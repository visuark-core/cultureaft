import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { OrderData, orderService } from '../services/orderService';
import { isValidEmail, isValidPhoneNumber, formatCurrency } from '../utils/paymentUtils';

const Checkout = () => {
  const { state, dispatch } = useCart();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phone)) {
      errors.phone = 'Please enter a valid Indian phone number';
    }
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.pincode.trim()) {
      errors.pincode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = 'PIN code must be 6 digits';
    }
    
    setFormErrors(errors);
    const valid = Object.keys(errors).length === 0;
    setIsFormValid(valid);
    return valid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    // Clear general errors
    if (orderError) setOrderError(null);
  };

  // Validate form on data change
  useEffect(() => {
    if (Object.values(formData).some(value => value.trim() !== '')) {
      validateForm();
    }
  }, [formData]);

  // Handle order placement
  const handleOrderPlacement = async () => {
    if (!validateForm()) {
      setOrderError('Please fill in all required fields correctly');
      return;
    }

    // Calculate amounts
    const subtotal = state.subtotal;
    const taxAmount = Math.round(subtotal * 0.18);
    const finalAmount = subtotal + taxAmount;
    
    const orderPayload: OrderData = {
      customerInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
      items: state.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        image: item.image
      })),
      paymentInfo: {
        method: 'cod',
        transactionId: 'COD_PENDING',
      },
      pricing: {
        subtotal: subtotal,
        codCharges: 0,
        taxAmount: taxAmount,
        finalAmount: finalAmount
      },
      totalAmount: subtotal,
      taxAmount: taxAmount,
      finalAmount: finalAmount
    };

    try {
      const orderResponse = await orderService.placeOrder(orderPayload);

      if (orderResponse.success && orderResponse.data) {
        dispatch({ type: 'CLEAR_CART' });
        navigate('/order-success', {
          state: {
            orderId: orderResponse.data.orderId,
            estimatedDelivery: orderResponse.data.estimatedDelivery,
            paymentId: 'COD_PENDING',
            amount: finalAmount,
            paymentMethod: 'cod',
            customerName: `${formData.firstName} ${formData.lastName}`
          }
        });
      } else {
        throw new Error(orderResponse.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      setOrderError(error instanceof Error ? error.message : 'Failed to place order');
    }
  };

  const handleStepNavigation = (step: number) => {
    if (step === 2 && !validateForm()) {
      setOrderError('Please fill in all required fields correctly');
      return;
    }
    setCurrentStep(step);
    setOrderError(null);
  };

  const steps = [
    { id: 1, title: 'Shipping', icon: Truck },
    { id: 2, title: 'Review & Place Order', icon: CheckCircle }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">No Items to Checkout</h2>
            <p className="text-xl text-gray-600 mb-8">Add some beautiful handicrafts to your cart first</p>
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Browse Products
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
          <h1 className="text-4xl font-bold text-blue-900">Checkout</h1>
          <Link
            to="/cart"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Cart
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <span className={`ml-3 font-semibold ${
                  currentStep >= step.id ? 'text-blue-900' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`ml-8 w-16 h-0.5 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {orderError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-700 text-sm mt-1">{orderError}</p>
                <button
                  onClick={() => setOrderError(null)}
                  className="text-red-600 hover:text-red-800 text-sm underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-2xl shadow-lg p-8">
              {/* Shipping Information */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">Shipping Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                          formErrors.firstName 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {formErrors.firstName && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                          formErrors.lastName 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {formErrors.lastName && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                          formErrors.email 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="10-digit mobile number"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                          formErrors.phone 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {formErrors.phone && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.phone}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        placeholder="House/Flat No., Street, Area"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                          formErrors.address 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {formErrors.address && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.address}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                          formErrors.city 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {formErrors.city && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.city}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State *
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                          formErrors.state 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">Select State</option>
                        {indianStates.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {formErrors.state && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.state}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        required
                        pattern="[0-9]{6}"
                        placeholder="6-digit PIN code"
                        maxLength={6}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                          formErrors.pincode 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {formErrors.pincode && (
                        <p className="text-red-600 text-sm mt-1">{formErrors.pincode}</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleStepNavigation(2)}
                    disabled={!isFormValid}
                    className="mt-8 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Review
                  </button>
                </div>
              )}

              {/* Review Order */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">Review Your Order</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Shipping Address</h3>
                      <p className="text-gray-600">
                        {formData.firstName} {formData.lastName}<br />
                        {formData.address}<br />
                        {formData.city}, {formData.state} {formData.pincode}<br />
                        {formData.phone}
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-orange-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-orange-800">Cash on Delivery</h3>
                          <p className="text-orange-700 text-sm mt-1">
                            Pay when your order arrives. Our delivery partner will collect the payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => handleStepNavigation(1)}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleOrderPlacement}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-6 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-300 font-semibold flex items-center justify-center"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Place Order - {formatCurrency(state.subtotal + Math.round(state.subtotal * 0.18))}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Order Summary</h3>
                
                {/* Items */}
                <div className="space-y-3 mb-6">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm">{item.name}</h4>
                        <p className="text-gray-600 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(state.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (18% GST)</span>
                    <span>{formatCurrency(Math.round(state.subtotal * 0.18))}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-blue-900">Total</span>
                      <span className="text-blue-900">
                        {formatCurrency(state.subtotal + Math.round(state.subtotal * 0.18))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;