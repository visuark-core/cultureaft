/**
 * Pricing validation utility for Razorpay payment processing
 */

import { validatePricing, getProductById } from '../data/products';
import { logger } from './logger';
import { handleValidationError } from './errorHandler';

export interface CartItem {
  productId: string;
  quantity: number;
  selectedVariant?: string;
}

export interface PricingBreakdown {
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    tax: number;
    total: number;
  }>;
  summary: {
    subtotal: number;
    totalTax: number;
    totalAmount: number;
    totalAmountInPaisa: number;
    currency: string;
    itemCount: number;
  };
  metadata: {
    hsn: string[];
    categories: string[];
    craftsmen: string[];
    shippingWeight: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  pricing?: PricingBreakdown;
}

/**
 * Validate cart items and calculate comprehensive pricing
 */
export const validateCartPricing = (cartItems: CartItem[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: PricingBreakdown['items'] = [];
  const metadata = {
    hsn: [] as string[],
    categories: [] as string[],
    craftsmen: [] as string[],
    shippingWeight: 0
  };

  logger.debug('PRICING_VALIDATION', 'Starting cart pricing validation', {
    itemCount: cartItems.length,
    items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity }))
  });

  // Validate each cart item
  for (const cartItem of cartItems) {
    const product = getProductById(cartItem.productId);
    
    if (!product) {
      errors.push(`Product with ID ${cartItem.productId} not found`);
      continue;
    }

    // Validate individual product pricing
    const productValidation = validatePricing(product, cartItem.quantity);
    
    if (!productValidation.isValid) {
      errors.push(...productValidation.errors.map(error => 
        `${product.name}: ${error}`
      ));
      continue;
    }

    if (!productValidation.calculatedPrice) {
      errors.push(`Failed to calculate price for ${product.name}`);
      continue;
    }

    // Add to items array
    items.push({
      productId: product.id,
      name: product.name,
      sku: product.metadata.sku,
      quantity: cartItem.quantity,
      unitPrice: product.pricing.basePrice,
      subtotal: productValidation.calculatedPrice.subtotal,
      tax: productValidation.calculatedPrice.tax,
      total: productValidation.calculatedPrice.total
    });

    // Collect metadata
    if (product.metadata.hsn && !metadata.hsn.includes(product.metadata.hsn)) {
      metadata.hsn.push(product.metadata.hsn);
    }
    
    if (!metadata.categories.includes(product.metadata.category)) {
      metadata.categories.push(product.metadata.category);
    }
    
    if (!metadata.craftsmen.includes(product.metadata.craftsman)) {
      metadata.craftsmen.push(product.metadata.craftsman);
    }
    
    metadata.shippingWeight += (product.metadata.shippingWeight || 0) * cartItem.quantity;

    // Add warnings for low stock
    if (product.pricing.stockCount && product.pricing.stockCount <= 5) {
      warnings.push(`${product.name}: Only ${product.pricing.stockCount} items left in stock`);
    }

    // Add warnings for heavy items
    if ((product.metadata.shippingWeight || 0) > 30) {
      warnings.push(`${product.name}: Heavy item - additional shipping charges may apply`);
    }
  }

  // Calculate summary
  const summary = {
    subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
    totalTax: items.reduce((sum, item) => sum + item.tax, 0),
    totalAmount: items.reduce((sum, item) => sum + item.total, 0),
    totalAmountInPaisa: 0,
    currency: 'INR',
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
  };

  summary.totalAmountInPaisa = Math.round(summary.totalAmount * 100);

  // Additional validations
  if (summary.totalAmount < 1) {
    errors.push('Order total must be at least ₹1');
  }

  if (summary.totalAmount > 1000000) {
    errors.push('Order total cannot exceed ₹10,00,000');
  }

  if (metadata.shippingWeight > 100) {
    warnings.push('Order weight exceeds 100kg - special shipping arrangements required');
  }

  const isValid = errors.length === 0;

  const result: ValidationResult = {
    isValid,
    errors,
    warnings
  };

  if (isValid) {
    result.pricing = {
      items,
      summary,
      metadata
    };
  }

  logger.info('PRICING_VALIDATION', 'Cart pricing validation completed', {
    isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
    totalAmount: summary.totalAmount,
    itemCount: summary.itemCount
  });

  if (!isValid) {
    handleValidationError(errors.join('; '), {
      component: 'PricingValidation',
      action: 'validateCartPricing',
      additionalData: {
        cartItems,
        errors,
        warnings
      }
    });
  }

  return result;
};

/**
 * Validate single product pricing
 */
export const validateProductPricing = (productId: string, quantity: number): ValidationResult => {
  return validateCartPricing([{ productId, quantity }]);
};

/**
 * Calculate shipping cost based on weight and location
 */
export const calculateShippingCost = (
  weight: number, 
  pincode: string,
  expedited: boolean = false
): {
  cost: number;
  estimatedDays: number;
  method: string;
} => {
  // Basic shipping calculation - in real app, this would use shipping API
  let baseCost = 0;
  let estimatedDays = 7;
  
  // Weight-based pricing
  if (weight <= 5) {
    baseCost = 100;
  } else if (weight <= 20) {
    baseCost = 200;
  } else if (weight <= 50) {
    baseCost = 500;
  } else {
    baseCost = 1000;
  }

  // Location-based adjustment (simplified)
  const metropolitanPincodes = ['110001', '400001', '560001', '600001', '700001', '500001'];
  const isMetropolitan = metropolitanPincodes.some(metro => pincode.startsWith(metro.substring(0, 3)));
  
  if (!isMetropolitan) {
    baseCost += 100;
    estimatedDays += 2;
  }

  // Expedited shipping
  if (expedited) {
    baseCost *= 2;
    estimatedDays = Math.ceil(estimatedDays / 2);
  }

  return {
    cost: baseCost,
    estimatedDays,
    method: expedited ? 'Express Delivery' : 'Standard Delivery'
  };
};

/**
 * Apply discount codes
 */
export const applyDiscountCode = (
  pricing: PricingBreakdown,
  discountCode: string
): {
  isValid: boolean;
  discountAmount: number;
  discountPercentage: number;
  message: string;
  updatedPricing?: PricingBreakdown;
} => {
  // Mock discount codes - in real app, this would validate against database
  const discountCodes: Record<string, {
    percentage: number;
    minAmount: number;
    maxDiscount: number;
    description: string;
  }> = {
    'WELCOME10': {
      percentage: 10,
      minAmount: 5000,
      maxDiscount: 2000,
      description: 'Welcome discount - 10% off'
    },
    'FESTIVE20': {
      percentage: 20,
      minAmount: 10000,
      maxDiscount: 5000,
      description: 'Festival special - 20% off'
    },
    'CRAFT15': {
      percentage: 15,
      minAmount: 7500,
      maxDiscount: 3000,
      description: 'Craftsman special - 15% off'
    }
  };

  const discount = discountCodes[discountCode.toUpperCase()];
  
  if (!discount) {
    return {
      isValid: false,
      discountAmount: 0,
      discountPercentage: 0,
      message: 'Invalid discount code'
    };
  }

  if (pricing.summary.subtotal < discount.minAmount) {
    return {
      isValid: false,
      discountAmount: 0,
      discountPercentage: 0,
      message: `Minimum order amount of ₹${discount.minAmount.toLocaleString()} required for this discount`
    };
  }

  const discountAmount = Math.min(
    Math.round(pricing.summary.subtotal * discount.percentage / 100),
    discount.maxDiscount
  );

  const updatedSubtotal = pricing.summary.subtotal - discountAmount;
  const updatedTax = Math.round(updatedSubtotal * 0.18); // Recalculate tax on discounted amount
  const updatedTotal = updatedSubtotal + updatedTax;

  const updatedPricing: PricingBreakdown = {
    ...pricing,
    summary: {
      ...pricing.summary,
      subtotal: updatedSubtotal,
      totalTax: updatedTax,
      totalAmount: updatedTotal,
      totalAmountInPaisa: Math.round(updatedTotal * 100)
    }
  };

  return {
    isValid: true,
    discountAmount,
    discountPercentage: discount.percentage,
    message: discount.description,
    updatedPricing
  };
};

/**
 * Format pricing for Razorpay order creation
 */
export const formatForRazorpay = (pricing: PricingBreakdown): {
  amount: number; // in paisa
  currency: string;
  receipt: string;
  notes: Record<string, string>;
} => {
  const receipt = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  return {
    amount: pricing.summary.totalAmountInPaisa,
    currency: pricing.summary.currency,
    receipt,
    notes: {
      item_count: pricing.summary.itemCount.toString(),
      subtotal: pricing.summary.subtotal.toString(),
      tax_amount: pricing.summary.totalTax.toString(),
      total_amount: pricing.summary.totalAmount.toString(),
      categories: pricing.metadata.categories.join(', '),
      craftsmen: pricing.metadata.craftsmen.join(', '),
      shipping_weight: pricing.metadata.shippingWeight.toString(),
      hsn_codes: pricing.metadata.hsn.join(', ')
    }
  };
};

/**
 * Validate pricing before payment processing
 */
export const validateBeforePayment = (
  cartItems: CartItem[],
  expectedAmount: number
): ValidationResult => {
  const validation = validateCartPricing(cartItems);
  
  if (!validation.isValid || !validation.pricing) {
    return validation;
  }

  // Check if calculated amount matches expected amount
  const calculatedAmount = validation.pricing.summary.totalAmount;
  const amountDifference = Math.abs(calculatedAmount - expectedAmount);
  
  if (amountDifference > 1) { // Allow 1 rupee difference for rounding
    validation.errors.push(
      `Amount mismatch: Expected ₹${expectedAmount}, calculated ₹${calculatedAmount}`
    );
    validation.isValid = false;
    
    logger.error('PRICING_VALIDATION', 'Payment amount mismatch detected', new Error('Amount mismatch'), {
      expectedAmount,
      calculatedAmount,
      difference: amountDifference,
      cartItems
    });
  }

  return validation;
};

export default {
  validateCartPricing,
  validateProductPricing,
  calculateShippingCost,
  applyDiscountCode,
  formatForRazorpay,
  validateBeforePayment
};