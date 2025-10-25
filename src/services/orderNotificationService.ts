/**
 * Order notification service with email/SMS capabilities
 */

import { Order, OrderStatus, OrderStatusUpdate, OrderNotificationPreferences } from '../types/order';
import { 
  NotificationTemplate, 
  NotificationType, 
  NotificationPayload, 
  NotificationRecipient, 
  NotificationQueue,
  NotificationDelivery 
} from '../types/notification';
import { notificationService } from './notificationService';

export class OrderNotificationService {
  private templates: Map<NotificationType, NotificationTemplate> = new Map();
  private queue: NotificationQueue[] = [];
  private deliveries: NotificationDelivery[] = [];
  private isProcessing = false;
  private readonly RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

  constructor() {
    this.initializeTemplates();
    this.startQueueProcessor();
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'order_confirmation',
        name: 'Order Confirmation',
        type: 'order_confirmation',
        subject: 'Order Confirmation - #{orderNumber}',
        emailTemplate: `
          <h2>Thank you for your order!</h2>
          <p>Hi {customerName},</p>
          <p>We've received your order #{orderNumber} and it's being processed.</p>
          <div>
            <h3>Order Details:</h3>
            <p>Order Number: #{orderNumber}</p>
            <p>Total Amount: {totalAmount}</p>
            <p>Estimated Delivery: {estimatedDelivery}</p>
          </div>
          <p>You can track your order status at any time.</p>
        `,
        smsTemplate: 'Order #{orderNumber} confirmed! Total: {totalAmount}. Track your order online.',
        variables: ['customerName', 'orderNumber', 'totalAmount', 'estimatedDelivery']
      },
      {
        id: 'order_status_update',
        name: 'Order Status Update',
        type: 'order_status_update',
        subject: 'Order #{orderNumber} Status Update',
        emailTemplate: `
          <h2>Order Status Update</h2>
          <p>Hi {customerName},</p>
          <p>Your order #{orderNumber} status has been updated to: <strong>{newStatus}</strong></p>
          {statusMessage}
          <p>Track your order for more details.</p>
        `,
        smsTemplate: 'Order #{orderNumber} is now {newStatus}. {statusMessage}',
        variables: ['customerName', 'orderNumber', 'newStatus', 'statusMessage']
      },
      {
        id: 'shipping_notification',
        name: 'Shipping Notification',
        type: 'shipping_notification',
        subject: 'Your Order #{orderNumber} Has Shipped!',
        emailTemplate: `
          <h2>Your order is on its way!</h2>
          <p>Hi {customerName},</p>
          <p>Great news! Your order #{orderNumber} has been shipped.</p>
          <div>
            <p><strong>Tracking Number:</strong> {trackingNumber}</p>
            <p><strong>Estimated Delivery:</strong> {estimatedDelivery}</p>
            <p><strong>Carrier:</strong> {carrier}</p>
          </div>
          <p>You can track your package using the tracking number above.</p>
        `,
        smsTemplate: 'Order #{orderNumber} shipped! Tracking: {trackingNumber}. Delivery: {estimatedDelivery}',
        variables: ['customerName', 'orderNumber', 'trackingNumber', 'estimatedDelivery', 'carrier']
      },
      {
        id: 'delivery_confirmation',
        name: 'Delivery Confirmation',
        type: 'delivery_confirmation',
        subject: 'Order #{orderNumber} Delivered Successfully',
        emailTemplate: `
          <h2>Your order has been delivered!</h2>
          <p>Hi {customerName},</p>
          <p>Your order #{orderNumber} has been successfully delivered.</p>
          <p><strong>Delivered at:</strong> {deliveryTime}</p>
          <p>We hope you enjoy your purchase! Please let us know if you have any questions.</p>
          <p>Don't forget to leave a review!</p>
        `,
        smsTemplate: 'Order #{orderNumber} delivered at {deliveryTime}. Enjoy your purchase!',
        variables: ['customerName', 'orderNumber', 'deliveryTime']
      },
      {
        id: 'issue_resolution',
        name: 'Issue Resolution',
        type: 'issue_resolution',
        subject: 'Update on Your Order #{orderNumber} Issue',
        emailTemplate: `
          <h2>Order Issue Update</h2>
          <p>Hi {customerName},</p>
          <p>We have an update regarding the issue with your order #{orderNumber}.</p>
          <div>
            <p><strong>Issue:</strong> {issueDescription}</p>
            <p><strong>Resolution:</strong> {resolutionDescription}</p>
            <p><strong>Next Steps:</strong> {nextSteps}</p>
          </div>
          <p>If you have any questions, please contact our support team.</p>
        `,
        smsTemplate: 'Order #{orderNumber} issue update: {resolutionDescription}. {nextSteps}',
        variables: ['customerName', 'orderNumber', 'issueDescription', 'resolutionDescription', 'nextSteps']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  /**
   * Send order confirmation notification
   */
  async sendOrderConfirmation(order: Order, recipient: NotificationRecipient): Promise<string> {
    const variables = {
      customerName: recipient.userId, // This should be replaced with actual customer name
      orderNumber: order.id,
      totalAmount: `${order.currency} ${order.totalAmount.toFixed(2)}`,
      estimatedDelivery: order.estimatedDelivery || 'TBD'
    };

    return this.queueNotification('order_confirmation', recipient, variables, 'high');
  }

  /**
   * Send order status update notification
   */
  async sendStatusUpdate(
    order: Order, 
    statusUpdate: OrderStatusUpdate, 
    recipient: NotificationRecipient
  ): Promise<string> {
    const statusMessages: Record<OrderStatus, string> = {
      pending: 'Your order is pending confirmation.',
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is currently being processed.',
      shipped: 'Your order has been shipped and is on its way.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled.',
      refunded: 'Your order has been refunded.'
    };

    const variables = {
      customerName: recipient.userId,
      orderNumber: order.id,
      newStatus: statusUpdate.newStatus.charAt(0).toUpperCase() + statusUpdate.newStatus.slice(1),
      statusMessage: statusMessages[statusUpdate.newStatus] || 'Status updated.'
    };

    return this.queueNotification('order_status_update', recipient, variables, 'normal');
  }

  /**
   * Send shipping notification
   */
  async sendShippingNotification(
    order: Order, 
    recipient: NotificationRecipient,
    carrier: string = 'Standard Shipping'
  ): Promise<string> {
    const variables = {
      customerName: recipient.userId,
      orderNumber: order.id,
      trackingNumber: order.trackingNumber || 'N/A',
      estimatedDelivery: order.estimatedDelivery || 'TBD',
      carrier
    };

    return this.queueNotification('shipping_notification', recipient, variables, 'high');
  }

  /**
   * Send delivery confirmation
   */
  async sendDeliveryConfirmation(
    order: Order, 
    recipient: NotificationRecipient,
    deliveryTime: string
  ): Promise<string> {
    const variables = {
      customerName: recipient.userId,
      orderNumber: order.id,
      deliveryTime
    };

    return this.queueNotification('delivery_confirmation', recipient, variables, 'normal');
  }

  /**
   * Send issue resolution notification
   */
  async sendIssueResolution(
    order: Order,
    recipient: NotificationRecipient,
    issueDescription: string,
    resolutionDescription: string,
    nextSteps: string
  ): Promise<string> {
    const variables = {
      customerName: recipient.userId,
      orderNumber: order.id,
      issueDescription,
      resolutionDescription,
      nextSteps
    };

    return this.queueNotification('issue_resolution', recipient, variables, 'high');
  }

  /**
   * Queue a notification for processing
   */
  private async queueNotification(
    type: NotificationType,
    recipient: NotificationRecipient,
    variables: Record<string, any>,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> {
    const template = this.templates.get(type);
    if (!template) {
      throw new Error(`Template not found for notification type: ${type}`);
    }

    const queueItem: NotificationQueue = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      payload: {
        templateId: template.id,
        recipient,
        variables,
        priority
      },
      status: 'queued',
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    this.queue.push(queueItem);
    this.sortQueueByPriority();

    // Show in-app notification immediately
    this.showInAppNotification(template, variables);

    return queueItem.id;
  }

  /**
   * Process the notification queue
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.queue.length > 0) {
        await this.processQueue();
      }
    }, 1000);
  }

  /**
   * Process queued notifications
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const pendingItems = this.queue.filter(item => 
        item.status === 'queued' && 
        (!item.nextRetryAt || new Date(item.nextRetryAt) <= new Date())
      );

      for (const item of pendingItems.slice(0, 5)) { // Process up to 5 items at once
        await this.processNotification(item);
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single notification
   */
  private async processNotification(queueItem: NotificationQueue): Promise<void> {
    queueItem.status = 'processing';

    try {
      const template = this.templates.get(queueItem.payload.templateId as NotificationType);
      if (!template) {
        throw new Error(`Template not found: ${queueItem.payload.templateId}`);
      }

      const { recipient } = queueItem.payload;

      // Send email if enabled and email available
      if (recipient.preferences.channels.find(c => c.type === 'email' && c.enabled) && recipient.email) {
        await this.sendEmail(template, queueItem.payload, queueItem.id);
      }

      // Send SMS if enabled and phone available
      if (recipient.preferences.channels.find(c => c.type === 'sms' && c.enabled) && recipient.phone) {
        await this.sendSMS(template, queueItem.payload, queueItem.id);
      }

      queueItem.status = 'completed';
      queueItem.processedAt = new Date().toISOString();

    } catch (error) {
      console.error('Error processing notification:', error);
      queueItem.status = 'failed';
      queueItem.failureReason = error instanceof Error ? error.message : 'Unknown error';
      
      // Schedule retry if within retry limits
      if (queueItem.retryCount < this.RETRY_DELAYS.length) {
        const delay = this.RETRY_DELAYS[queueItem.retryCount];
        queueItem.nextRetryAt = new Date(Date.now() + delay).toISOString();
        queueItem.retryCount++;
        queueItem.status = 'queued';
      }
    }
  }

  /**
   * Send email notification (mock implementation)
   */
  private async sendEmail(
    template: NotificationTemplate,
    payload: NotificationPayload,
    queueId: string
  ): Promise<void> {
    // Mock email sending - in production, integrate with email service like SendGrid, AWS SES, etc.
    const delivery: NotificationDelivery = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notificationId: queueId,
      channel: 'email',
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    };

    try {
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Replace variables in template
      const subject = this.replaceVariables(template.subject, payload.variables);
      const body = this.replaceVariables(template.emailTemplate, payload.variables);

      console.log(`[EMAIL] To: ${payload.recipient.email}`);
      console.log(`[EMAIL] Subject: ${subject}`);
      console.log(`[EMAIL] Body: ${body}`);

      delivery.status = 'sent';
      delivery.sentAt = new Date().toISOString();
      
      // Simulate delivery confirmation
      setTimeout(() => {
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date().toISOString();
      }, 1000);

    } catch (error) {
      delivery.status = 'failed';
      delivery.failureReason = error instanceof Error ? error.message : 'Email sending failed';
      throw error;
    } finally {
      this.deliveries.push(delivery);
    }
  }

  /**
   * Send SMS notification (mock implementation)
   */
  private async sendSMS(
    template: NotificationTemplate,
    payload: NotificationPayload,
    queueId: string
  ): Promise<void> {
    // Mock SMS sending - in production, integrate with SMS service like Twilio, AWS SNS, etc.
    const delivery: NotificationDelivery = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notificationId: queueId,
      channel: 'sms',
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    };

    try {
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 50));

      // Replace variables in template
      const message = this.replaceVariables(template.smsTemplate, payload.variables);

      console.log(`[SMS] To: ${payload.recipient.phone}`);
      console.log(`[SMS] Message: ${message}`);

      delivery.status = 'sent';
      delivery.sentAt = new Date().toISOString();
      
      // Simulate delivery confirmation
      setTimeout(() => {
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date().toISOString();
      }, 500);

    } catch (error) {
      delivery.status = 'failed';
      delivery.failureReason = error instanceof Error ? error.message : 'SMS sending failed';
      throw error;
    } finally {
      this.deliveries.push(delivery);
    }
  }

  /**
   * Show in-app notification
   */
  private showInAppNotification(template: NotificationTemplate, variables: Record<string, any>): void {
    const title = this.replaceVariables(template.subject, variables);
    const message = this.getShortMessage(template.type, variables);

    notificationService.showInfo(title, message, {
      autoHideDelay: 8000
    });
  }

  /**
   * Get short message for in-app notifications
   */
  private getShortMessage(type: NotificationType, variables: Record<string, any>): string {
    const messages: Record<NotificationType, string> = {
      order_confirmation: `Order ${variables.orderNumber} confirmed for ${variables.totalAmount}`,
      order_status_update: `Order ${variables.orderNumber} is now ${variables.newStatus}`,
      shipping_notification: `Order ${variables.orderNumber} has shipped`,
      delivery_confirmation: `Order ${variables.orderNumber} has been delivered`,
      order_cancelled: `Order ${variables.orderNumber} has been cancelled`,
      order_refunded: `Order ${variables.orderNumber} has been refunded`,
      payment_failed: `Payment failed for order ${variables.orderNumber}`,
      issue_resolution: `Update on order ${variables.orderNumber} issue`
    };

    return messages[type] || 'Order notification';
  }

  /**
   * Replace variables in template strings
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  /**
   * Sort queue by priority
   */
  private sortQueueByPriority(): void {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    
    this.queue.sort((a, b) => {
      const aPriority = priorityOrder[a.payload.priority];
      const bPriority = priorityOrder[b.payload.priority];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const byStatus = this.queue.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = this.queue.reduce((acc, item) => {
      acc[item.payload.priority] = (acc[item.payload.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.queue.length,
      byStatus,
      byPriority
    };
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats(): {
    total: number;
    byChannel: Record<string, number>;
    byStatus: Record<string, number>;
    successRate: number;
  } {
    const byChannel = this.deliveries.reduce((acc, delivery) => {
      acc[delivery.channel] = (acc[delivery.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = this.deliveries.reduce((acc, delivery) => {
      acc[delivery.status] = (acc[delivery.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const successful = this.deliveries.filter(d => d.status === 'delivered').length;
    const successRate = this.deliveries.length > 0 ? (successful / this.deliveries.length) * 100 : 0;

    return {
      total: this.deliveries.length,
      byChannel,
      byStatus,
      successRate
    };
  }

  /**
   * Clear completed queue items older than specified hours
   */
  cleanupQueue(hoursOld: number = 24): number {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    const initialLength = this.queue.length;
    
    this.queue = this.queue.filter(item => 
      item.status !== 'completed' || 
      new Date(item.createdAt) > cutoffTime
    );

    return initialLength - this.queue.length;
  }

  /**
   * Get notification preferences for a user
   */
  async getUserNotificationPreferences(userId: string): Promise<OrderNotificationPreferences> {
    // Mock implementation - in production, fetch from database
    return {
      userId,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      orderConfirmation: true,
      statusUpdates: true,
      shippingUpdates: true,
      deliveryConfirmation: true,
      issueResolution: true
    };
  }

  /**
   * Update notification preferences for a user
   */
  async updateUserNotificationPreferences(
    userId: string, 
    preferences: Partial<OrderNotificationPreferences>
  ): Promise<OrderNotificationPreferences> {
    // Mock implementation - in production, save to database
    const current = await this.getUserNotificationPreferences(userId);
    const updated = { ...current, ...preferences };
    
    console.log(`Updated notification preferences for user ${userId}:`, updated);
    return updated;
  }
}

// Global order notification service instance
export const orderNotificationService = new OrderNotificationService();

export default OrderNotificationService;