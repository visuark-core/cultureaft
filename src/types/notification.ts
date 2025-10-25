/**
 * Enhanced notification types for order notifications
 */

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject: string;
  emailTemplate: string;
  smsTemplate: string;
  variables: string[];
}

export type NotificationType = 
  | 'order_confirmation'
  | 'order_status_update'
  | 'shipping_notification'
  | 'delivery_confirmation'
  | 'order_cancelled'
  | 'order_refunded'
  | 'payment_failed'
  | 'issue_resolution';

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app';
  enabled: boolean;
  config?: Record<string, any>;
}

export interface NotificationRecipient {
  userId: string;
  email?: string;
  phone?: string;
  preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  channels: NotificationChannel[];
  orderConfirmation: boolean;
  statusUpdates: boolean;
  shippingUpdates: boolean;
  deliveryConfirmation: boolean;
  issueResolution: boolean;
  marketingEmails: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface NotificationPayload {
  templateId: string;
  recipient: NotificationRecipient;
  variables: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: string;
  expiresAt?: string;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
}

export interface NotificationQueue {
  id: string;
  payload: NotificationPayload;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: string;
}