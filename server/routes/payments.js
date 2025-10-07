const express = require('express');
const crypto = require('crypto');
const paymentService = require('../services/paymentService');
const webhookService = require('../services/webhookService');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

const router = express.Router();

/**
 * POST /api/payments/create-order
 * Creates a new Razorpay order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt, notes, orderData } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
        error: 'INVALID_AMOUNT'
      });
    }

    // Check if Razorpay is configured
    if (!paymentService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Payment service not configured',
        error: 'PAYMENT_SERVICE_UNAVAILABLE'
      });
    }

    // Create Razorpay order
    const razorpayResult = await paymentService.createRazorpayOrder({
      amount,
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {}
    });

    if (!razorpayResult.success) {
      return res.status(500).json({
        success: false,
        message: razorpayResult.message,
        error: razorpayResult.error
      });
    }

    // Create order record in database if orderData is provided
    let dbOrder = null;
    if (orderData) {
      try {
        const order = new Order({
          ...orderData,
          razorpayOrderId: razorpayResult.order_id,
          paymentMethod: 'razorpay',
          paymentStatus: 'pending'
        });
        dbOrder = await order.save();
      } catch (dbError) {
        console.error('Error creating order in database:', dbError);
        // Continue with payment creation even if order creation fails
      }
    }

    // Create payment record
    const paymentRecord = await paymentService.createPaymentRecord({
      orderId: dbOrder ? dbOrder._id : null,
      razorpayOrderId: razorpayResult.order_id,
      amount: razorpayResult.amount,
      currency: razorpayResult.currency,
      receipt: razorpayResult.receipt,
      status: 'created',
      notes: notes || {}
    });

    if (!paymentRecord.success) {
      console.error('Failed to create payment record:', paymentRecord.error);
      // Continue with response even if payment record creation fails
    }

    // Return success response
    res.json({
      success: true,
      data: {
        id: razorpayResult.order_id,
        amount: razorpayResult.amount,
        currency: razorpayResult.currency,
        receipt: razorpayResult.receipt,
        status: 'created',
        key_id: razorpayResult.key_id,
        db_order_id: dbOrder ? dbOrder._id : null
      }
    });

  } catch (error) {
    console.error('Error in create-order endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/payments/verify
 * Verifies payment signature and updates payment status
 */
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification data',
        error: 'MISSING_PAYMENT_DATA'
      });
    }

    // Verify payment signature
    const verificationResult = await paymentService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verificationResult.success) {
      // Log security incident
      console.error('Payment signature verification failed:', {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      return res.status(400).json({
        success: false,
        message: verificationResult.message,
        error: 'SIGNATURE_VERIFICATION_FAILED'
      });
    }

    // Update payment status
    const updateResult = await paymentService.updatePaymentStatus(
      razorpay_order_id,
      'paid',
      {
        razorpay_payment_id,
        signature: razorpay_signature
      }
    );

    if (!updateResult.success) {
      console.error('Failed to update payment status:', updateResult.error);
      return res.status(500).json({
        success: false,
        message: 'Payment verified but status update failed',
        error: 'STATUS_UPDATE_FAILED'
      });
    }

    // Return success response
    res.json({
      success: true,
      data: {
        success: true,
        message: 'Payment verified and processed successfully',
        transactionId: razorpay_payment_id,
        orderId: razorpay_order_id
      }
    });

  } catch (error) {
    console.error('Error in verify endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/payments/status/:orderId
 * Gets payment status for an order
 */
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate order ID
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
        error: 'MISSING_ORDER_ID'
      });
    }

    // Get payment status
    const statusResult = await paymentService.getPaymentStatus(orderId);

    if (!statusResult.success) {
      return res.status(404).json({
        success: false,
        message: statusResult.message,
        error: 'PAYMENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      payment: statusResult.payment
    });

  } catch (error) {
    console.error('Error in status endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/payments/webhook
 * Handles Razorpay webhook events
 */
router.post('/webhook', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    if (!webhookService.verifyWebhookSignature(webhookSignature, webhookBody)) {
      console.error('Webhook signature verification failed:', {
        signature: webhookSignature,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
        error: 'INVALID_WEBHOOK_SIGNATURE'
      });
    }

    // Process webhook event with retry and idempotency
    const eventResult = await webhookService.processWebhookEvent({
      event: req.body.event,
      payload: req.body.payload
    });

    if (!eventResult.success && !eventResult.duplicate) {
      console.error('Webhook event processing failed:', eventResult.error);
      return res.status(500).json({
        success: false,
        message: eventResult.message,
        error: 'WEBHOOK_PROCESSING_FAILED'
      });
    }

    res.json({
      success: true,
      message: eventResult.message || 'Webhook processed successfully',
      duplicate: eventResult.duplicate || false,
      unhandled: eventResult.unhandled || false
    });

  } catch (error) {
    console.error('Error in webhook endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/payments/config
 * Returns payment configuration for frontend
 */
router.get('/config', (req, res) => {
  try {
    const isConfigured = paymentService.isConfigured();
    
    if (!isConfigured) {
      console.log('❌ Payment service configuration check failed');
      console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
      console.log('Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
      
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured. Please check your Razorpay API credentials.',
        error: 'PAYMENT_SERVICE_UNAVAILABLE',
        details: {
          hasKeyId: !!process.env.RAZORPAY_KEY_ID,
          hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
          keyIdValid: !!(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('REPLACE_WITH'))
        }
      });
    }

    console.log('✅ Payment service is properly configured');
    
    res.json({
      success: true,
      config: {
        key_id: process.env.RAZORPAY_KEY_ID,
        currency: 'INR',
        company_name: 'Handicraft Store',
        theme_color: '#3399cc'
      }
    });

  } catch (error) {
    console.error('Error in config endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/payments/webhook/stats
 * Returns webhook processing statistics
 */
router.get('/webhook/stats', (req, res) => {
  try {
    const stats = webhookService.getStats();
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error in webhook stats endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;