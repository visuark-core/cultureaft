import React, { useState, useEffect } from 'react';
import {
    Users,
    MapPin,
    Clock,
    Star,
    TrendingUp,
    Package,
    CheckCircle,
    XCircle,
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    MoreVertical,
    Phone,
    Mail,
    Navigation
} from 'lucide-react';

interface DeliveryAgent {
    _id: string;
    profile: {
        employeeId: string;
        name: string;
        phone: string;
        email: string;
        photo?: string;
    };
    employment: {
        status: 'active' | 'inactive' | 'suspended' | 'terminated';
        joinDate: string;
    };
    availability: {
        isAvailable: boolean;
        currentOrders: string[];
        maxOrders: number;
    };
    performance: {
        totalDeliveries: number;
        successfulDeliveries: number;
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
        model?: string;
        registrationNumber?: string;
    };
}

interface DeliveryAgentStats {
    totalAgents: number;
    activeAgents: number;
    availableAgents: number;
    suspendedAgents: number;
    performance: {
        averageRating: number;
        averageDeliveries: number;
        totalDeliveries: number;
        successfulDeliveries: number;
        averageSuccessRate: number;
    };
    topPerformers: DeliveryAgent[];
}

const DeliveryAgents: React.FC = () => {
    const [agents, setAgents] = useState<DeliveryAgent[]>([]);
    const [stats, setStats] = useState<DeliveryAgentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [selectedAgent, setSelectedAgent] = useState<DeliveryAgent | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchDeliveryAgents();
        fetchStats();
    }, [currentPage, searchTerm, statusFilter, availabilityFilter]);

    const fetchDeliveryAgents = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                search: searchTerm,
                status: statusFilter,
                isAvailable: availabilityFilter === 'all' ? '' : availabilityFilter
            });

            const response = await fetch(`/api/admin/delivery-agents?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAgents(data.data.deliveryAgents);
                setTotalPages(data.data.totalPages);
                setTotalCount(data.data.totalCount);
            }
        } catch (error) {
            console.error('Error fetching delivery agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/delivery-agents/statistics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching delivery agent statistics:', error);
        }
    };

    const handleStatusChange = async (agentId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/delivery-agents/${agentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    employment: { status: newStatus }
                })
            });

            if (response.ok) {
                fetchDeliveryAgents();
                fetchStats();
            }
        } catch (error) {
            console.error('Error updating agent status:', error);
        }
    };

    const handleAssignOrder = async (agentId: string, orderId: string) => {
        try {
            const response = await fetch(`/api/admin/delivery-agents/${agentId}/assign-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ orderId })
            });

            if (response.ok) {
                fetchDeliveryAgents();
            }
        } catch (error) {
            console.error('Error assigning order:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100';
            case 'inactive': return 'text-gray-600 bg-gray-100';
            case 'suspended': return 'text-red-600 bg-red-100';
            case 'terminated': return 'text-red-800 bg-red-200';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getAvailabilityColor = (isAvailable: boolean) => {
        return isAvailable ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100';
    };

    const filteredAgents = agents.filter(agent => {
        const matchesSearch = agent.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.profile.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.profile.phone.includes(searchTerm) ||
            agent.profile.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || agent.employment.status === statusFilter;
        const matchesAvailability = availabilityFilter === 'all' ||
            agent.availability.isAvailable.toString() === availabilityFilter;

        return matchesSearch && matchesStatus && matchesAvailability;
    });

    if (loading && agents.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Delivery Agents</h1>
                    <p className="text-gray-600">Manage delivery agents and track performance</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add Agent
                </button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                                <p className="text-2xl font-bold text-green-600">{stats.activeAgents}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Available Now</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.availableAgents}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {stats.performance?.averageRating?.toFixed(1) || '0.0'}
                                </p>
                            </div>
                            <Star className="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="terminated">Terminated</option>
                    </select>

                    <select
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Availability</option>
                        <option value="true">Available</option>
                        <option value="false">Busy</option>
                    </select>
                </div>
            </div>

            {/* Agents Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Agent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Availability
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Performance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Current Orders
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vehicle
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAgents.map((agent) => (
                                <tr key={agent._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {agent.profile.photo ? (
                                                    <img
                                                        className="h-10 w-10 rounded-full"
                                                        src={agent.profile.photo}
                                                        alt={agent.profile.name}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {agent.profile.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {agent.profile.employeeId}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                    <span className="text-xs text-gray-500">{agent.profile.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(agent.employment.status)}`}>
                                            {agent.employment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityColor(agent.availability.isAvailable)}`}>
                                            {agent.availability.isAvailable ? 'Available' : 'Busy'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 text-yellow-400" />
                                                <span>{agent.performance.customerRating.toFixed(1)}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {agent.performance.totalDeliveries} deliveries
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {agent.performance.deliverySuccessRate.toFixed(1)}% success
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {agent.availability.currentOrders.length} / {agent.availability.maxOrders}
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(agent.availability.currentOrders.length / agent.availability.maxOrders) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 capitalize">
                                            {agent.vehicle.type}
                                        </div>
                                        {agent.vehicle.model && (
                                            <div className="text-xs text-gray-500">
                                                {agent.vehicle.model}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedAgent(agent);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View Details"
                                            >
                                                <Navigation className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedAgent(agent);
                                                    setShowEditModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <div className="relative">
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * itemsPerPage, totalCount)}
                                    </span>{' '}
                                    of <span className="font-medium">{totalCount}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const page = i + 1;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Top Performers Section */}
            {stats?.topPerformers && stats.topPerformers.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.topPerformers.slice(0, 6).map((agent, index) => (
                            <div key={agent._id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                            index === 1 ? 'bg-gray-100 text-gray-800' :
                                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-gray-900">{agent.profile.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-400" />
                                        <span className="text-sm font-medium">{agent.performance.customerRating.toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <div>{agent.performance.totalDeliveries} deliveries</div>
                                    <div>{agent.performance.deliverySuccessRate.toFixed(1)}% success rate</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryAgents;