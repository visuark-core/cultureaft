/**
 * Demo component to showcase order status notifications
 */

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types/order';
import { orderService } from '../services/orderService';
import { notificationService } from '../services/notificationService';

export const OrderStatusDemo: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const allOrders = orderService.getAllOrders();
    setOrders(allOrders);
  };

  const createSampleOrder = async () => {
    setLoading(true);
    try {
      const sampleOrder = await orderService.createOrder(
        'user123',
        [
          {
            id: 'item1',
            productId: 'prod1',
            productName: 'Sample Product',
            quantity: 2,
            price: 29.99,
            imageUrl: 'https://via.placeholder.com/100'
          }
        ],
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA',
          phone: '+1234567890'
        },
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        },
        'Credit Card'
      );

      loadOrders();
      setSelectedOrder(sampleOrder.id);
      
      notificationService.showSuccess(
        'Order Created',
        `Sample order ${sampleOrder.id} created successfully`
      );
    } catch (error) {
      console.error('Error creating sample order:', error);
      notificationService.showError(
        'Error',
        'Failed to create sample order'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      notificationService.showError(
        'Error',
        'Failed to update order status'
      );
    }
  };

  const addTrackingInfo = async (orderId: string) => {
    try {
      const trackingNumber = `TRK${Date.now()}`;
      await orderService.addTrackingInfo(orderId, trackingNumber, 'FedEx');
      loadOrders();
    } catch (error) {
      console.error('Error adding tracking info:', error);
      notificationService.showError(
        'Error',
        'Failed to add tracking information'
      );
    }
  };

  const simulateWorkflow = async (orderId: string) => {
    try {
      await orderService.simulateOrderWorkflow(orderId);
      
      // Refresh orders periodically to show updates
      const refreshInterval = setInterval(() => {
        loadOrders();
      }, 1000);

      // Stop refreshing after 10 seconds
      setTimeout(() => {
        clearInterval(refreshInterval);
      }, 10000);

      notificationService.showInfo(
        'Workflow Started',
        'Order workflow simulation started. Watch for status updates!'
      );
    } catch (error) {
      console.error('Error simulating workflow:', error);
      notificationService.showError(
        'Error',
        'Failed to simulate order workflow'
      );
    }
  };

  const reportIssue = async (orderId: string) => {
    try {
      await orderService.reportOrderIssue(
        orderId,
        'Package was damaged during shipping',
        'We are sending a replacement package at no additional cost',
        'Your replacement will arrive within 2-3 business days'
      );
      
      notificationService.showSuccess(
        'Issue Reported',
        'Issue resolution notification sent to customer'
      );
    } catch (error) {
      console.error('Error reporting issue:', error);
      notificationService.showError(
        'Error',
        'Failed to report order issue'
      );
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAvailableActions = (status: OrderStatus): OrderStatus[] => {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: ['refunded'],
      refunded: []
    };
    return transitions[status] || [];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Order Status Notifications Demo</h2>
          <button
            onClick={createSampleOrder}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Sample Order'}
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No orders found. Create a sample order to test notifications.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`border rounded-lg p-4 ${
                  selectedOrder === order.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order {order.id}</h3>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total: {order.currency} {order.totalAmount.toFixed(2)}
                    </p>
                    {order.trackingNumber && (
                      <p className="text-sm text-gray-600">
                        Tracking: {order.trackingNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Updated: {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {getAvailableActions(order.status).map((action) => (
                    <button
                      key={action}
                      onClick={() => updateOrderStatus(order.id, action)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Mark as {action.charAt(0).toUpperCase() + action.slice(1)}
                    </button>
                  ))}
                  
                  {order.status === 'processing' && !order.trackingNumber && (
                    <button
                      onClick={() => addTrackingInfo(order.id)}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Add Tracking
                    </button>
                  )}
                  
                  {order.status === 'pending' && (
                    <button
                      onClick={() => simulateWorkflow(order.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Simulate Full Workflow
                    </button>
                  )}
                  
                  {['shipped', 'delivered'].includes(order.status) && (
                    <button
                      onClick={() => reportIssue(order.id)}
                      className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      Report Issue
                    </button>
                  )}
                </div>

                <div className="bg-gray-50 rounded-md p-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Order Items:</h4>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span>{item.productName} (x{item.quantity})</span>
                        <span>{order.currency} {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Notes:</strong> {order.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Create a sample order to see order confirmation notifications</li>
            <li>• Use status buttons to trigger different notification types</li>
            <li>• "Simulate Full Workflow" will automatically progress through all statuses</li>
            <li>• Check the notification panel to see in-app notifications</li>
            <li>• Email and SMS notifications are logged to the console (mock implementation)</li>
            <li>• "Report Issue" demonstrates issue resolution notifications</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusDemo;