export interface ProductFilter {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  materials: string[];
  craftsmen: string[];
  ratings: number[];
  availability: boolean;
  isNew: boolean;
  isFeatured: boolean;
  tags: string[];
}

export interface SearchFilters {
  sortBy: 'name' | 'price-low' | 'price-high' | 'rating' | 'newest' | 'featured';
  viewMode: 'grid' | 'list';
  itemsPerPage: number;
}

export interface ProductComparison {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  features: string[];
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  addedAt: string;
}

export interface SearchSuggestion {
  type: 'product' | 'category' | 'material' | 'craftsman' | 'tag';
  value: string;
  label: string;
  count?: number;
}

export interface SearchHistory {
  query: string;
  timestamp: string;
  resultsCount: number;
}

export interface ProductPricing {
  basePrice: number; // Price in rupees
  originalPrice?: number; // Original price before discount
  discountPercentage?: number;
  taxRate: number; // Tax rate (e.g., 0.18 for 18% GST)
  currency: string;
  minQuantity: number;
  maxQuantity: number;
  isAvailable: boolean;
  stockCount?: number;
}

export interface ProductMetadata {
  sku: string;
  hsn?: string; // HSN code for tax purposes
  category: string;
  subcategory?: string;
  tags: string[];
  craftsman: string;
  origin: string;
  materials: string[];
  dimensions: string;
  weight: string;
  careInstructions?: string[];
  warranty?: string;
  shippingWeight?: number; // in kg
  shippingDimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  shortDescription?: string;
  image: string;
  images?: string[];
  pricing: ProductPricing;
  metadata: ProductMetadata;
  isNew: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  
  // Flattened properties for easier access
  price?: number;
  originalPrice?: number;
  stock?: number;
  sku?: string;
  category?: string;
  subcategory?: string;
  craftsman?: string;
  materials?: string[];
  dimensions?: string;
  weight?: string;
  origin?: string;
  minQuantity?: number;
  maxQuantity?: number;
  tags?: string[];
  hsn?: string;
  taxRate?: number;
  careInstructions?: string[];
  warranty?: string;
  shippingWeight?: number;
  shippingDimensions?: {
    length: string;
    width: string;
    height: string;
  };
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}