import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Save,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { Order } from '../../types/order';
import { formatCurrency } from '../../utils/paymentUtils';
import { toast } from 'react-toastify';

interface OrderEditModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editData: any) => Promise<void>;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave
}) => {
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (order && isOpen) {
      setEditData({
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
      setErrors({});
    }
  }, [order, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any, index?: number) => {
    setEditData((prev: any) => {
      const newData = { ...prev };
      
      if (index !== undefined && field.startsWith('items.')) {
        const itemField = field.replace('items.', '');
        newData.items[index][itemField] = value;
        
        // Recalculate subtotal if quantity or price changes
        if (itemField === 'quantity' || itemField === 'price') {
          newData.items[index].subtotal = newData.items[index].quantity * newData.items[index].price;
        }
      } else if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (!newData[parent]) newData[parent] = {};
        newData[parent][child] = value;
      } else {
        newData[field] = value;
      }
      
      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addItem = () => {
    setEditData((prev: any) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          name: '',
          sku: '',
          quantity: 1,
          price: 0,
          category: '',
          variant: {},
          subtotal: 0,
          discount: 0,
          tax: 0
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (editData.items.length <= 1) {
      toast.error('Order must have at least one item');
      return;
    }
    
    setEditData((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    // Validate items
    editData.items.forEach((item: any, index: number) => {
      if (!item.name.trim()) {
        newErrors[`items.${index}.name`] = 'Item name is required';
      }
      if (!item.sku.trim()) {
        newErrors[`items.${index}.sku`] = 'SKU is required';
      }
      if (item.quantity <= 0) {
        newErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0';
      }
      if (item.price < 0) {
        newErrors[`items.${index}.price`] = 'Price cannot be negative';
      }
    });

    // Validate shipping address
    if (!editData.shipping.address.street.trim()) {
      newErrors['shipping.address.street'] = 'Street address is required';
    }
    if (!editData.shipping.address.city.trim()) {
      newErrors['shipping.address.city'] = 'City is required';
    }
    if (!editData.shipping.address.state.trim()) {
      newErrors['shipping.address.state'] = 'State is required';
    }
    if (!editData.shipping.address.pincode.trim()) {
      newErrors['shipping.address.pincode'] = 'Pincode is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    try {
      await onSave(editData);
      toast.success('Order updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const itemsTotal = editData.items?.reduce((sum: number, item: any) => 
      sum + (item.subtotal || 0) - (item.discount || 0) + (item.tax || 0), 0) || 0;
    const shippingCost = editData.shipping?.shippingCost || 0;
    return itemsTotal + shippingCost;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Edit Order</h2>
              <p className="text-yellow-100 text-sm">{order.orderId}</p>
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
                <strong>Warning:</strong> Editing orders after confirmation may affect inventory and customer expectations. 
                Only edit orders that haven't been shipped.
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Order Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Order Items</h3>
              <button
                onClick={addItem}
                className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {editData.items?.map((item: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                    {editData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleFieldChange('items.name', e.target.value, index)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`items.${index}.name`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter product name"
                      />
                      {errors[`items.${index}.name`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.name`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU *
                      </label>
                      <input
                        type="text"
                        value={item.sku}
                        onChange={(e) => handleFieldChange('items.sku', e.target.value, index)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`items.${index}.sku`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter SKU"
                      />
                      {errors[`items.${index}.sku`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.sku`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => handleFieldChange('items.category', e.target.value, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter category"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleFieldChange('items.quantity', parseInt(e.target.value) || 1, index)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`items.${index}.quantity`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`items.${index}.quantity`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.quantity`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleFieldChange('items.price', parseFloat(e.target.value) || 0, index)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`items.${index}.price`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`items.${index}.price`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.price`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtotal
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(item.subtotal)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Shipping Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Shipping Address</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={editData.shipping?.address?.street || ''}
                      onChange={(e) => handleFieldChange('shipping.address.street', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors['shipping.address.street'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter street address"
                    />
                    {errors['shipping.address.street'] && (
                      <p className="text-red-500 text-xs mt-1">{errors['shipping.address.street']}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={editData.shipping?.address?.city || ''}
                        onChange={(e) => handleFieldChange('shipping.address.city', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors['shipping.address.city'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter city"
                      />
                      {errors['shipping.address.city'] && (
                        <p className="text-red-500 text-xs mt-1">{errors['shipping.address.city']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={editData.shipping?.address?.state || ''}
                        onChange={(e) => handleFieldChange('shipping.address.state', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors['shipping.address.state'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter state"
                      />
                      {errors['shipping.address.state'] && (
                        <p className="text-red-500 text-xs mt-1">{errors['shipping.address.state']}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={editData.shipping?.address?.pincode || ''}
                        onChange={(e) => handleFieldChange('shipping.address.pincode', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors['shipping.address.pincode'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter pincode"
                      />
                      {errors['shipping.address.pincode'] && (
                        <p className="text-red-500 text-xs mt-1">{errors['shipping.address.pincode']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={editData.shipping?.address?.country || 'India'}
                        onChange={(e) => handleFieldChange('shipping.address.country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={editData.shipping?.address?.landmark || ''}
                      onChange={(e) => handleFieldChange('shipping.address.landmark', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter landmark (optional)"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Shipping Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Method
                    </label>
                    <select
                      value={editData.shipping?.method || 'standard'}
                      onChange={(e) => handleFieldChange('shipping.method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                      <option value="same_day">Same Day</option>
                      <option value="pickup">Pickup</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Delivery
                    </label>
                    <input
                      type="date"
                      value={editData.shipping?.estimatedDelivery || ''}
                      onChange={(e) => handleFieldChange('shipping.estimatedDelivery', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Cost
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editData.shipping?.shippingCost || 0}
                      onChange={(e) => handleFieldChange('shipping.shippingCost', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Notes</h3>
            <textarea
              value={editData.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add any notes for this order..."
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Updated Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Items Total:</span>
                <span>{formatCurrency(editData.items?.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Cost:</span>
                <span>{formatCurrency(editData.shipping?.shippingCost || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
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
              onClick={handleSave}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;