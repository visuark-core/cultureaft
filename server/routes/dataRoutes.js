const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const { body } = require('express-validator');

// Validation middleware
const validateCustomer = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required')
];

const validateProduct = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('description').notEmpty().withMessage('Description is required')
];

const validateOrder = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('totalAmount').isNumeric().withMessage('Total amount must be a number')
];

// Customer routes
router.get('/customers', dataController.getAllCustomers);
router.get('/customers/:id', dataController.getCustomerById);
router.post('/customers', validateCustomer, dataController.createCustomer);
router.put('/customers/:id', dataController.updateCustomer);

// Product routes
router.get('/products', dataController.getAllProducts);
router.get('/products/:id', dataController.getProductById);
router.post('/products', validateProduct, dataController.createProduct);
router.put('/products/:id', dataController.updateProduct);

// Order routes
router.get('/orders', dataController.getAllOrders);
router.get('/orders/:id', dataController.getOrderById);
router.post('/orders', validateOrder, dataController.createOrder);
router.put('/orders/:id', dataController.updateOrder);

// Admin user routes
router.get('/admin-users', dataController.getAllAdminUsers);

// Analytics routes
router.get('/analytics', dataController.getAnalytics);

// Data source status
router.get('/status', dataController.getDataSourceStatus);

module.exports = router;