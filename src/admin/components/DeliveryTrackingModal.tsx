import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Navigation, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Camera,
  FileText,
  RefreshCw
} from 'lucide-react';

interface DeliveryAttempt {
  attemptNumber: number;
  attemptDate: string;
  status: 'successful' | 'failed' | 'rescheduled';
  reason?: string;
  notes?: string;
  deliveryAgent: {
    _id: string;
    profile: {
      name: string;
      phone: string;
    };
  };
  nextAttemptDate?: string;
}

interface DeliveryProof {
  type: 'signature' | 'photo' | 'otp' | 'biometric';
  data: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  verifiedBy?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  shipping: {
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      landmark?: string;
    };
    estimatedDelivery: string;
    actualDelivery?: string;
  };
  delivery: {
    assignedAgent?: {
      _id: string;
      profile: {
        name: string;
        phone: string;
        employeeId: string;
      };
    };
    attempts: DeliveryAttempt[];
    proof?: DeliveryProof;
    deliveryStatus: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
      timestamp: string;
    };
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
  };
  status: string;
}

interface DeliveryTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const DeliveryTrackingModal: React.FC<DeliveryTrackingModalProps> = ({
  isOpen,
  onClose,
  orderId
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [attemptData, setAttemptData] = useState({
    status: 'successful' as 'successful' | 'failed' | 'rescheduled',
    reason: '',
    notes: '',
    nextAttemptDate: ''
  });
  const [proofData, setProofData] = useState({
    type: 'signature' as 'signature' | 'photo' | 'otp' | 'biometric',
    data: '',
    verifiedBy: '',
    location: { latitude: 0, longitude: 0 }
  });

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAttempt = async () => {
    try {
      const response = await fetch('/api/admin/delivery-agents/record-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          orderId,
          ...attemptData
        })
      });

      if (response.ok) {
        setShowAttemptModal(false);
        setAttemptData({
          status: 'successful',
          reason: '',
          notes: '',
          nextAttemptDate: ''
        });
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error recording delivery attempt:', error);
    }
  };

  const handleUploadProof = async () => {
    try {
      const response = await fetch('/api/admin/delivery-agents/upload-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          orderId,
          ...proofData
        })
      });

      if (response.ok) {
        setShowProofModal(false);
        setProofData({
          type: 'signature',
          data: '',
          verifiedBy: '',
          location: { latitude: 0, longitude: 0 }
        });
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error uploading delivery proof:', error);
    }
  };

  const updateAgentLocation = async () => {
    if (!order?.delivery.assignedAgent) return;

    try {
      // Get current location (in a real app, this would use geolocation API)
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        const response = await fetch(`/api/admin/delivery-agents/${order.delivery.assignedAgent!._id}/update-location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({
            latitude,
            longitude,
            accuracy: position.coords.accuracy
          })
        });

        if (response.ok) {
          fetchOrderDetails();
        }
      });
    } catch (error) {
      console.error('Error updating agent location:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'out_for_delivery': return 'text-blue-600 bg-blue-100';
      case 'assigned': return 'text-purple-600 bg-purple-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'rescheduled': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAttemptStatusIcon = (status: string) => {
    switch (status) {
      case 'successful': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'rescheduled': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Delivery Tracking - {order?.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : order ? (
          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{order.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{order.customer.phone}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Delivery Address</h3>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <div>
                        <div>{order.shipping.address.street}</div>
                        <div>{order.shipping.address.city}, {order.shipping.address.state}</div>
                        <div>{order.shipping.address.pincode}</div>
                        {order.shipping.address.landmark && (
                          <div className="text-xs text-gray-500">
                            Landmark: {order.shipping.address.landmark}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Status */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Delivery Status</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.delivery.deliveryStatus)}`}>
                  {order.delivery.deliveryStatus.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {order.delivery.assignedAgent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.delivery.assignedAgent.profile.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {order.delivery.assignedAgent.profile.employeeId}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span>{order.delivery.assignedAgent.profile.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={updateAgentLocation}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Update Location"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowAttemptModal(true)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Record Attempt
                      </button>
                      {order.delivery.deliveryStatus === 'out_for_delivery' && (
                        <button
                          onClick={() => setShowProofModal(true)}
                          className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          Upload Proof
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Current Location */}
                  {order.delivery.currentLocation && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Current Location</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        <div>Lat: {order.delivery.currentLocation.latitude}</div>
                        <div>Lng: {order.delivery.currentLocation.longitude}</div>
                        <div className="text-xs text-blue-600">
                          Updated: {new Date(order.delivery.currentLocation.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estimated vs Actual Delivery */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.delivery.estimatedDeliveryTime && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-900">Estimated Delivery</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(order.delivery.estimatedDeliveryTime).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {order.delivery.actualDeliveryTime && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900">Actual Delivery</span>
                        </div>
                        <div className="text-sm text-green-700">
                          {new Date(order.delivery.actualDeliveryTime).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No delivery agent assigned yet
                </div>
              )}
            </div>

            {/* Delivery Attempts */}
            {order.delivery.attempts && order.delivery.attempts.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Delivery Attempts</h3>
                <div className="space-y-3">
                  {order.delivery.attempts.map((attempt, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getAttemptStatusIcon(attempt.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            Attempt #{attempt.attemptNumber}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(attempt.attemptDate).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Status: <span className="capitalize">{attempt.status}</span></div>
                          {attempt.reason && <div>Reason: {attempt.reason}</div>}
                          {attempt.notes && <div>Notes: {attempt.notes}</div>}
                          {attempt.nextAttemptDate && (
                            <div>Next Attempt: {new Date(attempt.nextAttemptDate).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Proof */}
            {order.delivery.proof && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Delivery Proof</h3>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">
                      Proof Type: {order.delivery.proof.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>Timestamp: {new Date(order.delivery.proof.timestamp).toLocaleString()}</div>
                    {order.delivery.proof.verifiedBy && (
                      <div>Verified by: {order.delivery.proof.verifiedBy}</div>
                    )}
                    {order.delivery.proof.location && (
                      <div>
                        Location: {order.delivery.proof.location.latitude}, {order.delivery.proof.location.longitude}
                      </div>
                    )}
                  </div>
                  {order.delivery.proof.type === 'photo' && order.delivery.proof.data && (
                    <div className="mt-3">
                      <img
                        src={`data:image/jpeg;base64,${order.delivery.proof.data}`}
                        alt="Delivery proof"
                        className="max-w-xs rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Order not found
          </div>
        )}

        {/* Record Attempt Modal */}
        {showAttemptModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Record Delivery Attempt</h3>
                <button
                  onClick={() => setShowAttemptModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={attemptData.status}
                    onChange={(e) => setAttemptData({ ...attemptData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="successful">Successful</option>
                    <option value="failed">Failed</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={attemptData.reason}
                    onChange={(e) => setAttemptData({ ...attemptData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter reason..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={attemptData.notes}
                    onChange={(e) => setAttemptData({ ...attemptData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>
                {attemptData.status === 'rescheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Attempt Date
                    </label>
                    <input
                      type="datetime-local"
                      value={attemptData.nextAttemptDate}
                      onChange={(e) => setAttemptData({ ...attemptData, nextAttemptDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <button
                  onClick={() => setShowAttemptModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordAttempt}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Record Attempt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Proof Modal */}
        {showProofModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Upload Delivery Proof</h3>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proof Type
                  </label>
                  <select
                    value={proofData.type}
                    onChange={(e) => setProofData({ ...proofData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="signature">Signature</option>
                    <option value="photo">Photo</option>
                    <option value="otp">OTP</option>
                    <option value="biometric">Biometric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proof Data
                  </label>
                  <textarea
                    value={proofData.data}
                    onChange={(e) => setProofData({ ...proofData, data: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter proof data (e.g., base64 encoded image)..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verified By
                  </label>
                  <input
                    type="text"
                    value={proofData.verifiedBy}
                    onChange={(e) => setProofData({ ...proofData, verifiedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer name or ID..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <button
                  onClick={() => setShowProofModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadProof}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload Proof
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryTrackingModal;