import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  Shield, 
  Lock,
  CheckCircle,
  AlertCircle,
  User,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  enabled: boolean;
  processingFee?: number;
}

interface CheckoutFormData {
  // Guest/User selection
  checkoutType: 'guest' | 'login' | 'register';
  
  // Login data
  loginEmail: string;
  loginPassword: string;
  
  // Registration data
  registerEmail: string;
  registerPassword: string;
  registerConfirmPassword: string;
  registerName: string;
  
  // Shipping information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  // Payment
  selectedPaymentMethod: string;
  savePaymentMethod: boolean;
  
  // Order notes
  orderNotes: string;
}

interface EnhancedCheckoutProps {
  cartItems: any[];
  subtotal: number;
  onOrderComplete: (orderData: any) => void;
  onBack: () => void;
}

const EnhancedCheckout: React.FC<EnhancedCheckoutProps> = ({
  cartItems,
  subtotal,
  onOrderComplete,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CheckoutFormData>({
    checkoutType: 'guest',
    loginEmail: '',
    loginPassword: '',
    registerEmail: '',
    registerPassword: '',
    registerConfirmPassword: '',
    registerName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    selectedPaymentMethod: 'card',
    savePaymentMethod: false,
    orderNotes: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay, American Express',
      enabled: true
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Pay using any UPI app',
      enabled: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building2,
      description: 'All major banks supported',
      enabled: true
    },
    {
      id: 'wallet',
      name: 'Digital Wallets',
      icon: Wallet,
      description: 'Paytm, PhonePe, Google Pay, Amazon Pay',
      enabled: true
    }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const taxRate = 0.18; // 18% GST
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Validate account type selection
      if (formData.checkoutType === 'login') {
        if (!formData.loginEmail) newErrors.loginEmail = 'Email is required';
        if (!formData.loginPassword) newErrors.loginPassword = 'Password is required';
      } else if (formData.checkoutType === 'register') {
        if (!formData.registerName) newErrors.registerName = 'Name is required';
        if (!formData.registerEmail) newErrors.registerEmail = 'Email is required';
        if (!formData.registerPassword) newErrors.registerPassword = 'Password is required';
        if (formData.registerPassword !== formData.registerConfirmPassword) {
          newErrors.registerConfirmPassword = 'Passwords do not match';
        }
      }
    }

    if (step === 2) {
      // Validate shipping information
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email && formData.checkoutType === 'guest') newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.address) newErrors.address = 'Address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.pincode) newErrors.pincode = 'PIN code is required';
      else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'PIN code must be 6 digits';
    }

    if (step === 3) {
      // Validate payment method selection
      if (!formData.selectedPaymentMethod) newErrors.selectedPaymentMethod = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsProcessing(true);
    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const orderData = {
        checkoutType: formData.checkoutType,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.checkoutType === 'guest' ? formData.email : 
                 formData.checkoutType === 'login' ? formData.loginEmail : formData.registerEmail,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        paymentMethod: formData.selectedPaymentMethod,
        orderNotes: formData.orderNotes,
        items: cartItems,
        subtotal,
        taxAmount,
        totalAmount
      };

      onOrderComplete(orderData);
    } catch (error) {
      console.error('Order processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
            
            {/* Checkout Type Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, checkoutType: 'guest' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.checkoutType === 'guest'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-6 w-6 text-gray-600" />
                    <div>
                      <div className="font-medium">Guest Checkout</div>
                      <div className="text-sm text-gray-500">Quick and easy</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, checkoutType: 'login' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.checkoutType === 'login'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-gray-600" />
                    <div>
                      <div className="font-medium">Login</div>
                      <div className="text-sm text-gray-500">Existing customer</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, checkoutType: 'register' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.checkoutType === 'register'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <UserPlus className="h-6 w-6 text-gray-600" />
                    <div>
                      <div className="font-medium">Create Account</div>
                      <div className="text-sm text-gray-500">New customer</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Login Form */}
            {formData.checkoutType === 'login' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="loginEmail"
                    value={formData.loginEmail}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.loginEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.loginEmail && (
                    <p className="text-red-600 text-sm mt-1">{errors.loginEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="loginPassword"
                      value={formData.loginPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                        errors.loginPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.loginPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.loginPassword}</p>
                  )}
                </div>
              </div>
            )}

            {/* Registration Form */}
            {formData.checkoutType === 'register' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="registerName"
                    value={formData.registerName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.registerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.registerName && (
                    <p className="text-red-600 text-sm mt-1">{errors.registerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="registerEmail"
                    value={formData.registerEmail}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.registerEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.registerEmail && (
                    <p className="text-red-600 text-sm mt-1">{errors.registerEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="registerPassword"
                      value={formData.registerPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                        errors.registerPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.registerPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.registerPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="registerConfirmPassword"
                      value={formData.registerConfirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                        errors.registerConfirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.registerConfirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.registerConfirmPassword}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>

              {formData.checkoutType === 'guest' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="10-digit mobile number"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="House/Flat No., Street, Area"
                />
                {errors.address && (
                  <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.city && (
                  <p className="text-red-600 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.state ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-red-600 text-sm mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Code *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.pincode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="6-digit PIN code"
                  maxLength={6}
                />
                {errors.pincode && (
                  <p className="text-red-600 text-sm mt-1">{errors.pincode}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
            
            <div className="space-y-4">
              {paymentMethods.map(method => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, selectedPaymentMethod: method.id }))}
                    disabled={!method.enabled}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                      formData.selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : method.enabled
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <IconComponent className={`h-6 w-6 ${
                        method.enabled ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className={`font-medium ${
                          method.enabled ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {method.name}
                        </div>
                        <div className={`text-sm ${
                          method.enabled ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {method.description}
                        </div>
                      </div>
                      {formData.selectedPaymentMethod === method.id && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="text-green-800 font-medium">Secure Payment</h3>
                  <p className="text-green-700 text-sm mt-1">
                    Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Notes (Optional)
              </label>
              <textarea
                name="orderNotes"
                value={formData.orderNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special instructions for your order..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
            
            {/* Order Review */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                <p className="text-gray-600 text-sm">
                  {formData.firstName} {formData.lastName}<br />
                  {formData.address}<br />
                  {formData.city}, {formData.state} {formData.pincode}<br />
                  Phone: {formData.phone}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                <p className="text-gray-600 text-sm">
                  {paymentMethods.find(m => m.id === formData.selectedPaymentMethod)?.name}
                </p>
              </div>

              {formData.orderNotes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Order Notes</h3>
                  <p className="text-gray-600 text-sm">{formData.orderNotes}</p>
                </div>
              )}
            </div>

            {/* Final Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-blue-800 font-medium">Ready to Complete Your Order</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    By clicking "Place Order", you agree to our terms and conditions. Your payment will be processed securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep >= step 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <span className="text-sm font-medium">{step}</span>
                )}
              </div>
              {index < 3 && (
                <div className={`ml-4 w-16 h-0.5 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
            Account
          </span>
          <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
            Shipping
          </span>
          <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
            Payment
          </span>
          <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
            Review
          </span>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={currentStep === 1 ? onBack : handleBack}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            {currentStep === 1 ? 'Back to Cart' : 'Back'}
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Place Order - ₹{totalAmount.toLocaleString()}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckout;