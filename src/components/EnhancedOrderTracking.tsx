import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail, AlertCircle } from 'lucide-react';

interface OrderTrackingProps {
  orderId: string;
  orderStatus: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  customerInfo?: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  onStatusUpdate?: (status: string) => void;
}

interface TrackingEvent {
  id: string;
  status: string;
  timestamp: string;
  location: string;
  description: string;
  isCompleted: boolean;
}

const EnhancedOrderTracking: React.FC<OrderTrackingProps> = ({
  orderId,
  orderStatus,
  estimatedDelivery,
  trackingNumber,
  customerInfo,
  onStatusUpdate
}) => {
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock tracking events based on order status
  useEffect(() => {
    const generateTrackingEvents = (status: string): TrackingEvent[] => {
      const baseEvents: TrackingEvent[] = [
        {
          id: '1',
          status: 'confirmed',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          location: 'Order Processing Center',
          description: 'Order confirmed and payment processed',
          isCompleted: true
        },
        {
          id: '2',
          status: 'processing',
          timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          location: 'Warehouse',
          description: 'Items being prepared for shipment',
          isCompleted: ['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(status)
        },
        {
          id: '3',
          status: 'shipped',
          timestamp: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
          location: 'Distribution Center',
          description: 'Package shipped and in transit',
          isCompleted: ['shipped', 'out_for_delivery', 'delivered'].includes(status)
        },
        {
          id: '4',
          status: 'out_for_delivery',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          location: 'Local Delivery Hub',
          description: 'Out for delivery - delivery agent assigned',
          isCompleted: ['out_for_delivery', 'delivered'].includes(status)
        },
        {
          id: '5',
          status: 'delivered',
          timestamp: new Date().toISOString(),
          location: customerInfo?.address || 'Delivery Address',
          description: 'Package delivered successfully',
          isCompleted: status === 'delivered'
        }
      ];

      return baseEvents;
    };

    setTrackingEvents(generateTrackingEvents(orderStatus));
    setLastUpdated(new Date());
  }, [orderStatus, customerInfo?.address]);

  // Simulate real-time tracking updates
  useEffect(() => {
    if (orderStatus === 'shipped' || orderStatus === 'out_for_delivery') {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
        // In a real implementation, this would fetch actual tracking data
        console.log('Checking for tracking updates...');
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [orderStatus]);

  const getStatusIcon = (status: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }

    switch (status) {
      case 'confirmed':
        return <Package className="h-6 w-6 text-blue-600" />;
      case 'processing':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case 'shipped':
        return <Truck className="h-6 w-6 text-blue-600" />;
      case 'out_for_delivery':
        return <MapPin className="h-6 w-6 text-orange-600" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string, isCompleted: boolean) => {
    if (isCompleted) return 'text-green-600';
    
    switch (status) {
      case 'confirmed':
      case 'shipped':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      case 'out_for_delivery':
        return 'text-orange-600';
      case 'delivered':
        return 'text-green-600';
      default:
        return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Order Tracking</h2>
          <p className="text-gray-600">Order ID: {orderId}</p>
          {trackingNumber && (
            <p className="text-sm text-gray-500">Tracking: {trackingNumber}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-semibold text-gray-700">
            {lastUpdated.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Current Status Banner */}
      <div className={`rounded-lg p-4 mb-6 ${
        orderStatus === 'delivered' 
          ? 'bg-green-50 border border-green-200' 
          : orderStatus === 'out_for_delivery'
          ? 'bg-orange-50 border border-orange-200'
          : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-center">
          {getStatusIcon(orderStatus, orderStatus === 'delivered')}
          <div className="ml-3">
            <h3 className={`font-semibold ${getStatusColor(orderStatus, orderStatus === 'delivered')}`}>
              {orderStatus === 'confirmed' && 'Order Confirmed'}
              {orderStatus === 'processing' && 'Being Prepared'}
              {orderStatus === 'shipped' && 'In Transit'}
              {orderStatus === 'out_for_delivery' && 'Out for Delivery'}
              {orderStatus === 'delivered' && 'Delivered'}
            </h3>
            <p className="text-sm text-gray-600">
              {orderStatus === 'confirmed' && 'Your order has been confirmed and payment processed'}
              {orderStatus === 'processing' && 'Your items are being prepared for shipment'}
              {orderStatus === 'shipped' && 'Your package is on its way'}
              {orderStatus === 'out_for_delivery' && 'Your package is out for delivery today'}
              {orderStatus === 'delivered' && 'Your package has been delivered successfully'}
            </p>
          </div>
        </div>
      </div>

      {/* Estimated Delivery */}
      {estimatedDelivery && orderStatus !== 'delivered' && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-600 mr-3" />
            <div>
              <h4 className="font-semibold text-gray-800">Estimated Delivery</h4>
              <p className="text-gray-600">
                {new Date(estimatedDelivery).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Tracking Timeline</h3>
        
        {trackingEvents.map((event, index) => (
          <div key={event.id} className="flex items-start space-x-4">
            {/* Timeline Icon */}
            <div className="flex-shrink-0">
              {getStatusIcon(event.status, event.isCompleted)}
            </div>
            
            {/* Timeline Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`font-semibold ${
                  event.isCompleted ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {event.description}
                </h4>
                <span className={`text-sm ${
                  event.isCompleted ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {event.isCompleted ? formatTimestamp(event.timestamp) : 'Pending'}
                </span>
              </div>
              
              <div className="flex items-center mt-1">
                <MapPin className={`h-4 w-4 mr-1 ${
                  event.isCompleted ? 'text-gray-500' : 'text-gray-300'
                }`} />
                <span className={`text-sm ${
                  event.isCompleted ? 'text-gray-500' : 'text-gray-300'
                }`}>
                  {event.location}
                </span>
              </div>
            </div>
            
            {/* Timeline Line */}
            {index < trackingEvents.length - 1 && (
              <div className="absolute left-6 mt-8 w-0.5 h-8 bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>

      {/* Customer Support */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Need Help?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Call Support</p>
              <p className="text-sm text-gray-600">+91 1234567890</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Email Support</p>
              <p className="text-sm text-gray-600">support@cultureaft.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Updates Notice */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Real-time Updates:</strong> This page automatically refreshes with the latest tracking information. 
              You'll also receive SMS and email notifications for major status changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedOrderTracking;