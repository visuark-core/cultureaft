
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { state, updateQuantity, removeItem, clearCart } = useCart();

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Your Cart is Empty</h2>
            <p className="text-xl text-gray-600 mb-8">
              Discover our beautiful collection of handcrafted furniture and decor
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-600">
              {state.items.reduce((total, item) => total + item.quantity, 0)} items in your cart
            </p>
          </div>
          <Link
            to="/products"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-blue-900">Cart Items</h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {state.items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-900 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                        <p className="text-lg font-bold text-blue-900">
                          ₹{item.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-6">Order Summary</h2>

              {/* Summary Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{state.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span className="font-semibold">₹{state.tax.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-blue-900">Total</span>
                    <span className="text-blue-900">
                      ₹{state.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Errors */}
              {state.validationErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-sm">
                    <p className="font-semibold mb-1">Please fix the following issues:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {state.validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Validation Warnings */}
              {state.validationWarnings.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-yellow-800 text-sm">
                    <p className="font-semibold mb-1">Please note:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {state.validationWarnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <Link
                to="/checkout"
                className={`w-full py-3 px-6 rounded-lg transition-all duration-300 font-semibold text-center block ${
                  state.isValid 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!state.isValid) {
                    e.preventDefault();
                  }
                }}
              >
                {state.isValid ? 'Proceed to Checkout' : 'Fix Issues to Continue'}
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Secure payment processing
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Free shipping across India
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  30-day return policy
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Authentic handcrafted items
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;