// Product pricing and metadata for Razorpay integration
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
    name: 'Royal Carved Throne Chair',
    description: 'Intricately carved mahogany throne chair with traditional Rajasthani motifs and gold leaf detailing. Features royal peacock designs and comfortable velvet upholstery.',
    image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricing: {
      basePrice: 45000,
      originalPrice: 55000,
      discountPercentage: 18.18,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 2,
      isAvailable: true,
      stockCount: 5
    },
    metadata: {
      sku: 'RCT-001',
      hsn: '94036000',
      category: 'Furniture',
      subcategory: 'Chairs',
      tags: ['royal', 'carved', 'throne', 'traditional', 'mahogany', 'gold-leaf'],
      craftsman: 'Master Ravi Sharma',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Mahogany Wood', 'Gold Leaf', 'Velvet'],
      dimensions: '120cm H x 70cm W x 65cm D',
      weight: '35kg',
      shippingWeight: 40,
      shippingDimensions: { length: 130, width: 80, height: 75 },
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
    name: 'Ornate Storage Cabinet',
    description: 'Hand-painted storage cabinet with brass fittings and mirror work. Features multiple compartments and traditional Marwari patterns.',
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricing: {
      basePrice: 32000,
      originalPrice: 40000,
      discountPercentage: 20,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 1,
      isAvailable: true,
      stockCount: 3
    },
    metadata: {
      sku: 'OSC-002',
      hsn: '94036000',
      category: 'Furniture',
      subcategory: 'Storage',
      tags: ['storage', 'cabinet', 'painted', 'brass', 'mirror-work', 'marwari'],
      craftsman: 'Artisan Mukesh Joshi',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Sheesham Wood', 'Brass', 'Mirror Work'],
      dimensions: '180cm H x 90cm W x 40cm D',
      weight: '45kg',
      shippingWeight: 50,
      shippingDimensions: { length: 190, width: 100, height: 50 },
      careInstructions: ['Clean mirrors with soft cloth', 'Polish brass fittings monthly', 'Avoid moisture'],
      warranty: '1 year against manufacturing defects'
    },
    isNew: false,
    isFeatured: true,
    rating: 4.6,
    reviewCount: 18
  },
  {
    id: '3',
    name: 'Decorative Mirror Frame',
    description: 'Elaborate mirror frame with traditional peacock and floral designs. Hand-carved from mango wood with antique gold finish.',
    image: 'https://images.pexels.com/photos/6580226/pexels-photo-6580226.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricing: {
      basePrice: 8500,
      originalPrice: 12000,
      discountPercentage: 29.17,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 5,
      isAvailable: true,
      stockCount: 12
    },
    metadata: {
      sku: 'DMF-003',
      hsn: '70099100',
      category: 'Decor',
      subcategory: 'Mirrors',
      tags: ['mirror', 'frame', 'peacock', 'floral', 'carved', 'antique-gold'],
      craftsman: 'Master Priya Devi',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Mango Wood', 'Antique Gold Finish'],
      dimensions: '90cm H x 60cm W x 5cm D',
      weight: '8kg',
      shippingWeight: 10,
      shippingDimensions: { length: 100, width: 70, height: 15 },
      careInstructions: ['Clean with dry cloth only', 'Avoid chemical cleaners', 'Handle with care'],
      warranty: '6 months against manufacturing defects'
    },
    isNew: true,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 31
  },
  {
    id: '4',
    name: 'Wooden Coffee Table',
    description: 'Round coffee table with intricate lattice work and brass inlays. Perfect centerpiece for traditional or contemporary settings.',
    image: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricing: {
      basePrice: 18000,
      originalPrice: 22000,
      discountPercentage: 18.18,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 2,
      isAvailable: true,
      stockCount: 7
    },
    metadata: {
      sku: 'WCT-004',
      hsn: '94036000',
      category: 'Furniture',
      subcategory: 'Tables',
      tags: ['coffee-table', 'round', 'lattice', 'brass-inlay', 'teak'],
      craftsman: 'Craftsman Gopal Singh',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Teak Wood', 'Brass Inlays'],
      dimensions: '45cm H x 80cm Diameter',
      weight: '20kg',
      shippingWeight: 25,
      shippingDimensions: { length: 90, width: 90, height: 55 },
      careInstructions: ['Use coasters for hot items', 'Polish wood monthly', 'Clean brass with soft cloth'],
      warranty: '1 year against manufacturing defects'
    },
    isNew: false,
    isFeatured: true,
    rating: 4.5,
    reviewCount: 15
  },
  {
    id: '5',
    name: 'Traditional Bookshelf',
    description: 'Five-tier bookshelf with carved panels and adjustable shelves. Features traditional Rajasthani geometric patterns.',
    image: 'https://images.pexels.com/photos/2177482/pexels-photo-2177482.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricing: {
      basePrice: 28000,
      originalPrice: 35000,
      discountPercentage: 20,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 1,
      isAvailable: true,
      stockCount: 4
    },
    metadata: {
      sku: 'TBS-005',
      hsn: '94036000',
      category: 'Furniture',
      subcategory: 'Storage',
      tags: ['bookshelf', 'carved', 'adjustable', 'geometric', 'rosewood'],
      craftsman: 'Master Lakhan Singh',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Rosewood', 'Brass Hardware'],
      dimensions: '200cm H x 100cm W x 35cm D',
      weight: '40kg',
      shippingWeight: 45,
      shippingDimensions: { length: 210, width: 110, height: 45 },
      careInstructions: ['Dust regularly', 'Check shelf adjustments periodically', 'Avoid overloading'],
      warranty: '2 years against manufacturing defects'
    },
    isNew: true,
    isFeatured: false,
    rating: 4.7,
    reviewCount: 12
  },
  {
    id: '6',
    name: 'Carved Wall Art Panel',
    description: 'Hand-carved wooden wall art depicting scenes from Rajasthani folklore. Intricate details with natural wood finish.',
    image: 'https://images.pexels.com/photos/6492400/pexels-photo-6492400.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricing: {
      basePrice: 12000,
      originalPrice: 15000,
      discountPercentage: 20,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 3,
      isAvailable: true,
      stockCount: 8
    },
    metadata: {
      sku: 'WAP-006',
      hsn: '44209900',
      category: 'Decor',
      subcategory: 'Wall Art',
      tags: ['wall-art', 'carved', 'folklore', 'rajasthani', 'natural-finish'],
      craftsman: 'Artisan Devi Lal',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Mango Wood', 'Natural Finish'],
      dimensions: '100cm H x 150cm W x 8cm D',
      weight: '15kg',
      shippingWeight: 18,
      shippingDimensions: { length: 160, width: 110, height: 18 },
      careInstructions: ['Dust with soft brush', 'Avoid direct sunlight', 'Handle mounting carefully'],
      warranty: '6 months against manufacturing defects'
    },
    isNew: false,
    isFeatured: false,
    rating: 4.4,
    reviewCount: 9
  },
  {
    id: '7',
    name: 'Vintage Trunk Storage',
    description: 'Antique-style storage trunk with brass corners and traditional lock. Perfect for storing linens or as a coffee table.',
    image: 'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricing: {
      basePrice: 22000,
      originalPrice: 28000,
      discountPercentage: 21.43,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 2,
      isAvailable: true,
      stockCount: 6
    },
    metadata: {
      sku: 'VTS-007',
      hsn: '94036000',
      category: 'Furniture',
      subcategory: 'Storage',
      tags: ['trunk', 'vintage', 'storage', 'brass', 'antique', 'lock'],
      craftsman: 'Master Kailash Chand',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Aged Wood', 'Brass Fittings'],
      dimensions: '50cm H x 120cm W x 60cm D',
      weight: '30kg',
      shippingWeight: 35,
      shippingDimensions: { length: 130, width: 70, height: 60 },
      careInstructions: ['Oil lock mechanism monthly', 'Keep in dry place', 'Polish brass fittings'],
      warranty: '1 year against manufacturing defects'
    },
    isNew: true,
    isFeatured: false,
    rating: 4.6,
    reviewCount: 14
  },
  {
    id: '8',
    name: 'Decorative Table Lamp',
    description: 'Traditional table lamp with hand-painted ceramic base and handwoven fabric shade. Creates warm ambient lighting.',
    image: 'https://images.pexels.com/photos/1910236/pexels-photo-1910236.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricing: {
      basePrice: 6500,
      originalPrice: 8500,
      discountPercentage: 23.53,
      taxRate: 0.18,
      currency: 'INR',
      minQuantity: 1,
      maxQuantity: 10,
      isAvailable: true,
      stockCount: 20
    },
    metadata: {
      sku: 'DTL-008',
      hsn: '94051000',
      category: 'Decor',
      subcategory: 'Lighting',
      tags: ['lamp', 'table-lamp', 'ceramic', 'handwoven', 'ambient'],
      craftsman: 'Artisan Sunita Devi',
      origin: 'Jodhpur, Rajasthan',
      materials: ['Ceramic', 'Handwoven Fabric'],
      dimensions: '45cm H x 25cm Diameter',
      weight: '3kg',
      shippingWeight: 5,
      shippingDimensions: { length: 35, width: 35, height: 55 },
      careInstructions: ['Use LED bulbs only', 'Clean shade with vacuum', 'Handle ceramic base carefully'],
      warranty: '6 months against manufacturing defects'
    },
    isNew: false,
    isFeatured: false,
    rating: 4.3,
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