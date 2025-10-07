import { useState, useEffect, useCallback, useRef } from 'react';
import { loadRazorpayScript } from '../utils/razorpayLoader';
import PaymentService from '../services/paymentService';
import {
  CreateOrderData,
  RazorpayOptions,
  RazorpayPaymentResponse,
  PaymentVerificationResponse
} from '../types/payment';
import { logger } from '../utils/logger';
import { handlePaymentError, handleSystemError } from '../utils/errorHandler';

interface UseRazorpayOptions {
  onSuccess?: (response: PaymentVerificationResponse) => void;
  onFailure?: (error: string) => void;
  onDismiss?: () => void;
  autoVerify?: boolean;
}

interface UseRazorpayReturn {
  processPayment: (
    orderData: CreateOrderData,
    paymentOptions: Partial<RazorpayOptions>
  ) => Promise<void>;
  verifyPayment: (paymentResponse: RazorpayPaymentResponse) => Promise<PaymentVerificationResponse>;
  loading: boolean;
  error: string | null;
  scriptLoaded: boolean;
  clearError: () => void;
  isProcessing: boolean;
}

const useRazorpay = (options: UseRazorpayOptions = {}): UseRazorpayReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { onSuccess, onFailure, onDismiss, autoVerify = true } = options;
  
  // Use ref to store the latest callback functions to avoid stale closures
  const callbacksRef = useRef({ onSuccess, onFailure, onDismiss });
  callbacksRef.current = { onSuccess, onFailure, onDismiss };

  // Load Razorpay script on mount
  useEffect(() => {
    const loadScript = async () => {
      try {
        logger.debug('RAZORPAY_HOOK', 'Loading Razorpay script');
        await loadRazorpayScript();
        setScriptLoaded(true);
        logger.info('RAZORPAY_HOOK', 'Razorpay script loaded successfully');
      } catch (err) {
        const processedError = handleSystemError(err as Error, {
          component: 'useRazorpay',
          action: 'loadScript'
        });
        
        logger.error('RAZORPAY_HOOK', 'Failed to load Razorpay script', err as Error);
        setError(processedError.userMessage);
      }
    };

    loadScript();
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Verify payment function
  const verifyPayment = useCallback(async (paymentResponse: RazorpayPaymentResponse): Promise<PaymentVerificationResponse> => {
    const { razorpay_order_id, razorpay_payment_id } = paymentResponse;
    
    try {
      setIsProcessing(true);
      
      logger.info('RAZORPAY_HOOK', 'Starting payment verification', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });

      const verificationResult = await PaymentService.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      if (verificationResult.success) {
        logger.info('RAZORPAY_HOOK', 'Payment verification successful', {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          transactionId: verificationResult.transactionId
        });
        
        callbacksRef.current.onSuccess?.(verificationResult);
      } else {
        const errorMsg = verificationResult.message || 'Payment verification failed';
        
        logger.error('RAZORPAY_HOOK', 'Payment verification failed', new Error(errorMsg), {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        });
        
        setError(errorMsg);
        callbacksRef.current.onFailure?.(errorMsg);
      }

      return verificationResult;
    } catch (err) {
      const processedError = handlePaymentError(err as Error, {
        component: 'useRazorpay',
        action: 'verifyPayment',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
      
      logger.error('RAZORPAY_HOOK', 'Payment verification error', err as Error, {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        processedErrorId: processedError.id
      });
      
      setError(processedError.userMessage);
      callbacksRef.current.onFailure?.(processedError.userMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Process payment function
  const processPayment = useCallback(async (
    orderData: CreateOrderData,
    paymentOptions: Partial<RazorpayOptions> = {}
  ): Promise<void> => {
    if (!scriptLoaded) {
      const errorMsg = 'Payment system is not ready. Please wait and try again.';
      setError(errorMsg);
      callbacksRef.current.onFailure?.(errorMsg);
      return;
    }

    // Validate configuration
    if (!PaymentService.validateConfig()) {
      const errorMsg = 'Payment system is not properly configured. Please check your Razorpay credentials.';
      console.error('❌ Razorpay configuration invalid:', {
        keyId: import.meta.env.VITE_RAZORPAY_KEY_ID,
        hasKeyId: !!import.meta.env.VITE_RAZORPAY_KEY_ID
      });
      setError(errorMsg);
      callbacksRef.current.onFailure?.(errorMsg);
      return;
    }

    // Validate order data
    const validation = PaymentService.validateOrderData(orderData);
    if (!validation.isValid) {
      const errorMsg = `Invalid order data: ${validation.errors.join(', ')}`;
      setError(errorMsg);
      callbacksRef.current.onFailure?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create Razorpay order
      const razorpayOrder = await PaymentService.createOrder(orderData);
      
      // Get payment configuration
      const config = PaymentService.getConfig();

      // Prepare Razorpay options
      const defaultOptions: RazorpayOptions = {
        key: config.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: config.companyName,
        description: `Payment for Order #${razorpayOrder.receipt}`,
        order_id: razorpayOrder.id,
        handler: async (response: RazorpayPaymentResponse) => {
          if (autoVerify) {
            await verifyPayment(response);
          } else {
            // If auto-verify is disabled, just call onSuccess with the raw response
            callbacksRef.current.onSuccess?.(response as any);
          }
        },
        theme: {
          color: config.themeColor,
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            callbacksRef.current.onDismiss?.();
          },
        },
      };

      // Merge with provided options
      const finalOptions: RazorpayOptions = {
        ...defaultOptions,
        ...paymentOptions,
        // Ensure critical fields are not overridden
        key: config.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
      };

      // Create and open Razorpay checkout
      const paymentObject = new window.Razorpay(finalOptions);
      
      // Add error handler for payment failures
      paymentObject.on('payment.failed', (response: any) => {
        const errorMsg = response.error?.description || 'Payment failed';
        setError(errorMsg);
        setLoading(false);
        callbacksRef.current.onFailure?.(errorMsg);
      });

      paymentObject.open();
    } catch (err) {
      console.error('Payment processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      setLoading(false);
      callbacksRef.current.onFailure?.(errorMessage);
    }
  }, [scriptLoaded, autoVerify, verifyPayment]);

  return {
    processPayment,
    verifyPayment,
    loading,
    error,
    scriptLoaded,
    clearError,
    isProcessing,
  };
};

export default useRazorpay;