import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Star, 
  MapPin, 
  Clock, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  Zap
} from 'lucide-react';

interface DeliveryAgent {
  _id: string;
  profile: {
    employeeId: string;
    name: string;
    phone: string;
    email: string;
  };
  availability: {
    isAvailable: boolean;
    currentOrders: string[];
    maxOrders: number;
  };
  performance: {
    totalDeliveries: number;
    customerRating: number;
    deliverySuccessRate: number;
    onTimeDeliveryRate: number;
  };
  location: {
    assignedZones: Array<{
      name: string;
      pincodes: string[];
    }>;
  };
  vehicle: {
    type: string;
  };
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  shipping: {
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  delivery?: {
    priority?: string;
    assignedAgent?: any;
  };
}

interface DeliveryAgentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onAssign: (assignments: { orderId: string; agentId: string }[]) => void;
}

const DeliveryAgentAssignmentModal: React.FC<DeliveryAgentAssignmentModalProps> = ({
  isOpen,
  onClose,
  orders,
  onAssign
}) => {
  const [availableAgents, setAvailableAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState<{ [orderId: string]: string }>({});
  const [autoAssignMode, setAutoAssignMode] = useState(false);

  useEffect(() => {
    if (isOpen && orders.length > 0) {
      fetchAvailableAgents();
    }
  }, [isOpen, orders]);

  const fetchAvailableAgents = async () => {
    try {
      setLoading(true);
      // Get unique pincodes from orders
      const pincodes = [...new Set(orders.map(order => order.shipping.address.pincode))];
      
      // Fetch available agents for each pincode
      const agentPromises = pincodes.map(pincode =>
        fetch(`/api/admin/delivery-agents/available?pincode=${pincode}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }).then(res => res.json())
      );

      const responses = await Promise.all(agentPromises);
      const allAgents = responses.flatMap(response => 
        response.success ? response.data : []
      );

      // Remove duplicates
      const uniqueAgents = allAgents.filter((agent, index, self) =>
        index === self.findIndex(a => a._id === agent._id)
      );

      setAvailableAgents(uniqueAgents);
    } catch (error) {
      console.error('Error fetching available agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      const orderIds = orders.map(order => order._id);
      
      const response = await fetch('/api/admin/delivery-agents/auto-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ orderIds })
      });

      if (response.ok) {
        const data = await response.json();
        const autoAssignments: { [orderId: string]: string } = {};
        
        data.data.successful.forEach((assignment: any) => {
          autoAssignments[assignment.orderId] = assignment.agentId;
        });

        setAssignments(autoAssignments);
      }
    } catch (error) {
      console.error('Error auto-assigning orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = (orderId: string, agentId: string) => {
    setAssignments(prev => ({
      ...prev,
      [orderId]: agentId
    }));
  };

  const handleSubmit = () => {
    const assignmentList = Object.entries(assignments).map(([orderId, agentId]) => ({
      orderId,
      agentId
    }));
    
    onAssign(assignmentList);
    onClose();
  };

  const getAgentWorkload = (agent: DeliveryAgent) => {
    const currentLoad = agent.availability.currentOrders.length;
    const maxLoad = agent.availability.maxOrders;
    return (currentLoad / maxLoad) * 100;
  };

  const getAgentScore = (agent: DeliveryAgent) => {
    const ratingScore = (agent.performance.customerRating / 5) * 40;
    const successScore = (agent.performance.deliverySuccessRate / 100) * 30;
    const availabilityScore = (1 - (getAgentWorkload(agent) / 100)) * 30;
    return ratingScore + successScore + availabilityScore;
  };

  const filteredAgents = availableAgents
    .filter(agent => 
      agent.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.profile.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => getAgentScore(b) - getAgentScore(a));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Assign Delivery Agents
            </h2>
            <p className="text-sm text-gray-600">
              Assign {orders.length} order{orders.length > 1 ? 's' : ''} to available delivery agents
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Auto-assign option */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Smart Auto-Assignment</h3>
                  <p className="text-sm text-blue-700">
                    Automatically assign orders to the best available agents based on performance and location
                  </p>
                </div>
              </div>
              <button
                onClick={handleAutoAssign}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Auto Assign'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders to Assign */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders to Assign</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.map((order) => (
                  <div key={order._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {order.orderNumber}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.delivery?.priority === 'urgent' 
                          ? 'bg-red-100 text-red-800'
                          : order.delivery?.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.delivery?.priority || 'normal'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{order.customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {order.shipping.address.city}, {order.shipping.address.pincode}
                        </span>
                      </div>
                    </div>
                    
                    {/* Assignment Status */}
                    {assignments[order._id] && (
                      <div className="mt-2 p-2 bg-green-50 rounded border">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Assigned to: {
                              availableAgents.find(a => a._id === assignments[order._id])?.profile.name || 'Agent'
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Available Agents */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Available Agents</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No available agents found
                  </div>
                ) : (
                  filteredAgents.map((agent) => (
                    <div key={agent._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {agent.profile.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {agent.profile.employeeId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {agent.performance.customerRating.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Score: {getAgentScore(agent).toFixed(0)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                        <div>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{agent.performance.totalDeliveries} deliveries</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>{agent.performance.deliverySuccessRate.toFixed(1)}% success</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{agent.performance.onTimeDeliveryRate.toFixed(1)}% on-time</span>
                          </div>
                          <div className="capitalize">
                            Vehicle: {agent.vehicle.type}
                          </div>
                        </div>
                      </div>

                      {/* Current Workload */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Current Load</span>
                          <span>
                            {agent.availability.currentOrders.length} / {agent.availability.maxOrders}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              getAgentWorkload(agent) > 80 ? 'bg-red-500' :
                              getAgentWorkload(agent) > 60 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${getAgentWorkload(agent)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Assignment Buttons */}
                      <div className="flex gap-2">
                        {orders.map((order) => (
                          <button
                            key={order._id}
                            onClick={() => handleManualAssign(order._id, agent._id)}
                            disabled={assignments[order._id] === agent._id}
                            className={`px-2 py-1 text-xs rounded ${
                              assignments[order._id] === agent._id
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            {assignments[order._id] === agent._id ? 'Assigned' : `Assign ${order.orderNumber}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Assignment Summary */}
          {Object.keys(assignments).length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Assignment Summary</h4>
              <div className="text-sm text-gray-600">
                {Object.keys(assignments).length} of {orders.length} orders assigned
              </div>
              <div className="mt-2 space-y-1">
                {Object.entries(assignments).map(([orderId, agentId]) => {
                  const order = orders.find(o => o._id === orderId);
                  const agent = availableAgents.find(a => a._id === agentId);
                  return (
                    <div key={orderId} className="flex items-center justify-between text-xs">
                      <span>{order?.orderNumber}</span>
                      <span>→ {agent?.profile.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={Object.keys(assignments).length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Assign Orders ({Object.keys(assignments).length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAgentAssignmentModal;