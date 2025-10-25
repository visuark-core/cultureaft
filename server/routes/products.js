const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware for product creation/update
const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
];

/**
 * @route GET /api/products
 * @desc Get all products with pagination and filtering
 * @access Public
 */
router.get('/', productController.getProducts);

/**
 * @route POST /api/products
 * @desc Create new product (Admin only)
 * @access Private/Admin
 */
router.post('/', verifyToken, productValidation, productController.createProduct);

/**
 * @route GET /api/products/:id
 * @desc Get single product by ID
 * @access Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route PUT /api/products/:id
 * @desc Update product (Admin only)
 * @access Private/Admin
 */
router.put('/:id', verifyToken, productValidation, productController.updateProduct);

/**
 * @route DELETE /api/products/:id
 * @desc Delete product (Admin only)
 * @access Private/Admin
 */
router.delete('/:id', verifyToken, productController.deleteProduct);

/**
 * @route GET /api/products/category/:category
 * @desc Get products by category
 * @access Public
 */
router.get('/category/:category', productController.getProductsByCategory);

/**
 * @route GET /api/products/search/:query
 * @desc Search products (using query params instead)
 * @access Public
 */
router.get('/search', productController.getProducts);

/**
 * @route GET /api/products/featured/list
 * @desc Get featured products
 * @access Public
 */
router.get('/featured/list', productController.getFeaturedProducts);

/**
 * @route GET /api/products/categories/list
 * @desc Get all product categories
 * @access Public
 */
router.get('/categories/list', productController.getCategories);

module.exports = router;