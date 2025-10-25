const AnalyticsService = require('./analyticsService');
const WebSocketService = require('./websocketService');
const EventEmitter = require('events');

class AnalyticsEventService extends EventEmitter {
  constructor() {
    super();
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for various order and customer events
   */
  setupEventListeners() {
    // Order events
    this.on('order:created', this.handleOrderCreated.bind(this));
    this.on('order:updated', this.handleOrderUpdated.bind(this));
    this.on('order:cancelled', this.handleOrderCancelled.bind(this));
    this.on('order:delivered', this.handleOrderDelivered.bind(this));
    
    // Payment events
    this.on('payment:completed', this.handlePaymentCompleted.bind(this));
    this.on('payment:failed', this.handlePaymentFailed.bind(this));
    this.on('payment:refunded', this.handlePaymentRefunded.bind(this));
    
    // Customer events
    this.on('customer:registered', this.handleCustomerRegistered.bind(this));
    this.on('customer:updated', this.handleCustomerUpdated.bind(this));
    
    console.log('Analytics event service initialized');
  }

  /**
   * Handle order created event
   * @param {Object} orderData - Order data
   */
  async handleOrderCreated(orderData) {
    try {
      console.log(`Processing order created event: ${orderData.orderId}`);
      
      // Update real-time analytics
      await AnalyticsService.updateRealTimeAnalytics('order_created', orderData);
      
      // Broadcast to WebSocket clients
      WebSocketService.broadcastOrderUpdate(orderData);
      
      // Trigger inventory reservation if needed
      if (orderData.inventory && !orderData.inventory.reserved) {
        this.emit('inventory:reserve', {
          orderId: orderData.orderId,
          items: orderData.items || orderData.products
        });
      }
      
    } catch (error) {
      console.error('Error handling order created event:', error);
    }
  }

  /**
   * Handle order updated event
   * @param {Object} orderData - Order data
   */
  async handleOrderUpdated(orderData) {
    try {
      console.log(`Processing order updated event: ${orderData.orderId}, status: ${orderData.status}`);
      
      // Update real-time analytics
      await AnalyticsService.updateRealTimeAnalytics('order_updated', orderData);
      
      // Broadcast to WebSocket clients
      WebSocketService.broadcastOrderUpdate(orderData);
      
      // Handle specific status changes
      switch (orderData.status) {
        case 'confirmed':
          this.emit('order:confirmed', orderData);
          break;
        case 'shipped':
          this.emit('order:shipped', orderData);
          break;
        case 'out_for_delivery':
          this.emit('order:out_for_delivery', orderData);
          break;
        case 'delivered':
          this.emit('order:delivered', orderData);
          break;
        case 'cancelled':
          this.emit('order:cancelled', orderData);
          break;
      }
      
    } catch (error) {
      console.error('Error handling order updated event:', error);
    }
  }

  /**
   * Handle order cancelled event
   * @param {Object} orderData - Order data
   */
  async handleOrderCancelled(orderData) {
    try {
      console.log(`Processing order cancelled event: ${orderData.orderId}`);
      
      // Update real-time analytics
      await AnalyticsService.updateRealTimeAnalytics('order_cancelled', orderData);
      
      // Broadcast to WebSocket clients
      WebSocketService.broadcastOrderUpdate(orderData);
      
      // Release inventory
      this.emit('inventory:release', {
        orderId: orderData.orderId,
        items: orderData.items || orderData.products
      });
      
      // Process refund if payment was completed
      if (orderData.payment?.status === 'completed' || orderData.paymentStatus === 'paid') {
        this.emit('payment:refund_required', {
          orderId: orderData.orderId,
          amount: orderData.pricing?.total || orderData.totalAmount,
          reason: 'Order cancelled'
        });
      }
      
    } catch (error) {
      console.error('Error handling order cancelled event:', error);
    }
  }

  /**
   * Handle order delivered event
   * @param {Object} orderData - Order data
   */
  async handleOrderDelivered(orderData) {
    try {
      console.log(`Processing order delivered event: ${orderData.orderId}`);
      
      // Update real-time analytics
      await AnalyticsService.updateRealTimeAnalytics('order_delivered', orderData);
      
      // Broadcast to WebSocket clients
      WebSocketService.broadcastOrderUpdate(orderData);
      
      // Update customer metrics
      this.emit('customer:order_completed', {
        customerId: orderData.customer?.customerId || orderData.customerId,
        orderValue: orderData.pricing?.total || orderData.totalAmount,
        orderDate: orderData.createdAt || new Date()
      });
      
      // Request customer feedback
      this.emit('feedback:request', {
        orderId: orderData.orderId,
        customerId: orderData.customer?.customerId || orderData.customerId
      });
      
    } catch (error) {
      console.error('Error handling order delivered event:', error);
    }
  }

  /**
   * Handle payment completed event
   * @param {Object} paymentData - Payment data
   */
  async handlePaymentCompleted(paymentData) {
    try {
      console.log(`Processing payment completed event: ${paymentData.orderId}`);
      
      // Update real-time analytics
      await AnalyticsService.updateRealTimeAnalytics('payment_completed', paymentData);
      
      // Broadcast to WebSocket clients
      WebSocketService.broadcastPaymentUpdate(paymentData);
      
      // Update order status to confirmed
      this.emit('order:payment_confirmed', {
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount
      });
      
    } catch (error) {
      console.error('Error handling payment completed event:', error);
    }
  }

  /**
   * Handle payment failed event
   * @param {Object} paymentData - Payment data
   */
  async handlePaymentFailed(paymentData) {
    try {
      console.log(`Processing payment failed event: ${paymentData.orderId}`);
      
      // Update real-time analytics
      await AnalyticsService.updateRealTimeAnalytics('payment_failed', paymentData);
      
      // Broadcast to WebSocket clients
      WebSocketService.broadcastPaymentUpdate(paymentData);
      
      // Send notification to admin
      WebSocketService.sendNotification({
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Payment failed for order ${paymentData.orderId}`,
        orderId: paymentData.orderId,
        severity: 'warning'
      });
      
      // Release inventory reservation if payment fails multiple times
      if (paymentData.retryCount >= 3) {
        this.emit('inventory:release', {
          orderId: paymentData.orderId,
          reason: 'Payment failed after multiple attempts'
        });
      }
      
    } catch (error) {
      console.error('Error handling payment failed event:', error);
    }
  }

  /**
   * Handle payment refunded event
   * @param {Object} refundData - Refund data
   */
  async handlePaymentRefunded(refundData) {
    try {
      console.log(`Processing payment refunded event: ${refundData.orderId}`);
      
      // Update real-time analytics
      await AnalyticsService.updateRealTimeAnalytics('payment_refunded', refundData);
      
      // Broadcast to WebSocket clients
      WebSocketService.broadcastPaymentUpdate(refundData);
      
      // Send notification to admin
      WebSocketService.sendNotification({
        type: 'payment_refunded',
        title: 'Payment Refunded',
        message: `Refund processed for order ${refundData.orderId}`,
        orderId: refundData.orderId,
        amount: refundData.amount,
        severity: 'info'
      });
      
    } catch (error) {
      console.error('Error handling payment refunded event:', error);
    }
  }

  /**
   * Handle customer registered event
   * @param {Object} customerData - Customer data
   */
  async handleCustomerRegistered(customerData) {
    try {
      console.log(`Processing customer registered event: ${customerData.customerId}`);
      
      // Update real-time analytics
      await AnalyticsService.updateRealTimeAnalytics('customer_registered', customerData);
      
      // Broadcast to WebSocket clients
      WebSocketService.broadcastCustomerRegistration(customerData);
      
      // Send welcome notification (could trigger email/SMS)
      this.emit('notification:welcome', {
        customerId: customerData.customerId,
        email: customerData.email,
        name: customerData.name
      });
      
    } catch (error) {
      console.error('Error handling customer registered event:', error);
    }
  }

  /**
   * Handle customer updated event
   * @param {Object} customerData - Customer data
   */
  async handleCustomerUpdated(customerData) {
    try {
      console.log(`Processing customer updated event: ${customerData.customerId}`);
      
      // Update real-time analytics if significant changes
      if (customerData.statusChanged || customerData.profileCompleted) {
        await AnalyticsService.updateRealTimeAnalytics('customer_updated', customerData);
      }
      
    } catch (error) {
      console.error('Error handling customer updated event:', error);
    }
  }

  /**
   * Emit order event
   * @param {string} eventType - Event type
   * @param {Object} orderData - Order data
   */
  emitOrderEvent(eventType, orderData) {
    this.emit(`order:${eventType}`, orderData);
  }

  /**
   * Emit payment event
   * @param {string} eventType - Event type
   * @param {Object} paymentData - Payment data
   */
  emitPaymentEvent(eventType, paymentData) {
    this.emit(`payment:${eventType}`, paymentData);
  }

  /**
   * Emit customer event
   * @param {string} eventType - Event type
   * @param {Object} customerData - Customer data
   */
  emitCustomerEvent(eventType, customerData) {
    this.emit(`customer:${eventType}`, customerData);
  }

  /**
   * Process batch analytics updates
   * @param {string} period - Period type (hourly, daily, weekly, monthly)
   */
  async processBatchAnalytics(period = 'daily') {
    try {
      console.log(`Processing batch analytics for period: ${period}`);
      
      const now = new Date();
      await AnalyticsService.processAnalyticsAggregation(now, period);
      
      // Broadcast completion to WebSocket clients
      WebSocketService.sendNotification({
        type: 'analytics_processed',
        title: 'Analytics Updated',
        message: `${period} analytics processing completed`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error processing batch analytics:', error);
      
      // Send error notification
      WebSocketService.sendNotification({
        type: 'analytics_error',
        title: 'Analytics Processing Failed',
        message: `Failed to process ${period} analytics`,
        severity: 'error'
      });
    }
  }

  /**
   * Start periodic batch processing
   */
  startPeriodicProcessing() {
    // Process hourly analytics every hour
    setInterval(() => {
      this.processBatchAnalytics('hourly');
    }, 60 * 60 * 1000); // 1 hour

    // Process daily analytics at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.processBatchAnalytics('daily');
      
      // Then process daily analytics every 24 hours
      setInterval(() => {
        this.processBatchAnalytics('daily');
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, msUntilMidnight);

    console.log('Periodic analytics processing started');
  }

  /**
   * Get event statistics
   * @returns {Object} Event statistics
   */
  getEventStats() {
    return {
      listeners: this.eventNames().map(event => ({
        event,
        listenerCount: this.listenerCount(event)
      })),
      maxListeners: this.getMaxListeners()
    };
  }
}

// Export singleton instance
module.exports = new AnalyticsEventService();