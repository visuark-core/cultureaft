const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const productService = require('../services/productService');
const { 
  authenticateAdmin, 
  requirePermission, 
  auditLogger,
  sensitiveOperationLimiter 
} = require('../middleware/adminAuth');
const { uploadProductImages, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateAdmin);

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

// @route   GET /api/admin/products
// @desc    Get products with filtering and pagination
// @access  Private (requires products:read permission)
router.get('/',
  requirePermission('products', 'read'),
  auditLogger('read', 'products'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['createdAt', 'name', 'price', 'stock', 'rating', 'category']).withMessage('Invalid sort field'),
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
        inStock: req.query.inStock,
        lowStock: req.query.lowStock,
        isFeatured: req.query.isFeatured,
        isNew: req.query.isNew,
        minRating: req.query.minRating,
        craftsman: req.query.craftsman,
        origin: req.query.origin
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        search: req.query.search || ''
      };

      const result = await productService.getProducts(filters, options);

      res.json({
        success: true,
        message: 'Products retrieved successfully',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve products'
      });
    }
  }
);

// @route   GET /api/admin/products/statistics
// @desc    Get product statistics
// @access  Private (requires products:read permission)
router.get('/statistics',
  requirePermission('products', 'read'),
  auditLogger('read', 'product_statistics'),
  async (req, res) => {
    try {
      const statistics = await productService.getProductStatistics();

      res.json({
        success: true,
        message: 'Product statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve product statistics'
      });
    }
  }
);

// @route   GET /api/admin/products/categories
// @desc    Get all product categories
// @access  Private (requires products:read permission)
router.get('/categories',
  requirePermission('products', 'read'),
  async (req, res) => {
    try {
      const categories = await productService.getCategories();

      res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve categories'
      });
    }
  }
);

// @route   GET /api/admin/products/craftsmen
// @desc    Get all craftsmen
// @access  Private (requires products:read permission)
router.get('/craftsmen',
  requirePermission('products', 'read'),
  async (req, res) => {
    try {
      const craftsmen = await productService.getCraftsmen();

      res.json({
        success: true,
        message: 'Craftsmen retrieved successfully',
        data: craftsmen
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve craftsmen'
      });
    }
  }
);

// @route   GET /api/admin/products/low-stock
// @desc    Get low stock products
// @access  Private (requires products:read permission)
router.get('/low-stock',
  requirePermission('products', 'read'),
  auditLogger('read', 'low_stock_products'),
  [
    query('threshold').optional().isInt({ min: 1, max: 100 }).withMessage('Threshold must be between 1 and 100')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold) || 10;
      const products = await productService.getLowStockProducts(threshold);

      res.json({
        success: true,
        message: 'Low stock products retrieved successfully',
        data: {
          threshold,
          products
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve low stock products'
      });
    }
  }
);

// @route   GET /api/admin/products/out-of-stock
// @desc    Get out of stock products
// @access  Private (requires products:read permission)
router.get('/out-of-stock',
  requirePermission('products', 'read'),
  auditLogger('read', 'out_of_stock_products'),
  async (req, res) => {
    try {
      const products = await productService.getOutOfStockProducts();

      res.json({
        success: true,
        message: 'Out of stock products retrieved successfully',
        data: products
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve out of stock products'
      });
    }
  }
);

// @route   GET /api/admin/products/search
// @desc    Search products
// @access  Private (requires products:read permission)
router.get('/search',
  requirePermission('products', 'read'),
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const searchCriteria = {
        query: req.query.q,
        filters: {
          category: req.query.category,
          inStock: req.query.inStock
        },
        limit: parseInt(req.query.limit) || 20
      };

      const products = await productService.searchProducts(searchCriteria);

      res.json({
        success: true,
        message: 'Product search completed successfully',
        data: products
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search products'
      });
    }
  }
);

