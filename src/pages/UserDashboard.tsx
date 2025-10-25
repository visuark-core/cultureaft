import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Package, 
  Heart, 
  Settings, 
  ShoppingBag, 
  TrendingUp, 
  Calendar,
  Bell,
  CreditCard,
  MapPin,
  Star,
  Gift,
  Clock,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  wishlistItems: number;
  loyaltyPoints: number;
}

interface RecentOrder {
  id: string;
  product: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  amount: number;
  image: string;
  trackingNumber?: string;
}

interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'system';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile' | 'settings'>('overview');
  const [showBalance, setShowBalance] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
    loyaltyPoints: 0
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  // Load dashboard data
  useEffect(() => {
    // Simulate loading dashboard data
    setStats({
      totalOrders: 12,
      totalSpent: 45600,
      wishlistItems: 8,
      loyaltyPoints: 1250
    });

    setRecentOrders([
      {
        id: 'ORD-2024-001',
        product: 'Royal Carved Throne Chair',
        status: 'delivered',
        date: '2024-12-15',
        amount: 45000,
        image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=200',
        trackingNumber: 'TRK123456789'
      },
      {
        id: 'ORD-2024-002',
        product: 'Decorative Mirror Frame',
        status: 'shipped',
        date: '2024-12-20',
        amount: 8500,
        image: 'https://images.pexels.com/photos/6580226/pexels-photo-6580226.jpeg?auto=compress&cs=tinysrgb&w=200',
        trackingNumber: 'TRK987654321'
      },
      {
        id: 'ORD-2024-003',
        product: 'Traditional Bookshelf',
        status: 'processing',
        date: '2024-12-22',
        amount: 28000,
        image: 'https://images.pexels.com/photos/2177482/pexels-photo-2177482.jpeg?auto=compress&cs=tinysrgb&w=200'
      }
    ]);

    setNotifications([
      {
        id: '1',
        type: 'order',
        title: 'Order Delivered',
        message: 'Your Royal Carved Throne Chair has been delivered successfully.',
        date: '2024-12-15',
        read: false
      },
      {
        id: '2',
        type: 'promotion',
        title: 'Special Offer',
        message: 'Get 20% off on all furniture items. Limited time offer!',
        date: '2024-12-20',
        read: false
      },
      {
        id: '3',
        type: 'system',
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully.',
        date: '2024-12-18',
        read: true
      }
    ]);
  }, []);

  const quickActions = [
    { 
      title: 'My Orders', 
      icon: Package, 
      path: '/user/orders', 
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Track your orders'
    },
    { 
      title: 'Wishlist', 
      icon: Heart, 
      path: '/user/wishlist', 
      color: 'bg-pink-500 hover:bg-pink-600',
      description: `${stats.wishlistItems} saved items`
    },
    { 
      title: 'Profile', 
      icon: User, 
      path: '/user/profile', 
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Manage your profile'
    },
    { 
      title: 'Settings', 
      icon: Settings, 
      path: '/user/settings', 
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Account preferences'
    },
  ];

  const getStatusColor = (status: RecentOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return Package;
      case 'promotion':
        return Gift;
      case 'system':
        return Bell;
      default:
        return Bell;
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name || 'User'}!</h1>
                <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  Member since December 2024
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
              
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {showBalance ? `₹${stats.totalSpent.toLocaleString()}` : '₹••••••'}
                  </p>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+8% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wishlist Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.wishlistItems}</p>
              </div>
              <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => navigate('/user/wishlist')}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                View Wishlist →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
                <p className="text-2xl font-bold text-gray-900">{stats.loyaltyPoints}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">≈ ₹{Math.floor(stats.loyaltyPoints / 10)} value</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, i) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(action.path)}
                      className={`${action.color} text-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-6 w-6" />
                        <div className="text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm opacity-90">{action.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <button
                  onClick={() => navigate('/user/orders')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/user/orders/${order.id}`)}
                  >
                    <img
                      src={order.image}
                      alt={order.product}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{order.product}</h3>
                      <p className="text-sm text-gray-600">Order #{order.id}</p>
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500">{order.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        ₹{order.amount.toLocaleString()}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Track: {order.trackingNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {recentOrders.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                  <button
                    onClick={() => navigate('/products')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Products
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Status</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member Level</span>
                  <span className="text-purple-600 font-medium">Gold</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Next Reward</span>
                  <span className="text-blue-600 font-medium">250 pts</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate('/user/profile')}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Manage Account
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notification.read 
                          ? 'border-gray-100 bg-gray-50' 
                          : 'border-blue-100 bg-blue-50'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className={`h-5 w-5 mt-0.5 ${
                          notification.read ? 'text-gray-400' : 'text-blue-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            notification.read ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-1 ${
                            notification.read ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{notification.date}</p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {notifications.length > 3 && (
                <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View All Notifications
                </button>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/support')}
                  className="w-full text-left p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Customer Support
                </button>
                <button
                  onClick={() => navigate('/user/addresses')}
                  className="w-full text-left p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Manage Addresses
                </button>
                <button
                  onClick={() => navigate('/user/payment-methods')}
                  className="w-full text-left p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Payment Methods
                </button>
                <button
                  onClick={() => navigate('/user/preferences')}
                  className="w-full text-left p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
