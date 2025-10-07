import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface OrderData {
  customerId?: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    image?: string;
  }>;
  paymentInfo: {
    method: string;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardName?: string;
    transactionId?: string;
  };
  totalAmount: number;
  taxAmount: number;
  finalAmount: number;
}

export interface OrderResponse {
  success: boolean;
  data: {
    orderId: string;
    status: string;
    estimatedDelivery: string;
  };
  message: string;
}

class OrderService {
  /**
   * Place a new order
   */
  static async placeOrder(orderData: OrderData): Promise<OrderResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders/place`, orderData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 seconds timeout for order placement
      });

      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(error.response.data?.message || 'Failed to place order');
        } else if (error.request) {
          throw new Error('Network error. Please check your connection and try again.');
        }
      }
      
      throw new Error('An unexpected error occurred while placing your order');
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Get user's order history
   */
  static async getUserOrders(userId?: string): Promise<any> {
    try {
      const url = userId 
        ? `${API_BASE_URL}/api/orders/user/${userId}`
        : `${API_BASE_URL}/api/orders/user`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw new Error('Failed to fetch order history');
    }
  }

  /**
   * Update order status (for admin use)
   */
  static async updateOrderStatus(orderId: string, status: string): Promise<any> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, reason?: string): Promise<any> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order');
    }
  }
}

export default OrderService;