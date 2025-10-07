const Product = require('../models/Product');
const { AdminUser } = require('../models/AdminUser');
const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

/**
 * Get all products with advanced filtering and pagination
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      lowStock,
      hasFlags,
      flagType,
      tags,
      createdFrom,
      createdTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filters object
    const filters = {
      search,
      status,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      lowStock,
      hasFlags: hasFlags === 'true',
      flagType,
      tags: tags ? tags.split(',') : undefined,
      createdFrom,
      createdTo
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 per page
      sortBy,
      sortOrder
    };

    // Get products with advanced search
    const products = await Product.advancedSearch(filters, options);
    
    // Get total count for pagination
    const totalQuery = Product.advancedSearch(filters, { ...options, page: 1, limit: 0 });
    const totalProducts = await Product.countDocuments(totalQuery.getQuery());

    // Get product statistics
    const stats = await Product.getProductStats();

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(totalProducts / options.limit),
          totalProducts,
          hasNext: options.page < Math.ceil(totalProducts / options.limit),
          hasPrev: options.page > 1
        },
        stats,
        filters: filters
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      data: null,
      error: error.message
    });
  }
};

/**
 * Get single product by ID with complete details
 */
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId)
      .populate('createdBy', 'profile email')
      .populate('lastModifiedBy', 'profile email')
      .populate('flags.createdBy', 'profile email')
      .populate('flags.resolvedBy', 'profile email')
      .populate('notes.createdBy', 'profile email')
      .populate('parentProduct', 'name sku');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    // Update popularity score
    product.calculatePopularityScore();
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product',
      data: null,
      error: error.message
    });
  }
};

/**
 * Create new product
 */
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const productData = req.body;
    const adminId = req.admin._id;

    // Set admin as creator
    productData.createdBy = adminId;
    productData.lastModifiedBy = adminId;

    // Generate SKU if not provided
    if (!productData.sku) {
      const timestamp = Date.now().toString().slice(-6);
      const categoryPrefix = productData.category ? productData.category.substring(0, 3).toUpperCase() : 'PRD';
      productData.sku = `${categoryPrefix}${timestamp}`;
    }

    // Initialize pricing from legacy fields if needed
    if (!productData.pricing && productData.price) {
      productData.pricing = {
        basePrice: productData.price,
        salePrice: productData.originalPrice !== productData.price ? productData.originalPrice : null,
        currency: 'INR',
        taxRate: 0
      };
    }

    // Initialize inventory from legacy stock field if needed
    if (!productData.inventory && productData.stock !== undefined) {
      productData.inventory = {
        stock: productData.stock,
        reserved: 0,
        available: productData.stock,
        lowStockThreshold: 10,
        autoReorderPoint: 5
      };
    }

    const product = new Product(productData);
    await product.save();

    // Log the creation
    await AuditLog.create({
      adminId,
      action: 'CREATE_PRODUCT',
      resource: 'product',
      resourceId: product._id,
      changes: { productData },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'admin-panel'
      },
      severity: 'medium'
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Product with this ${field} already exists`,
        data: null,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      data: null,
      error: error.message
    });
  }
};

/**
 * Update product information
 */
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const updateData = req.body;
    const adminId = req.admin._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    // Store original data for audit
    const originalData = product.toObject();

    // Update last modified by
    updateData.lastModifiedBy = adminId;

    // Handle price changes with history tracking
    if (updateData.pricing && updateData.pricing.basePrice !== product.pricing.basePrice) {
      if (!product.pricing.priceHistory) {
        product.pricing.priceHistory = [];
      }
      
      product.pricing.priceHistory.push({
        price: product.pricing.basePrice,
        type: 'base',
        changedBy: adminId,
        changedAt: new Date(),
        reason: updateData.priceChangeReason || 'Admin update'
      });
    }

    // Update product
    Object.assign(product, updateData);
    await product.save();

    // Log the update
    await AuditLog.create({
      adminId,
      action: 'UPDATE_PRODUCT',
      resource: 'product',
      resourceId: productId,
      changes: {
        before: originalData,
        after: updateData
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'admin-panel'
      },
      severity: 'medium'
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      data: null,
      error: error.message
    });
  }
};/**
 * Upd
ate product status
 */
const updateProductStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.admin._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    const oldStatus = product.status;
    product.status = status;
    product.lastModifiedBy = adminId;

    // Add flag if discontinuing or marking as inactive
    if (status === 'discontinued' || status === 'inactive') {
      await product.addFlag({
        type: status === 'discontinued' ? 'discontinued' : 'manual_review',
        reason: reason || `Product ${status} by admin`,
        severity: status === 'discontinued' ? 'high' : 'medium'
      }, adminId);
    }

    await product.save();

    // Log the status change
    await AuditLog.create({
      adminId,
      action: 'UPDATE_PRODUCT_STATUS',
      resource: 'product',
      resourceId: productId,
      changes: {
        oldStatus,
        newStatus: status,
        reason
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'admin-panel'
      },
      severity: status === 'discontinued' ? 'high' : 'medium'
    });

    res.status(200).json({
      success: true,
      message: `Product ${status} successfully`,
      data: { product }
    });

  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product status',
      data: null,
      error: error.message
    });
  }
};

/**
 * Update product inventory
 */
const updateProductInventory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const { quantity, type = 'set', reason = 'Admin update' } = req.body;
    const adminId = req.admin._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    const oldStock = product.inventory.stock;
    
    // Update inventory using the model method
    await product.updateInventory(quantity, type, reason);

    // Log the inventory update
    await AuditLog.create({
      adminId,
      action: 'UPDATE_PRODUCT_INVENTORY',
      resource: 'product',
      resourceId: productId,
      changes: {
        oldStock,
        newStock: product.inventory.stock,
        quantity,
        type,
        reason
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'admin-panel'
      },
      severity: 'medium'
    });

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Update product inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      data: null,
      error: error.message
    });
  }
};

/**
 * Add flag to product
 */
const addProductFlag = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const flagData = req.body;
    const adminId = req.admin._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    await product.addFlag(flagData, adminId);

    // Log the flag addition
    await AuditLog.create({
      adminId,
      action: 'ADD_PRODUCT_FLAG',
      resource: 'product',
      resourceId: productId,
      changes: { flagData },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'admin-panel'
      },
      severity: flagData.severity || 'medium'
    });

    res.status(200).json({
      success: true,
      message: 'Flag added successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Add product flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add flag',
      data: null,
      error: error.message
    });
  }
};

/**
 * Resolve product flag
 */
const resolveProductFlag = async (req, res) => {
  try {
    const { productId, flagId } = req.params;
    const { notes } = req.body;
    const adminId = req.admin._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    await product.resolveFlag(flagId, adminId, notes);

    // Log the flag resolution
    await AuditLog.create({
      adminId,
      action: 'RESOLVE_PRODUCT_FLAG',
      resource: 'product',
      resourceId: productId,
      changes: { flagId, notes },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'admin-panel'
      },
      severity: 'low'
    });

    res.status(200).json({
      success: true,
      message: 'Flag resolved successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Resolve product flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve flag',
      data: null,
      error: error.message
    });
  }
};/**

 * Add note to product
 */
const addProductNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { productId } = req.params;
    const { content, isPrivate = false } = req.body;
    const adminId = req.admin._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    product.notes.push({
      content,
      createdBy: adminId,
      isPrivate
    });

    await product.save();

    // Log the note addition
    await AuditLog.create({
      adminId,
      action: 'ADD_PRODUCT_NOTE',
      resource: 'product',
      resourceId: productId,
      changes: { content, isPrivate },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'admin-panel'
      },
      severity: 'low'
    });

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Add product note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      data: null,
      error: error.message
    });
  }
};

/**
 * Get product analytics
 */
const getProductAnalytics = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    // Update popularity score
    product.calculatePopularityScore();
    await product.save();

    // Get additional analytics data
    const analytics = {
      ...product.analytics.toObject(),
      isLowStock: product.isLowStock,
      availableStock: product.availableStock,
      currentPrice: product.currentPrice,
      discountPercentage: product.discountPercentage,
      riskFactors: [],
      recommendations: []
    };

    // Analyze risk factors
    if (product.flags.filter(f => !f.resolved).length > 0) {
      analytics.riskFactors.push('Has unresolved flags');
    }
    
    if (product.isLowStock) {
      analytics.riskFactors.push('Low stock level');
    }
    
    if (product.analytics.conversionRate < 1) {
      analytics.riskFactors.push('Low conversion rate');
    }

    // Generate recommendations
    if (product.isLowStock) {
      analytics.recommendations.push('Restock inventory');
    }
    
    if (product.analytics.views > 100 && product.analytics.conversionRate < 2) {
      analytics.recommendations.push('Optimize product listing');
    }
    
    if (product.analytics.averageRating < 3.5) {
      analytics.recommendations.push('Improve product quality');
    }

    res.status(200).json({
      success: true,
      message: 'Product analytics retrieved successfully',
      data: { analytics }
    });

  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product analytics',
      data: null,
      error: error.message
    });
  }
};

/**
 * Search products with advanced filters
 */
const searchProducts = async (req, res) => {
  try {
    const { q, filters = '{}', page = 1, limit = 20 } = req.query;

    let searchFilters = {};
    try {
      searchFilters = JSON.parse(filters);
    } catch (e) {
      // If filters is not valid JSON, ignore it
    }

    // Add text search if provided
    if (q) {
      searchFilters.search = q;
    }

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const products = await Product.advancedSearch(searchFilters, options);
    const totalQuery = Product.advancedSearch(searchFilters, { ...options, page: 1, limit: 0 });
    const totalProducts = await Product.countDocuments(totalQuery.getQuery());

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        products,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(totalProducts / options.limit),
          totalProducts,
          hasNext: options.page < Math.ceil(totalProducts / options.limit),
          hasPrev: options.page > 1
        },
        query: q,
        filters: searchFilters
      }
    });

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      data: null,
      error: error.message
    });
  }
};

/**
 * Delete product (soft delete by setting status to inactive)
 */
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    // Soft delete by setting status to inactive
    const oldStatus = product.status;
    product.status = 'inactive';
    product.lastModifiedBy = adminId;
    
    // Add flag for deletion
    await product.addFlag({
      type: 'manual_review',
      reason: reason || 'Product deleted by admin',
      severity: 'high'
    }, adminId);

    await product.save();

    // Log the deletion
    await AuditLog.create({
      adminId,
      action: 'DELETE_PRODUCT',
      resource: 'product',
      resourceId: productId,
      changes: {
        oldStatus,
        newStatus: 'inactive',
        reason
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'admin-panel'
      },
      severity: 'high'
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      data: null,
      error: error.message
    });
  }
};/**

 * Bulk update products
 */
const bulkUpdateProducts = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { updates, options = {} } = req.body;
    const adminId = req.admin._id;
    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0
    };

    // Process each update
    for (const update of updates) {
      try {
        const { productId, data } = update;
        
        const product = await Product.findById(productId);
        if (!product) {
          results.failed.push({
            productId,
            error: 'Product not found',
            data: update
          });
          continue;
        }

        // Store original data for audit
        const originalData = product.toObject();

        // Update last modified by
        data.lastModifiedBy = adminId;

        // Update product
        Object.assign(product, data);
        await product.save();

        results.successful.push({
          productId,
          product: product.toObject()
        });

        // Log individual update
        await AuditLog.create({
          adminId,
          action: 'BULK_UPDATE_PRODUCT',
          resource: 'product',
          resourceId: productId,
          changes: {
            before: originalData,
            after: data,
            bulkOperation: true
          },
          request: {
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('User-Agent') || 'bulk-operation'
          },
          severity: 'medium'
        });

      } catch (error) {
        results.failed.push({
          productId: update.productId,
          error: error.message,
          data: update
        });
      }
      
      results.totalProcessed++;
    }

    results.totalSuccessful = results.successful.length;
    results.totalFailed = results.failed.length;

    // Log bulk operation summary
    await AuditLog.create({
      adminId,
      action: 'BULK_UPDATE_PRODUCTS_SUMMARY',
      resource: 'product',
      resourceId: null,
      changes: {
        totalProcessed: results.totalProcessed,
        totalSuccessful: results.totalSuccessful,
        totalFailed: results.totalFailed,
        bulkOperation: true
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'bulk-operation'
      },
      severity: 'medium'
    });

    const statusCode = results.totalFailed > 0 ? 207 : 200; // 207 Multi-Status if some failed

    res.status(statusCode).json({
      success: results.totalFailed === 0,
      message: `Bulk update completed. ${results.totalSuccessful} successful, ${results.totalFailed} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Bulk update products error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk update failed',
      data: null,
      error: error.message
    });
  }
};

/**
 * Bulk update product status
 */
const bulkUpdateProductStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: errors.array()
      });
    }

    const { productIds, status, reason } = req.body;
    const adminId = req.admin._id;
    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0
    };

    // Process each product
    for (const productId of productIds) {
      try {
        const product = await Product.findById(productId);
        if (!product) {
          results.failed.push({
            productId,
            error: 'Product not found'
          });
          continue;
        }

        const oldStatus = product.status;
        product.status = status;
        product.lastModifiedBy = adminId;

        // Add flag if discontinuing or marking as inactive
        if (status === 'discontinued' || status === 'inactive') {
          await product.addFlag({
            type: status === 'discontinued' ? 'discontinued' : 'manual_review',
            reason: reason || `Product ${status} by admin (bulk operation)`,
            severity: status === 'discontinued' ? 'high' : 'medium'
          }, adminId);
        }

        await product.save();

        results.successful.push({
          productId,
          oldStatus,
          newStatus: status,
          product: product.toObject()
        });

        // Log individual status change
        await AuditLog.create({
          adminId,
          action: 'BULK_UPDATE_PRODUCT_STATUS',
          resource: 'product',
          resourceId: productId,
          changes: {
            oldStatus,
            newStatus: status,
            reason,
            bulkOperation: true
          },
          request: {
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.get('User-Agent') || 'bulk-operation'
          },
          severity: status === 'discontinued' ? 'high' : 'medium'
        });

      } catch (error) {
        results.failed.push({
          productId,
          error: error.message
        });
      }
      
      results.totalProcessed++;
    }

    results.totalSuccessful = results.successful.length;
    results.totalFailed = results.failed.length;

    // Log bulk operation summary
    await AuditLog.create({
      adminId,
      action: 'BULK_UPDATE_PRODUCT_STATUS_SUMMARY',
      resource: 'product',
      resourceId: null,
      changes: {
        status,
        reason,
        totalProcessed: results.totalProcessed,
        totalSuccessful: results.totalSuccessful,
        totalFailed: results.totalFailed,
        bulkOperation: true
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'bulk-operation'
      },
      severity: status === 'discontinued' ? 'high' : 'medium'
    });

    const statusCode = results.totalFailed > 0 ? 207 : 200;

    res.status(statusCode).json({
      success: results.totalFailed === 0,
      message: `Bulk status update completed. ${results.totalSuccessful} successful, ${results.totalFailed} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Bulk update product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk status update failed',
      data: null,
      error: error.message
    });
  }
};/**
 * Expo
rt products to CSV
 */
const exportProductsCSV = async (req, res) => {
  try {
    const {
      filters = {},
      fields = [],
      filename = `products_export_${Date.now()}.csv`
    } = req.body;

    const adminId = req.admin._id;

    // Default fields to export if none specified
    const defaultFields = [
      'sku',
      'name',
      'brand',
      'category',
      'status',
      'pricing.basePrice',
      'pricing.salePrice',
      'inventory.stock',
      'inventory.available',
      'analytics.views',
      'analytics.purchases',
      'analytics.revenue',
      'createdAt'
    ];

    const exportFields = fields.length > 0 ? fields : defaultFields;

    // Build query using existing advanced search
    const searchFilters = {
      ...filters,
      // Remove pagination for export
      page: undefined,
      limit: undefined
    };

    // Get products based on filters
    const products = await Product.advancedSearch(searchFilters, { 
      page: 1, 
      limit: 10000, // Max export limit
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found matching the criteria',
        data: null
      });
    }

    // Prepare CSV data
    const csvData = products.map(product => {
      const row = {};
      
      exportFields.forEach(field => {
        const value = getNestedValue(product, field);
        row[field] = formatCSVValue(value);
      });
      
      return row;
    });

    // Create CSV headers
    const csvHeaders = exportFields.map(field => ({
      id: field,
      title: formatFieldTitle(field)
    }));

    // Create temporary file path
    const tempDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, filename);

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: filePath,
      header: csvHeaders
    });

    // Write CSV file
    await csvWriter.writeRecords(csvData);

    // Log the export
    await AuditLog.create({
      adminId,
      action: 'EXPORT_PRODUCTS_CSV',
      resource: 'product',
      resourceId: null,
      changes: {
        filename,
        recordCount: products.length,
        filters: searchFilters,
        fields: exportFields
      },
      request: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'admin-panel'
      },
      severity: 'low'
    });

    // Send file for download
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to download file',
          data: null,
          error: err.message
        });
      }

      // Clean up temporary file after download
      setTimeout(() => {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Failed to delete temp file:', unlinkErr);
        });
      }, 5000);
    });

  } catch (error) {
    console.error('Export products CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export products',
      data: null,
      error: error.message
    });
  }
};

// Helper functions
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
}

function formatCSVValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.join('; ');
    return JSON.stringify(value);
  }
  return String(value);
}

function formatFieldTitle(field) {
  return field
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

module.exports = {
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
};