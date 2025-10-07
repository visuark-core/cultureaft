import axios from 'axios';
import {
  RazorpayOrderResponse,
  CreateOrderData,
  VerifyPaymentData,
  PaymentVerificationResponse,
  PaymentStatus,
  PaymentApiResponse,
  PaymentConfig
} from '../types/payment';
import { logger, logPaymentStarted, logPaymentFailed, logPaymentVerificationStarted, logPaymentVerificationSuccess, logPaymentVerificationFailed } from '../utils/logger';
import { handlePaymentError, handleNetworkError } from '../utils/errorHandler';
import { withPaymentRetry } from '../utils/retryMechanism';

class PaymentService {
  private static readonly API_BASE_URL = '/api';
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  // Payment configuration management
  private static config: PaymentConfig = {
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
    currency: 'INR',
    companyName: 'Handicraft Store',
    themeColor: '#3B82F6',
    timeout: this.DEFAULT_TIMEOUT,
    retryAttempts: this.MAX_RETRY_ATTEMPTS
  };

  /**
   * Get current payment configuration
   */
  static getConfig(): PaymentConfig {
    return { ...this.config };
  }

  /**
   * Update payment configuration
   */
  static updateConfig(newConfig: Partial<PaymentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Validate payment configuration
   */
  static validateConfig(): boolean {
    if (!this.config.keyId) {
      console.error('Razorpay Key ID is not configured');
      return false;
    }
    return true;
  }

  /**
   * Create axios instance with default configuration
   */
  private static createAxiosInstance() {
    return axios.create({
      baseURL: this.API_BASE_URL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Handle API errors consistently with comprehensive logging
   */
  private static handleApiError(error: unknown, operation: string, context: { orderId?: string; paymentId?: string } = {}): never {
    const processedError = axios.isAxiosError(error) 
      ? handleNetworkError(error, { 
          component: 'PaymentService', 
          action: operation,
          ...context 
        })
      : handlePaymentError(error as Error, { 
          component: 'PaymentService', 
          action: operation,
          ...context 
        });

    // Log the processed error
    logger.error('PAYMENT_SERVICE', `Payment service error during ${operation}`, 
      error instanceof Error ? error : new Error(String(error)), 
      { 
        processedErrorId: processedError.id,
        userMessage: processedError.userMessage,
        isRetryable: processedError.isRetryable,
        ...context
      }
    );

    // Throw user-friendly error message
    throw new Error(processedError.userMessage);
  }

  /**
   * Enhanced retry mechanism using the retry utility
   */
  private static async retryApiCall<T>(
    apiCall: () => Promise<T>,
    operation: string,
    context: { orderId?: string; paymentId?: string } = {}
  ): Promise<T> {
    try {
      return await withPaymentRetry(
        apiCall,
        context.orderId || 'unknown',
        operation,
        context.paymentId
      );
    } catch (error) {
      this.handleApiError(error, operation, context);
    }
  }

  /**
   * Create a Razorpay order with comprehensive logging
   */
  static async createOrder(orderData: CreateOrderData): Promise<RazorpayOrderResponse> {
    const orderId = orderData.receipt;
    
    // Log payment initiation
    logPaymentStarted(orderId, this.convertFromPaisa(orderData.amount), {
      currency: orderData.currency,
      notes: orderData.notes
    });

    if (!this.validateConfig()) {
      const error = new Error('Payment configuration is invalid. Please check your Razorpay credentials.');
      logPaymentFailed(orderId, error, { reason: 'invalid_configuration' });
      throw error;
    }

    try {
      const result = await this.retryApiCall(async () => {
        const axiosInstance = this.createAxiosInstance();
        
        logger.debug('PAYMENT_SERVICE', 'Creating Razorpay order', {
          orderId,
          amount: orderData.amount,
          currency: orderData.currency
        });

        const response = await axiosInstance.post<PaymentApiResponse<RazorpayOrderResponse>>(
          '/api/payments/create-order',
          orderData
        );
        
        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.error?.message || 'Failed to create order');
        }
        
        return response.data.data;
      }, 'create Razorpay order', { orderId });

      // Log successful order creation
      logger.info('PAYMENT_SERVICE', 'Razorpay order created successfully', {
        orderId,
        razorpayOrderId: result.id,
        amount: result.amount,
        currency: result.currency,
        status: result.status
      });

      return result;
    } catch (error) {
      logPaymentFailed(orderId, error as Error, { 
        stage: 'order_creation',
        amount: orderData.amount,
        currency: orderData.currency
      });
      throw error;
    }
  }

  /**
   * Verify payment signature with comprehensive logging
   */
  static async verifyPayment(verificationData: VerifyPaymentData): Promise<PaymentVerificationResponse> {
    const { razorpay_order_id, razorpay_payment_id } = verificationData;
    
    // Log verification start
    logPaymentVerificationStarted(razorpay_order_id, razorpay_payment_id);

    try {
      const result = await this.retryApiCall(async () => {
        const axiosInstance = this.createAxiosInstance();
        
        logger.debug('PAYMENT_SERVICE', 'Verifying payment signature', {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        });

        const response = await axiosInstance.post<PaymentApiResponse<PaymentVerificationResponse>>(
          '/api/payments/verify',
          verificationData
        );
        
        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.error?.message || 'Payment verification failed');
        }
        
        return response.data.data;
      }, 'verify payment', { 
        orderId: razorpay_order_id, 
        paymentId: razorpay_payment_id 
      });

      if (result.success) {
        logPaymentVerificationSuccess(razorpay_order_id, razorpay_payment_id);
        
        logger.info('PAYMENT_SERVICE', 'Payment verification successful', {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          transactionId: result.transactionId
        });
      } else {
        const error = new Error(result.message || 'Payment verification failed');
        logPaymentVerificationFailed(razorpay_order_id, razorpay_payment_id, error);
        throw error;
      }

      return result;
    } catch (error) {
      logPaymentVerificationFailed(razorpay_order_id, razorpay_payment_id, error as Error);
      throw error;
    }
  }

  /**
   * Get payment status by order ID with logging
   */
  static async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    logger.debug('PAYMENT_SERVICE', 'Fetching payment status', { orderId });

    try {
      const result = await this.retryApiCall(async () => {
        const axiosInstance = this.createAxiosInstance();
        const response = await axiosInstance.get<PaymentApiResponse<PaymentStatus>>(
          `/api/payments/status/${orderId}`
        );
        
        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.error?.message || 'Failed to get payment status');
        }
        
        return response.data.data;
      }, 'get payment status', { orderId });

      logger.info('PAYMENT_SERVICE', 'Payment status retrieved successfully', {
        orderId,
        status: result.status,
        amount: result.amount,
        paymentId: result.paymentId
      });

      return result;
    } catch (error) {
      logger.error('PAYMENT_SERVICE', 'Failed to get payment status', error as Error, { orderId });
      throw error;
    }
  }

  /**
   * Convert amount to paisa (smallest currency unit)
   */
  static convertToPaisa(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from paisa to rupees
   */
  static convertFromPaisa(paisa: number): number {
    return paisa / 100;
  }

  /**
   * Format amount for display
   */
  static formatAmount(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Generate unique receipt ID
   */
  static generateReceiptId(prefix: string = 'rcpt'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Validate order data before creating order
   */
  static validateOrderData(orderData: CreateOrderData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!orderData.amount || orderData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }
    
    if (orderData.amount < 1) {
      errors.push('Minimum amount is ₹1');
    }
    
    if (!orderData.currency) {
      errors.push('Currency is required');
    }
    
    if (!orderData.receipt) {
      errors.push('Receipt ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default PaymentService;