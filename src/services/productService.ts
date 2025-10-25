import { Product, ProductFilter, SearchFilters, SearchSuggestion, SearchHistory } from '../types/product';
import apiClient from './apiClient';

interface ProductsApiResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface CategoriesApiResponse {
  success: boolean;
  message: string;
  data: string[];
}

interface CraftsmenApiResponse {
  success: boolean;
  message: string;
  data: string[];
}

class ProductService {
  private searchHistory: SearchHistory[] = [];

  constructor() {
    this.loadSearchHistory();
  }

  async getProducts(filters: any = {}): Promise<ProductsApiResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add filters as query parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });
      
      // Add cache-busting parameter
      params.append('_t', Date.now().toString());

      const response = await apiClient.get(`/api/products?${params.toString()}`);
      
      if (response.success && response.data) {
        return {
          products: response.data.products || [],
          pagination: response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        };
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return {
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  }

  async searchProducts(query: string, filters?: ProductFilter, searchOptions?: SearchFilters): Promise<Product[]> {
    try {
      const apiFilters: any = {};
      if (filters) {
        if (filters.categories && filters.categories.length > 0) apiFilters.category = filters.categories.join(',');
        if (filters.priceRange) {
          apiFilters.minPrice = filters.priceRange.min;
          apiFilters.maxPrice = filters.priceRange.max;
        }
        if (filters.materials && filters.materials.length > 0) apiFilters.materials = filters.materials.join(',');
        if (filters.craftsmen && filters.craftsmen.length > 0) apiFilters.craftsman = filters.craftsmen.join(',');
        if (filters.ratings && filters.ratings.length > 0) apiFilters.minRating = Math.min(...filters.ratings);
        if (filters.availability) apiFilters.inStock = true;
        if (filters.isNew) apiFilters.isNew = true;
        if (filters.isFeatured) apiFilters.isFeatured = true;
      }

      const apiOptions: any = {};
      if (searchOptions) {
        apiOptions.sortBy = searchOptions.sortBy === 'name' ? 'name' :
                            searchOptions.sortBy === 'price-low' ? 'price' :
                            searchOptions.sortBy === 'price-high' ? 'price' :
                            searchOptions.sortBy === 'rating' ? 'rating' :
                            searchOptions.sortBy === 'newest' ? 'createdAt' :
                            searchOptions.sortBy === 'featured' ? 'isFeatured' : 'createdAt';
        apiOptions.sortOrder = searchOptions.sortBy === 'price-high' ? 'desc' : 'asc'; // Default to asc for price-low, desc for price-high
        if (searchOptions.sortBy === 'rating' || searchOptions.sortBy === 'newest' || searchOptions.sortBy === 'featured') {
          apiOptions.sortOrder = 'desc';
        }
        apiOptions.limit = searchOptions.itemsPerPage;
      }

      const response = await apiClient.get<ProductsApiResponse>('/api/products', { q: query, ...apiFilters, ...apiOptions });
      this.saveSearchToHistory(query, response.data.products.length);
      return response.data.products;
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  }

  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (query.length < 2) return [];

    const suggestions: SearchSuggestion[] = [];
    try {
      const response = await apiClient.get<ProductsApiResponse>('/api/products/search', { q: query, limit: 5 });
      response.data.products.forEach(product => {
        suggestions.push({
          type: 'product',
          value: product.name,
          label: product.name
        });
      });

      const categoriesResponse = await apiClient.get<CategoriesApiResponse>('/api/products/categories');
      categoriesResponse.data.data.forEach(category => {
        if (category.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            type: 'category',
            value: category,
            label: category
          });
        }
      });

      const craftsmenResponse = await apiClient.get<CraftsmenApiResponse>('/api/products/craftsmen');
      craftsmenResponse.data.data.forEach(craftsman => {
        if (craftsman.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            type: 'craftsman',
            value: craftsman,
            label: `Craftsman: ${craftsman}`
          });
        }
      });

    } catch (error) {
      console.error('Failed to get search suggestions:', error);
    }
    return suggestions.slice(0, 10);
  }

  async getFilterOptions(): Promise<{
    categories: string[];
    materials: string[];
    craftsmen: string[];
    priceRange: { min: number; max: number };
    tags: string[];
  }> {
    try {
      const categoriesResponse = await apiClient.get<CategoriesApiResponse>('/api/products/categories');
      const categories = categoriesResponse.data.data;

      const craftsmenResponse = await apiClient.get<CraftsmenApiResponse>('/api/products/craftsmen');
      const craftsmen = craftsmenResponse.data.data;

      // For materials, priceRange, and tags, we might need a dedicated API endpoint or fetch all products and process
      // For now, returning dummy data or empty arrays
      return {
        categories,
        materials: [], // TODO: Implement API for materials
        craftsmen,
        priceRange: { min: 0, max: 100000 }, // TODO: Implement API for price range
        tags: [] // TODO: Implement API for tags
      };
    } catch (error) {
      console.error('Failed to get filter options:', error);
      return {
        categories: [],
        materials: [],
        craftsmen: [],
        priceRange: { min: 0, max: 100000 },
        tags: []
      };
    }
  }

  private loadSearchHistory(): void {
    const saved = localStorage.getItem('productSearchHistory');
    if (saved) {
      this.searchHistory = JSON.parse(saved);
    }
  }

  private saveSearchToHistory(query: string, resultsCount: number): void {
    if (!query.trim()) return;

    const historyItem: SearchHistory = {
      query: query.trim(),
      timestamp: new Date().toISOString(),
      resultsCount
    };

    this.searchHistory = this.searchHistory.filter(item => item.query !== query);
    this.searchHistory.unshift(historyItem);
    this.searchHistory = this.searchHistory.slice(0, 10);
    localStorage.setItem('productSearchHistory', JSON.stringify(this.searchHistory));
  }

  getSearchHistory(): SearchHistory[] {
    return this.searchHistory;
  }

  clearSearchHistory(): void {
    this.searchHistory = [];
    localStorage.removeItem('productSearchHistory');
  }
}

export const productService = new ProductService();