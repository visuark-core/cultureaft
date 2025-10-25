const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

class WebhookService {
  constructor() {
    this.processedEvents = new Set(); // In-memory cache for recent events
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay
  }

  /**
   * Verifies webhook signature
   * @param {string} signature - Webhook signature from headers
   * @param {string} body - Raw webhook body
   * @returns {boolean} True if signature is valid
   */
  verifyWebhookSignature(signature, body) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.warn('Webhook secret not configured, skipping signature verification');
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      // Use constant-time comparison
      return this.constantTimeCompare(signature, expectedSignature);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Processes webhook event with idempotency and retry logic
   * @param {Object} eventData - Webhook event data
   * @returns {Promise<Object>} Processing result
   */
  async processWebhookEvent(eventData) {
    const { event, payload } = eventData;
    const eventId = this.generateEventId(eventData);

    try {
      // Check for duplicate events (idempotency)
      if (this.processedEvents.has(eventId)) {
        console.log('Duplicate webhook event ignored:', eventId);
        return {
          success: true,
          message: 'Event already processed',
          duplicate: true
        };
      }

      // Process event with retry logic
      const result = await this.processEventWithRetry(event, payload, 0);

      // Mark event as processed
      this.processedEvents.add(eventId);
      
      // Clean up old events (keep last 1000)
      if (this.processedEvents.size > 1000) {
        const eventsArray = Array.from(this.processedEvents);
        this.processedEvents.clear();
        eventsArray.slice(-500).forEach(id => this.processedEvents.add(id));
      }

      return result;

    } catch (error) {
      console.error('Error processing webhook event:', error);
      return {
        success: false,
        message: 'Failed to process webhook event',
        error: error.message
      };
    }
  }

  /**
   * Processes event with exponential backoff retry
   * @param {string} event - Event type
   * @param {Object} payload - Event payload
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Object>} Processing result
   */
  async processEventWithRetry(event, payload, attempt) {
    try {
      return await this.processEvent(event, payload);
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Webhook processing failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        
        await this.sleep(delay);
        return await this.processEventWithRetry(event, payload, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * Processes individual webhook event
   * @param {string} event - Event type
   * @param {Object} payload - Event payload
   * @returns {Promise<Object>} Processing result
   */
  async processEvent(event, payload) {
    console.log('Processing webhook event:', event);

    switch (event) {
      case 'payment.captured':
        return await this.handlePaymentCaptured(payload.payment.entity);
        
      case 'payment.failed':
        return await this.handlePaymentFailed(payload.payment.entity);
        
      case 'payment.authorized':
        return await this.handlePaymentAuthorized(payload.payment.entity);
        
      case 'order.paid':
        return await this.handleOrderPaid(payload.order.entity);
        
      case 'refund.created':
        return await this.handleRefundCreated(payload.refund.entity);
        
      case 'refund.processed':
        return await this.handleRefundProcessed(payload.refund.entity);
        
      default:
        console.log('Unhandled webhook event:', event);
        return {
          success: true,
          message: 'Event acknowledged but not processed',
          unhandled: true
        };
    }
  }

  /**
   * Handles payment captured event
   * @param {Object} paymentEntity - Payment entity from webhook
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentCaptured(paymentEntity) {
    const {
      id: paymentId,
      order_id: orderId,
      amount,
      currency,
      method,
      bank,
      card_id,
      captured_at
    } = paymentEntity;

    console.log('Processing payment captured:', paymentId);

    // Find payment record
    const payment = await Payment.findByRazorpayOrderId(orderId);
    if (!payment) {
      throw new Error(`Payment record not found for order: ${orderId}`);
    }

    // Update payment record
    payment.status = 'paid';
    payment.razorpayPaymentId = paymentId;
    payment.paymentMethod = method;
    payment.bank = bank;
    payment.cardId = card_id;

    await payment.save();

    // Update order status
    const order = await Order.findById(payment.orderId);
    if (order) {
      await order.markAsPaid(paymentId, new Date(captured_at * 1000));
    }

    // Add webhook event to payment record
    await payment.addWebhookEvent(paymentId, 'payment.captured', paymentEntity);

    return {
      success: true,
      message: 'Payment captured processed successfully',
      payment_id: paymentId,
      order_id: orderId
    };
  }

  /**
   * Handles payment failed event
   * @param {Object} paymentEntity - Payment entity from webhook
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentFailed(paymentEntity) {
    const {
      id: paymentId,
      order_id: orderId,
      error_code,
      error_description,
      error_source,
      error_step,
      error_reason
    } = paymentEntity;

    console.log('Processing payment failed:', paymentId);

    // Find payment record
    const payment = await Payment.findByRazorpayOrderId(orderId);
    if (!payment) {
      throw new Error(`Payment record not found for order: ${orderId}`);
    }

    // Update payment record
    payment.status = 'failed';
    payment.razorpayPaymentId = paymentId;
    payment.failureReason = error_description || error_reason;

    await payment.save();

    // Update order status
    const order = await Order.findById(payment.orderId);
    if (order) {
      await order.markPaymentFailed();
    }

    // Add webhook event to payment record
    await payment.addWebhookEvent(paymentId, 'payment.failed', paymentEntity);

    return {
      success: true,
      message: 'Payment failure processed successfully',
      payment_id: paymentId,
      order_id: orderId,
      error: error_description
    };
  }

  /**
   * Handles payment authorized event
   * @param {Object} paymentEntity - Payment entity from webhook
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentAuthorized(paymentEntity) {
    const { id: paymentId, order_id: orderId } = paymentEntity;

    console.log('Processing payment authorized:', paymentId);

    // Find payment record
    const payment = await Payment.findByRazorpayOrderId(orderId);
    if (payment) {
      payment.status = 'attempted';
      payment.razorpayPaymentId = paymentId;
      await payment.save();

      // Add webhook event to payment record
      await payment.addWebhookEvent(paymentId, 'payment.authorized', paymentEntity);
    }

    return {
      success: true,
      message: 'Payment authorization processed successfully',
      payment_id: paymentId,
      order_id: orderId
    };
  }

  /**
   * Handles order paid event
   * @param {Object} orderEntity - Order entity from webhook
   * @returns {Promise<Object>} Processing result
   */
  async handleOrderPaid(orderEntity) {
    const { id: orderId, amount_paid } = orderEntity;

    console.log('Processing order paid:', orderId);

    // Find payment record
    const payment = await Payment.findByRazorpayOrderId(orderId);
    if (payment && payment.status !== 'paid') {
      payment.status = 'paid';
      await payment.save();

      // Update order status
      const order = await Order.findById(payment.orderId);
      if (order) {
        await order.markAsPaid(payment.razorpayPaymentId);
      }

      // Add webhook event to payment record
      await payment.addWebhookEvent(orderId, 'order.paid', orderEntity);
    }

    return {
      success: true,
      message: 'Order paid processed successfully',
      order_id: orderId,
      amount_paid
    };
  }

  /**
   * Handles refund created event
   * @param {Object} refundEntity - Refund entity from webhook
   * @returns {Promise<Object>} Processing result
   */
  async handleRefundCreated(refundEntity) {
    const {
      id: refundId,
      payment_id: paymentId,
      amount,
      status,
      created_at
    } = refundEntity;

    console.log('Processing refund created:', refundId);

    // Find payment record by payment ID
    const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (payment) {
      // Add refund to payment record
      payment.refunds.push({
        refundId,
        amount,
        status,
        createdAt: new Date(created_at * 1000)
      });

      await payment.save();

      // Add webhook event to payment record
      await payment.addWebhookEvent(refundId, 'refund.created', refundEntity);
    }

    return {
      success: true,
      message: 'Refund creation processed successfully',
      refund_id: refundId,
      payment_id: paymentId
    };
  }

  /**
   * Handles refund processed event
   * @param {Object} refundEntity - Refund entity from webhook
   * @returns {Promise<Object>} Processing result
   */
  async handleRefundProcessed(refundEntity) {
    const {
      id: refundId,
      payment_id: paymentId,
      status
    } = refundEntity;

    console.log('Processing refund processed:', refundId);

    // Find payment record and update refund status
    const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (payment) {
      const refund = payment.refunds.find(r => r.refundId === refundId);
      if (refund) {
        refund.status = status;
        await payment.save();
      }

      // Add webhook event to payment record
      await payment.addWebhookEvent(refundId, 'refund.processed', refundEntity);
    }

    return {
      success: true,
      message: 'Refund processing completed successfully',
      refund_id: refundId,
      payment_id: paymentId,
      status
    };
  }

  /**
   * Generates unique event ID for idempotency
   * @param {Object} eventData - Event data
   * @returns {string} Unique event ID
   */
  generateEventId(eventData) {
    const { event, payload } = eventData;
    const entityId = payload?.payment?.entity?.id || 
                    payload?.order?.entity?.id || 
                    payload?.refund?.entity?.id || 
                    'unknown';
    
    return `${event}_${entityId}_${Date.now()}`;
  }

  /**
   * Constant-time string comparison
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} True if strings are equal
   */
  constantTimeCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets webhook processing statistics
   * @returns {Object} Processing statistics
   */
  getStats() {
    return {
      processedEventsCount: this.processedEvents.size,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    };
  }
}

module.exports = new WebhookService();