// @route   GET /api/admin/products/:id
// @desc    Get single product by ID
// @access  Private (requires products:read permission)
router.get('/:id',
  requirePermission('products', 'read'),
  auditLogger('read', 'products'),
  [
    param('id').isMongoId().withMessage('Invalid product ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const product = await productService.getProductById(req.params.id);

      res.json({
        success: true,
        message: 'Product retrieved successfully',
        data: product
      });

    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve product'
      });
    }
  }
);

// @route   POST /api/admin/products
// @desc    Create new product
// @access  Private (requires products:create permission)
router.post('/',
  requirePermission('products', 'create'),
  uploadProductImages,
  handleUploadError,
  auditLogger('create', 'products'),
  [
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Product name is required and must be less than 200 characters'),
    body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category is required and must be less than 100 characters'),
    body('price').isNumeric().withMessage('Price must be a number').custom(value => {
      if (parseFloat(value) < 0) throw new Error('Price must be a positive number');
      return true;
    }),
    body('originalPrice').optional().isNumeric().withMessage('Original price must be a number').custom(value => {
      if (value && parseFloat(value) < 0) throw new Error('Original price must be a positive number');
      return true;
    }),
    body('sku').optional().trim().isLength({ max: 50 }).withMessage('SKU must be less than 50 characters'),
    body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required and must be less than 2000 characters'),
    body('stock').optional().isNumeric().withMessage('Stock must be a number').custom(value => {
      if (value && parseInt(value) < 0) throw new Error('Stock must be a non-negative integer');
      return true;
    }),
    body('rating').optional().isNumeric().withMessage('Rating must be a number').custom(value => {
      if (value && (parseFloat(value) < 0 || parseFloat(value) > 5)) throw new Error('Rating must be between 0 and 5');
      return true;
    }),
    body('isFeatured').optional().isIn(['true', 'false']).withMessage('isFeatured must be boolean'),
    body('isNew').optional().isIn(['true', 'false']).withMessage('isNew must be boolean'),
    body('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Handle file uploads
      let mainImage = null;
      let additionalImages = [];
      let imagePublicIds = [];

      if (req.files) {
        if (req.files.image && req.files.image[0]) {
          mainImage = req.files.image[0].path;
          imagePublicIds.push(req.files.image[0].filename);
        }
        if (req.files.images) {
          additionalImages = req.files.images.map(file => file.path);
          imagePublicIds.push(...req.files.images.map(file => file.filename));
        }
      }

      // Validate that at least one image is provided
      if (!mainImage) {
        return res.status(400).json({
          success: false,
          message: 'At least one product image is required'
        });
      }

      // Parse arrays from form data
      const materials = req.body.materials ? 
        (Array.isArray(req.body.materials) ? req.body.materials : JSON.parse(req.body.materials)) : [];
      const tags = req.body.tags ? 
        (Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags)) : [];
      const careInstructions = req.body.careInstructions ? 
        (Array.isArray(req.body.careInstructions) ? req.body.careInstructions : JSON.parse(req.body.careInstructions)) : [];

      // Parse shipping dimensions
      let shippingDimensions = {};
      if (req.body.shippingDimensions) {
        try {
          const dims = typeof req.body.shippingDimensions === 'string' ? 
            JSON.parse(req.body.shippingDimensions) : req.body.shippingDimensions;
          shippingDimensions = {
            length: dims.length ? parseFloat(dims.length) : undefined,
            width: dims.width ? parseFloat(dims.width) : undefined,
            height: dims.height ? parseFloat(dims.height) : undefined
          };
        } catch (e) {
          // If parsing fails, leave empty
        }
      }

      const productData = {
        name: req.body.name,
        category: req.body.category,
        subcategory: req.body.subcategory,
        price: parseFloat(req.body.price),
        originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : undefined,
        sku: req.body.sku,
        description: req.body.description,
        shortDescription: req.body.shortDescription,
        craftsman: req.body.craftsman,
        image: mainImage,
        images: additionalImages,
        imagePublicIds: imagePublicIds,
        materials: materials,
        dimensions: req.body.dimensions,
        weight: req.body.weight,
        origin: req.body.origin,
        rating: req.body.rating ? parseFloat(req.body.rating) : 0,
        isNew: req.body.isNew === 'true',
        isFeatured: req.body.isFeatured === 'true',
        isActive: req.body.isActive !== 'false', // Default to true unless explicitly false
        stock: req.body.stock ? parseInt(req.body.stock) : 0,
        minQuantity: req.body.minQuantity ? parseInt(req.body.minQuantity) : 1,
        maxQuantity: req.body.maxQuantity ? parseInt(req.body.maxQuantity) : 10,
        tags: tags,
        hsn: req.body.hsn,
        taxRate: req.body.taxRate ? parseFloat(req.body.taxRate) : 0.18,
        careInstructions: careInstructions,
        warranty: req.body.warranty,
        shippingWeight: req.body.shippingWeight ? parseFloat(req.body.shippingWeight) : undefined,
        shippingDimensions: shippingDimensions,
        metaTitle: req.body.metaTitle,
        metaDescription: req.body.metaDescription
      };

      const product = await productService.createProduct(productData, req.admin.id);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });

    } catch (error) {
      console.error('Product creation error:', error);
      const statusCode = error.message === 'SKU already exists' ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create product'
      });
    }
  }
);

