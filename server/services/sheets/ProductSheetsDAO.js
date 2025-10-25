const googleSheetsService = require('../googleSheetsService');
const { v4: uuidv4 } = require('uuid');

class ProductSheetsDAO {
  constructor() {
    this.sheetName = 'Products';
    this.headers = [
      'id',
      'name',
      'category',
      'subcategory',
      'price',
      'originalPrice',
      'sku',
      'description',
      'shortDescription',
      'craftsman',
      'image', // Main Cloudinary URL
      'images', // Additional Cloudinary URLs (JSON array)
      'imagePublicIds', // Cloudinary public IDs (JSON array)
      'materials', // JSON array
      'dimensions',
      'weight',
      'origin',
      'rating',
      'isNew',
      'isFeatured',
      'isActive',
      'stock',
      'minQuantity',
      'maxQuantity',
      'tags', // JSON array
      'hsn',
      'taxRate',
      'careInstructions', // JSON array
      'warranty',
      'shippingWeight',
      'shippingDimensions', // JSON object
      'metaTitle',
      'metaDescription',
      'createdAt',
      'updatedAt',
      'createdBy',
      'updatedBy'
    ];
  }

  async initialize() {
    try {
      await googleSheetsService.ensureInitialized();

      // Check if Products sheet exists, create if not
      const metadata = await googleSheetsService.getSheetMetadata();
      const sheetExists = metadata.sheets.some(sheet => sheet.properties.title === this.sheetName);

      if (!sheetExists) {
        await googleSheetsService.createSheet(this.sheetName);
        // Add headers
        await googleSheetsService.writeSheet(this.sheetName, 'A1:AK1', [this.headers]);
      }

      console.log(`ProductSheetsDAO initialized for sheet: ${this.sheetName}`);
    } catch (error) {
      console.error('Failed to initialize ProductSheetsDAO:', error);
      throw error;
    }
  }

  async createProduct(productData, adminId) {
    try {
      await this.initialize();

      const productId = uuidv4();
      const now = new Date().toISOString();

      const productRow = [
        productId,
        productData.name || '',
        productData.category || '',
        productData.subcategory || '',
        productData.price || 0,
        productData.originalPrice || '',
        productData.sku || '',
        productData.description || '',
        productData.shortDescription || '',
        productData.craftsman || '',
        productData.image || '', // Cloudinary URL
        JSON.stringify(productData.images || []), // Additional images
        JSON.stringify(productData.imagePublicIds || []), // Cloudinary public IDs
        JSON.stringify(productData.materials || []),
        productData.dimensions || '',
        productData.weight || '',
        productData.origin || '',
        productData.rating || 0,
        productData.isNew || false,
        productData.isFeatured || false,
        productData.isActive !== false, // Default to true
        productData.stock || 0,
        productData.minQuantity || 1,
        productData.maxQuantity || 10,
        JSON.stringify(productData.tags || []),
        productData.hsn || '',
        productData.taxRate || 0.18,
        JSON.stringify(productData.careInstructions || []),
        productData.warranty || '',
        productData.shippingWeight || '',
        JSON.stringify(productData.shippingDimensions || {}),
        productData.metaTitle || '',
        productData.metaDescription || '',
        now,
        now,
        adminId || '',
        adminId || ''
      ];

      await googleSheetsService.appendToSheet(this.sheetName, [productRow]);
      console.log('Product row appended to sheet:', productId);

      // Return the created product data directly instead of reading from sheet
      const createdProductData = {
        id: productId,
        name: productData.name || '',
        category: productData.category || '',
        subcategory: productData.subcategory || '',
        price: productData.price || 0,
        originalPrice: productData.originalPrice || '',
        sku: productData.sku || '',
        description: productData.description || '',
        shortDescription: productData.shortDescription || '',
        craftsman: productData.craftsman || '',
        image: productData.image || '',
        images: productData.images || [],
        imagePublicIds: productData.imagePublicIds || [],
        materials: productData.materials || [],
        dimensions: productData.dimensions || '',
        weight: productData.weight || '',
        origin: productData.origin || '',
        rating: productData.rating || 0,
        isNew: productData.isNew || false,
        isFeatured: productData.isFeatured || false,
        isActive: productData.isActive !== false,
        stock: productData.stock || 0,
        minQuantity: productData.minQuantity || 1,
        maxQuantity: productData.maxQuantity || 10,
        tags: productData.tags || [],
        hsn: productData.hsn || '',
        taxRate: productData.taxRate || 0.18,
        careInstructions: productData.careInstructions || [],
        warranty: productData.warranty || '',
        shippingWeight: productData.shippingWeight || '',
        shippingDimensions: productData.shippingDimensions || {},
        metaTitle: productData.metaTitle || '',
        metaDescription: productData.metaDescription || '',
        createdAt: now,
        updatedAt: now,
        createdBy: adminId || '',
        updatedBy: adminId || ''
      };

      return createdProductData;
    } catch (error) {
      console.error('Error creating product in sheets:', error);
      throw error;
    }
  }

  async getProductById(productId) {
    try {
      await this.initialize();

      const data = await googleSheetsService.readSheet(this.sheetName);
      console.log('Sheet data length:', data.length);
      if (data.length <= 1) return null; // Only headers or empty

      const products = googleSheetsService.sheetDataToObjects(data);
      console.log('Parsed products count:', products.length);
      console.log('Looking for product ID:', productId);
      const product = products.find(p => p.id === productId);
      console.log('Found product:', product ? 'Yes' : 'No');

      if (!product) return null;

      return this.parseProduct(product);
    } catch (error) {
      console.error('Error getting product by ID from sheets:', error);
      throw error;
    }
  }

  async getProducts(filters = {}, options = {}) {
    try {
      await this.initialize();

      const data = await googleSheetsService.readSheet(this.sheetName);
      if (data.length <= 1) {
        return {
          products: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: options.page || 1
        };
      }

      let products = googleSheetsService.sheetDataToObjects(data);
      products = products.map(p => this.parseProduct(p));

      // Apply filters
      products = this.applyFilters(products, filters);

      // Apply sorting
      products = this.applySorting(products, options);

      // Apply pagination
      const totalCount = products.length;
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 20;
      const startIndex = (page - 1) * limit;
      const paginatedProducts = products.slice(startIndex, startIndex + limit);

      return {
        products: paginatedProducts,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Error getting products from sheets:', error);
      throw error;
    }
  }

  async updateProduct(productId, updateData, adminId) {
    try {
      await this.initialize();

      const data = await googleSheetsService.readSheet(this.sheetName);
      if (data.length <= 1) throw new Error('Product not found');

      const products = googleSheetsService.sheetDataToObjects(data);
      const productIndex = products.findIndex(p => p.id === productId);

      if (productIndex === -1) throw new Error('Product not found');

      // Update the product
      const existingProduct = products[productIndex];
      const updatedProduct = { ...existingProduct, ...updateData };
      updatedProduct.updatedAt = new Date().toISOString();
      updatedProduct.updatedBy = adminId || '';

      // Convert back to row format
      const updatedRow = this.productToRow(updatedProduct);

      // Update the specific row (add 2 to account for 0-based index and header row)
      const rowNumber = productIndex + 2;
      await googleSheetsService.writeSheet(
        this.sheetName,
        `A${rowNumber}:AK${rowNumber}`,
        [updatedRow]
      );

      return this.parseProduct(updatedProduct);
    } catch (error) {
      console.error('Error updating product in sheets:', error);
      throw error;
    }
  }

  async deleteProduct(productId, adminId) {
    try {
      await this.initialize();

      const data = await googleSheetsService.readSheet(this.sheetName);
      if (data.length <= 1) throw new Error('Product not found');

      const products = googleSheetsService.sheetDataToObjects(data);
      const productIndex = products.findIndex(p => p.id === productId);

      if (productIndex === -1) throw new Error('Product not found');

      const product = products[productIndex];

      // Instead of actually deleting, mark as inactive
      await this.updateProduct(productId, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        deletedBy: adminId
      }, adminId);

      return this.parseProduct(product);
    } catch (error) {
      console.error('Error deleting product in sheets:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      await this.initialize();

      const data = await googleSheetsService.readSheet(this.sheetName);
      if (data.length <= 1) return [];

      const products = googleSheetsService.sheetDataToObjects(data);
      const categories = [...new Set(products
        .filter(p => p.category && p.isActive !== 'false')
        .map(p => p.category)
      )];

      return categories.sort();
    } catch (error) {
      console.error('Error getting categories from sheets:', error);
      return [];
    }
  }

  async getProductStatistics() {
    try {
      await this.initialize();

      const data = await googleSheetsService.readSheet(this.sheetName);
      if (data.length <= 1) {
        return {
          stockStats: [{ totalProducts: 0, outOfStock: 0, lowStock: 0 }],
          featuredStats: [{ featured: 0 }]
        };
      }

      const products = googleSheetsService.sheetDataToObjects(data);
      const activeProducts = products.filter(p => p.isActive !== 'false');

      const totalProducts = activeProducts.length;
      const outOfStock = activeProducts.filter(p => parseInt(p.stock) === 0).length;
      const lowStock = activeProducts.filter(p => {
        const stock = parseInt(p.stock);
        return stock > 0 && stock <= 10;
      }).length;
      const featured = activeProducts.filter(p => p.isFeatured === 'true').length;

      return {
        stockStats: [{ totalProducts, outOfStock, lowStock }],
        featuredStats: [{ featured }]
      };
    } catch (error) {
      console.error('Error getting product statistics from sheets:', error);
      return {
        stockStats: [{ totalProducts: 0, outOfStock: 0, lowStock: 0 }],
        featuredStats: [{ featured: 0 }]
      };
    }
  }

  // Helper methods
  parseProduct(product) {
    if (!product) return null;

    return {
      id: product.id,
      _id: product.id, // For compatibility
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      price: parseFloat(product.price) || 0,
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : undefined,
      sku: product.sku,
      description: product.description,
      shortDescription: product.shortDescription,
      craftsman: product.craftsman,
      image: product.image,
      images: this.parseJSON(product.images, []),
      imagePublicIds: this.parseJSON(product.imagePublicIds, []),
      materials: this.parseJSON(product.materials, []),
      dimensions: product.dimensions,
      weight: product.weight,
      origin: product.origin,
      rating: parseFloat(product.rating) || 0,
      isNew: product.isNew === 'true' || product.isNew === 'TRUE',
      isFeatured: product.isFeatured === 'true' || product.isFeatured === 'TRUE',
      isActive: product.isActive !== 'false' && product.isActive !== 'FALSE',
      stock: parseInt(product.stock) || 0,
      minQuantity: parseInt(product.minQuantity) || 1,
      maxQuantity: parseInt(product.maxQuantity) || 10,
      tags: this.parseJSON(product.tags, []),
      hsn: product.hsn,
      taxRate: parseFloat(product.taxRate) || 0.18,
      careInstructions: this.parseJSON(product.careInstructions, []),
      warranty: product.warranty,
      shippingWeight: product.shippingWeight ? parseFloat(product.shippingWeight) : undefined,
      shippingDimensions: this.parseJSON(product.shippingDimensions, {}),
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      createdBy: product.createdBy,
      updatedBy: product.updatedBy
    };
  }

  productToRow(product) {
    return [
      product.id,
      product.name || '',
      product.category || '',
      product.subcategory || '',
      product.price || 0,
      product.originalPrice || '',
      product.sku || '',
      product.description || '',
      product.shortDescription || '',
      product.craftsman || '',
      product.image || '',
      JSON.stringify(product.images || []),
      JSON.stringify(product.imagePublicIds || []),
      JSON.stringify(product.materials || []),
      product.dimensions || '',
      product.weight || '',
      product.origin || '',
      product.rating || 0,
      product.isNew || false,
      product.isFeatured || false,
      product.isActive !== false,
      product.stock || 0,
      product.minQuantity || 1,
      product.maxQuantity || 10,
      JSON.stringify(product.tags || []),
      product.hsn || '',
      product.taxRate || 0.18,
      JSON.stringify(product.careInstructions || []),
      product.warranty || '',
      product.shippingWeight || '',
      JSON.stringify(product.shippingDimensions || {}),
      product.metaTitle || '',
      product.metaDescription || '',
      product.createdAt || new Date().toISOString(),
      product.updatedAt || new Date().toISOString(),
      product.createdBy || '',
      product.updatedBy || ''
    ];
  }

  parseJSON(jsonString, defaultValue = null) {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  applyFilters(products, filters) {
    return products.filter(product => {
      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Price range filter
      if (filters.minPrice && product.price < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) {
        return false;
      }

      // Stock filters
      if (filters.inStock && product.stock <= 0) {
        return false;
      }
      if (filters.lowStock && (product.stock <= 0 || product.stock > 10)) {
        return false;
      }

      // Feature filters
      if (filters.isFeatured && !product.isFeatured) {
        return false;
      }
      if (filters.isNew && !product.isNew) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchFields = [
          product.name,
          product.description,
          product.sku,
          product.category,
          product.craftsman,
          ...(product.tags || [])
        ].join(' ').toLowerCase();

        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  applySorting(products, options) {
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    return products.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
}

module.exports = new ProductSheetsDAO();