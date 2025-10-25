/**
 * Order service for managing orders and triggering notifications
 */

import { Order, OrderStatus, OrderStatusUpdate, Address, OrderItem } from '../types/order';
import { NotificationRecipient } from '../types/notification';
import { orderNotificationService } from './orderNotificationService';
import { notificationService } from './notificationService';
import axios from 'axios';

export interface OrderData {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    image: string;
  }>;
  paymentInfo: {
    method: string;
    transactionId: string;
  };
  pricing?: {
    subtotal: number;
    codCharges: number;
    taxAmount: number;
    finalAmount: number;
  };
  totalAmount: number;
  taxAmount: number;
  finalAmount: number;
}

export interface InventoryCheckResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
  reservationId?: string;
  reservationExpiry?: Date;
}

export interface OrderResponse {
  success: boolean;
  data?: {
    orderId: string;
    status: string;
    estimatedDelivery: string;
    totalAmount: number;
    customerName: string;
  };
  message?: string;
}

export class OrderService {
  private orders: Map<string, Order> = new Map();
  private orderHistory: Map<string, OrderStatusUpdate[]> = new Map();

  /**
   * Create a new order
   */
  async createOrder(
    userId: string,
    items: OrderItem[],
    shippingAddress: Address,
    billingAddress: Address,
    paymentMethod: string
  ): Promise<Order> {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order: Order = {
      id: orderId,
      userId,
      items,
      status: 'pending',
      totalAmount,
      currency: 'USD',
      shippingAddress,
      billingAddress,
      paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDelivery: this.calculateEstimatedDelivery()
    };

    this.orders.set(orderId, order);
    this.orderHistory.set(orderId, []);

    // Send order confirmation notification
    await this.sendOrderConfirmationNotification(order);

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    notes?: string,
    trackingNumber?: string,
    estimatedDelivery?: string
  ): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const previousStatus = order.status;
    const statusUpdate: OrderStatusUpdate = {
      orderId,
      previousStatus,
      newStatus,
      timestamp: new Date().toISOString(),
      notes,
      trackingNumber,
      estimatedDelivery
    };

    // Update order
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    if (notes) order.notes = notes;

    this.orders.set(orderId, order);

    // Add to history
    const history = this.orderHistory.get(orderId) || [];
    history.push(statusUpdate);
    this.orderHistory.set(orderId, history);

    // Send appropriate notifications based on status
    await this.handleStatusChangeNotifications(order, statusUpdate);

    return order;
  }

  /**
   * Handle notifications for status changes
   */
  private async handleStatusChangeNotifications(
    order: Order,
    statusUpdate: OrderStatusUpdate
  ): Promise<void> {
    const recipient = await this.getNotificationRecipient(order.userId);

    try {
      switch (statusUpdate.newStatus) {
        case 'confirmed':
          await orderNotificationService.sendStatusUpdate(order, statusUpdate, recipient);
          break;

        case 'processing':
          await orderNotificationService.sendStatusUpdate(order, statusUpdate, recipient);
          break;

        case 'shipped':
          await orderNotificationService.sendShippingNotification(
            order, 
            recipient, 
            'Standard Shipping'
          );
          break;

        case 'delivered':
          await orderNotificationService.sendDeliveryConfirmation(
            order,
            recipient,
            new Date().toLocaleString()
          );
          break;

        case 'cancelled':
        case 'refunded':
          await orderNotificationService.sendStatusUpdate(order, statusUpdate, recipient);
          break;

        default:
          // For any other status changes, send a generic status update
          await orderNotificationService.sendStatusUpdate(order, statusUpdate, recipient);
      }

      // Show success notification to admin/system
      notificationService.showSuccess(
        'Notification Sent',
        `Order ${order.id} status notification sent to customer`
      );

    } catch (error) {
      console.error('Error sending order notification:', error);
      notificationService.showError(
        'Notification Failed',
        `Failed to send notification for order ${order.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Send order confirmation notification
   */
  private async sendOrderConfirmationNotification(order: Order): Promise<void> {
    const recipient = await this.getNotificationRecipient(order.userId);

    try {
      await orderNotificationService.sendOrderConfirmation(order, recipient);
      
      notificationService.showSuccess(
        'Order Created',
        `Order ${order.id} created and confirmation sent to customer`
      );
    } catch (error) {
      console.error('Error sending order confirmation:', error);
      notificationService.showError(
        'Confirmation Failed',
        `Order created but failed to send confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get notification recipient for a user
   */
  private async getNotificationRecipient(userId: string): Promise<NotificationRecipient> {
    // Mock implementation - in production, fetch user details from database
    const userPreferences = await orderNotificationService.getUserNotificationPreferences(userId);
    
    return {
      userId,
      email: `user${userId}@example.com`, // Mock email
      phone: `+1234567890`, // Mock phone
      preferences: {
        channels: [
          { type: 'email', enabled: userPreferences.emailNotifications },
          { type: 'sms', enabled: userPreferences.smsNotifications },
          { type: 'push', enabled: userPreferences.pushNotifications },
          { type: 'in_app', enabled: true }
        ],
        orderConfirmation: userPreferences.orderConfirmation,
        statusUpdates: userPreferences.statusUpdates,
        shippingUpdates: userPreferences.shippingUpdates,
        deliveryConfirmation: userPreferences.deliveryConfirmation,
        issueResolution: userPreferences.issueResolution,
        marketingEmails: false,
        frequency: 'immediate'
      }
    };
  }

  /**
   * Calculate estimated delivery date
   */
  private calculateEstimatedDelivery(): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 business days
    return deliveryDate.toLocaleDateString();
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Get orders for a user
   */
  getUserOrders(userId: string): Order[] {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  /**
   * Get order history
   */
  getOrderHistory(orderId: string): OrderStatusUpdate[] {
    return this.orderHistory.get(orderId) || [];
  }

  /**
   * Get all orders (admin function)
   */
  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  /**
   * Search orders by status
   */
  getOrdersByStatus(status: OrderStatus): Order[] {
    return Array.from(this.orders.values()).filter(order => order.status === status);
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    return this.updateOrderStatus(orderId, 'cancelled', reason);
  }

  /**
   * Process refund
   */
  async processRefund(orderId: string, reason?: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.status === 'refunded') {
      throw new Error('Order is already refunded');
    }

    return this.updateOrderStatus(orderId, 'refunded', reason);
  }

  /**
   * Add tracking information
   */
  async addTrackingInfo(
    orderId: string,
    trackingNumber: string,
    carrier: string = 'Standard Shipping',
    estimatedDelivery?: string
  ): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Update to shipped status if not already
    if (order.status !== 'shipped') {
      return this.updateOrderStatus(
        orderId,
        'shipped',
        `Shipped via ${carrier}`,
        trackingNumber,
        estimatedDelivery
      );
    } else {
      // Just update tracking info
      order.trackingNumber = trackingNumber;
      if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
      order.updatedAt = new Date().toISOString();
      this.orders.set(orderId, order);

      // Send updated shipping notification
      const recipient = await this.getNotificationRecipient(order.userId);
      await orderNotificationService.sendShippingNotification(order, recipient, carrier);

      return order;
    }
  }

  /**
   * Mark order as delivered
   */
  async markAsDelivered(orderId: string, deliveryNotes?: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'delivered', deliveryNotes);
  }

  /**
   * Report order issue and send resolution notification
   */
  async reportOrderIssue(
    orderId: string,
    issueDescription: string,
    resolutionDescription: string,
    nextSteps: string
  ): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const recipient = await this.getNotificationRecipient(order.userId);
    
    try {
      await orderNotificationService.sendIssueResolution(
        order,
        recipient,
        issueDescription,
        resolutionDescription,
        nextSteps
      );

      notificationService.showSuccess(
        'Issue Resolution Sent',
        `Issue resolution notification sent for order ${orderId}`
      );
    } catch (error) {
      console.error('Error sending issue resolution notification:', error);
      notificationService.showError(
        'Notification Failed',
        `Failed to send issue resolution notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get order statistics
   */
  getOrderStats(): {
    total: number;
    byStatus: Record<OrderStatus, number>;
    totalRevenue: number;
    averageOrderValue: number;
  } {
    const orders = Array.from(this.orders.values());
    const byStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const totalRevenue = orders
      .filter(order => !['cancelled', 'refunded'].includes(order.status))
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return {
      total: orders.length,
      byStatus,
      totalRevenue,
      averageOrderValue
    };
  }

  /**
   * Place a new order through the API
   */
  async placeOrder(orderData: OrderData): Promise<OrderResponse> {
    try {
      const response = await axios.post('/api/orders/place', orderData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to place order'
        };
      }
    } catch (error) {
      console.error('Error placing order:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            success: false,
            message: error.response.data?.message || 'Server error occurred while placing order'
          };
        } else if (error.request) {
          return {
            success: false,
            message: 'Network error. Please check your connection and try again.'
          };
        }
      }
      
      // Handle non-axios errors (like our test mock)
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as any;
        if (responseError.response?.data?.message) {
          return {
            success: false,
            message: responseError.response.data.message
          };
        }
      }
      
      return {
        success: false,
        message: 'An unexpected error occurred while placing your order'
      };
    }
  }

  /**
   * Check inventory availability for cart items with enhanced validation
   */
  async checkInventoryAvailability(items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>): Promise<InventoryCheckResult> {
    try {
      // First try the enhanced inventory validation service
      const { inventoryValidationService } = await import('./inventoryValidationService');
      
      const inventoryItems = items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity
      }));

      const validationResult = await inventoryValidationService.validateInventory(inventoryItems);
      
      return {
        success: validationResult.success,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        reservationId: validationResult.reservationId,
        reservationExpiry: validationResult.reservationExpiry
      };

    } catch (enhancedError) {
      console.warn('Enhanced inventory validation failed, falling back to basic check:', enhancedError);
      
      // Fallback to the original API-based check
      try {
        const response = await axios.post('/api/orders/check-inventory', { items }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 seconds timeout
        });

        if (response.data.success) {
          return {
            success: true,
            errors: response.data.errors || [],
            warnings: response.data.warnings || []
          };
        } else {
          return {
            success: false,
            errors: response.data.errors || ['Unable to verify inventory availability'],
            warnings: response.data.warnings || []
          };
        }
      } catch (error) {
        console.error('Error checking inventory:', error);
        
        // For inventory checks, we'll be more lenient and allow the order to proceed
        // but with a warning
        return {
          success: true,
          errors: [],
          warnings: ['Unable to verify inventory. Items will be confirmed during order processing.']
        };
      }
    }
  }

  /**
   * Simulate order processing workflow
   */
  async simulateOrderWorkflow(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Simulate order processing steps with delays
    const steps = [
      { status: 'confirmed' as OrderStatus, delay: 1000, message: 'Order confirmed and payment processed' },
      { status: 'processing' as OrderStatus, delay: 3000, message: 'Order is being prepared' },
      { status: 'shipped' as OrderStatus, delay: 5000, message: 'Order has been shipped', trackingNumber: `TRK${Date.now()}` }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      
      if (step.trackingNumber) {
        await this.updateOrderStatus(orderId, step.status, step.message, step.trackingNumber);
      } else {
        await this.updateOrderStatus(orderId, step.status, step.message);
      }
    }

    // Simulate delivery after additional delay
    setTimeout(async () => {
      await this.markAsDelivered(orderId, 'Package delivered successfully');
    }, 8000);
  }
}

// Global order service instance
export const orderService = new OrderService();

export default OrderService;