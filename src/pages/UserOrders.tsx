import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, Clock, ChevronRight, Loader, AlertCircle } from 'lucide-react';
import OrderService from '../services/orderService';

interface Order {
  _id: string;
  orderId: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  totalAmount: number;
  status: string;
  orderDate: string;
  estimatedDelivery?: string;
}

const UserOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // For demo purposes, we'll try to load orders by email
      // In a real app, you'd get the user ID from authentication context
      const userEmail = localStorage.getItem('userEmail') || 'demo@example.com';

      const response = await OrderService.getUserOrders();
      if (response.success) {
        setOrders(response.data);
      } else {
        setError(response.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin h-8 w-8 text-blue-600 mr-3" />
            <span className="text-gray-600">Loading your orders...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Orders</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to see your orders here!</p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Order List */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Order Icon */}
                    <div className="w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-12 w-12 text-blue-600" />
                    </div>

                    {/* Order Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            Order #{order.orderId}
                          </h3>
                          <p className="text-gray-600">
                            {order.products.length > 1
                              ? `${order.products[0].name} and ${order.products.length - 1} more items`
                              : order.products[0]?.name || 'Order items'
                            }
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(order.orderDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          {order.products.reduce((sum, product) => sum + product.quantity, 0)} items
                        </div>
                        {order.estimatedDelivery && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="font-semibold text-blue-900">
                          Total: ₹{order.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <Link
                          to={`/order/${order.orderId}`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrders;
