// Payment-related type definitions for Cash on Delivery

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  orderId?: string;
  transactionId?: string;
}

export interface PaymentStatus {
  orderId?: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  method: 'cod';
  paymentId?: string;
  amount: number;
  currency?: string;
  transactionId?: string;
  createdAt?: string;
  updatedAt?: string;
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