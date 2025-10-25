const cloudinary = require('cloudinary').v2;
const ProductSheetsDAO = require('./sheets/ProductSheetsDAO');
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class EnhancedProductService {
  constructor() {
    this.productDAO = ProductSheetsDAO;
  }

  /**
   * Create a new product with Cloudinary image upload and Google Sheets storage
   */
  async createProduct(productData, files, adminId) {
    try {
      // Upload images to Cloudinary (handle case where no files are provided)
      const imageUploadResults = await this.uploadProductImages(files || {});
      
      // Prepare product data with Cloudinary URLs
      const enhancedProductData = {
        ...productData,
        image: imageUploadResults.mainImage?.secure_url || '',
        images: imageUploadResults.additionalImages?.map(img => img.secure_url) || [],
        imagePublicIds: [
          ...(imageUploadResults.mainImage ? [imageUploadResults.mainImage.public_id] : []),
          ...(imageUploadResults.additionalImages?.map(img => img.public_id) || [])
        ]
      };

      // Generate SKU if not provided
      if (!enhancedProductData.sku) {
        enhancedProductData.sku = await this.generateSKU(enhancedProductData.category, enhancedProductData.name);
      }

      // Validate SKU uniqueness
      await this.validateSKUUniqueness(enhancedProductData.sku);

      // Save to Google Sheets
      const product = await this.productDAO.createProduct(enhancedProductData, adminId);

      console.log(`Product created successfully: ${product.id}`);
      return product;

    } catch (error) {
      // If product creation fails, clean up uploaded images
      if (error.uploadedImages) {
        await this.cleanupCloudinaryImages(error.uploadedImages);
      }
      
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId, updateData, files, adminId) {
    try {
      // Get existing product
      const existingProduct = await this.productDAO.getProductById(productId);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      let enhancedUpdateData = { ...updateData };

      // Handle image updates if files are provided
      if (files && (files.image || files.images)) {
        const imageUploadResults = await this.uploadProductImages(files);
        
        // Update image URLs
        if (imageUploadResults.mainImage) {
          enhancedUpdateData.image = imageUploadResults.mainImage.secure_url;
        }
        
        if (imageUploadResults.additionalImages && imageUploadResults.additionalImages.length > 0) {
          enhancedUpdateData.images = [
            ...(existingProduct.images || []),
            ...imageUploadResults.additionalImages.map(img => img.secure_url)
          ];
        }

        // Update public IDs
        const newPublicIds = [
          ...(imageUploadResults.mainImage ? [imageUploadResults.mainImage.public_id] : []),
          ...(imageUploadResults.additionalImages?.map(img => img.public_id) || [])
        ];
        
        enhancedUpdateData.imagePublicIds = [
          ...(existingProduct.imagePublicIds || []),
          ...newPublicIds
        ];
      }

      // Validate SKU uniqueness if SKU is being updated
      if (enhancedUpdateData.sku && enhancedUpdateData.sku !== existingProduct.sku) {
        await this.validateSKUUniqueness(enhancedUpdateData.sku, productId);
      }

      // Update in Google Sheets
      const updatedProduct = await this.productDAO.updateProduct(productId, enhancedUpdateData, adminId);

      console.log(`Product updated successfully: ${productId}`);
      return updatedProduct;

    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product and its images
   */
  async deleteProduct(productId, adminId) {
    try {
      // Get existing product
      const existingProduct = await this.productDAO.getProductById(productId);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Delete images from Cloudinary
      if (existingProduct.imagePublicIds && existingProduct.imagePublicIds.length > 0) {
        await this.cleanupCloudinaryImages(existingProduct.imagePublicIds);
      }

      // Soft delete in Google Sheets
      const deletedProduct = await this.productDAO.deleteProduct(productId, adminId);

      console.log(`Product deleted successfully: ${productId}`);
      return deletedProduct;

    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    return await this.productDAO.getProductById(productId);
  }

  /**
   * Get products with filtering and pagination
   */
  async getProducts(filters = {}, options = {}) {
    return await this.productDAO.getProducts(filters, options);
  }

  /**
   * Get product categories
   */
  async getCategories() {
    return await this.productDAO.getCategories();
  }

  /**
   * Get product statistics
   */
  async getProductStatistics() {
    return await this.productDAO.getProductStatistics();
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(productIds, updateData, adminId) {
    try {
      let modifiedCount = 0;
      const results = [];

      for (const productId of productIds) {
        try {
          const updatedProduct = await this.productDAO.updateProduct(productId, updateData, adminId);
          if (updatedProduct) {
            modifiedCount++;
            results.push(updatedProduct);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      }

      return {
        matchedCount: productIds.length,
        modifiedCount,
        results
      };

    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  /**
   * Update product stock
   */
  async updateStock(productId, newStock, adminId, reason = '') {
    try {
      const updateData = {
        stock: newStock,
        stockUpdateReason: reason,
        lastStockUpdate: new Date().toISOString()
      };

      return await this.productDAO.updateProduct(productId, updateData, adminId);
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(searchCriteria) {
    const filters = {
      search: searchCriteria.query,
      ...searchCriteria.filters
    };
    
    const options = {
      limit: searchCriteria.limit || 20
    };

    const result = await this.productDAO.getProducts(filters, options);
    return result.products;
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold = 10) {
    const filters = { lowStock: true };
    const result = await this.productDAO.getProducts(filters);
    return result.products.filter(product => product.stock <= threshold && product.stock > 0);
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts() {
    const result = await this.productDAO.getProducts();
    return result.products.filter(product => product.stock === 0);
  }

  /**
   * Export products to CSV
   */
  async exportProducts(filters = {}) {
    const result = await this.productDAO.getProducts(filters, { limit: 10000 });
    const products = result.products;

    // CSV headers
    const headers = [
      'ID', 'Name', 'Category', 'SKU', 'Price', 'Stock', 'Status', 'Created At'
    ];

    // Convert products to CSV rows
    const rows = products.map(product => [
      product.id,
      product.name,
      product.category,
      product.sku,
      product.price,
      product.stock,
      product.isActive ? 'Active' : 'Inactive',
      product.createdAt
    ]);

    // Combine headers and rows
    const csvData = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvData;
  }

  // Private helper methods

  /**
   * Upload product images to Cloudinary
   */
  async uploadProductImages(files) {
    try {
      const results = {
        mainImage: null,
        additionalImages: []
      };

      // Handle case where files is undefined or empty
      if (!files) {
        return results;
      }

      // Upload main image
      if (files.image && files.image[0]) {
        const mainImageResult = await this.uploadToCloudinary(files.image[0], 'main');
        results.mainImage = mainImageResult;
      }

      // Upload additional images
      if (files.images && files.images.length > 0) {
        const additionalUploads = files.images.map((file, index) => 
          this.uploadToCloudinary(file, `additional_${index}`)
        );
        results.additionalImages = await Promise.all(additionalUploads);
      }

      return results;

    } catch (error) {
      console.error('Error uploading images to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload single file to Cloudinary
   */
  async uploadToCloudinary(file, suffix = '') {
    try {
      const options = {
        folder: 'products',
        public_id: `product_${uuidv4()}_${suffix}`,
        transformation: [
          { width: 800, height: 800, crop: 'limit', quality: 'auto' },
          { format: 'auto' }
        ]
      };

      let uploadResult;
      
      if (file.path) {
        // File from multer with local path
        uploadResult = await cloudinary.uploader.upload(file.path, options);
      } else if (file.buffer) {
        // File from multer with buffer
        uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(file.buffer);
        });
      } else {
        throw new Error('Invalid file format for upload');
      }

      return uploadResult;

    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Clean up Cloudinary images
   */
  async cleanupCloudinaryImages(publicIds) {
    try {
      if (!publicIds || publicIds.length === 0) return;

      const deletePromises = publicIds.map(publicId => 
        cloudinary.uploader.destroy(publicId)
      );

      await Promise.all(deletePromises);
      console.log(`Cleaned up ${publicIds.length} images from Cloudinary`);

    } catch (error) {
      console.error('Error cleaning up Cloudinary images:', error);
      // Don't throw error as this is cleanup
    }
  }

  /**
   * Generate SKU
   */
  async generateSKU(category, productName) {
    const categoryPrefix = category ? category.substring(0, 3).toUpperCase() : 'PRD';
    const namePrefix = productName ? productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : 'XXX';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    return `${categoryPrefix}-${namePrefix}-${timestamp}-${random}`;
  }

  /**
   * Validate SKU uniqueness
   */
  async validateSKUUniqueness(sku, excludeProductId = null) {
    try {
      const result = await this.productDAO.getProducts({ search: sku });
      const existingProduct = result.products.find(p => 
        p.sku === sku && p.id !== excludeProductId
      );

      if (existingProduct) {
        throw new Error('SKU already exists');
      }

      return true;
    } catch (error) {
      if (error.message === 'SKU already exists') {
        throw error;
      }
      // If there's an error checking, assume it's unique
      return true;
    }
  }

  /**
   * Get craftsmen list
   */
  async getCraftsmen() {
    try {
      const result = await this.productDAO.getProducts({}, { limit: 10000 });
      const craftsmen = [...new Set(result.products
        .filter(p => p.craftsman && p.isActive)
        .map(p => p.craftsman)
      )];
      
      return craftsmen.sort();
    } catch (error) {
      console.error('Error getting craftsmen:', error);
      return [];
    }
  }
}

module.exports = new EnhancedProductService();