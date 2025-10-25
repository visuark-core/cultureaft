import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar,
  Phone,
  Mail,
  Copy,
  ExternalLink
} from 'lucide-react';

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location: string;
  timestamp: string;
  isCompleted: boolean;
}

interface OrderTrackingProps {
  orderId: string;
  currentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
}

const OrderTracking: React.FC<OrderTrackingProps> = ({
  orderId,
  currentStatus,
  trackingNumber,
  estimatedDelivery,
  shippingAddress
}) => {
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Simulate tracking events based on current status
    const generateTrackingEvents = () => {
      const baseEvents: TrackingEvent[] = [
        {
          id: '1',
          status: 'Order Placed',
          description: 'Your order has been successfully placed and is being prepared.',
          location: 'Jodhpur, Rajasthan',
          timestamp: '2024-12-20T10:00:00Z',
          isCompleted: true
        }
      ];

      if (['processing', 'shipped', 'delivered'].includes(currentStatus)) {
        baseEvents.push({
          id: '2',
          status: 'Order Confirmed',
          description: 'Your order has been confirmed and is being prepared by our artisans.',
          location: 'Jodhpur, Rajasthan',
          timestamp: '2024-12-20T14:30:00Z',
          isCompleted: true
        });
      }

      if (['shipped', 'delivered'].includes(currentStatus)) {
        baseEvents.push({
          id: '3',
          status: 'Shipped',
          description: 'Your order has been shipped and is on its way to you.',
          location: 'Jodhpur Distribution Center',
          timestamp: '2024-12-21T09:15:00Z',
          isCompleted: true
        });

        baseEvents.push({
          id: '4',
          status: 'In Transit',
          description: 'Your package is in transit to the destination city.',
          location: 'Delhi Hub',
          timestamp: '2024-12-22T16:45:00Z',
          isCompleted: true
        });
      }

      if (currentStatus === 'delivered') {
        baseEvents.push({
          id: '5',
          status: 'Out for Delivery',
          description: 'Your package is out for delivery and will arrive today.',
          location: 'Local Delivery Center',
          timestamp: '2024-12-23T08:30:00Z',
          isCompleted: true
        });

        baseEvents.push({
          id: '6',
          status: 'Delivered',
          description: 'Your order has been successfully delivered.',
          location: shippingAddress?.city || 'Delivery Address',
          timestamp: '2024-12-23T14:20:00Z',
          isCompleted: true
        });
      }

      return baseEvents;
    };

    setTrackingEvents(generateTrackingEvents());
  }, [currentStatus, shippingAddress]);

  const copyTrackingNumber = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = (status: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }

    switch (status.toLowerCase()) {
      case 'shipped':
      case 'in transit':
        return <Truck className="h-6 w-6 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Order Status Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Order Tracking</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentStatus === 'delivered' ? 'bg-green-100 text-green-800' :
            currentStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
            currentStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-medium">{orderId}</p>
            </div>
          </div>

          {trackingNumber && (
            <div className="flex items-center space-x-3">
              <Truck className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Tracking Number</p>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{trackingNumber}</p>
                  <button
                    onClick={copyTrackingNumber}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copied && (
                    <span className="text-xs text-green-600">Copied!</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {estimatedDelivery && (
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Estimated Delivery</p>
                <p className="font-medium">
                  {new Date(estimatedDelivery).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tracking History</h3>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {trackingEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start space-x-4">
                {/* Timeline Dot */}
                <div className="relative z-10 flex-shrink-0">
                  {getStatusIcon(event.status, event.isCompleted)}
                </div>
                
                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      event.isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {event.status}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    event.isCompleted ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {event.description}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {event.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {shippingAddress && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
          <div className="space-y-2">
            <p className="font-medium text-gray-900">{shippingAddress.name}</p>
            <p className="text-gray-600">{shippingAddress.address}</p>
            <p className="text-gray-600">
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
            </p>
            <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{shippingAddress.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External Tracking */}
      {trackingNumber && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Track with Courier Partner
              </h3>
              <p className="text-blue-700">
                Get real-time updates directly from our shipping partner
              </p>
            </div>
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <ExternalLink className="h-4 w-4" />
              <span>Track Package</span>
            </button>
          </div>
        </div>
      )}

      {/* Support */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Call us</p>
              <p className="font-medium text-blue-600">+91 98765 43210</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Email us</p>
              <p className="font-medium text-blue-600">support@cultureaft.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;