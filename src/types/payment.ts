// Payment-related type definitions

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: 'created' | 'attempted' | 'paid' | 'failed' | 'cancelled';
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface CreateOrderData {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  orderId?: string;
  transactionId?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentConfig {
  keyId: string;
  currency: string;
  companyName: string;
  companyLogo?: string;
  themeColor?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface PaymentStatus {
  orderId: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  paymentId?: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentError {
  code: string;
  message: string;
  description?: string;
  field?: string;
}

export interface PaymentApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: PaymentError;
  message?: string;
}

// Razorpay global interface
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}