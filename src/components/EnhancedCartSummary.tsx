import React, { useState } from 'react';
import { Package, AlertTriangle, CheckCircle, Clock, Truck, Shield, Info, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '../utils/paymentUtils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  sku?: string;
  availability?: 'available' | 'low_stock' | 'out_of_stock';
  estimatedDelivery?: string;
}

interface EnhancedCartSummaryProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  codCharges?: number;
  shippingCharges?: number;
  discount?: number;
  inventoryStatus?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showDetailedBreakdown?: boolean;
}

const EnhancedCartSummary: React.FC<EnhancedCartSummaryProps> = ({
  items,
  subtotal,
  tax,
  total,
  codCharges = 0,
  shippingCharges = 0,
  discount = 0,
  inventoryStatus,
  isCollapsed = false,
  onToggleCollapse,
  showDetailedBreakdown = true
}) => {
  const [showAllItems, setShowAllItems] = useState(false);
  const displayItems = showAllItems ? items : items.slice(0, 3);
  const hasMoreItems = items.length > 3;

  const getAvailabilityIcon = (availability?: string) => {
    switch (availability) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'out_of_stock':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAvailabilityText = (availability?: string) => {
    switch (availability) {
      case 'available':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Checking...';
    }
  };

  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'available':
        return 'text-green-600';
      case 'low_stock':
        return 'text-yellow-600';
      case 'out_of_stock':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-white mr-3" />
            <h2 className="text-xl font-bold text-white">Order Summary</h2>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="text-white hover:text-blue-200 transition-colors"
            >
              {isCollapsed ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          )}
        </div>
        <p className="text-blue-100 text-sm mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} • 
          Total: {formatCurrency(total)}
        </p>
      </div>

      {!isCollapsed && (
        <div className="p-6">
          {/* Inventory Status */}
          {inventoryStatus && (
            <div className="mb-6">
              {inventoryStatus.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-800 font-semibold">Inventory Issues</h4>
                      <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                        {inventoryStatus.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {inventoryStatus.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-yellow-800 font-semibold">Please Note</h4>
                      <ul className="text-yellow-700 text-sm mt-1 list-disc list-inside">
                        {inventoryStatus.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {inventoryStatus.isValid && inventoryStatus.errors.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <h4 className="text-green-800 font-semibold">All Items Available</h4>
                      <p className="text-green-700 text-sm">Your items are in stock and ready to ship.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items List */}
          <div className="space-y-4 mb-6">
            {displayItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                {/* Product Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                  <p className="text-sm text-gray-600">{item.category}</p>
                  {item.sku && (
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                  )}
                  
                  {/* Availability Status */}
                  <div className="flex items-center mt-1">
                    {getAvailabilityIcon(item.availability)}
                    <span className={`text-xs ml-1 ${getAvailabilityColor(item.availability)}`}>
                      {getAvailabilityText(item.availability)}
                    </span>
                  </div>
                </div>

                {/* Quantity and Price */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(item.price)} each
                  </div>
                </div>
              </div>
            ))}

            {/* Show More/Less Button */}
            {hasMoreItems && (
              <button
                onClick={() => setShowAllItems(!showAllItems)}
                className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                {showAllItems 
                  ? `Show Less (${items.length - 3} items hidden)` 
                  : `Show ${items.length - 3} More Items`
                }
              </button>
            )}
          </div>

          {/* Pricing Breakdown */}
          {showDetailedBreakdown && (
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({items.length} items)</span>
                <span className="text-gray-800">{formatCurrency(subtotal)}</span>
              </div>

              {shippingCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping Charges</span>
                  <span className="text-gray-800">{formatCurrency(shippingCharges)}</span>
                </div>
              )}

              {codCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">COD Charges</span>
                  <span className="text-orange-600">{formatCurrency(codCharges)}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST (18%)</span>
                <span className="text-gray-800">{formatCurrency(tax)}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total Amount</span>
                  <span className="text-blue-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Truck className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-800 font-semibold text-sm">Delivery Information</h4>
                <ul className="text-blue-700 text-xs mt-1 space-y-1">
                  <li>• Free shipping on all orders</li>
                  <li>• Estimated delivery: 5-7 business days</li>
                  <li>• Track your order in real-time</li>
                  <li>• Secure packaging guaranteed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
            <Shield className="h-4 w-4 mr-2" />
            <span>Secure checkout with 256-bit SSL encryption</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCartSummary;