/**
 * Product validation service that works with Google Sheets data
 */

import { logger } from '../utils/logger';

export interface ProductForValidation {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  sku: string;
  taxRate: number;
  stock: number;
  minQuantity: number;
  maxQuantity: number;
  isActive: boolean;
  craftsman: string;
  hsn?: string;
  shippingWeight?: number;
  materials?: string[];
}

class ProductValidationService {
  private productCache: Map<string, ProductForValidation> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  /**
   * Get product by ID from API
   */
  async getProductById(productId: string): Promise<ProductForValidation | null> {
    try {
      // Check cache first
      if (this.productCache.has(productId) && this.isCacheValid()) {
        return this.productCache.get(productId) || null;
      }

      // Fetch from API
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          logger.warn('PRODUCT_VALIDATION', `Product not found: ${productId}`);
          return null;
        }
        throw new Error(`Failed to fetch product: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        logger.warn('PRODUCT_VALIDATION', `Invalid product response for ID: ${productId}`);
        return null;
      }

      const product = this.transformProduct(result.data);
      
      // Cache the product
      this.productCache.set(productId, product);
      
      return product;

    } catch (error) {
      logger.error('PRODUCT_VALIDATION', `Error fetching product ${productId}`, error as Error);
      return null;
    }
  }

  /**
   * Get multiple products by IDs
   */
  async getProductsByIds(productIds: string[]): Promise<Map<string, ProductForValidation>> {
    const products = new Map<string, ProductForValidation>();
    
    // Try to get from cache first
    const uncachedIds: string[] = [];
    
    for (const id of productIds) {
      if (this.productCache.has(id) && this.isCacheValid()) {
        const product = this.productCache.get(id);
        if (product) {
          products.set(id, product);
        }
      } else {
        uncachedIds.push(id);
      }
    }

    // Fetch uncached products
    if (uncachedIds.length > 0) {
      try {
        // Fetch all products and filter by IDs (more efficient than individual requests)
        const response = await fetch('/api/products?limit=1000');
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data && result.data.products) {
            const allProducts = result.data.products.map((p: any) => this.transformProduct(p));
            
            // Update cache and collect requested products
            for (const product of allProducts) {
              this.productCache.set(product.id, product);
              
              if (uncachedIds.includes(product.id)) {
                products.set(product.id, product);
              }
            }
            
            this.lastCacheUpdate = Date.now();
          }
        }
      } catch (error) {
        logger.error('PRODUCT_VALIDATION', 'Error fetching products for validation', error as Error);
        
        // Fallback: try individual requests
        for (const id of uncachedIds) {
          const product = await this.getProductById(id);
          if (product) {
            products.set(id, product);
          }
        }
      }
    }

    return products;
  }

  /**
   * Transform API product data to validation format
   */
  private transformProduct(apiProduct: any): ProductForValidation {
    return {
      id: apiProduct.id,
      name: apiProduct.name || '',
      category: apiProduct.category || '',
      subcategory: apiProduct.subcategory,
      price: parseFloat(apiProduct.price) || 0,
      originalPrice: apiProduct.originalPrice ? parseFloat(apiProduct.originalPrice) : undefined,
      sku: apiProduct.sku || '',
      taxRate: parseFloat(apiProduct.taxRate) || 0.18,
      stock: parseInt(apiProduct.stock) || 0,
      minQuantity: parseInt(apiProduct.minQuantity) || 1,
      maxQuantity: parseInt(apiProduct.maxQuantity) || 10,
      isActive: apiProduct.isActive !== false,
      craftsman: apiProduct.craftsman || '',
      hsn: apiProduct.hsn,
      shippingWeight: apiProduct.shippingWeight ? parseFloat(apiProduct.shippingWeight) : undefined,
      materials: apiProduct.materials || []
    };
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  /**
   * Clear the product cache
   */
  clearCache(): void {
    this.productCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Validate product pricing
   */
  validateProductPricing(product: ProductForValidation, quantity: number): {
    isValid: boolean;
    errors: string[];
    calculatedPrice?: {
      subtotal: number;
      tax: number;
      total: number;
      totalInPaisa: number;
    };
  } {
    const errors: string[] = [];
    
    if (!product.isActive) {
      errors.push('Product is currently unavailable');
    }
    
    if (quantity < product.minQuantity) {
      errors.push(`Minimum quantity is ${product.minQuantity}`);
    }
    
    if (quantity > product.maxQuantity) {
      errors.push(`Maximum quantity is ${product.maxQuantity}`);
    }
    
    if (product.stock && quantity > product.stock) {
      errors.push(`Only ${product.stock} items in stock`);
    }
    
    if (product.price <= 0) {
      errors.push('Invalid product price');
    }
    
    const isValid = errors.length === 0;
    let calculatedPrice;
    
    if (isValid) {
      const subtotal = product.price * quantity;
      const tax = Math.round(subtotal * product.taxRate);
      const total = subtotal + tax;
      
      calculatedPrice = {
        subtotal,
        tax,
        total,
        totalInPaisa: Math.round(total * 100)
      };
    }
    
    return {
      isValid,
      errors,
      calculatedPrice
    };
  }
}

export const productValidationService = new ProductValidationService();
export default productValidationService;