// @route   PUT /api/admin/products/:id
// @desc    Update product
// @access  Private (requires products:update permission)
router.put('/:id',
  requirePermission('products', 'update'),
  uploadProductImages,
  handleUploadError,
  auditLogger('update', 'products'),
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Product name must be less than 200 characters'),
    body('category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Category must be less than 100 characters'),
    body('price').optional().isNumeric().withMessage('Price must be a number').custom(value => {
      if (value && parseFloat(value) < 0) throw new Error('Price must be a positive number');
      return true;
    }),
    body('originalPrice').optional().isNumeric().withMessage('Original price must be a number').custom(value => {
      if (value && parseFloat(value) < 0) throw new Error('Original price must be a positive number');
      return true;
    }),
    body('sku').optional().trim().isLength({ max: 50 }).withMessage('SKU must be less than 50 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
    body('stock').optional().isNumeric().withMessage('Stock must be a number').custom(value => {
      if (value && parseInt(value) < 0) throw new Error('Stock must be a non-negative integer');
      return true;
    }),
    body('rating').optional().isNumeric().withMessage('Rating must be a number').custom(value => {
      if (value && (parseFloat(value) < 0 || parseFloat(value) > 5)) throw new Error('Rating must be between 0 and 5');
      return true;
    }),
    body('isFeatured').optional().isIn(['true', 'false']).withMessage('isFeatured must be boolean'),
    body('isNew').optional().isIn(['true', 'false']).withMessage('isNew must be boolean'),
    body('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const updateData = {};
      
      // Handle file uploads if provided
      if (req.files) {
        if (req.files.image && req.files.image[0]) {
          updateData.image = req.files.image[0].path;
          updateData.imagePublicIds = [req.files.image[0].filename];
        }
        if (req.files.images) {
          updateData.images = req.files.images.map(file => file.path);
          updateData.imagePublicIds = [...(updateData.imagePublicIds || []), ...req.files.images.map(file => file.filename)];
        }
      }

      // Only include provided fields
      const allowedFields = [
        'name', 'category', 'subcategory', 'price', 'originalPrice', 'sku', 'description', 'shortDescription',
        'craftsman', 'materials', 'dimensions', 'weight', 'origin',
        'rating', 'isNew', 'isFeatured', 'isActive', 'stock', 'minQuantity', 'maxQuantity',
        'tags', 'hsn', 'taxRate', 'careInstructions', 'warranty', 'shippingWeight', 'shippingDimensions',
        'metaTitle', 'metaDescription'
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          let value = req.body[field];
          
          // Parse numeric fields
          if (['price', 'originalPrice', 'rating', 'taxRate', 'shippingWeight'].includes(field)) {
            value = parseFloat(value);
          } else if (['stock', 'minQuantity', 'maxQuantity'].includes(field)) {
            value = parseInt(value);
          } else if (['isFeatured', 'isNew', 'isActive'].includes(field)) {
            value = value === 'true';
          } else if (['materials', 'tags', 'careInstructions'].includes(field)) {
            // Parse arrays
            value = Array.isArray(value) ? value : JSON.parse(value || '[]');
          } else if (field === 'shippingDimensions') {
            // Parse shipping dimensions
            try {
              const dims = typeof value === 'string' ? JSON.parse(value) : value;
              value = {
                length: dims.length ? parseFloat(dims.length) : undefined,
                width: dims.width ? parseFloat(dims.width) : undefined,
                height: dims.height ? parseFloat(dims.height) : undefined
              };
            } catch (e) {
              // If parsing fails, skip this field
              return;
            }
          }
          
          updateData[field] = value;
        }
      });

      const product = await productService.updateProduct(req.params.id, updateData, req.admin.id);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });

    } catch (error) {
      console.error('Product update error:', error);
      let statusCode = 500;
      if (error.message === 'Product not found') statusCode = 404;
      if (error.message === 'SKU already exists') statusCode = 409;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update product'
      });
    }
  }
);

// @route   DELETE /api/admin/products/:id
// @desc    Delete product
// @access  Private (requires products:delete permission)
router.delete('/:id',
  requirePermission('products', 'delete'),
  sensitiveOperationLimiter(),
  auditLogger('delete', 'products'),
  [
    param('id').isMongoId().withMessage('Invalid product ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const product = await productService.deleteProduct(req.params.id, req.admin.id);

      res.json({
        success: true,
        message: 'Product deleted successfully',
        data: product
      });

    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete product'
      });
    }
  }
);

// @route   PUT /api/admin/products/:id/stock
// @desc    Update product stock
// @access  Private (requires products:update permission)
router.put('/:id/stock',
  requirePermission('products', 'update'),
  auditLogger('update', 'product_stock'),
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('reason').optional().isLength({ max: 200 }).withMessage('Reason must be less than 200 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { stock, reason } = req.body;
      const product = await productService.updateStock(req.params.id, stock, req.admin.id, reason);

      res.json({
        success: true,
        message: 'Product stock updated successfully',
        data: product
      });

    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update product stock'
      });
    }
  }
);

// @route   POST /api/admin/products/bulk-update
// @desc    Bulk update products
// @access  Private (requires products:update permission)
router.post('/bulk-update',
  requirePermission('products', 'update'),
  sensitiveOperationLimiter(60000, 5), // More restrictive for bulk operations
  auditLogger('bulk_operation', 'products'),
  [
    body('productIds').isArray({ min: 1, max: 100 }).withMessage('Product IDs array is required (max 100)'),
    body('productIds.*').isMongoId().withMessage('Invalid product ID in array'),
    body('updateData').isObject().withMessage('Update data is required'),
    body('updateData.isFeatured').optional().isBoolean().withMessage('isFeatured must be boolean'),
    body('updateData.isNew').optional().isBoolean().withMessage('isNew must be boolean'),
    body('updateData.category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Category must be less than 100 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { productIds, updateData } = req.body;
      
      // Validate update data contains only allowed fields
      const allowedFields = ['isFeatured', 'isNew', 'category'];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid fields for bulk update: ${invalidFields.join(', ')}`
        });
      }

      const result = await productService.bulkUpdateProducts(productIds, updateData, req.admin.id);

      res.json({
        success: true,
        message: `Bulk update completed. ${result.modifiedCount} products updated.`,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to perform bulk update'
      });
    }
  }
);

// @route   GET /api/admin/products/export/csv
// @desc    Export products to CSV
// @access  Private (requires products:export permission)
router.get('/export/csv',
  requirePermission('products', 'export'),
  auditLogger('export', 'products'),
  async (req, res) => {
    try {
      const filters = {
        category: req.query.category,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        inStock: req.query.inStock,
        isFeatured: req.query.isFeatured,
        isNew: req.query.isNew
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const csvData = await productService.exportProducts(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=products-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvData);

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export products'
      });
    }
  }
);

module.exports = router;