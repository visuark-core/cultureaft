const ProductSheetsDAO = require('./sheets/ProductSheetsDAO');

class UserProductService {
  constructor() {
    this.productDAO = ProductSheetsDAO;
  }

  /**
   * Get products for public display (only active products)
   */
  async getPublicProducts(filters = {}, options = {}) {
    try {
      // Add filter to only show active products
      const publicFilters = {
        ...filters,
        isActive: true
      };

      const result = await this.productDAO.getProducts(publicFilters, options);
      
      // Filter out sensitive admin data and only return public fields
      const publicProducts = result.products.map(product => this.sanitizeProductForPublic(product));

      return {
        ...result,
        products: publicProducts
      };

    } catch (error) {
      console.error('Error getting public products:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID for public display
   */
  async getPublicProductById(productId) {
    try {
      const product = await this.productDAO.getProductById(productId);
      
      if (!product || !product.isActive) {
        return null;
      }

      return this.sanitizeProductForPublic(product);

    } catch (error) {
      console.error('Error getting public product by ID:', error);
      throw error;
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8) {
    try {
      const filters = {
        isFeatured: true,
        isActive: true
      };

      const options = {
        limit: limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await this.productDAO.getProducts(filters, options);
      const publicProducts = result.products.map(product => this.sanitizeProductForPublic(product));

      return publicProducts;

    } catch (error) {
      console.error('Error getting featured products:', error);
      return [];
    }
  }

  /**
   * Get new products
   */
  async getNewProducts(limit = 8) {
    try {
      const filters = {
        isNew: true,
        isActive: true
      };

      const options = {
        limit: limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await this.productDAO.getProducts(filters, options);
      const publicProducts = result.products.map(product => this.sanitizeProductForPublic(product));

      return publicProducts;

    } catch (error) {
      console.error('Error getting new products:', error);
      return [];
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category, options = {}) {
    try {
      const filters = {
        category: category,
        isActive: true
      };

      const result = await this.productDAO.getProducts(filters, options);
      const publicProducts = result.products.map(product => this.sanitizeProductForPublic(product));

      return {
        ...result,
        products: publicProducts
      };

    } catch (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }
  }

  /**
   * Search products for public
   */
  async searchPublicProducts(searchQuery, filters = {}, options = {}) {
    try {
      const publicFilters = {
        ...filters,
        search: searchQuery,
        isActive: true
      };

      const result = await this.productDAO.getProducts(publicFilters, options);
      const publicProducts = result.products.map(product => this.sanitizeProductForPublic(product));

      return {
        ...result,
        products: publicProducts
      };

    } catch (error) {
      console.error('Error searching public products:', error);
      throw error;
    }
  }

  /**
   * Get product categories for public display
   */
  async getPublicCategories() {
    try {
      return await this.productDAO.getCategories();
    } catch (error) {
      console.error('Error getting public categories:', error);
      return [];
    }
  }

  /**
   * Get products with price range
   */
  async getProductsInPriceRange(minPrice, maxPrice, options = {}) {
    try {
      const filters = {
        minPrice: minPrice,
        maxPrice: maxPrice,
        isActive: true
      };

      const result = await this.productDAO.getProducts(filters, options);
      const publicProducts = result.products.map(product => this.sanitizeProductForPublic(product));

      return {
        ...result,
        products: publicProducts
      };

    } catch (error) {
      console.error('Error getting products in price range:', error);
      throw error;
    }
  }

  /**
   * Get related products (same category, excluding current product)
   */
  async getRelatedProducts(productId, limit = 4) {
    try {
      const currentProduct = await this.productDAO.getProductById(productId);
      if (!currentProduct) {
        return [];
      }

      const filters = {
        category: currentProduct.category,
        isActive: true
      };

      const options = {
        limit: limit + 1, // Get one extra to exclude current product
        sortBy: 'rating',
        sortOrder: 'desc'
      };

      const result = await this.productDAO.getProducts(filters, options);
      
      // Exclude current product and limit results
      const relatedProducts = result.products
        .filter(product => product.id !== productId)
        .slice(0, limit)
        .map(product => this.sanitizeProductForPublic(product));

      return relatedProducts;

    } catch (error) {
      console.error('Error getting related products:', error);
      return [];
    }
  }

  /**
   * Get products by craftsman
   */
  async getProductsByCraftsman(craftsman, options = {}) {
    try {
      const filters = {
        craftsman: craftsman,
        isActive: true
      };

      const result = await this.productDAO.getProducts(filters, options);
      const publicProducts = result.products.map(product => this.sanitizeProductForPublic(product));

      return {
        ...result,
        products: publicProducts
      };

    } catch (error) {
      console.error('Error getting products by craftsman:', error);
      throw error;
    }
  }

  /**
   * Check product availability and stock
   */
  async checkProductAvailability(productId, quantity = 1) {
    try {
      const product = await this.productDAO.getProductById(productId);
      
      if (!product) {
        return {
          available: false,
          reason: 'Product not found'
        };
      }

      if (!product.isActive) {
        return {
          available: false,
          reason: 'Product is not available'
        };
      }

      if (product.stock < quantity) {
        return {
          available: false,
          reason: 'Insufficient stock',
          availableStock: product.stock
        };
      }

      if (quantity < product.minQuantity) {
        return {
          available: false,
          reason: `Minimum quantity is ${product.minQuantity}`,
          minQuantity: product.minQuantity
        };
      }

      if (quantity > product.maxQuantity) {
        return {
          available: false,
          reason: `Maximum quantity is ${product.maxQuantity}`,
          maxQuantity: product.maxQuantity
        };
      }

      return {
        available: true,
        product: this.sanitizeProductForPublic(product)
      };

    } catch (error) {
      console.error('Error checking product availability:', error);
      return {
        available: false,
        reason: 'Error checking availability'
      };
    }
  }

  /**
   * Get product recommendations based on user behavior
   * (This is a simple implementation - can be enhanced with ML algorithms)
   */
  async getRecommendedProducts(userPreferences = {}, limit = 8) {
    try {
      let filters = {
        isActive: true
      };

      // If user has preferred categories, prioritize them
      if (userPreferences.categories && userPreferences.categories.length > 0) {
        // For now, just pick the first preferred category
        filters.category = userPreferences.categories[0];
      }

      // If user has a price range preference
      if (userPreferences.minPrice) {
        filters.minPrice = userPreferences.minPrice;
      }
      if (userPreferences.maxPrice) {
        filters.maxPrice = userPreferences.maxPrice;
      }

      const options = {
        limit: limit,
        sortBy: 'rating', // Prioritize highly rated products
        sortOrder: 'desc'
      };

      const result = await this.productDAO.getProducts(filters, options);
      
      // If we don't have enough products with user preferences, fill with featured products
      let recommendedProducts = result.products;
      if (recommendedProducts.length < limit) {
        const featuredProducts = await this.getFeaturedProducts(limit - recommendedProducts.length);
        recommendedProducts = [...recommendedProducts, ...featuredProducts];
      }

      // Remove duplicates and limit
      const uniqueProducts = recommendedProducts
        .filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        )
        .slice(0, limit);

      return uniqueProducts.map(product => this.sanitizeProductForPublic(product));

    } catch (error) {
      console.error('Error getting recommended products:', error);
      return [];
    }
  }

  // Private helper methods

  /**
   * Remove sensitive admin data from product for public display
   */
  sanitizeProductForPublic(product) {
    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      originalPrice: product.originalPrice,
      sku: product.sku,
      description: product.description,
      shortDescription: product.shortDescription,
      craftsman: product.craftsman,
      image: product.image,
      images: product.images || [],
      materials: product.materials || [],
      dimensions: product.dimensions,
      weight: product.weight,
      origin: product.origin,
      rating: product.rating,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      stock: product.stock,
      minQuantity: product.minQuantity,
      maxQuantity: product.maxQuantity,
      tags: product.tags || [],
      careInstructions: product.careInstructions || [],
      warranty: product.warranty,
      shippingWeight: product.shippingWeight,
      shippingDimensions: product.shippingDimensions,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      createdAt: product.createdAt
      // Exclude: imagePublicIds, hsn, taxRate, createdBy, updatedBy, updatedAt
    };
  }
}

module.exports = new UserProductService();