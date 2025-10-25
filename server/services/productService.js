const Product = require('../models/Product');
const mongoose = require('mongoose');

class ProductService {
  /**
   * Get product by ID with error handling
   */
  async getProductById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid product ID format');
      }

      const product = await Product.findById(id).lean();
      
      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get products with advanced filtering
   */
  async getProducts(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        search,
        minPrice,
        maxPrice,
        inStock,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isFeatured,
        isNew,
        minRating
      } = filters;

      // Build filter object
      const filter = { isActive: true };

      if (category) {
        filter.category = { $regex: category, $options: 'i' };
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }

      if (inStock === true) {
        filter.stock = { $gt: 0 };
      }

      if (isFeatured === true) {
        filter.isFeatured = true;
      }

      if (isNew === true) {
        filter.isNew = true;
      }

      if (minRating) {
        filter.rating = { $gte: parseFloat(minRating) };
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [products, totalCount] = await Promise.all([
        Product.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Product.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      return {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }  
/**
   * Create new product
   */
  async createProduct(productData, userId) {
    try {
      const product = new Product({
        ...productData,
        createdBy: userId
      });

      await product.save();
      return product;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Product with this SKU already exists');
      }
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(id, updateData, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid product ID format');
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: userId },
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Product with this SKU already exists');
      }
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid product ID format');
      }

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category, options = {}) {
    try {
      const filters = {
        ...options,
        category
      };

      return await this.getProducts(filters);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 10) {
    try {
      const products = await Product.find({
        isActive: true,
        isFeatured: true
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

      return products;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product categories with counts
   */
  async getCategories() {
    try {
      const categories = await Product.distinct('category', { isActive: true });
      
      const categoryCounts = await Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const categoriesWithCounts = categoryCounts.map(cat => ({
        name: cat._id,
        count: cat.count
      }));

      return {
        categories,
        categoriesWithCounts
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update product stock
   */
  async updateStock(id, stock, userId, reason) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid product ID format');
      }

      const product = await Product.findById(id);
      
      if (!product) {
        throw new Error('Product not found');
      }

      const oldStock = product.stock;
      product.stock = stock;
      product.updatedBy = userId;
      
      // Add stock change to history if needed
      if (reason) {
        if (!product.stockHistory) {
          product.stockHistory = [];
        }
        product.stockHistory.push({
          oldStock,
          newStock: stock,
          reason,
          changedBy: userId,
          changedAt: new Date()
        });
      }

      await product.save();

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStatistics() {
    try {
      const [categoryStats, stockStats, priceStats, featuredStats, topProducts] = await Promise.all([
        // Category statistics
        Product.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),

        // Stock statistics
        Product.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              inStock: { $sum: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] } },
              lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 10] }] }, 1, 0] } },
              outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
            }
          }
        ]),

        // Price statistics
        Product.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              avgPrice: { $avg: '$price' },
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' }
            }
          }
        ]),

        // Featured and new product statistics
        Product.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              featured: { $sum: { $cond: ['$isFeatured', 1, 0] } },
              new: { $sum: { $cond: ['$isNew', 1, 0] } }
            }
          }
        ]),

        // Top products by rating
        Product.find({ isActive: true })
          .sort({ rating: -1, createdAt: -1 })
          .limit(10)
          .lean()
      ]);

      return {
        categoryStats,
        stockStats,
        priceStats,
        featuredStats,
        topProducts
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get craftsmen list
   */
  async getCraftsmen() {
    try {
      const craftsmen = await Product.distinct('craftsman', { 
        isActive: true,
        craftsman: { $exists: true, $ne: null, $ne: '' }
      });
      
      return craftsmen.filter(craftsman => craftsman && craftsman.trim() !== '');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold = 10) {
    try {
      const products = await Product.find({
        isActive: true,
        stock: { $gt: 0, $lte: threshold }
      })
      .sort({ stock: 1 })
      .lean();

      return products;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts() {
    try {
      const products = await Product.find({
        isActive: true,
        stock: 0
      })
      .sort({ updatedAt: -1 })
      .lean();

      return products;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(searchCriteria) {
    try {
      const { query, filters = {}, limit = 20 } = searchCriteria;
      
      const searchFilter = {
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { sku: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
          { craftsman: { $regex: query, $options: 'i' } }
        ]
      };

      // Apply additional filters
      if (filters.category) {
        searchFilter.category = { $regex: filters.category, $options: 'i' };
      }

      if (filters.inStock === true) {
        searchFilter.stock = { $gt: 0 };
      }

      const products = await Product.find(searchFilter)
        .sort({ rating: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      return products;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(productIds, updateData, userId) {
    try {
      const validIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (validIds.length === 0) {
        throw new Error('No valid product IDs provided');
      }

      const result = await Product.updateMany(
        { _id: { $in: validIds } },
        { 
          ...updateData, 
          updatedBy: userId,
          updatedAt: new Date()
        }
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export products to CSV
   */
  async exportProducts(filters = {}) {
    try {
      const query = { isActive: true };

      // Apply filters
      if (filters.category) {
        query.category = { $regex: filters.category, $options: 'i' };
      }

      if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice);
      }

      if (filters.inStock === true) {
        query.stock = { $gt: 0 };
      }

      if (filters.isFeatured === true) {
        query.isFeatured = true;
      }

      if (filters.isNew === true) {
        query.isNew = true;
      }

      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .lean();

      // Convert to CSV format
      const headers = [
        'ID', 'Name', 'SKU', 'Category', 'Price', 'Original Price', 'Stock',
        'Rating', 'Featured', 'New', 'Active', 'Craftsman', 'Created At'
      ];

      const csvRows = [headers.join(',')];

      products.forEach(product => {
        const row = [
          product._id,
          `"${product.name.replace(/"/g, '""')}"`,
          product.sku || '',
          product.category || '',
          product.price || 0,
          product.originalPrice || '',
          product.stock || 0,
          product.rating || 0,
          product.isFeatured ? 'Yes' : 'No',
          product.isNew ? 'Yes' : 'No',
          product.isActive ? 'Yes' : 'No',
          product.craftsman || '',
          product.createdAt ? new Date(product.createdAt).toISOString() : ''
        ];
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProductService();