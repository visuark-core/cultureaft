import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle, Package, Calendar, ArrowRight, Home, CreditCard, Shield, Copy, Download, AlertCircle, Loader } from 'lucide-react';
import { formatCurrency } from '../utils/paymentUtils';

// Removed unused OrderService import
import EnhancedOrderTracking from '../components/EnhancedOrderTracking';

const OrderSuccess = () => {
  const location = useLocation();
  const { orderId: urlOrderId } = useParams();
  const orderDetails = location.state;
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Fetch order data if accessed via URL parameter
  useEffect(() => {
    const fetchOrderData = async () => {
      if (urlOrderId && !orderDetails) {
        setIsLoadingOrder(true);
        try {
          // This would fetch order details from the backend
          // For now, we'll create a mock response
          const mockOrderData = {
            orderId: urlOrderId,
            customerName: 'Customer',
            amount: 0,
            paymentMethod: 'cod',
            paymentId: 'COD_PENDING',
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };
          setOrderData(mockOrderData);
        } catch (error) {
          console.error('Failed to fetch order data:', error);
          setOrderError('Unable to fetch order details');
        } finally {
          setIsLoadingOrder(false);
        }
      }
    };

    fetchOrderData();
  }, [urlOrderId, orderDetails]);

  // Set payment status for COD orders
  useEffect(() => {
    const currentOrderDetails = orderDetails || orderData;
    if (currentOrderDetails?.paymentMethod === 'cod') {
      setPaymentStatus({
        status: 'pending',
        method: 'cod',
        amount: currentOrderDetails.amount,
        transactionId: 'COD_PENDING'
      });
    }
  }, [orderDetails, orderData]);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Show loading state when fetching order data
  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Loading Order Details</h2>
            <p className="text-xl text-gray-600">Please wait while we fetch your order information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if order couldn't be loaded
  if (orderError || (!orderDetails && !orderData && urlOrderId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Order Not Found</h2>
            <p className="text-xl text-gray-600 mb-8">
              {orderError || "We couldn't find your order details."}
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
            >
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Use either orderDetails from navigation state or orderData from URL fetch
  const currentOrderDetails = orderDetails || orderData;

  if (!currentOrderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Order Not Found</h2>
            <p className="text-xl text-gray-600 mb-8">We couldn't find your order details.</p>
            <Link
              to="/"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
            >
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    orderId,
    estimatedDelivery,
    totalAmount,
    customerName,
    paymentId,
    amount,
    paymentMethod = 'cod'
  } = currentOrderDetails || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Order Placed Successfully!</h1>
          <p className="text-xl text-gray-600">
            Thank you {customerName}! Your order has been confirmed and is being processed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Order Details</h2>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Order ID */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Order ID</h3>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-gray-600 font-mono text-lg">{orderId}</p>
                  <button
                    onClick={() => copyToClipboard(orderId, 'orderId')}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Copy Order ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copiedField === 'orderId' && (
                    <span className="text-green-600 text-sm">Copied!</span>
                  )}
                </div>
              </div>

              {/* Total Amount */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <span className="text-green-600 font-bold text-xl">₹</span>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Amount</h3>
                <p className="text-gray-600 text-lg font-semibold">
                  {formatCurrency(amount || totalAmount || 0)}
                </p>
              </div>

              {/* Estimated Delivery */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Estimated Delivery</h3>
                <p className="text-gray-600 text-lg">
                  {estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '7-10 business days'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Confirmation Card */}
        {paymentId && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className={`bg-gradient-to-r px-8 py-6 ${paymentMethod === 'cod'
                ? 'from-orange-600 to-orange-700'
                : 'from-green-600 to-green-700'
              }`}>
              <div className="flex items-center">
                {paymentMethod === 'cod' ? (
                  <span className="text-white text-2xl mr-3">💵</span>
                ) : (
                  <Shield className="h-6 w-6 text-white mr-3" />
                )}
                <h2 className="text-2xl font-bold text-white">
                  {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Payment Confirmation'}
                </h2>
              </div>
            </div>

            <div className="p-8">
              {isLoadingPayment ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading payment details...</p>
                </div>
              ) : paymentError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                    <p className="text-yellow-800">{paymentError}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Payment Status */}
                  <div className="flex items-center justify-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full ${paymentMethod === 'cod'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                      }`}>
                      {paymentMethod === 'cod' ? (
                        <span className="mr-2">💵</span>
                      ) : (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      )}
                      <span className="font-semibold">
                        {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Payment Successful'}
                      </span>
                    </div>
                  </div>

                  {/* Payment Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Transaction ID */}
                    {paymentMethod !== 'cod' && paymentId !== 'COD_PENDING' && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-semibold text-gray-800">Transaction ID</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-600 font-mono text-sm break-all">{paymentId}</p>
                          <button
                            onClick={() => copyToClipboard(paymentId, 'paymentId')}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                            title="Copy Transaction ID"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          {copiedField === 'paymentId' && (
                            <span className="text-green-600 text-sm">Copied!</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        {paymentMethod === 'cod' ? (
                          <span className="text-orange-600 text-lg mr-2">💵</span>
                        ) : (
                          <Shield className="h-5 w-5 text-blue-600 mr-2" />
                        )}
                        <h3 className="font-semibold text-gray-800">Payment Method</h3>
                      </div>
                      <p className="text-gray-600">
                        Cash on Delivery
                      </p>
                    </div>

                    {/* Payment Amount */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-blue-600 font-bold text-lg mr-2">₹</span>
                        <h3 className="font-semibold text-gray-800">Amount Paid</h3>
                      </div>
                      <p className="text-gray-600 text-lg font-semibold">
                        {formatCurrency(amount || totalAmount || 0)}
                      </p>
                    </div>

                    {/* Payment Status */}
                    {paymentStatus && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <h3 className="font-semibold text-gray-800">Status</h3>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${paymentStatus.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : paymentStatus.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {paymentStatus.status === 'paid' ? 'Verified & Confirmed' :
                              paymentStatus.status === 'pending' ? 'Processing' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Date */}
                  <div className="text-center text-sm text-gray-500">
                    Payment processed on {new Date().toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  {/* Receipt Download */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        // This would typically generate and download a receipt
                        console.log('Download receipt for payment:', paymentId);
                      }}
                      className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Order Tracking */}
        <div className="mb-8">
          <EnhancedOrderTracking
            orderId={orderId}
            orderStatus="confirmed"
            estimatedDelivery={estimatedDelivery}
            customerInfo={{
              name: customerName,
              phone: "+91 1234567890", // This would come from actual order data
              email: "customer@example.com", // This would come from actual order data
              address: "Delivery Address" // This would come from actual order data
            }}
            onStatusUpdate={(status) => {
              console.log('Order status updated:', status);
            }}
          />
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">What's Next?</h2>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  {paymentMethod === 'cod' ? 'Order Confirmed' : 'Payment Confirmed'}
                </h3>
                <p className="text-gray-600">
                  {paymentMethod === 'cod'
                    ? 'Your order has been confirmed. Payment will be collected upon delivery.'
                    : paymentId
                      ? 'Your payment has been successfully processed and verified.'
                      : 'Your order has been placed successfully.'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Order Confirmation</h3>
                <p className="text-gray-600">
                  You'll receive an email confirmation with your order and payment details shortly.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Processing</h3>
                <p className="text-gray-600">Our artisans will carefully prepare your handcrafted items for shipping.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Shipping</h3>
                <p className="text-gray-600">We'll send you tracking information once your order ships.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Delivery</h3>
                <p className="text-gray-600">Your beautiful handicrafts will be delivered to your doorstep with care.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/user/orders"
            className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
          >
            <Package className="h-5 w-5 mr-2" />
            Track Your Order
          </Link>

          <Link
            to="/products"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-full border-2 border-blue-600 hover:bg-blue-50 transition-all duration-300"
          >
            Continue Shopping
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>

        {/* Support Information */}
        <div className="bg-blue-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-blue-900 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-6">
            If you have any questions about your order or payment, our customer support team is here to help.
          </p>

          {/* Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Order Support</h4>
              <p className="text-gray-600 text-sm mb-3">Questions about delivery, tracking, or products</p>
              <div className="flex gap-2">
                <a
                  href="mailto:orders@cultureaft.com"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Email Orders
                </a>
                <a
                  href="tel:+911234567890"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  Call Us
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Payment Support</h4>
              <p className="text-gray-600 text-sm mb-3">Issues with payment, refunds, or billing</p>
              <div className="flex gap-2">
                <a
                  href="mailto:payments@cultureaft.com"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Email Payments
                </a>
                <a
                  href="tel:+911234567891"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm"
                >
                  Call Payments
                </a>
              </div>
            </div>
          </div>

          {/* Important Information */}
          {paymentId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Keep your Order ID and Transaction ID safe for future reference</li>
                <li>• Payment confirmation email will be sent within 5-10 minutes</li>
                <li>• For refunds, please contact our payment support team</li>
                <li>• Transaction disputes can be raised within 30 days of purchase</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;