import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { logger } from '../utils/logger';

// Define Product interface locally to avoid dependency on old data
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  sku: string;
  stock: number;
  maxQuantity: number;
  taxRate?: number;
}

interface PricingBreakdown {
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
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  sku: string;
  maxQuantity: number;
  stockCount?: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  subtotal: number;
  tax: number;
  itemCount: number;
  pricing: PricingBreakdown | null;
  validationErrors: string[];
  validationWarnings: string[];
  isValid: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'VALIDATE_CART'; payload: { pricing: PricingBreakdown; errors: string[]; warnings: string[] } }
  | { type: 'SET_VALIDATION_ERROR'; payload: string[] };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  canAddItem: (productId: string, additionalQuantity?: number) => boolean;
} | null>(null);

const initialState: CartState = {
  items: [],
  total: 0,
  subtotal: 0,
  tax: 0,
  itemCount: 0,
  pricing: null,
  validationErrors: [],
  validationWarnings: [],
  isValid: true
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);

      let updatedItems: CartItem[];

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          existingItem.maxQuantity,
          existingItem.stockCount || Infinity
        );

        updatedItems = state.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Debug logging to help identify pricing issues
        const extractedPrice = product.pricing?.basePrice || (product as any).price || 0;
        console.log('Adding product to cart:', {
          productId: product.id || (product as any)._id,
          productName: product.name,
          pricingBasePrice: product.pricing?.basePrice,
          productPrice: (product as any).price,
          extractedPrice: extractedPrice,
          fullProduct: product
        });

        // Ensure we're using the correct price - prefer the flat price field for server products
        const finalPrice = (product as any).price || product.pricing?.basePrice || 0;

        const cartItem: CartItem = {
          id: product.id || (product as any)._id,
          name: product.name,
          price: finalPrice,
          image: product.image,
          quantity: Math.min(
            quantity,
            product.pricing?.maxQuantity || (product as any).maxQuantity || 10,
            product.pricing?.stockCount || (product as any).stock || Infinity
          ),
          category: product.metadata?.category || (product as any).category || '',
          sku: product.metadata?.sku || (product as any).sku || '',
          maxQuantity: product.pricing?.maxQuantity || (product as any).maxQuantity || 10,
          stockCount: product.pricing?.stockCount || (product as any).stock || 0
        };
        updatedItems = [...state.items, cartItem];
      }

      const basicTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      // Debug logging for cart totals
      console.log('Cart calculation:', {
        items: updatedItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        basicTotal,
        itemCount
      });

      return {
        ...state,
        items: updatedItems,
        total: basicTotal,
        subtotal: basicTotal, // Set subtotal same as total for basic calculation
        itemCount,
        // Validation will be triggered by useEffect
      };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      const basicTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...state,
        items: updatedItems,
        total: basicTotal,
        subtotal: basicTotal, // Set subtotal same as total for basic calculation
        itemCount,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      const updatedItems = state.items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, Math.min(
            quantity,
            item.maxQuantity,
            item.stockCount || Infinity
          ));
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);

      const basicTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...state,
        items: updatedItems,
        total: basicTotal,
        subtotal: basicTotal, // Set subtotal same as total for basic calculation
        itemCount,
      };
    }

    case 'VALIDATE_CART': {
      const { pricing, errors, warnings } = action.payload;
      return {
        ...state,
        pricing,
        subtotal: pricing.summary.subtotal,
        tax: pricing.summary.totalTax,
        total: pricing.summary.totalAmount,
        validationErrors: errors,
        validationWarnings: warnings,
        isValid: errors.length === 0
      };
    }

    case 'SET_VALIDATION_ERROR': {
      return {
        ...state,
        validationErrors: action.payload,
        isValid: action.payload.length === 0
      };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Simple cart validation without external dependencies
  useEffect(() => {
    if (state.items.length === 0) {
      return;
    }

    try {
      // Calculate basic pricing
      const items = state.items.map(item => {
        const subtotal = item.price * item.quantity;
        const taxRate = 0.18; // Default 18% GST
        const tax = Math.round(subtotal * taxRate);
        const total = subtotal + tax;

        return {
          productId: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal,
          tax,
          total
        };
      });

      const summary = {
        subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
        totalTax: items.reduce((sum, item) => sum + item.tax, 0),
        totalAmount: items.reduce((sum, item) => sum + item.total, 0),
        totalAmountInPaisa: 0,
        currency: 'INR',
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
      };

      summary.totalAmountInPaisa = Math.round(summary.totalAmount * 100);

      const pricing: PricingBreakdown = {
        items,
        summary
      };

      // Basic validation
      const errors: string[] = [];
      const warnings: string[] = [];

      if (summary.totalAmount < 1) {
        errors.push('Order total must be at least ₹1');
      }

      dispatch({
        type: 'VALIDATE_CART',
        payload: {
          pricing,
          errors,
          warnings
        }
      });

      logger.debug('CART_CONTEXT', 'Cart validation completed', {
        isValid: errors.length === 0,
        itemCount: state.items.length,
        totalAmount: summary.totalAmount,
        errors,
        warnings
      });
    } catch (error) {
      logger.error('CART_CONTEXT', 'Cart validation failed', error as Error, {
        itemCount: state.items.length
      });

      dispatch({
        type: 'SET_VALIDATION_ERROR',
        payload: ['Failed to validate cart. Please refresh and try again.']
      });
    }
  }, [state.items]);

  // Helper functions
  const addItem = (product: Product, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemQuantity = (productId: string): number => {
    const item = state.items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const canAddItem = (productId: string, additionalQuantity: number = 1): boolean => {
    // For now, allow adding items - validation will happen in the cart
    const currentQuantity = getItemQuantity(productId);
    const newQuantity = currentQuantity + additionalQuantity;

    // Basic validation - allow up to 10 items per product
    return newQuantity <= 10;
  };

  const contextValue = {
    state,
    dispatch,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    canAddItem
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};