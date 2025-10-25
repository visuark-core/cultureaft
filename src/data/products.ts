// Product pricing and metadata
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
  name: string;
  description: string;
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
}

export const productsData: Product[] = [
  {
    id: '1',
    name: 'Handcrafted Rajasthani Wooden Chair',
    description: 'Exquisite handcrafted wooden chair featuring traditional Rajasthani motifs and intricate carvings. Made from premium teak wood by skilled artisans in Jodhpur.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop'
    ],
    pricing: {
      basePrice: 15000,
      originalPrice: 18000,
      discountPercentage: 16.67,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 4,
      isAvailable: true,
      stockCount: 8
    },
    metadata: {
      sku: 'RWC-001',
      hsn: '94036000',
      category: 'furniture',
      subcategory: 'chairs',
      tags: ['handcrafted', 'traditional', 'rajasthani', 'wooden', 'chair'],
      craftsman: 'Master Ravi Kumar',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Teak Wood', 'Natural Finish', 'Brass Fittings'],
      dimensions: '45cm W x 50cm D x 90cm H',
      weight: '12kg',
      careInstructions: ['Dust regularly with soft cloth', 'Avoid direct sunlight', 'Use wood polish monthly'],
      warranty: '2 years against manufacturing defects'
    },
    isNew: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 24
  },
  {
    id: '2',
    name: 'Ornate Brass Mirror Frame',
    description: 'Stunning brass mirror frame with intricate peacock and floral designs. Hand-forged by master craftsmen using traditional techniques passed down through generations.',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop'
    ],
    pricing: {
      basePrice: 8500,
      originalPrice: 12000,
      discountPercentage: 29.17,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 3,
      isAvailable: true,
      stockCount: 12
    },
    metadata: {
      sku: 'BMF-002',
      hsn: '70099100',
      category: 'decor',
      subcategory: 'mirrors',
      tags: ['brass', 'mirror', 'ornate', 'peacock', 'traditional'],
      craftsman: 'Artisan Priya Sharma',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Brass', 'Mirror Glass', 'Antique Finish'],
      dimensions: '60cm W x 4cm D x 80cm H',
      weight: '5kg',
      careInstructions: ['Clean with dry cloth only', 'Avoid chemical cleaners', 'Handle with care'],
      warranty: '1 year against manufacturing defects'
    },
    isNew: false,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 18
  },
  {
    id: '3',
    name: 'Carved Wooden Coffee Table',
    description: 'Elegant carved wooden coffee table featuring traditional Rajasthani patterns. Perfect centerpiece for your living room, combining functionality with artistic beauty.',
    image: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop'
    ],
    pricing: {
      basePrice: 22000,
      originalPrice: 28000,
      discountPercentage: 21.43,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 2,
      isAvailable: true,
      stockCount: 5
    },
    metadata: {
      sku: 'WCT-003',
      hsn: '94036000',
      category: 'furniture',
      subcategory: 'tables',
      tags: ['wooden', 'coffee-table', 'carved', 'sheesham', 'traditional'],
      craftsman: 'Master Gopal Singh',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Sheesham Wood', 'Natural Polish', 'Brass Inlay'],
      dimensions: '120cm W x 60cm D x 45cm H',
      weight: '25kg',
      careInstructions: ['Use coasters for hot items', 'Polish wood monthly', 'Avoid water spills'],
      warranty: '2 years against manufacturing defects'
    },
    isNew: true,
    isFeatured: false,
    rating: 4.7,
    reviewCount: 31
  },
  {
    id: '4',
    name: 'Traditional Ceramic Vase',
    description: 'Beautiful hand-painted ceramic vase showcasing traditional Rajasthani art. Perfect for displaying flowers or as a standalone decorative piece.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&h=800&fit=crop'
    ],
    pricing: {
      basePrice: 4500,
      originalPrice: 6000,
      discountPercentage: 25,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 5,
      isAvailable: true,
      stockCount: 20
    },
    metadata: {
      sku: 'TCV-004',
      hsn: '69139000',
      category: 'decor',
      subcategory: 'vases',
      tags: ['ceramic', 'vase', 'hand-painted', 'traditional', 'decorative'],
      craftsman: 'Artisan Sunita Devi',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Ceramic', 'Hand-painted', 'Glazed Finish'],
      dimensions: '25cm W x 25cm D x 40cm H',
      weight: '2kg',
      careInstructions: ['Handle with care', 'Clean with damp cloth', 'Avoid harsh chemicals'],
      warranty: '6 months against manufacturing defects'
    },
    isNew: false,
    isFeatured: false,
    rating: 4.5,
    reviewCount: 15
  },
  {
    id: '5',
    name: 'Antique Wooden Storage Chest',
    description: 'Magnificent antique-style wooden storage chest with brass fittings and traditional lock mechanism. Ideal for storing linens, documents, or treasured items.',
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop'
    ],
    pricing: {
      basePrice: 35000,
      originalPrice: 42000,
      discountPercentage: 16.67,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 1,
      isAvailable: true,
      stockCount: 3
    },
    metadata: {
      sku: 'WSC-005',
      hsn: '94036000',
      category: 'furniture',
      subcategory: 'storage',
      tags: ['wooden', 'storage', 'chest', 'antique', 'brass'],
      craftsman: 'Master Kailash Chand',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Mango Wood', 'Brass Fittings', 'Antique Finish'],
      dimensions: '100cm W x 50cm D x 40cm H',
      weight: '30kg',
      careInstructions: ['Oil lock mechanism monthly', 'Keep in dry place', 'Polish brass fittings'],
      warranty: '2 years against manufacturing defects'
    },
    isNew: true,
    isFeatured: true,
    rating: 4.6,
    reviewCount: 22
  }
];

// Utility functions for pricing
export const calculateTotalPrice = (basePrice: number, taxRate: number): number => {
  return Math.round(basePrice * (1 + taxRate));
};

export const calculateTaxAmount = (basePrice: number, taxRate: number): number => {
  return Math.round(basePrice * taxRate);
};

export const convertToPaisa = (amount: number): number => {
  return Math.round(amount * 100);
};

export const validatePricing = (product: Product, quantity: number): {
  isValid: boolean;
  errors: string[];
  calculatedPrice?: {
    subtotal: number;
    tax: number;
    total: number;
    totalInPaisa: number;
  };
} => {
  const errors: string[] = [];
  
  if (!product.pricing.isAvailable) {
    errors.push('Product is currently unavailable');
  }
  
  if (quantity < product.pricing.minQuantity) {
    errors.push(`Minimum quantity is ${product.pricing.minQuantity}`);
  }
  
  if (quantity > product.pricing.maxQuantity) {
    errors.push(`Maximum quantity is ${product.pricing.maxQuantity}`);
  }
  
  if (product.pricing.stockCount && quantity > product.pricing.stockCount) {
    errors.push(`Only ${product.pricing.stockCount} items in stock`);
  }
  
  if (product.pricing.basePrice <= 0) {
    errors.push('Invalid product price');
  }
  
  const isValid = errors.length === 0;
  let calculatedPrice;
  
  if (isValid) {
    const subtotal = product.pricing.basePrice * quantity;
    const tax = calculateTaxAmount(subtotal, product.pricing.taxRate);
    const total = subtotal + tax;
    
    calculatedPrice = {
      subtotal,
      tax,
      total,
      totalInPaisa: convertToPaisa(total)
    };
  }
  
  return {
    isValid,
    errors,
    calculatedPrice
  };
};

// Get product by ID with validation
export const getProductById = (id: string): Product | null => {
  return productsData.find(product => product.id === id) || null;
};

// Get products by category
export const getProductsByCategory = (category: string): Product[] => {
  return productsData.filter(product => 
    product.metadata.category.toLowerCase() === category.toLowerCase()
  );
};

// Search products
export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase();
  return productsData.filter(product =>
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    product.metadata.materials.some(material => material.toLowerCase().includes(lowercaseQuery))
  );
};