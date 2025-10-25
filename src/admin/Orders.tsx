import { useState, useEffect, useCallback, useRef } from 'react';
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
  Package,
  User,
  Edit,
  History,
  ChevronDown,
  ChevronUp,
  Settings,
  Bell,
  Activity,
  Tag,
  MapPin,
  Truck,
  Users
} from 'lucide-react';
import { formatCurrency } from '../utils/paymentUtils';
import apiClient from '../services/apiClient';
import { Order } from '../types/order';
import { toast } from 'react-toastify';
import OrderDetailsModal from './components/OrderDetailsModal';
import OrderEditModal from './components/OrderEditModal';
import BulkUpdateModal from './components/BulkUpdateModal';
import OrderTimelineModal from './components/OrderTimelineModal';
import DeliveryTrackingModal from './components/DeliveryTrackingModal';
import DeliveryAgentAssignmentModal from './components/DeliveryAgentAssignmentModal';

// Extend the Order interface to include pagination metadata
interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const Orders = () => {
  // Core state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({ from: '', to: '' });
  const [amountRangeFilter, setAmountRangeFilter] = useState({ min: '', max: '' });
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDeliveryTracking, setShowDeliveryTracking] = useState(false);
  const [showAgentAssignment, setShowAgentAssignment] = useState(false);
  const [selectedOrdersForAssignment, setSelectedOrdersForAssignment] = useState<Order[]>([]);

  // Edit and bulk operations
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  // Removed unused bulk update state variables

  // UI state
  // Removed unused copiedField state
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Real-time updates
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const wsRef = useRef<WebSocket | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);


  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    // Temporarily disable WebSocket for Google Sheets integration
    console.log('WebSocket disabled - using polling for updates');
    return;

    if (!realTimeEnabled) return;

    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/admin/orders`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for real-time order updates');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ORDER_UPDATE') {
            setOrders(prevOrders =>
              prevOrders.map(order =>
                order._id === data.order._id ? { ...order, ...data.order } : order
              )
            );
            setLastUpdated(new Date());
          } else if (data.type === 'NEW_ORDER') {
            setOrders(prevOrders => [data.order, ...prevOrders]);
            setTotalOrders(prev => prev + 1);
            setLastUpdated(new Date());
            toast.info(`New order received: ${data.order.orderId}`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [realTimeEnabled]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: ordersPerPage,
        sortBy,
        sortOrder,
        status: statusFilter === 'all' ? undefined : statusFilter,
        paymentStatus: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
        paymentMethod: paymentMethodFilter === 'all' ? undefined : paymentMethodFilter,
        search: searchTerm || undefined,
        city: cityFilter || undefined,
        state: stateFilter || undefined,
        orderDateFrom: dateRangeFilter.from || undefined,
        orderDateTo: dateRangeFilter.to || undefined,
        minAmount: amountRangeFilter.min || undefined,
        maxAmount: amountRangeFilter.max || undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await apiClient.get<OrdersResponse>('/api/admin/orders', { params });
      const data = response.data as OrdersResponse;
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
      setCurrentPage(data.page || 1);
      setOrdersPerPage(data.limit || 10);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
      setOrders([]); // Ensure orders is always an array
      setTotalOrders(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    ordersPerPage,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    searchTerm,
    cityFilter,
    stateFilter,
    dateRangeFilter,
    amountRangeFilter,
    sortBy,
    sortOrder
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (realTimeEnabled) {
      connectWebSocket();

      // Set up periodic refresh as fallback
      refreshIntervalRef.current = setInterval(() => {
        fetchOrders();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [realTimeEnabled, connectWebSocket, fetchOrders]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await apiClient.get<Order>(`/api/admin/orders/${orderId}`);
      setSelectedOrder(response.data as Order);
      setShowOrderDetails(true);
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch order details');
    }
  };

  // Filter orders is now handled by the backend API
  // const filteredOrders = orders.filter(order => {
  //   const matchesSearch =
  //     order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     order.payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

  //   const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
  //   const matchesPayment = paymentStatusFilter === 'all' || order.payment.status === paymentStatusFilter;

  //   return matchesSearch && matchesStatus && matchesPayment;
  // });

  // Removed unused copyToClipboard function

  // Refresh payment status - COD only
  const refreshPaymentStatus = async (order: Order) => {
    setRefreshing(true);
    try {
      // For COD orders, just refresh the order status
      const response = await apiClient.put(`/api/admin/orders/${order._id}/payment`, {
        paymentStatus: 'pending'
      });

      const data = response.data as any;
      if (data.success) {
        toast.success('Payment status refreshed successfully!');
        fetchOrders(); // Re-fetch orders to get updated status
      } else {
        toast.error(data.message || 'Failed to refresh payment status');
      }
    } catch (error: any) {
      console.error('Failed to refresh payment status:', error);
      toast.error(error.response?.data?.message || 'Failed to refresh payment status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, notes: string = '') => {
    try {
      const response = await apiClient.put(`/api/admin/orders/${orderId}/status`, { status, notes });
      const data = response.data as any;
      if (data.success) {
        toast.success(`Order ${orderId} status updated to ${status}`);
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          fetchOrderDetails(orderId); // Refresh details if modal is open
        }
      } else {
        toast.error(data.message || 'Failed to update order status');
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string = 'Admin cancellation') => {
    if (!window.confirm(`Are you sure you want to cancel order ${orderId}?`)) return;
    try {
      const response = await apiClient.post(`/api/admin/orders/${orderId}/cancel`, { reason });
      const data = response.data as any;
      if (data.success) {
        toast.success(`Order ${orderId} cancelled successfully`);
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          fetchOrderDetails(orderId);
        }
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleEditOrder = (order: Order) => {
    // Only allow editing if order is not shipped or delivered
    if (['shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled'].includes(order.status)) {
      toast.error('Cannot edit order after it has been shipped or completed');
      return;
    }

    setEditingOrder(order);
    setEditFormData({
      items: order.items.map(item => ({
        productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
        variant: item.variant || {},
        subtotal: item.subtotal,
        discount: item.discount || 0,
        tax: item.tax || 0
      })),
      shipping: {
        address: { ...order.shipping.address },
        method: order.shipping.method || 'standard',
        estimatedDelivery: order.shipping.estimatedDelivery ?
          new Date(order.shipping.estimatedDelivery).toISOString().split('T')[0] : '',
        shippingCost: order.shipping.shippingCost || 0
      },
      notes: order.notes || ''
    });
    setShowEditModal(true);
  };

  // Removed unused handleEditFormChange function

  // Removed unused addOrderItem function

  // Removed unused removeOrderItem function

  const submitEditOrder = async () => {
    if (!editingOrder) return;
    try {
      const response = await apiClient.put(`/api/admin/orders/${editingOrder._id}/edit`, editFormData);
      const data = response.data as any;
      if (data.success) {
        toast.success('Order updated successfully');
        setShowEditModal(false);
        fetchOrders();
        if (selectedOrder && selectedOrder._id === editingOrder._id) {
          fetchOrderDetails(editingOrder._id);
        }
      } else {
        toast.error(data.message || 'Failed to update order');
      }
    } catch (error: any) {
      console.error('Error editing order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order');
    }
  };

  // Removed unused handleBulkUpdate function

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedOrderIds.length === 0) {
      toast.warn('No orders selected.');
      return;
    }

    const confirmMessage = `Are you sure you want to update ${selectedOrderIds.length} orders to "${status}"?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await apiClient.post('/api/admin/orders/bulk-update', {
        orderIds: selectedOrderIds,
        updateData: { status }
      });

      const data = response.data as any;
      if (data.success) {
        toast.success(`${data.data.modifiedCount} orders updated to ${status}`);
        setSelectedOrderIds([]);
        fetchOrders();
      } else {
        toast.error(data.message || 'Failed to perform bulk update');
      }
    } catch (error: any) {
      console.error('Error performing bulk status update:', error);
      toast.error(error.response?.data?.message || 'Failed to perform bulk update');
    }
  };

  const handleExportOrders = async () => {
    try {
      const params = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        paymentStatus: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
        search: searchTerm || undefined,
      };
      const response = await apiClient.get('/api/admin/orders/export/csv', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Orders exported successfully!');
    } catch (error: any) {
      console.error('Error exporting orders:', error);
      toast.error(error.response?.data?.message || 'Failed to export orders');
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'confirmed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
      case 'returned':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment status icon
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'refunded':
      case 'partially_refunded':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleCheckboxChange = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && Array.isArray(orders)) {
      setSelectedOrderIds(orders.map(order => order._id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setPaymentMethodFilter('all');
    setDateRangeFilter({ from: '', to: '' });
    setAmountRangeFilter({ min: '', max: '' });
    setCityFilter('');
    setStateFilter('');
    setCurrentPage(1);
  };

  const applyQuickFilter = (filterType: string) => {
    switch (filterType) {
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        setDateRangeFilter({ from: today, to: today });
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        setDateRangeFilter({
          from: weekAgo.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        });
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        setDateRangeFilter({
          from: monthAgo.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        });
        break;
      case 'pending_payment':
        setPaymentStatusFilter('pending');
        break;
      case 'failed_payment':
        setPaymentStatusFilter('failed');
        break;
      case 'high_value':
        setAmountRangeFilter({ min: '5000', max: '' });
        break;
      default:
        break;
    }
    setCurrentPage(1);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-900">Order Management Dashboard</h1>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <Activity className="h-4 w-4 mr-2" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <div className={`ml-4 flex items-center ${realTimeEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${realTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                Real-time {realTimeEnabled ? 'ON' : 'OFF'}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${realTimeEnabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
            >
              <Bell className="h-4 w-4 mr-2" />
              Real-time
            </button>
            <button
              onClick={handleExportOrders}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => fetchOrders()}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
            <button
              onClick={() => applyQuickFilter('today')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Today's Orders
            </button>
            <button
              onClick={() => applyQuickFilter('week')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => applyQuickFilter('pending_payment')}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
            >
              Pending Payment
            </button>
            <button
              onClick={() => applyQuickFilter('high_value')}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              High Value (₹5000+)
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Main Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders, customers, or transaction IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchOrders();
                  }
                }}
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
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
              </select>
            </div>

            {/* Orders Per Page */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={ordersPerPage}
                onChange={(e) => setOrdersPerPage(parseInt(e.target.value))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value={10}>10 Orders per page</option>
                <option value={20}>20 Orders per page</option>
                <option value={50}>50 Orders per page</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Settings className="h-4 w-4 mr-1" />
              Advanced Filters
              {showAdvancedFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </button>

            {selectedOrderIds.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('confirmed')}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Confirm ({selectedOrderIds.length})
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('processing')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Process ({selectedOrderIds.length})
                </button>
                <button
                  onClick={() => setShowBulkUpdateModal(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Bulk Update ({selectedOrderIds.length})
                </button>
                <button
                  onClick={() => {
                    if (!Array.isArray(orders)) {
                      toast.warn('No orders available');
                      return;
                    }
                    const ordersToAssign = orders.filter(order =>
                      selectedOrderIds.includes(order._id) &&
                      (order.status === 'confirmed' || order.status === 'processing') &&
                      !order.delivery?.assignedAgent
                    );
                    if (ordersToAssign.length === 0) {
                      toast.warn('No eligible orders selected for agent assignment');
                      return;
                    }
                    setSelectedOrdersForAssignment(ordersToAssign);
                    setShowAgentAssignment(true);
                  }}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assign Agents ({selectedOrderIds.length})
                </button>
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Payment Method Filter */}
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="all">All Payment Methods</option>

                    <option value="cod">Cash on Delivery</option>
                    <option value="wallet">Wallet</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateRangeFilter.from}
                    onChange={(e) => setDateRangeFilter(prev => ({ ...prev, from: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="From Date"
                  />
                  <input
                    type="date"
                    value={dateRangeFilter.to}
                    onChange={(e) => setDateRangeFilter(prev => ({ ...prev, to: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="To Date"
                  />
                </div>

                {/* Amount Range */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={amountRangeFilter.min}
                    onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, min: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Min Amount"
                  />
                  <input
                    type="number"
                    value={amountRangeFilter.max}
                    onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, max: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Max Amount"
                  />
                </div>

                {/* Location Filters */}
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by City"
                />
                <input
                  type="text"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by State"
                />
              </div>
            </div>
          )}
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
                        className="form-checkbox h-4 w-4 text-blue-600"
                        onChange={handleSelectAllChange}
                        checked={Array.isArray(orders) && selectedOrderIds.length === orders.length && orders.length > 0}
                      />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('orderId')}
                    >
                      <div className="flex items-center">
                        Order Details
                        {sortBy === 'orderId' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('customer.name')}
                    >
                      <div className="flex items-center">
                        Customer
                        {sortBy === 'customer.name' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('payment.status')}
                    >
                      <div className="flex items-center">
                        Payment Info
                        {sortBy === 'payment.status' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('pricing.total')}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortBy === 'pricing.total' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortBy === 'status' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(orders) ? orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-blue-600"
                          checked={selectedOrderIds.includes(order._id)}
                          onChange={() => handleCheckboxChange(order._id)}
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
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {order.items?.length || 0} item(s)
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
                              {order.customer?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customer?.email || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {order.customer?.phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Payment Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPaymentStatusIcon(order.payment?.status || 'pending')}
                          <div className="ml-3">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.payment?.status || 'pending')}`}>
                                {order.payment?.status || 'pending'}
                              </span>
                            </div>
                            {order.payment?.transactionId && (
                              <div className="text-xs text-gray-500 mt-1 font-mono">
                                {order.payment.transactionId.substring(0, 16)}...
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {order.payment?.method || 'N/A'}
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
                              {formatCurrency(order.pricing?.total || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Tax: {formatCurrency(order.pricing?.taxes || 0)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => fetchOrderDetails(order._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit Order"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel Order"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => refreshPaymentStatus(order)}
                            disabled={refreshing}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Refresh Payment Status"
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowTimelineModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Timeline"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {/* Delivery Tracking Button */}
                          {(order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'out_for_delivery') && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDeliveryTracking(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Track Delivery"
                            >
                              <MapPin className="h-4 w-4" />
                            </button>
                          )}
                          {/* Assign Delivery Agent Button */}
                          {(order.status === 'confirmed' || order.status === 'processing') && !order.delivery?.assignedAgent && (
                            <button
                              onClick={() => {
                                setSelectedOrdersForAssignment([order]);
                                setShowAgentAssignment(true);
                              }}
                              className="text-orange-600 hover:text-orange-900"
                              title="Assign Delivery Agent"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : null}
                </tbody>
              </table>

              {(!Array.isArray(orders) || orders.length === 0) && !loading && (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No orders found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalOrders > ordersPerPage && (
          <div className="flex justify-center mt-8">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.ceil(totalOrders / ordersPerPage) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === page ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalOrders / ordersPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(totalOrders / ordersPerPage)}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Enhanced Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            isOpen={showOrderDetails}
            onClose={() => setShowOrderDetails(false)}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePaymentStatus={async (orderId: string, paymentStatus: string, notes?: string) => {
              try {
                const response = await apiClient.put(`/api/admin/orders/${orderId}/payment`, {
                  paymentStatus,
                  notes
                });
                const data = response.data as any;
                if (data.success) {
                  toast.success('Payment status updated successfully');
                  fetchOrders();
                  if (selectedOrder && selectedOrder._id === orderId) {
                    fetchOrderDetails(orderId);
                  }
                } else {
                  toast.error(data.message || 'Failed to update payment status');
                }
              } catch (error: any) {
                console.error('Error updating payment status:', error);
                toast.error(error.response?.data?.message || 'Failed to update payment status');
              }
            }}
          />
        )}

        {/* Enhanced Order Edit Modal */}
        {editingOrder && (
          <OrderEditModal
            order={editingOrder}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingOrder(null);
            }}
            onSave={submitEditOrder}
          />
        )}

        {/* Enhanced Bulk Update Modal */}
        <BulkUpdateModal
          isOpen={showBulkUpdateModal}
          onClose={() => setShowBulkUpdateModal(false)}
          selectedOrderIds={selectedOrderIds}
          onBulkUpdate={async (updateData: any) => {
            try {
              const response = await apiClient.post('/api/admin/orders/bulk-update', {
                orderIds: selectedOrderIds,
                updateData
              });

              const data = response.data as any;
              if (data.success) {
                toast.success(`${data.data.modifiedCount} orders updated successfully`);
                setSelectedOrderIds([]);
                fetchOrders();
              } else {
                toast.error(data.message || 'Failed to perform bulk update');
              }
            } catch (error: any) {
              console.error('Error performing bulk update:', error);
              toast.error(error.response?.data?.message || 'Failed to perform bulk update');
            }
          }}
        />

        {/* Enhanced Timeline Modal */}
        {selectedOrder && (
          <OrderTimelineModal
            order={selectedOrder}
            isOpen={showTimelineModal}
            onClose={() => setShowTimelineModal(false)}
            onAddTimelineEvent={async (orderId: string, status: string, notes: string) => {
              try {
                const response = await apiClient.put(`/api/admin/orders/${orderId}/status`, {
                  status,
                  notes
                });
                const data = response.data as any;
                if (data.success) {
                  toast.success('Timeline event added successfully');
                  fetchOrders();
                  if (selectedOrder && selectedOrder._id === orderId) {
                    fetchOrderDetails(orderId);
                  }
                } else {
                  toast.error(data.message || 'Failed to add timeline event');
                }
              } catch (error: any) {
                console.error('Error adding timeline event:', error);
                toast.error(error.response?.data?.message || 'Failed to add timeline event');
              }
            }}
          />
        )}

        {/* Legacy Modal Removed - Using Enhanced Modals Instead */}
        {/* Legacy modal content removed - using enhanced modals instead */}

        {/* Order Timeline Modal */}
        {showTimelineModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Order Timeline for {selectedOrder.orderId}</h2>
                  <button
                    onClick={() => setShowTimelineModal(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {selectedOrder.timeline && selectedOrder.timeline.length > 0 ? (
                  <ol className="relative border-l border-gray-200 dark:border-gray-700">
                    {selectedOrder.timeline.map((event, index) => (
                      <li key={index} className="mb-10 ml-4">
                        <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </time>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {event.status.replace(/_/g, ' ')}
                        </h3>
                        <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
                          {event.notes}
                          {event.updatedBy && <span className="ml-2 text-xs text-gray-400">(by Admin)</span>}
                          {event.automated && <span className="ml-2 text-xs text-gray-400">(Automated)</span>}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-600">No timeline events available for this order.</p>
                )}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowTimelineModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Tracking Modal */}
        {selectedOrder && (
          <DeliveryTrackingModal
            isOpen={showDeliveryTracking}
            onClose={() => setShowDeliveryTracking(false)}
            orderId={selectedOrder._id}
          />
        )}

        {/* Delivery Agent Assignment Modal */}
        <DeliveryAgentAssignmentModal
          isOpen={showAgentAssignment}
          onClose={() => setShowAgentAssignment(false)}
          orders={selectedOrdersForAssignment}
          onAssign={async (assignments) => {
            try {
              for (const assignment of assignments) {
                const response = await apiClient.post(`/api/admin/delivery-agents/${assignment.agentId}/assign-order`, {
                  orderId: assignment.orderId
                });

                const data = response.data as any;
                if (!data.success) {
                  throw new Error(`Failed to assign order ${assignment.orderId}`);
                }
              }

              toast.success(`Successfully assigned ${assignments.length} order(s) to delivery agents`);
              setSelectedOrdersForAssignment([]);
              fetchOrders();
            } catch (error: any) {
              console.error('Error assigning orders:', error);
              toast.error(error.response?.data?.message || 'Failed to assign orders to delivery agents');
            }
          }}
        />
      </div>
    </div>
  );
};

export default Orders;
