import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  Flag
} from 'lucide-react';
import { supportService } from '../services/supportService';
import { SupportTicket, SupportStats } from '../types/support';

const SupportManagement = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, statsData] = await Promise.all([
        supportService.getAllTickets(),
        supportService.getSupportStats()
      ]);
      setTickets(ticketsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      await supportService.updateTicketStatus(ticketId, newStatus);
      await supportService.sendEmailNotification(ticketId, 'updated');
      loadData();
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleAddResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return;

    try {
      setIsSubmittingResponse(true);
      await supportService.addResponse(selectedTicket.id, responseMessage, true);
      await supportService.sendEmailNotification(selectedTicket.id, 'updated');
      
      // Reload the selected ticket to show the new response
      const updatedTicket = await supportService.getTicketById(selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
      
      setResponseMessage('');
      loadData();
    } catch (error) {
      console.error('Error adding response:', error);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_for_customer': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageResponseTime}h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Support Tickets</h2>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_for_customer">Waiting</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No tickets found matching your criteria.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">#{ticket.ticketNumber}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <Flag className={`h-4 w-4 ${getPriorityColor(ticket.priority)}`} />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600 mb-2">{ticket.name} • {ticket.email}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()} • {ticket.category}
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white rounded-lg shadow-md">
          {selectedTicket ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Ticket Details</h3>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusUpdate(selectedTicket.id, e.target.value as SupportTicket['status'])}
                  className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_customer">Waiting for Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-sm font-medium text-gray-600">Ticket #</span>
                  <p className="text-gray-900">{selectedTicket.ticketNumber}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">Subject</span>
                  <p className="text-gray-900">{selectedTicket.subject}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Priority</span>
                    <p className={`capitalize ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Category</span>
                    <p className="text-gray-900 capitalize">{selectedTicket.category}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">Customer</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{selectedTicket.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{selectedTicket.email}</span>
                  </div>
                  {selectedTicket.phone && (
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{selectedTicket.phone}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">Created</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">Message</span>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              {/* Responses */}
              {selectedTicket.responses.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Responses</h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {selectedTicket.responses.map((response) => (
                      <div
                        key={response.id}
                        className={`p-3 rounded-lg ${
                          response.isFromSupport ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {response.authorName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{response.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Response */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Add Response
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Type your response..."
                />
                <button
                  onClick={handleAddResponse}
                  disabled={!responseMessage.trim() || isSubmittingResponse}
                  className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmittingResponse ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      <span>Send Response</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportManagement;