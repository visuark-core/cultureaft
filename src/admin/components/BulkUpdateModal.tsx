import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Package,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-toastify';

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrderIds: string[];
  onBulkUpdate: (updateData: any) => Promise<void>;
}

const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  isOpen,
  onClose,
  selectedOrderIds,
  onBulkUpdate
}) => {
  const [updateType, setUpdateType] = useState<'status' | 'payment' | 'both'>('status');
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const updateData: any = {};
    
    if (updateType === 'status' || updateType === 'both') {
      if (!orderStatus) {
        toast.error('Please select an order status');
        return;
      }
      updateData.status = orderStatus;
    }
    
    if (updateType === 'payment' || updateType === 'both') {
      if (!paymentStatus) {
        toast.error('Please select a payment status');
        return;
      }
      updateData.paymentStatus = paymentStatus;
    }

    if (notes.trim()) {
      updateData.notes = notes.trim();
    }

    setLoading(true);
    try {
      await onBulkUpdate(updateData);
      onClose();
      // Reset form
      setUpdateType('status');
      setOrderStatus('');
      setPaymentStatus('');
      setNotes('');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  const getStatusPreview = () => {
    const updates = [];
    if (updateType === 'status' || updateType === 'both') {
      updates.push(`Order Status → ${orderStatus}`);
    }
    if (updateType === 'payment' || updateType === 'both') {
      updates.push(`Payment Status → ${paymentStatus}`);
    }
    return updates;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Bulk Update Orders</h2>
              <p className="text-purple-100 text-sm">{selectedOrderIds.length} orders selected</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Warning:</strong> This action will update {selectedOrderIds.length} orders simultaneously. 
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Update Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What would you like to update?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="updateType"
                  value="status"
                  checked={updateType === 'status'}
                  onChange={(e) => setUpdateType(e.target.value as any)}
                  className="form-radio h-4 w-4 text-purple-600"
                />
                <Package className="h-4 w-4 ml-2 mr-1 text-gray-500" />
                <span className="text-sm text-gray-700">Order Status Only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="updateType"
                  value="payment"
                  checked={updateType === 'payment'}
                  onChange={(e) => setUpdateType(e.target.value as any)}
                  className="form-radio h-4 w-4 text-purple-600"
                />
                <CreditCard className="h-4 w-4 ml-2 mr-1 text-gray-500" />
                <span className="text-sm text-gray-700">Payment Status Only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="updateType"
                  value="both"
                  checked={updateType === 'both'}
                  onChange={(e) => setUpdateType(e.target.value as any)}
                  className="form-radio h-4 w-4 text-purple-600"
                />
                <RefreshCw className="h-4 w-4 ml-2 mr-1 text-gray-500" />
                <span className="text-sm text-gray-700">Both Status Types</span>
              </label>
            </div>
          </div>

          {/* Order Status Selection */}
          {(updateType === 'status' || updateType === 'both') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Order Status *
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select order status...</option>
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
            </div>
          )}

          {/* Payment Status Selection */}
          {(updateType === 'payment' || updateType === 'both') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Payment Status *
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select payment status...</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Add a note explaining the reason for this bulk update..."
            />
          </div>

          {/* Preview */}
          {(orderStatus || paymentStatus) && (
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Update Preview
              </h4>
              <div className="text-sm text-blue-700">
                <p className="mb-1">The following changes will be applied to {selectedOrderIds.length} orders:</p>
                <ul className="list-disc list-inside space-y-1">
                  {getStatusPreview().map((update, index) => (
                    <li key={index}>{update}</li>
                  ))}
                  {notes && <li>Note: "{notes}"</li>}
                </ul>
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
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (!orderStatus && !paymentStatus)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Updating...' : `Update ${selectedOrderIds.length} Orders`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpdateModal;