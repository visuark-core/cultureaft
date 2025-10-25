import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  Shield, 
  Download,
  Mail,
  Phone,
  Copy,
  ExternalLink
} from 'lucide-react';

interface PaymentConfirmationProps {
  orderData: {
    orderId: string;
    paymentId: string;
    amount: number;
    status: 'success' | 'pending' | 'failed';
    paymentMethod: string;
    customerEmail: string;
    estimatedDelivery?: string;
  };
  onContinueShopping: () => void;
  onViewOrder: () => void;
}

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  orderData,
  onContinueShopping,
  onViewOrder
}) => {
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Simulate sending confirmation email
    const timer = setTimeout(() => {
      setEmailSent(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderData.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReceipt = () => {
    // Simulate receipt download
    const receiptData = {
      orderId: orderData.orderId,
      paymentId: orderData.paymentId,
      amount: orderData.amount,
      date: new Date().toISOString(),
      status: orderData.status
    };
    
    const dataStr = JSON.stringify(receiptData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `receipt-${orderData.orderId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusIcon = () => {
    switch (orderData.status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (orderData.status) {
      case 'success':
        return {
          title: 'Payment Successful!',
          message: 'Your order has been placed successfully and payment has been confirmed.',
          color: 'text-green-800'
        };
      case 'pending':
        return {
          title: 'Payment Pending',
          message: 'Your payment is being processed. You will receive a confirmation shortly.',
          color: 'text-yellow-800'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          message: 'There was an issue processing your payment. Please try again or contact support.',
          color: 'text-red-800'
        };
      default:
        return {
          title: 'Processing Payment',
          message: 'Please wait while we process your payment.',
          color: 'text-gray-800'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className={`p-8 text-center ${
          orderData.status === 'success' ? 'bg-green-50' :
          orderData.status === 'pending' ? 'bg-yellow-50' :
          orderData.status === 'failed' ? 'bg-red-50' : 'bg-gray-50'
        }`}>
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${statusInfo.color}`}>
            {statusInfo.title}
          </h1>
          <p className="text-gray-600">
            {statusInfo.message}
          </p>
        </div>

        {/* Order Details */}
        <div className="p-8 space-y-6">
          {/* Order Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Order ID:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono font-medium">{orderData.orderId}</span>
                  <button
                    onClick={copyOrderId}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copied && (
                    <span className="text-xs text-green-600">Copied!</span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600">Payment ID:</span>
                <div className="font-mono font-medium mt-1">{orderData.paymentId}</div>
              </div>
              
              <div>
                <span className="text-gray-600">Amount Paid:</span>
                <div className="font-semibold text-lg mt-1">₹{orderData.amount.toLocaleString()}</div>
              </div>
              
              <div>
                <span className="text-gray-600">Payment Method:</span>
                <div className="font-medium mt-1 capitalize">{orderData.paymentMethod}</div>
              </div>
              
              <div>
                <span className="text-gray-600">Date & Time:</span>
                <div className="font-medium mt-1">
                  {new Date().toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              
              {orderData.estimatedDelivery && (
                <div>
                  <span className="text-gray-600">Estimated Delivery:</span>
                  <div className="font-medium mt-1">
                    {new Date(orderData.estimatedDelivery).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-blue-800 font-medium">Secure Transaction</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Your payment has been processed securely. All transaction details are encrypted and protected.
                </p>
              </div>
            </div>
          </div>

          {/* Email Confirmation */}
          <div className={`border rounded-lg p-4 ${
            emailSent ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-3">
              <Mail className={`h-5 w-5 mt-0.5 ${
                emailSent ? 'text-green-600' : 'text-yellow-600'
              }`} />
              <div>
                <h3 className={`font-medium ${
                  emailSent ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {emailSent ? 'Confirmation Email Sent' : 'Sending Confirmation Email'}
                </h3>
                <p className={`text-sm mt-1 ${
                  emailSent ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {emailSent 
                    ? `Order confirmation has been sent to ${orderData.customerEmail}`
                    : `Sending order confirmation to ${orderData.customerEmail}...`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={downloadReceipt}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download Receipt</span>
              </button>
              
              <button
                onClick={onViewOrder}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View Order Details</span>
              </button>
            </div>

            <button
              onClick={onContinueShopping}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>

          {/* Support Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-gray-600">Call us</p>
                  <p className="font-medium text-blue-600">+91 98765 43210</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-gray-600">Email us</p>
                  <p className="font-medium text-blue-600">support@cultureaft.com</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                For any issues with your order or payment, please contact our support team with your Order ID: 
                <span className="font-mono font-medium"> {orderData.orderId}</span>
              </p>
            </div>
          </div>

          {/* Additional Information for Failed Payments */}
          {orderData.status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium mb-2">What to do next?</h3>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• Check if your payment method has sufficient balance</li>
                <li>• Verify your card details and try again</li>
                <li>• Try using a different payment method</li>
                <li>• Contact your bank if the issue persists</li>
                <li>• Reach out to our support team for assistance</li>
              </ul>
            </div>
          )}

          {/* Additional Information for Pending Payments */}
          {orderData.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-yellow-800 font-medium mb-2">Payment Processing</h3>
              <p className="text-yellow-700 text-sm">
                Your payment is being verified by our payment partner. This usually takes a few minutes. 
                You will receive an email confirmation once the payment is confirmed. If you don't receive 
                confirmation within 30 minutes, please contact our support team.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;