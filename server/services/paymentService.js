const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

class PaymentService {
  constructor() {
    // Validate configuration first
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay API keys not configured. Payment functionality will be disabled.');
      console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
      this.razorpay = null;
      return;
    }

    // Check for placeholder values
    if (process.env.RAZORPAY_KEY_ID.includes('REPLACE_WITH') || 
        process.env.RAZORPAY_KEY_SECRET.includes('REPLACE_WITH') ||
        process.env.RAZORPAY_KEY_ID === 'rzp_test_xxxxxxxxxx') {
      console.error('❌ Razorpay API keys contain placeholder values. Please update with actual credentials.');
      console.error('Current Key ID:', process.env.RAZORPAY_KEY_ID);
      this.razorpay = null;
      return;
    }

    try {
      // Initialize Razorpay instance
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      
      console.log('✅ Razorpay initialized successfully with Key ID:', process.env.RAZORPAY_KEY_ID);
    } catch (error) {
      console.error('❌ Failed to initialize Razorpay:', error.message);
      this.razorpay = null;
    }
  }

  /**
   * Creates a new Razorpay order
   * @param {Object} orderData - Order creation data
   * @param {number} orderData.amount - Amount in rupees
   * @param {string} orderData.currency - Currency code (default: INR)
   * @param {string} orderData.receipt - Receipt identifier
   * @param {Object} orderData.notes - Additional notes
   * @returns {Promise<Object>} Created order details
   */
  async createRazorpayOrder(orderData) {
    try {
      // Check if Razorpay is properly configured
      if (!this.razorpay) {
        throw new Error('Razorpay is not properly configured. Please check your API credentials.');
      }

      const { amount, currency = 'INR', receipt, notes = {} } = orderData;

      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount provided');
      }

      // Convert amount to paisa (smallest currency unit)
      const amountInPaisa = Math.round(amount * 100);

      console.log('Creating Razorpay order with:', {
        amount: amountInPaisa,
        currency: currency.toUpperCase(),
        receipt: receipt || `receipt_${Date.now()}`,
        key_id: process.env.RAZORPAY_KEY_ID
      });

      // Create order with Razorpay
      const razorpayOrder = await this.razorpay.orders.create({
        amount: amountInPaisa,
        currency: currency.toUpperCase(),
        receipt: receipt || `receipt_${Date.now()}`,
        notes: {
          ...notes,
          created_by: 'handicraft_store',
          created_at: new Date().toISOString()
        }
      });

      console.log('✅ Razorpay order created successfully:', razorpayOrder.id);

      return {
        success: true,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        key_id: process.env.RAZORPAY_KEY_ID
      };

    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error);
      
      // Provide specific error messages for common issues
      let errorMessage = 'Failed to create payment order';
      
      if (error.statusCode === 401) {
        errorMessage = 'Invalid Razorpay API credentials. Please check your Key ID and Key Secret.';
      } else if (error.statusCode === 400) {
        errorMessage = 'Invalid request data. Please check the order details.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.error || error,
        statusCode: error.statusCode
      };
    }
  }

  /**
   * Verifies payment signature using HMAC SHA256
   * @param {Object} paymentData - Payment verification data
   * @param {string} paymentData.razorpay_order_id - Razorpay order ID
   * @param {string} paymentData.razorpay_payment_id - Razorpay payment ID
   * @param {string} paymentData.razorpay_signature - Payment signature
   * @returns {Promise<Object>} Verification result
   */
  async verifyPaymentSignature(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Validate required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error('Missing required payment verification data');
      }

      // Create signature for verification
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      // Use constant-time comparison to prevent timing attacks
      const isAuthentic = this.constantTimeCompare(expectedSignature, razorpay_signature);

      if (isAuthentic) {
        console.log('Payment signature verified successfully:', razorpay_payment_id);
        
        return {
          success: true,
          message: 'Payment verified successfully',
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id
        };
      } else {
        console.error('Payment signature verification failed:', {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          expected: expectedSignature,
          received: razorpay_signature
        });

        return {
          success: false,
          message: 'Payment verification failed',
          error: 'Invalid signature'
        };
      }

    } catch (error) {
      console.error('Error verifying payment signature:', error);
      
      return {
        success: false,
        message: 'Payment verification failed',
        error: error.message || error
      };
    }
  }

  /**
   * Updates payment status in database
   * @param {string} razorpayOrderId - Razorpay order ID
   * @param {string} status - New payment status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>} Update result
   */
  async updatePaymentStatus(razorpayOrderId, status, additionalData = {}) {
    try {
      // Find payment record
      const payment = await Payment.findByRazorpayOrderId(razorpayOrderId);
      
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Update payment status
      payment.status = status;
      
      // Update additional fields
      if (additionalData.razorpay_payment_id) {
        payment.razorpayPaymentId = additionalData.razorpay_payment_id;
      }
      
      if (additionalData.signature) {
        payment.signature = additionalData.signature;
      }
      
      if (additionalData.failure_reason) {
        payment.failureReason = additionalData.failure_reason;
      }

      if (additionalData.payment_method) {
        payment.paymentMethod = additionalData.payment_method;
      }

      await payment.save();

      // Update corresponding order
      const order = await Order.findById(payment.orderId);
      if (order) {
        if (status === 'paid') {
          await order.markAsPaid(additionalData.razorpay_payment_id);
        } else if (status === 'failed') {
          await order.markPaymentFailed();
        }
      }

      console.log(`Payment status updated to ${status} for order:`, razorpayOrderId);

      return {
        success: true,
        message: 'Payment status updated successfully',
        payment_id: payment._id,
        status: payment.status
      };

    } catch (error) {
      console.error('Error updating payment status:', error);
      
      return {
        success: false,
        message: 'Failed to update payment status',
        error: error.message || error
      };
    }
  }

  /**
   * Creates a payment record in database
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment record
   */
  async createPaymentRecord(paymentData) {
    try {
      const payment = new Payment(paymentData);
      await payment.save();

      console.log('Payment record created:', payment._id);

      return {
        success: true,
        payment_id: payment._id,
        razorpay_order_id: payment.razorpayOrderId
      };

    } catch (error) {
      console.error('Error creating payment record:', error);
      
      return {
        success: false,
        message: 'Failed to create payment record',
        error: error.message || error
      };
    }
  }

  /**
   * Gets payment status by order ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(orderId) {
    try {
      const payment = await Payment.findByOrderId(orderId).populate('orderId');
      
      if (!payment) {
        return {
          success: false,
          message: 'Payment not found'
        };
      }

      return {
        success: true,
        payment: {
          id: payment._id,
          razorpay_order_id: payment.razorpayOrderId,
          razorpay_payment_id: payment.razorpayPaymentId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          created_at: payment.createdAt,
          updated_at: payment.updatedAt
        }
      };

    } catch (error) {
      console.error('Error getting payment status:', error);
      
      return {
        success: false,
        message: 'Failed to get payment status',
        error: error.message || error
      };
    }
  }

  /**
   * Processes webhook events
   * @param {Object} eventData - Webhook event data
   * @returns {Promise<Object>} Processing result
   */
  async processWebhookEvent(eventData) {
    try {
      const { event, payload } = eventData;
      
      console.log('Processing webhook event:', event);

      switch (event) {
        case 'payment.captured':
          return await this.handlePaymentCaptured(payload.payment.entity);
          
        case 'payment.failed':
          return await this.handlePaymentFailed(payload.payment.entity);
          
        case 'order.paid':
          return await this.handleOrderPaid(payload.order.entity);
          
        default:
          console.log('Unhandled webhook event:', event);
          return { success: true, message: 'Event acknowledged but not processed' };
      }

    } catch (error) {
      console.error('Error processing webhook event:', error);
      
      return {
        success: false,
        message: 'Failed to process webhook event',
        error: error.message || error
      };
    }
  }

  /**
   * Handles payment captured webhook
   * @param {Object} paymentEntity - Payment entity from webhook
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentCaptured(paymentEntity) {
    const { id: paymentId, order_id: orderId, method, bank, card_id } = paymentEntity;
    
    return await this.updatePaymentStatus(orderId, 'paid', {
      razorpay_payment_id: paymentId,
      payment_method: method,
      bank: bank,
      card_id: card_id
    });
  }

  /**
   * Handles payment failed webhook
   * @param {Object} paymentEntity - Payment entity from webhook
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentFailed(paymentEntity) {
    const { order_id: orderId, error_description } = paymentEntity;
    
    return await this.updatePaymentStatus(orderId, 'failed', {
      failure_reason: error_description
    });
  }

  /**
   * Handles order paid webhook
   * @param {Object} orderEntity - Order entity from webhook
   * @returns {Promise<Object>} Processing result
   */
  async handleOrderPaid(orderEntity) {
    const { id: orderId } = orderEntity;
    
    return await this.updatePaymentStatus(orderId, 'paid');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
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
   * Validates Razorpay configuration
   * @returns {boolean} True if configuration is valid
   */
  isConfigured() {
    return !!(this.razorpay && 
              process.env.RAZORPAY_KEY_ID && 
              process.env.RAZORPAY_KEY_SECRET &&
              !process.env.RAZORPAY_KEY_ID.includes('REPLACE_WITH') &&
              !process.env.RAZORPAY_KEY_SECRET.includes('REPLACE_WITH') &&
              process.env.RAZORPAY_KEY_ID !== 'rzp_test_xxxxxxxxxx');
  }
}

module.exports = new PaymentService();