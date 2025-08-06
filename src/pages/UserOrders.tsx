import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, Clock, ChevronRight } from 'lucide-react';

interface Order {
  id: string;
  product: string;
  status: string;
  date: string;
  total: number;
  items: number;
  image: string;
}

const UserOrders = () => {
  // Mock orders data - in a real app, this would come from an API
  const orders: Order[] = [
    {
      id: '1234',
      product: 'Hand Carved Chair and 2 other items',
      status: 'Delivered',
      date: '2025-08-01',
      total: 35000,
      items: 3,
      image: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg'
    },
    {
      id: '1235',
      product: 'Brass Inlay Coffee Table',
      status: 'Processing',
      date: '2025-07-28',
      total: 22000,
      items: 1,
      image: 'https://images.pexels.com/photos/2762247/pexels-photo-2762247.jpeg'
    },
    {
      id: '1236',
      product: 'Traditional Wall Mirror',
      status: 'Shipped',
      date: '2025-07-25',
      total: 18500,
      items: 1,
      image: 'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg'
    }
  ];

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

        {/* Order List */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Order Image */}
                  <img
                    src={order.image}
                    alt={order.product}
                    className="w-24 h-24 object-cover rounded-lg shadow"
                  />

                  {/* Order Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          Order #{order.id}
                        </h3>
                        <p className="text-gray-600">{order.product}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(order.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        {order.items} {order.items === 1 ? 'item' : 'items'}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Estimated Delivery: {new Date(order.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="font-semibold text-blue-900">
                        Total: ₹{order.total.toLocaleString()}
                      </div>
                      <Link
                        to={`/order/${order.id}`}
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
      </div>
    </div>
  );
};

export default UserOrders;
