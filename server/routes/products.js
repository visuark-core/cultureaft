const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'text/csv', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  updateProductInventory,
  addProductFlag,
  resolveProductFlag,
  addProductNote,
  getProductAnalytics,
  searchProducts,
  deleteProduct,
  bulkUpdateProducts,
  bulkUpdateProductStatus,
  exportProductsCSV
} = require('../controllers/productController');

const {
  authenticateToken,
  requirePermission,
  auditLogger,
  validateSession
} = require('../middleware/auth');

// Apply authentication and session validation to all routes
router.use(authenticateToken);
router.use(validateSession);

/**
 * @route   GET /api/products
 * @desc    Get all products with advanced filtering and pagination
 * @access  Private (requires 'products' read permission)
 */
router.get('/',
  requirePermission('products', 'read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'inactive', 'discontinued', 'out_of_stock', 'pending_approval']).withMessage('Invalid status'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
    query('inStock').optional().isBoolean().withMessage('inStock must be boolean'),
    query('lowStock').optional().isBoolean().withMessage('lowStock must be boolean'),
    query('sortBy').optional().isIn([
      'createdAt', 'name', 'brand', 'category', 'pricing.basePrice', 
      'inventory.stock', 'analytics.popularityScore', 'analytics.revenue'
    ]).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  auditLogger('VIEW_PRODUCTS', 'product'),
  getProducts
);

/**
 * @route   GET /api/products/search
 * @desc    Search products with advanced filters
 * @access  Private (requires 'products' read permission)
 */
router.get('/search',
  requirePermission('products', 'read'),
  [
    query('q').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  auditLogger('SEARCH_PRODUCTS', 'product'),
  searchProducts
);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (requires 'products' create permission)
 */
router.post('/',
  requirePermission('products', 'create'),
  [
    body('name').isLength({ min: 1, max: 200 }).withMessage('Product name must be 1-200 characters'),
    body('category').isLength({ min: 1, max: 100 }).withMessage('Category is required and must be max 100 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('sku').optional().isLength({ min: 1, max: 50 }).withMessage('SKU must be 1-50 characters'),
    body('brand').optional().isLength({ max: 100 }).withMessage('Brand must be max 100 characters'),
    body('description').optional().isLength({ max: 5000 }).withMessage('Description must be max 5000 characters'),
    body('status').optional().isIn(['active', 'inactive', 'discontinued', 'out_of_stock', 'pending_approval']).withMessage('Invalid status'),
    body('pricing.basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('pricing.salePrice').optional().isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
    body('inventory.stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('inventory.lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer')
  ],
  auditLogger('CREATE_PRODUCT', 'product'),
  createProduct
);

/**
 * @route   GET /api/products/:productId
 * @desc    Get single product by ID with complete details
 * @access  Private (requires 'products' read permission)
 */
router.get('/:productId',
  requirePermission('products', 'read'),
  [
    param('productId').isMongoId().withMessage('Invalid product ID')
  ],
  auditLogger('VIEW_PRODUCT', 'product'),
  getProductById
);

/**
 * @route   PUT /api/products/:productId
 * @desc    Update product information
 * @access  Private (requires 'products' update permission)
 */
router.put('/:productId',
  requirePermission('products', 'update'),
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().isLength({ min: 1, max: 200 }).withMessage('Product name must be 1-200 characters'),
    body('category').optional().isLength({ min: 1, max: 100 }).withMessage('Category must be 1-100 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('brand').optional().isLength({ max: 100 }).withMessage('Brand must be max 100 characters'),
    body('description').optional().isLength({ max: 5000 }).withMessage('Description must be max 5000 characters'),
    body('status').optional().isIn(['active', 'inactive', 'discontinued', 'out_of_stock', 'pending_approval']).withMessage('Invalid status'),
    body('pricing.basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('pricing.salePrice').optional().isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
    body('inventory.stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('inventory.lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer')
  ],
  auditLogger('UPDATE_PRODUCT', 'product'),
  updateProduct
);/**

 * @route   PATCH /api/products/:productId/status
 * @desc    Update product status
 * @access  Private (requires 'products' update permission)
 */
router.patch('/:productId/status',
  requirePermission('products', 'update'),
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('status').isIn(['active', 'inactive', 'discontinued', 'out_of_stock', 'pending_approval']).withMessage('Invalid status'),
    body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
  ],
  auditLogger('UPDATE_PRODUCT_STATUS', 'product'),
  updateProductStatus
);

/**
 * @route   PATCH /api/products/:productId/inventory
 * @desc    Update product inventory
 * @access  Private (requires 'products' update permission)
 */
router.patch('/:productId/inventory',
  requirePermission('products', 'update'),
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('type').optional().isIn(['add', 'subtract', 'set']).withMessage('Type must be add, subtract, or set'),
    body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
  ],
  auditLogger('UPDATE_PRODUCT_INVENTORY', 'product'),
  updateProductInventory
);

/**
 * @route   POST /api/products/:productId/flags
 * @desc    Add flag to product
 * @access  Private (requires 'products' update permission)
 */
router.post('/:productId/flags',
  requirePermission('products', 'update'),
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('type').isIn([
      'quality_issue', 'inventory_discrepancy', 'pricing_error', 'compliance_violation',
      'negative_reviews', 'supplier_issue', 'manual_review', 'discontinued', 'seasonal_unavailable'
    ]).withMessage('Invalid flag type'),
    body('reason').isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters'),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters')
  ],
  auditLogger('ADD_PRODUCT_FLAG', 'product'),
  addProductFlag
);

/**
 * @route   PATCH /api/products/:productId/flags/:flagId/resolve
 * @desc    Resolve product flag
 * @access  Private (requires 'products' update permission)
 */
router.patch('/:productId/flags/:flagId/resolve',
  requirePermission('products', 'update'),
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    param('flagId').isMongoId().withMessage('Invalid flag ID'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters')
  ],
  auditLogger('RESOLVE_PRODUCT_FLAG', 'product'),
  resolveProductFlag
);

/**
 * @route   POST /api/products/:productId/notes
 * @desc    Add note to product
 * @access  Private (requires 'products' update permission)
 */
router.post('/:productId/notes',
  requirePermission('products', 'update'),
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('content').isLength({ min: 1, max: 1000 }).withMessage('Note content must be 1-1000 characters'),
    body('isPrivate').optional().isBoolean().withMessage('isPrivate must be boolean')
  ],
  auditLogger('ADD_PRODUCT_NOTE', 'product'),
  addProductNote
);

/**
 * @route   GET /api/products/:productId/analytics
 * @desc    Get product analytics and insights
 * @access  Private (requires 'products' read permission)
 */
router.get('/:productId/analytics',
  requirePermission('products', 'read'),
  [
    param('productId').isMongoId().withMessage('Invalid product ID')
  ],
  auditLogger('VIEW_PRODUCT_ANALYTICS', 'product'),
  getProductAnalytics
);

/**
 * @route   DELETE /api/products/:productId
 * @desc    Delete product (soft delete)
 * @access  Private (requires 'products' delete permission)
 */
router.delete('/:productId',
  requirePermission('products', 'delete'),
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
  ],
  auditLogger('DELETE_PRODUCT', 'product'),
  deleteProduct
);

// ============ BULK OPERATIONS ============

/**
 * @route   POST /api/products/bulk/update
 * @desc    Bulk update products
 * @access  Private (requires 'products' update permission)
 */
router.post('/bulk/update',
  requirePermission('products', 'update'),
  [
    body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
    body('updates.*.productId').isMongoId().withMessage('Invalid product ID in updates'),
    body('updates.*.data').isObject().withMessage('Update data is required'),
    body('updates.*.data.name').optional().isLength({ min: 1, max: 200 }).withMessage('Product name must be 1-200 characters'),
    body('updates.*.data.category').optional().isLength({ min: 1, max: 100 }).withMessage('Category must be 1-100 characters'),
    body('updates.*.data.price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('updates.*.data.status').optional().isIn(['active', 'inactive', 'discontinued', 'out_of_stock', 'pending_approval']).withMessage('Invalid status')
  ],
  auditLogger('BULK_UPDATE_PRODUCTS', 'product'),
  bulkUpdateProducts
);

/**
 * @route   POST /api/products/bulk/status
 * @desc    Bulk update product status
 * @access  Private (requires 'products' update permission)
 */
router.post('/bulk/status',
  requirePermission('products', 'update'),
  [
    body('productIds').isArray({ min: 1 }).withMessage('Product IDs array is required'),
    body('productIds.*').isMongoId().withMessage('Invalid product ID'),
    body('status').isIn(['active', 'inactive', 'discontinued', 'out_of_stock', 'pending_approval']).withMessage('Invalid status'),
    body('reason').optional().isLength({ min: 1, max: 500 }).withMessage('Reason must be 1-500 characters')
  ],
  auditLogger('BULK_UPDATE_PRODUCT_STATUS', 'product'),
  bulkUpdateProductStatus
);

// ============ CSV EXPORT ============

/**
 * @route   POST /api/products/export/csv
 * @desc    Export products to CSV
 * @access  Private (requires 'products' read permission)
 */
router.post('/export/csv',
  requirePermission('products', 'read'),
  [
    body('filters').optional().isObject().withMessage('Filters must be an object'),
    body('fields').optional().isArray().withMessage('Fields must be an array'),
    body('filename').optional().isString().withMessage('Filename must be a string')
  ],
  auditLogger('EXPORT_PRODUCTS_CSV', 'product'),
  exportProductsCSV
);

module.exports = router;