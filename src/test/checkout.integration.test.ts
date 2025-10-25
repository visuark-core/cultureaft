/**
 * Integration tests for the enhanced checkout system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { OrderService } from '../services/orderService';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Enhanced Checkout System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OrderService.placeOrder', () => {
    it('should place an order with COD payment successfully', async () => {
      const mockOrderData = {
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '9876543210',
          address: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        items: [
          {
            id: 'product-1',
            name: 'Handcrafted Vase',
            price: 1500,
            quantity: 1,
            category: 'Decor',
            image: 'vase.jpg'
          }
        ],
        paymentInfo: {
          method: 'cod',
          transactionId: 'COD_PENDING'
        },
        pricing: {
          subtotal: 1500,
          codCharges: 0,
          taxAmount: 270,
          finalAmount: 1770
        },
        totalAmount: 1500,
        taxAmount: 270,
        finalAmount: 1770
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            orderId: 'ORD-123456',
            status: 'confirmed',
            estimatedDelivery: '2024-01-15',
            totalAmount: 1770,
            customerName: 'John Doe'
          },
          message: 'Order placed successfully'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const orderService = new OrderService();
      const result = await orderService.placeOrder(mockOrderData);

      expect(result.success).toBe(true);
      expect(result.data?.orderId).toBe('ORD-123456');
      expect(result.data?.status).toBe('confirmed');
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/orders/place', mockOrderData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
    });

    it('should place an order with COD payment successfully', async () => {
      const mockOrderData = {
        customerInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '9876543210',
          address: '456 Oak St',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        items: [
          {
            id: 'product-2',
            name: 'Wooden Chair',
            price: 2500,
            quantity: 1,
            category: 'Furniture',
            image: 'chair.jpg'
          }
        ],
        paymentInfo: {
          method: 'cod',
          transactionId: 'COD_PENDING'
        },
        pricing: {
          subtotal: 2500,
          codCharges: 50,
          taxAmount: 459,
          finalAmount: 3009
        },
        totalAmount: 2500,
        taxAmount: 459,
        finalAmount: 3009
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            orderId: 'ORD-789012',
            status: 'confirmed',
            estimatedDelivery: '2024-01-15',
            totalAmount: 3009,
            customerName: 'Jane Smith'
          },
          message: 'Order placed successfully'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const orderService = new OrderService();
      const result = await orderService.placeOrder(mockOrderData);

      expect(result.success).toBe(true);
      expect(result.data?.orderId).toBe('ORD-789012');
      expect(result.data?.status).toBe('confirmed');
    });

    it('should handle order placement errors gracefully', async () => {
      const mockOrderData = {
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '9876543210',
          address: '789 Test St',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        items: [],
        paymentInfo: {
          method: 'cod',
          transactionId: 'COD_PENDING'
        },
        totalAmount: 0,
        taxAmount: 0,
        finalAmount: 0
      };

      const mockError = {
        response: {
          data: {
            success: false,
            message: 'No items in order'
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      const orderService = new OrderService();
      const result = await orderService.placeOrder(mockOrderData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No items in order');
    });
  });

  describe('OrderService.checkInventoryAvailability', () => {
    it('should check inventory availability successfully', async () => {
      const mockItems = [
        { id: 'product-1', name: 'Test Product', quantity: 2 }
      ];

      const mockResponse = {
        data: {
          success: true,
          errors: [],
          warnings: []
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const orderService = new OrderService();
      const result = await orderService.checkInventoryAvailability(mockItems);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/orders/check-inventory', { items: mockItems }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
    });

    it('should handle inventory check errors gracefully', async () => {
      const mockItems = [
        { id: 'product-1', name: 'Test Product', quantity: 10 }
      ];

      const mockResponse = {
        data: {
          success: false,
          errors: ['Insufficient stock for "Test Product"'],
          warnings: []
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const orderService = new OrderService();
      const result = await orderService.checkInventoryAvailability(mockItems);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Insufficient stock for "Test Product"');
    });

    it('should be lenient on network errors for inventory checks', async () => {
      const mockItems = [
        { id: 'product-1', name: 'Test Product', quantity: 1 }
      ];

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const orderService = new OrderService();
      const result = await orderService.checkInventoryAvailability(mockItems);

      // Should still allow order to proceed with warning
      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Unable to verify inventory. Items will be confirmed during order processing.');
    });
  });
});