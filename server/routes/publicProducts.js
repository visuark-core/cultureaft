const express = require('express');
const { query, param, validationResult } = require('express-validator');
const userProductService = require('../services/userProductService');

const router = express.Router();

// Validation middleware
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

// @route   GET /api/products
// @desc    Get products for public display
// @access  Public
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('sortBy').optional().isIn(['createdAt', 'name', 'price', 'rating']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search query too long'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        category: req.query.category,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        search: req.query.search,
        craftsman: req.query.craftsman,
        origin: req.query.origin
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') {
          delete filters[key];
        }
      });

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await userProductService.getPublicProducts(filters, options);

      res.json({
        success: true,
        message: 'Products retrieved successfully',
        data: result
      });

    } catch (error) {
      console.error('Error retrieving public products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve products'
      });
    }
  }
);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured',
  [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 8;
      const products = await userProductService.getFeaturedProducts(limit);

      res.json({
        success: true,
        message: 'Featured products retrieved successfully',
        data: products
      });

    } catch (error) {
      console.error('Error retrieving featured products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve featured products'
      });
    }
  }
);

// @route   GET /api/products/new
// @desc    Get new products
// @access  Public
router.get('/new',
  [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 8;
      const products = await userProductService.getNewProducts(limit);

      res.json({
        success: true,
        message: 'New products retrieved successfully',
        data: products
      });

    } catch (error) {
      console.error('Error retrieving new products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve new products'
      });
    }
  }
);

// @route   GET /api/products/categories
// @desc    Get all product categories
// @access  Public
router.get('/categories',
  async (req, res) => {
    try {
      const categories = await userProductService.getPublicCategories();

      res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
      });

    } catch (error) {
      console.error('Error retrieving categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories'
      });
    }
  }
);

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get('/search',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const searchQuery = req.query.q;
      const filters = {
        category: req.query.category,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') {
          delete filters[key];
        }
      });

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'rating',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await userProductService.searchPublicProducts(searchQuery, filters, options);

      res.json({
        success: true,
        message: 'Product search completed successfully',
        data: result
      });

    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products'
      });
    }
  }
);

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category',
  [
    param('category').notEmpty().withMessage('Category is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const category = req.params.category;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await userProductService.getProductsByCategory(category, options);

      res.json({
        success: true,
        message: `Products in category '${category}' retrieved successfully`,
        data: result
      });

    } catch (error) {
      console.error('Error retrieving products by category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve products by category'
      });
    }
  }
);

// @route   GET /api/products/craftsman/:craftsman
// @desc    Get products by craftsman
// @access  Public
router.get('/craftsman/:craftsman',
  [
    param('craftsman').notEmpty().withMessage('Craftsman is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const craftsman = req.params.craftsman;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await userProductService.getProductsByCraftsman(craftsman, options);

      res.json({
        success: true,
        message: `Products by craftsman '${craftsman}' retrieved successfully`,
        data: result
      });

    } catch (error) {
      console.error('Error retrieving products by craftsman:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve products by craftsman'
      });
    }
  }
);

// @route   GET /api/products/recommendations
// @desc    Get recommended products
// @access  Public
router.get('/recommendations',
  [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 8;
      
      // Simple user preferences (can be enhanced with user authentication and history)
      const userPreferences = {
        categories: req.query.categories ? req.query.categories.split(',') : [],
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice
      };

      const products = await userProductService.getRecommendedProducts(userPreferences, limit);

      res.json({
        success: true,
        message: 'Recommended products retrieved successfully',
        data: products
      });

    } catch (error) {
      console.error('Error retrieving recommended products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recommended products'
      });
    }
  }
);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id',
  async (req, res) => {
    try {
      const product = await userProductService.getPublicProductById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or not available'
        });
      }

      res.json({
        success: true,
        message: 'Product retrieved successfully',
        data: product
      });

    } catch (error) {
      console.error('Error retrieving product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve product'
      });
    }
  }
);

// @route   GET /api/products/:id/related
// @desc    Get related products
// @access  Public
router.get('/:id/related',
  [
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 4;
      const products = await userProductService.getRelatedProducts(req.params.id, limit);

      res.json({
        success: true,
        message: 'Related products retrieved successfully',
        data: products
      });

    } catch (error) {
      console.error('Error retrieving related products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve related products'
      });
    }
  }
);

// @route   POST /api/products/:id/check-availability
// @desc    Check product availability and stock
// @access  Public
router.post('/:id/check-availability',
  [
    query('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const quantity = parseInt(req.query.quantity) || 1;
      const availability = await userProductService.checkProductAvailability(req.params.id, quantity);

      res.json({
        success: true,
        message: 'Product availability checked successfully',
        data: availability
      });

    } catch (error) {
      console.error('Error checking product availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check product availability'
      });
    }
  }
);

module.exports = router;