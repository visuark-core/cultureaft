import React, { useState } from 'react';
import {
  X,
  Package,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Edit,
  Save,
  History,
  Truck,
  Home
} from 'lucide-react';
import { Order } from '../../types/order';
import { formatCurrency } from '../../utils/paymentUtils';
import { toast } from 'react-toastify';

interface OrderDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string, notes?: string) => Promise<void>;
  onUpdatePaymentStatus?: (orderId: string, paymentStatus: string, notes?: string) => Promise<void>;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdatePaymentStatus
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'customer' | 'payment' | 'shipping' | 'timeline'>('overview');
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [statusNotes, setStatusNotes] = useState('');
  const [, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await onUpdateStatus(order._id, newStatus, statusNotes);
      setEditingStatus(false);
      setStatusNotes('');
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'customer', label: 'Customer', icon: User },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'timeline', label: 'Timeline', icon: History }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Order Details</h2>
              <p className="text-blue-100 text-sm">{order.orderId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order ID:</span>
                    <div className="flex items-center">
                      <span className="font-mono text-sm">{order.orderId}</span>
                      <button
                        onClick={() => copyToClipboard(order.orderId, 'orderId')}
                        className="ml-2 text-gray-400 hover:text-blue-600"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span>{order.items.length} item(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold">{formatCurrency(order.pricing.total)}</span>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Status Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Status:</span>
                    <div className="flex items-center">
                      {getPaymentStatusIcon(order.payment.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.payment.status)}`}>
                        {order.payment.status}
                      </span>
                    </div>
                  </div>
                  
                  {editingStatus ? (
                    <div className="space-y-2">
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="returned">Returned</option>
                      </select>
                      <textarea
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        placeholder="Add notes for status change..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleStatusUpdate}
                          className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingStatus(false);
                            setNewStatus(order.status);
                            setStatusNotes('');
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingStatus(true)}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Update Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                        <p className="text-sm text-gray-600">Category: {item.category}</p>
                        {item.variant && Object.keys(item.variant).length > 0 && (
                          <div className="text-sm text-gray-600">
                            Variant: {Object.entries(item.variant).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.price)} × {item.quantity}</p>
                        <p className="text-sm text-gray-600">Subtotal: {formatCurrency(item.subtotal)}</p>
                        {item.discount > 0 && (
                          <p className="text-sm text-green-600">Discount: -{formatCurrency(item.discount)}</p>
                        )}
                        {item.tax > 0 && (
                          <p className="text-sm text-gray-600">Tax: {formatCurrency(item.tax)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pricing Breakdown */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Pricing Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.pricing.subtotal)}</span>
                  </div>
                  {order.pricing.shippingCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrency(order.pricing.shippingCharges)}</span>
                    </div>
                  )}
                  {order.pricing.codCharges > 0 && (
                    <div className="flex justify-between">
                      <span>COD Charges:</span>
                      <span>{formatCurrency(order.pricing.codCharges)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span>{formatCurrency(order.pricing.taxes)}</span>
                  </div>
                  {order.pricing.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(order.pricing.discount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(order.pricing.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Customer Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{order.customer.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{order.customer.email}</span>
                    <button
                      onClick={() => copyToClipboard(order.customer.email, 'email')}
                      className="ml-2 text-gray-400 hover:text-blue-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{order.customer.phone}</span>
                    <button
                      onClick={() => copyToClipboard(order.customer.phone, 'phone')}
                      className="ml-2 text-gray-400 hover:text-blue-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Shipping Address</h3>
                <div className="flex items-start">
                  <Home className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                  <div>
                    <p>{order.shipping.address.street}</p>
                    <p>{order.shipping.address.city}, {order.shipping.address.state}</p>
                    <p>{order.shipping.address.pincode}</p>
                    <p>{order.shipping.address.country || 'India'}</p>
                    {order.shipping.address.landmark && (
                      <p className="text-sm text-gray-600">Landmark: {order.shipping.address.landmark}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="capitalize">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <div className="flex items-center">
                      {getPaymentStatusIcon(order.payment.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.payment.status)}`}>
                        {order.payment.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold text-orange-600">Cash on Delivery</span>
                  </div>
                  {order.payment.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <div className="flex items-center">
                        <span className="font-mono text-sm">{order.payment.transactionId}</span>
                        <button
                          onClick={() => copyToClipboard(order.payment.transactionId!, 'transactionId')}
                          className="ml-2 text-gray-400 hover:text-blue-600"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span>{formatCurrency(order.payment.paidAmount)}</span>
                  </div>
                  {order.payment.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid At:</span>
                      <span>{new Date(order.payment.paidAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {order.payment.refunds && order.payment.refunds.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Refunds</h3>
                  <div className="space-y-3">
                    {order.payment.refunds.map((refund, index) => (
                      <div key={index} className="border-l-4 border-purple-400 pl-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span>{formatCurrency(refund.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(refund.status || 'pending')}`}>
                            {refund.status}
                          </span>
                        </div>
                        {refund.reason && (
                          <div className="text-sm text-gray-600 mt-1">
                            Reason: {refund.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Shipping Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="capitalize">{order.shipping.method}</span>
                  </div>
                  {order.shipping.estimatedDelivery && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Delivery:</span>
                      <span>{new Date(order.shipping.estimatedDelivery).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.shipping.actualDelivery && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Delivery:</span>
                      <span>{new Date(order.shipping.actualDelivery).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.shipping.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <div className="flex items-center">
                        <span className="font-mono text-sm">{order.shipping.trackingNumber}</span>
                        <button
                          onClick={() => copyToClipboard(order.shipping.trackingNumber!, 'trackingNumber')}
                          className="ml-2 text-gray-400 hover:text-blue-600"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  {order.shipping.carrier && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carrier:</span>
                      <span>{order.shipping.carrier}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Cost:</span>
                    <span>{formatCurrency(order.shipping.shippingCost || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Delivery Address</h3>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                  <div>
                    <p>{order.shipping.address.street}</p>
                    <p>{order.shipping.address.city}, {order.shipping.address.state}</p>
                    <p>{order.shipping.address.pincode}</p>
                    <p>{order.shipping.address.country || 'India'}</p>
                    {order.shipping.address.landmark && (
                      <p className="text-sm text-gray-600">Landmark: {order.shipping.address.landmark}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Order Timeline</h3>
              <div className="space-y-4">
                {order.timeline && order.timeline.length > 0 ? (
                  order.timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusBadgeColor(event.status)}`}>
                        <div className="w-3 h-3 rounded-full bg-current"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {event.status.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {event.notes && (
                          <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                        )}
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          {event.automated ? (
                            <span>Automated</span>
                          ) : (
                            <span>Manual update</span>
                          )}
                          {event.location && (
                            <span className="ml-2">• {event.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No timeline events available</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;