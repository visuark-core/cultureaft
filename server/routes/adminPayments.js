const express = require('express');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { query, param } = require('express-validator');
const { validationResult } = require('express-validator');

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * GET /api/admin/payments/dashboard
 * Gets payment dashboard data - COD only
 */
router.get('/dashboard',
  authenticateAdmin,
  (req, res) => {
    res.json({
      success: true,
      data: {
        totalRevenue: 0,
        totalOrders: 0,
        codOrders: 0,
        pendingCOD: 0,
        paymentMethods: {
          cod: 100
        },
        message: 'Cash on Delivery only - no online payments processed'
      }
    });
  }
);

/**
 * GET /api/admin/payments/analytics
 * Gets payment analytics - COD only
 */
router.get('/analytics',
  authenticateAdmin,
  (req, res) => {
    res.json({
      success: true,
      data: {
        totalTransactions: 0,
        successRate: 100,
        averageOrderValue: 0,
        paymentMethods: {
          cod: 100
        },
        message: 'Cash on Delivery only - no online payment analytics'
      }
    });
  }
);

/**
 * GET /api/admin/payments/orders/:orderId
 * Get payment details for a specific order
 */
router.get('/orders/:orderId',
  authenticateAdmin,
  [
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  handleValidationErrors,
  (req, res) => {
    res.json({
      success: true,
      data: {
        orderId: req.params.orderId,
        paymentMethod: 'cod',
        status: 'pending',
        amount: 0,
        message: 'Cash on Delivery - payment will be collected on delivery'
      }
    });
  }
);

/**
 * GET /api/admin/payments/status
 * Get payment system status
 */
router.get('/status',
  authenticateAdmin,
  (req, res) => {
    res.json({
      success: true,
      data: {
        paymentGateway: 'Cash on Delivery',
        status: 'active',
        supportedMethods: ['cod'],
        message: 'Payment system configured for Cash on Delivery only'
      }
    });
  }
);

module.exports = router;