import React, { useState } from 'react';
import {
  X,
  History,
  User,
  Bot,
  MapPin,
  Plus,
  Save,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Order } from '../../types/order';
import { toast } from 'react-toastify';

interface OrderTimelineModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onAddTimelineEvent?: (orderId: string, status: string, notes: string) => Promise<void>;
}

const OrderTimelineModal: React.FC<OrderTimelineModalProps> = ({
  order,
  isOpen,
  onClose,
  onAddTimelineEvent
}) => {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventStatus, setNewEventStatus] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'confirmed':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'cancelled':
      case 'returned':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return '✅';
      case 'shipped':
      case 'out_for_delivery':
        return '🚚';
      case 'processing':
        return '⚙️';
      case 'confirmed':
        return '✔️';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '❌';
      case 'returned':
        return '↩️';
      case 'refunded':
        return '💰';
      default:
        return '📦';
    }
  };

  const handleAddEvent = async () => {
    if (!newEventStatus || !newEventNotes.trim()) {
      toast.error('Please select a status and add notes');
      return;
    }

    if (!onAddTimelineEvent) {
      toast.error('Adding timeline events is not supported');
      return;
    }

    setLoading(true);
    try {
      await onAddTimelineEvent(order._id, newEventStatus, newEventNotes.trim());
      setShowAddEvent(false);
      setNewEventStatus('');
      setNewEventNotes('');
      toast.success('Timeline event added successfully');
    } catch (error) {
      toast.error('Failed to add timeline event');
    } finally {
      setLoading(false);
    }
  };

  const formatTimelineDate = (date: string | Date) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString(),
      relative: getRelativeTime(d)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const sortedTimeline = order.timeline ? [...order.timeline].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <History className="h-5 w-5 mr-2" />
                Order Timeline
              </h2>
              <p className="text-purple-100 text-sm">{order.orderId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Add Event Button */}
        {onAddTimelineEvent && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            {!showAddEvent ? (
              <button
                onClick={() => setShowAddEvent(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Timeline Event
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newEventStatus}
                      onChange={(e) => setNewEventStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select status...</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={newEventNotes}
                      onChange={(e) => setNewEventNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Add notes for this event..."
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddEvent}
                    disabled={loading || !newEventStatus || !newEventNotes.trim()}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    {loading ? 'Adding...' : 'Add Event'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddEvent(false);
                      setNewEventStatus('');
                      setNewEventNotes('');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {sortedTimeline.length > 0 ? (
            <div className="space-y-6">
              {sortedTimeline.map((event, index) => {
                const timeInfo = formatTimelineDate(event.timestamp);
                return (
                  <div key={index} className="relative">
                    {/* Timeline Line */}
                    {index < sortedTimeline.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      {/* Status Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 ${getStatusBadgeColor(event.status)}`}>
                        {getStatusIcon(event.status)}
                      </div>
                      
                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-lg font-medium text-gray-900 capitalize">
                            {event.status.replace('_', ' ')}
                          </h4>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{timeInfo.relative}</p>
                            <p className="text-xs text-gray-400">{timeInfo.date} at {timeInfo.time}</p>
                          </div>
                        </div>
                        
                        {event.notes && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-2">
                            <div className="flex items-start">
                              <MessageSquare className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700">{event.notes}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            {event.automated ? (
                              <>
                                <Bot className="h-3 w-3 mr-1" />
                                <span>Automated</span>
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                <span>Manual Update</span>
                              </>
                            )}
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{timeInfo.date}</span>
                          </div>
                        </div>
                        
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            <details className="cursor-pointer">
                              <summary className="hover:text-gray-700">Additional Details</summary>
                              <div className="mt-1 bg-gray-100 rounded p-2 font-mono text-xs">
                                <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No timeline events available for this order</p>
              <p className="text-sm text-gray-400 mt-1">Timeline events will appear here as the order progresses</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {sortedTimeline.length > 0 && (
                <span>
                  {sortedTimeline.length} timeline event{sortedTimeline.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTimelineModal;