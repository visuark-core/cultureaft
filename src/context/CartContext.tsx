import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Product, getProductById } from '../data/products';
import { validateCartPricing, PricingBreakdown } from '../utils/pricingValidation';
import { logger } from '../utils/logger';

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
        const cartItem: CartItem = {
          id: product.id,
          name: product.name,
          price: product.pricing.basePrice,
          image: product.image,
          quantity: Math.min(quantity, product.pricing.maxQuantity, product.pricing.stockCount || Infinity),
          category: product.metadata.category,
          sku: product.metadata.sku,
          maxQuantity: product.pricing.maxQuantity,
          stockCount: product.pricing.stockCount
        };
        updatedItems = [...state.items, cartItem];
      }

      const basicTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...state,
        items: updatedItems,
        total: basicTotal,
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

  // Validate cart whenever items change
  useEffect(() => {
    if (state.items.length === 0) {
      return;
    }

    const cartItems = state.items.map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    try {
      const validation = validateCartPricing(cartItems);
      
      if (validation.pricing) {
        dispatch({
          type: 'VALIDATE_CART',
          payload: {
            pricing: validation.pricing,
            errors: validation.errors,
            warnings: validation.warnings
          }
        });
      } else {
        dispatch({
          type: 'SET_VALIDATION_ERROR',
          payload: validation.errors
        });
      }

      logger.debug('CART_CONTEXT', 'Cart validation completed', {
        isValid: validation.isValid,
        itemCount: state.items.length,
        totalAmount: validation.pricing?.summary.totalAmount || 0,
        errors: validation.errors,
        warnings: validation.warnings
      });
    } catch (error) {
      logger.error('CART_CONTEXT', 'Cart validation failed', error as Error, {
        cartItems,
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
    const product = getProductById(productId);
    if (!product || !product.pricing.isAvailable) return false;

    const currentQuantity = getItemQuantity(productId);
    const newQuantity = currentQuantity + additionalQuantity;

    return newQuantity <= product.pricing.maxQuantity && 
           (product.pricing.stockCount ? newQuantity <= product.pricing.stockCount : true);
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