import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvelopeIcon, DevicePhoneMobileIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateInput = () => {
    if (!contact.trim()) {
      setError(`${method === 'email' ? 'Email' : 'Phone number'} is required.`);
      return false;
    }
    
    if (method === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
        setError('Please enter a valid email address.');
        return false;
      }
    } else {
      if (!/^\+?[\d\s-()]{10,}$/.test(contact)) {
        setError('Please enter a valid phone number.');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateInput()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Integrate with backend API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setSuccess(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-blue-900 mb-2">Reset Link Sent</h2>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to your {method === 'email' ? 'email' : 'phone'}. 
              Please check and follow the instructions to reset your password.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Login
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setContact('');
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Send Another Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Login
          </button>
          <h2 className="text-4xl font-extrabold text-blue-900 mb-2">Reset Password</h2>
          <p className="text-gray-600">Choose how you'd like to receive your reset link</p>
        </div>
        
        <div className="mt-8 bg-white/80 backdrop-blur py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
            
            {/* Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Reset Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    setContact('');
                    setError('');
                  }}
                  className={`flex items-center justify-center px-4 py-3 border rounded-md text-sm font-medium ${
                    method === 'email'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('sms');
                    setContact('');
                    setError('');
                  }}
                  className={`flex items-center justify-center px-4 py-3 border rounded-md text-sm font-medium ${
                    method === 'sms'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                  SMS
                </button>
              </div>
            </div>

            {/* Contact Input */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                {method === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                id="contact"
                name="contact"
                type={method === 'email' ? 'email' : 'tel'}
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  method === 'email' 
                    ? 'Enter your email address' 
                    : 'Enter your phone number'
                }
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Reset Link...
                  </div>
                ) : (
                  `Send Reset Link via ${method === 'email' ? 'Email' : 'SMS'}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;