import { Product } from '../types/product';
import apiClient from './apiClient';

interface ProductsApiResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

interface ProductApiResponse {
  success: boolean;
  message: string;
  data: Product;
}

interface CategoriesApiResponse {
  success: boolean;
  message: string;
  data: {
    categories: string[];
  };
}

interface CraftsmenApiResponse {
  success: boolean;
  message: string;
  data: string[];
}

interface ProductStatisticsApiResponse {
  success: boolean;
  message: string;
  data: {
    categoryStats: { _id: string; count: number }[];
    stockStats: { 
      totalProducts: number;
      inStock: number; 
      lowStock: number; 
      outOfStock: number 
    }[];
    priceStats: { avgPrice: number; minPrice: number; maxPrice: number }[];
    featuredStats: { featured: number; new: number }[];
    topProducts: Product[];
  };
}

class AdminProductService {
  async getProducts(filters: any = {}, options: any = {}): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/products', { ...filters, ...options });
      return response;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/admin/products/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch product with ID ${id}:`, error);
      throw error;
    }
  }

  async createProduct(productData: FormData): Promise<any> {
    try {
      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (const pair of productData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      const response = await apiClient.post(
        '/api/admin/products',
        productData
      );
      return response;
    } catch (error) {
      console.error('Failed to create product:', error);
      // Log more detailed error information
      if (typeof error === 'object' && error !== null) {
        const apiError = error as { message?: string; statusCode?: number };
        console.error('Error message:', apiError.message);
        console.error('Status code:', apiError.statusCode);
      }
      throw error;
    }
  }

  async updateProduct(id: string, productData: FormData): Promise<any> {
    try {
      const response = await apiClient.put(`/api/admin/products/${id}`, productData);
      return response;
    } catch (error) {
      console.error(`Failed to update product with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/api/admin/products/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete product with ID ${id}:`, error);
      throw error;
    }
  }

  async updateStock(id: string, stock: number, reason?: string): Promise<ProductApiResponse> {
    try {
      const response = await apiClient.put(`/api/admin/products/${id}/stock`, { stock, reason });
      return response.data as ProductApiResponse;
    } catch (error) {
      console.error(`Failed to update stock for product with ID ${id}:`, error);
      throw error;
    }
  }

  async getCategories(): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/products/categories');
      return response;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }

  async getCraftsmen(): Promise<CraftsmenApiResponse> {
    try {
      const response = await apiClient.get('/api/admin/products/craftsmen');
      return response.data as CraftsmenApiResponse;
    } catch (error) {
      console.error('Failed to fetch craftsmen:', error);
      throw error;
    }
  }

  async getProductStatistics(): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/products/statistics');
      return response;
    } catch (error) {
      console.error('Failed to fetch product statistics:', error);
      throw error;
    }
  }

  async getLowStockProducts(): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/products/low-stock');
      return response;
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
      throw error;
    }
  }

  async getOutOfStockProducts(): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/products/out-of-stock');
      return response;
    } catch (error) {
      console.error('Failed to fetch out of stock products:', error);
      throw error;
    }
  }

  async bulkUpdateProducts(productIds: string[], updateData: any): Promise<any> {
    try {
      const response = await apiClient.post('/api/admin/products/bulk-update', {
        productIds,
        updateData
      });
      return response.data;
    } catch (error) {
      console.error('Failed to perform bulk update:', error);
      throw error;
    }
  }

  async searchProducts(query: string): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/products/search', { query });
      return response;
    } catch (error) {
      console.error('Failed to search products:', error);
      throw error;
    }
  }

  async exportProducts(filters: any = {}): Promise<Blob> {
    try {
      const response = await apiClient.get('/api/admin/products/export', {
        params: filters,
        responseType: 'blob'
      });
      return response.data as Blob;
    } catch (error) {
      console.error('Failed to export products:', error);
      throw error;
    }
  }
}

export const adminProductService = new AdminProductService();
export default AdminProductService;