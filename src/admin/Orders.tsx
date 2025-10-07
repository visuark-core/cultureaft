import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Package,
  User,
  Copy,
  ExternalLink,
  Flag,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  ShoppingCart,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Send
} from 'lucide-react';
import { formatCurrency } from '../utils/paymentUtils';
import PaymentService from '../services/paymentService';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface PaymentInfo {
  method: string;
  transactionId?: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

interface OrderFlag {
  _id: string;
  type: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
}

interface CustomerInsights {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  segment: string;
  riskLevel: string;
  daysSinceLastOrder?: number;
}

interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  statusBreakdown: Array<{ _id: string; count: number; revenue: number }>;
  paymentBreakdown: Array<{ _id: string; count: number; revenue: number }>;
  dailyTrend: Array<{ _id: string; orders: number; revenue: number }>;
  topCustomers: Array<{ _id: string; totalOrders: number; totalSpent: number; customerInfo: any }>;
  flaggedOrders: number;
}

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  taxAmount: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentInfo: PaymentInfo;
  shippingAddress: string;
  orderDate: string;
  estimatedDelivery?: string;
  flags?: OrderFlag[];
  customerInsights?: CustomerInsights;
  trackingNumber?: string;
  shippingCarrier?: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch orders and analytics
  useEffect(() => {
    fetchOrders();
    fetchAnalytics();
  }, [currentPage, statusFilter, paymentFilter, searchTerm, dateRange]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // In real app, this would be an API call
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentFilter !== 'all' && { paymentStatus: paymentFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockOrders: Order[] = [
          {
            id: '1',
            orderId: 'ORD-2024-001',
            customerName: 'Rajesh Kumar',
            customerEmail: 'rajesh@example.com',
            customerPhone: '+91 9876543210',
            items: [
              { id: '1', name: 'Handwoven Silk Saree', quantity: 1, price: 15000, image: '/api/placeholder/100/100' },
              { id: '2', name: 'Brass Decorative Plate', quantity: 2, price: 2500, image: '/api/placeholder/100/100' }
            ],
            totalAmount: 20000,
            taxAmount: 3600,
            finalAmount: 23600,
            status: 'confirmed',
            paymentInfo: {
              method: 'razorpay',
              transactionId: 'pay_MkjHGFD123456',
              status: 'paid',
              amount: 23600,
              currency: 'INR',
              createdAt: '2024-01-15T10:30:00Z',
              updatedAt: '2024-01-15T10:32:00Z',
              razorpayOrderId: 'order_MkjHGFD123456',
              razorpayPaymentId: 'pay_MkjHGFD123456'
            },
            shippingAddress: '123 Main Street, Mumbai, Maharashtra 400001',
            orderDate: '2024-01-15T10:30:00Z',
            estimatedDelivery: '2024-01-22T00:00:00Z',
            customerInsights: {
              totalOrders: 5,
              totalSpent: 45230,
              avgOrderValue: 9046,
              segment: 'vip',
              riskLevel: 'low',
              daysSinceLastOrder: 2
            },
            trackingNumber: 'TRK123456789',
            shippingCarrier: 'BlueDart'
          },
          {
            id: '2',
            orderId: 'ORD-2024-002',
            customerName: 'Priya Sharma',
            customerEmail: 'priya@example.com',
            customerPhone: '+91 9876543211',
            items: [
              { id: '3', name: 'Wooden Handicraft Set', quantity: 1, price: 8500, image: '/api/placeholder/100/100' }
            ],
            totalAmount: 8500,
            taxAmount: 1530,
            finalAmount: 10030,
            status: 'processing',
            paymentInfo: {
              method: 'razorpay',
              transactionId: 'pay_NklJHGF789012',
              status: 'paid',
              amount: 10030,
              currency: 'INR',
              createdAt: '2024-01-16T14:20:00Z',
              updatedAt: '2024-01-16T14:22:00Z',
              razorpayOrderId: 'order_NklJHGF789012',
              razorpayPaymentId: 'pay_NklJHGF789012'
            },
            shippingAddress: '456 Park Avenue, Delhi, Delhi 110001',
            orderDate: '2024-01-16T14:20:00Z',
            estimatedDelivery: '2024-01-23T00:00:00Z',
            customerInsights: {
              totalOrders: 3,
              totalSpent: 18500,
              avgOrderValue: 6167,
              segment: 'loyal',
              riskLevel: 'low',
              daysSinceLastOrder: 1
            }
          },
          {
            id: '3',
            orderId: 'ORD-2024-003',
            customerName: 'Amit Patel',
            customerEmail: 'amit@example.com',
            customerPhone: '+91 9876543212',
            items: [
              { id: '4', name: 'Traditional Pottery', quantity: 3, price: 1200, image: '/api/placeholder/100/100' }
            ],
            totalAmount: 3600,
            taxAmount: 648,
            finalAmount: 4248,
            status: 'pending',
            paymentInfo: {
              method: 'razorpay',
              transactionId: undefined,
              status: 'failed',
              amount: 4248,
              currency: 'INR',
              createdAt: '2024-01-17T09:15:00Z',
              updatedAt: '2024-01-17T09:17:00Z',
              razorpayOrderId: 'order_OplKJHG345678'
            },
            shippingAddress: '789 Garden Road, Bangalore, Karnataka 560001',
            orderDate: '2024-01-17T09:15:00Z',
            flags: [
              {
                _id: 'flag1',
                type: 'payment_issue',
                reason: 'Payment failed multiple times',
                severity: 'medium',
                createdAt: '2024-01-17T09:17:00Z',
                resolved: false
              }
            ],
            customerInsights: {
              totalOrders: 1,
              totalSpent: 0,
              avgOrderValue: 0,
              segment: 'new',
              riskLevel: 'medium',
              daysSinceLastOrder: 0
            }
          }
        ];
        
        setOrders(mockOrders);
        setTotalPages(5); // Mock pagination
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Simulate API call for analytics
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockAnalytics: OrderAnalytics = {
        totalOrders: 1247,
        totalRevenue: 2847650,
        avgOrderValue: 2284,
        statusBreakdown: [
          { _id: 'delivered', count: 856, revenue: 1956780 },
          { _id: 'processing', count: 234, revenue: 534890 },
          { _id: 'shipped', count: 89, revenue: 203450 },
          { _id: 'pending', count: 45, revenue: 102890 },
          { _id: 'cancelled', count: 23, revenue: 49640 }
        ],
        paymentBreakdown: [
          { _id: 'paid', count: 1179, revenue: 2695140 },
          { _id: 'pending', count: 45, revenue: 102890 },
          { _id: 'failed', count: 18, revenue: 41230 },
          { _id: 'refunded', count: 5, revenue: 8390 }
        ],
        dailyTrend: [
          { _id: '2024-01-15', orders: 45, revenue: 102890 },
          { _id: '2024-01-16', orders: 52, revenue: 118760 },
          { _id: '2024-01-17', orders: 38, revenue: 86540 }
        ],
        topCustomers: [
          { _id: 'cust1', totalOrders: 12, totalSpent: 45230, customerInfo: { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh@example.com' } },
          { _id: 'cust2', totalOrders: 8, totalSpent: 32100, customerInfo: { firstName: 'Priya', lastName: 'Sharma', email: 'priya@example.com' } }
        ],
        flaggedOrders: 23
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.paymentInfo.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentInfo.status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Bulk actions
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedOrders.length === 0) return;
    
    try {
      // In real app, this would be an API call
      console.log(`Updating ${selectedOrders.length} orders to status: ${status}`);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          selectedOrders.includes(order.id) 
            ? { ...order, status: status as any }
            : order
        )
      );
      
      setSelectedOrders([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  // Flag order
  const flagOrder = async (order: Order, flagType: string, reason: string) => {
    try {
      // In real app, this would be an API call
      console.log(`Flagging order ${order.orderId} with type: ${flagType}, reason: ${reason}`);
      
      const newFlag: OrderFlag = {
        _id: `flag_${Date.now()}`,
        type: flagType,
        reason,
        severity: 'medium',
        createdAt: new Date().toISOString(),
        resolved: false
      };

      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id 
            ? { ...o, flags: [...(o.flags || []), newFlag] }
            : o
        )
      );
    } catch (error) {
      console.error('Failed to flag order:', error);
    }
  };

  // Process refund
  const processRefund = async (order: Order, amount: number, reason: string) => {
    try {
      // In real app, this would be an API call
      console.log(`Processing refund for order ${order.orderId}: ${amount}, reason: ${reason}`);
      
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id 
            ? { 
                ...o, 
                paymentInfo: { ...o.paymentInfo, status: 'refunded' },
                status: 'cancelled'
              }
            : o
        )
      );
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  // Refresh payment status
  const refreshPaymentStatus = async (order: Order) => {
    if (!order.paymentInfo.razorpayOrderId) return;
    
    setRefreshing(true);
    try {
      const paymentStatus = await PaymentService.getPaymentStatus(order.paymentInfo.razorpayOrderId);
      
      // Update order with new payment status
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id 
            ? { 
                ...o, 
                paymentInfo: { 
                  ...o.paymentInfo, 
                  status: paymentStatus.status as any,
                  updatedAt: paymentStatus.updatedAt 
                } 
              }
            : o
        )
      );
    } catch (error) {
      console.error('Failed to refresh payment status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment status icon
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-900">Orders & Payments</h1>
            <p className="text-gray-600 mt-2">Manage orders, track payments, and analyze customer behavior</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                showAnalytics 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button 
              onClick={() => {
                fetchOrders();
                fetchAnalytics();
              }}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="mb-8">
            {analyticsLoading ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            ) : analytics && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-blue-900">{analytics.totalOrders.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+12.5% from last month</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(analytics.totalRevenue)}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+8.2% from last month</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(analytics.avgOrderValue)}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center">
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-600">-2.1% from last month</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Flagged Orders</p>
                        <p className="text-2xl font-bold text-red-900">{analytics.flaggedOrders}</p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Flag className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-yellow-600">Requires attention</span>
                    </div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Breakdown</h3>
                    <div className="space-y-3">
                      {analytics.statusBreakdown.map((status) => (
                        <div key={status._id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(status._id)}`}>
                              {status._id}
                            </span>
                            <span className="ml-3 text-sm text-gray-600">{status.count} orders</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(status.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Status Breakdown</h3>
                    <div className="space-y-3">
                      {analytics.paymentBreakdown.map((payment) => (
                        <div key={payment._id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(payment._id)}`}>
                              {payment._id}
                            </span>
                            <span className="ml-3 text-sm text-gray-600">{payment.count} orders</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(payment.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-900">
                  {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('processing')}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Mark Processing
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('shipped')}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  Mark Shipped
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('delivered')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Mark Delivered
                </button>
                <button
                  onClick={() => setSelectedOrders([])}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders, customers, or transaction IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Order Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Order Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Payment Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                {selectedOrders.length === filteredOrders.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className={`hover:bg-gray-50 ${selectedOrders.includes(order.id) ? 'bg-blue-50' : ''}`}>
                      {/* Checkbox */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Order Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-blue-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.orderId}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.orderDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {order.items.length} item(s)
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              <button
                                onClick={() => window.location.href = `/admin/customers?search=${order.customerEmail}`}
                                className="hover:text-blue-600 hover:underline"
                                title="View customer profile"
                              >
                                {order.customerName}
                              </button>
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customerEmail}
                            </div>
                            <div className="text-xs text-gray-400">
                              {order.customerPhone}
                            </div>
                            {order.customerInsights && (
                              <div className="flex items-center mt-1 space-x-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.customerInsights.segment === 'vip' ? 'bg-purple-100 text-purple-800' :
                                  order.customerInsights.segment === 'loyal' ? 'bg-blue-100 text-blue-800' :
                                  order.customerInsights.segment === 'returning' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.customerInsights.segment}
                                </span>
                                {order.customerInsights.riskLevel !== 'low' && (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.customerInsights.riskLevel === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {order.customerInsights.riskLevel} risk
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Payment Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPaymentStatusIcon(order.paymentInfo.status)}
                          <div className="ml-3">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.paymentInfo.status)}`}>
                                {order.paymentInfo.status}
                              </span>
                            </div>
                            {order.paymentInfo.transactionId && (
                              <div className="text-xs text-gray-500 mt-1 font-mono">
                                {order.paymentInfo.transactionId.substring(0, 16)}...
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {order.paymentInfo.method}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.finalAmount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Tax: {formatCurrency(order.taxAmount)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                            {order.status}
                          </span>
                          {order.flags && order.flags.filter(f => !f.resolved).length > 0 && (
                            <div className="flex items-center">
                              <Flag className="h-3 w-3 text-red-500 mr-1" />
                              <span className="text-xs text-red-600">
                                {order.flags.filter(f => !f.resolved).length} flag{order.flags.filter(f => !f.resolved).length > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                          {order.trackingNumber && (
                            <div className="text-xs text-gray-500">
                              Track: {order.trackingNumber}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Order Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => window.location.href = `/admin/customers?search=${order.customerEmail}`}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Customer Profile"
                          >
                            <User className="h-4 w-4" />
                          </button>
                          {order.paymentInfo.status === 'paid' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => processRefund(order, order.finalAmount, 'Admin refund')}
                              className="text-orange-600 hover:text-orange-900"
                              title="Process Refund"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => flagOrder(order, 'manual_review', 'Flagged for review')}
                            className="text-red-600 hover:text-red-900"
                            title="Flag Order"
                          >
                            <Flag className="h-4 w-4" />
                          </button>
                          {order.paymentInfo.razorpayOrderId && (
                            <button
                              onClick={() => refreshPaymentStatus(order)}
                              disabled={refreshing}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Refresh Payment Status"
                            >
                              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          <div className="relative">
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              title="More Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && !loading && (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No orders found matching your criteria.</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Order Details</h2>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Order Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <div className="flex items-center">
                          <span className="font-mono">{selectedOrder.orderId}</span>
                          <button
                            onClick={() => copyToClipboard(selectedOrder.orderId, 'orderId')}
                            className="ml-2 text-gray-400 hover:text-blue-600"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {copiedField === 'orderId' && (
                            <span className="ml-1 text-green-600 text-xs">Copied!</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span>{new Date(selectedOrder.orderDate).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Payment Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <div className="flex items-center">
                          {getPaymentStatusIcon(selectedOrder.paymentInfo.status)}
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(selectedOrder.paymentInfo.status)}`}>
                            {selectedOrder.paymentInfo.status}
                          </span>
                        </div>
                      </div>
                      {selectedOrder.paymentInfo.transactionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction ID:</span>
                          <div className="flex items-center">
                            <span className="font-mono text-xs">{selectedOrder.paymentInfo.transactionId}</span>
                            <button
                              onClick={() => copyToClipboard(selectedOrder.paymentInfo.transactionId!, 'transactionId')}
                              className="ml-2 text-gray-400 hover:text-blue-600"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            {copiedField === 'transactionId' && (
                              <span className="ml-1 text-green-600 text-xs">Copied!</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="capitalize">{selectedOrder.paymentInfo.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-semibold">{formatCurrency(selectedOrder.paymentInfo.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Customer Details</h3>
                    <button
                      onClick={() => window.location.href = `/admin/customers?search=${selectedOrder.customerEmail}`}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Profile
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{selectedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2">{selectedOrder.customerEmail}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2">{selectedOrder.customerPhone}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2">{selectedOrder.shippingAddress}</span>
                    </div>
                  </div>
                  
                  {/* Customer Insights */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2">Customer Insights</h4>
                    {selectedOrder.customerInsights ? (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded p-3">
                          <div className="text-lg font-bold text-blue-600">{selectedOrder.customerInsights.totalOrders}</div>
                          <div className="text-xs text-gray-600">Total Orders</div>
                        </div>
                        <div className="bg-white rounded p-3">
                          <div className="text-lg font-bold text-green-600">{formatCurrency(selectedOrder.customerInsights.totalSpent)}</div>
                          <div className="text-xs text-gray-600">Total Spent</div>
                        </div>
                        <div className="bg-white rounded p-3">
                          <div className={`text-lg font-bold ${
                            selectedOrder.customerInsights.segment === 'vip' ? 'text-purple-600' :
                            selectedOrder.customerInsights.segment === 'loyal' ? 'text-blue-600' :
                            selectedOrder.customerInsights.segment === 'returning' ? 'text-green-600' :
                            'text-gray-600'
                          }`}>
                            {selectedOrder.customerInsights.segment.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600">Segment</div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded p-3">
                          <div className="text-lg font-bold text-blue-600">5</div>
                          <div className="text-xs text-gray-600">Total Orders</div>
                        </div>
                        <div className="bg-white rounded p-3">
                          <div className="text-lg font-bold text-green-600">₹45,230</div>
                          <div className="text-xs text-gray-600">Total Spent</div>
                        </div>
                        <div className="bg-white rounded p-3">
                          <div className="text-lg font-bold text-purple-600">VIP</div>
                          <div className="text-xs text-gray-600">Segment</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Risk Assessment */}
                    {selectedOrder.customerInsights && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">Risk Level:</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            selectedOrder.customerInsights.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                            selectedOrder.customerInsights.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {selectedOrder.customerInsights.riskLevel}
                          </span>
                        </div>
                        {selectedOrder.customerInsights.daysSinceLastOrder !== undefined && (
                          <div className="text-sm text-gray-600">
                            Last order: {selectedOrder.customerInsights.daysSinceLastOrder} days ago
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex items-center">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg mr-3"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(item.price * item.quantity)}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(item.price)} each</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Payment Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (18% GST):</span>
                      <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-blue-900">{formatCurrency(selectedOrder.finalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  {/* Admin Actions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => {
                        const newStatus = selectedOrder.status === 'pending' ? 'processing' : 
                                        selectedOrder.status === 'processing' ? 'shipped' : 
                                        selectedOrder.status === 'shipped' ? 'delivered' : selectedOrder.status;
                        if (newStatus !== selectedOrder.status) {
                          setOrders(prevOrders => 
                            prevOrders.map(o => 
                              o.id === selectedOrder.id ? { ...o, status: newStatus as any } : o
                            )
                          );
                          setSelectedOrder({ ...selectedOrder, status: newStatus as any });
                        }
                      }}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update Status
                    </button>
                    
                    {selectedOrder.paymentInfo.status === 'paid' && selectedOrder.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          processRefund(selectedOrder, selectedOrder.finalAmount, 'Admin refund from modal');
                          setSelectedOrder({ 
                            ...selectedOrder, 
                            paymentInfo: { ...selectedOrder.paymentInfo, status: 'refunded' },
                            status: 'cancelled'
                          });
                        }}
                        className="flex items-center px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Process Refund
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        flagOrder(selectedOrder, 'manual_review', 'Flagged from order details');
                        const newFlag: OrderFlag = {
                          _id: `flag_${Date.now()}`,
                          type: 'manual_review',
                          reason: 'Flagged from order details',
                          severity: 'medium',
                          createdAt: new Date().toISOString(),
                          resolved: false
                        };
                        setSelectedOrder({ 
                          ...selectedOrder, 
                          flags: [...(selectedOrder.flags || []), newFlag]
                        });
                      }}
                      className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Flag Order
                    </button>
                    
                    <button
                      onClick={() => window.location.href = `/admin/customers?search=${selectedOrder.customerEmail}`}
                      className="flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Customer
                    </button>
                  </div>

                  {/* System Actions */}
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.paymentInfo.razorpayOrderId && (
                      <button
                        onClick={() => refreshPaymentStatus(selectedOrder)}
                        disabled={refreshing}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh Payment
                      </button>
                    )}
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View in Razorpay
                    </button>
                    <button
                      onClick={() => setShowOrderDetails(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
