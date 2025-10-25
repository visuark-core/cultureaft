/**
 * Issue resolution component for handling order problems
 */

import React, { useState, useEffect } from 'react';
import { Order } from '../types/order';
import { orderService } from '../services/orderService';
import { notificationService } from '../services/notificationService';

interface Issue {
  id: string;
  orderId: string;
  type: 'delivery' | 'damage' | 'missing' | 'quality' | 'other';
  description: string;
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reportedAt: string;
  resolvedAt?: string;
  resolution?: string;
  nextSteps?: string;
  customerSatisfied?: boolean;
}

interface IssueResolutionProps {
  orderId?: string;
  onClose?: () => void;
}

export const IssueResolution: React.FC<IssueResolutionProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newIssue, setNewIssue] = useState({
    type: 'other' as Issue['type'],
    description: '',
    priority: 'medium' as Issue['priority']
  });

  useEffect(() => {
    if (orderId) {
      loadOrderAndIssues(orderId);
    }
  }, [orderId]);

  const loadOrderAndIssues = (orderIdToLoad: string) => {
    const orderDetails = orderService.getOrder(orderIdToLoad);
    setOrder(orderDetails || null);
    
    // Mock issues data - in production, this would come from a database
    const mockIssues: Issue[] = [
      {
        id: 'issue1',
        orderId: orderIdToLoad,
        type: 'delivery',
        description: 'Package was not delivered to the correct address',
        status: 'resolved',
        priority: 'high',
        reportedAt: new Date(Date.now() - 86400000).toISOString(),
        resolvedAt: new Date(Date.now() - 43200000).toISOString(),
        resolution: 'Package was redirected to the correct address and delivered successfully',
        nextSteps: 'No further action required',
        customerSatisfied: true
      }
    ];
    
    setIssues(mockIssues.filter(issue => issue.orderId === orderIdToLoad));
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order || !newIssue.description.trim()) {
      notificationService.showError('Error', 'Please provide a description of the issue');
      return;
    }

    setLoading(true);

    try {
      const issue: Issue = {
        id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        orderId: order.id,
        type: newIssue.type,
        description: newIssue.description,
        status: 'reported',
        priority: newIssue.priority,
        reportedAt: new Date().toISOString()
      };

      // Add to issues list
      setIssues(prev => [issue, ...prev]);

      // Send notification to customer
      await orderService.reportOrderIssue(
        order.id,
        newIssue.description,
        'We have received your report and are investigating the issue',
        'We will provide an update within 24 hours'
      );

      // Reset form
      setNewIssue({
        type: 'other',
        description: '',
        priority: 'medium'
      });
      setShowReportForm(false);

      notificationService.showSuccess(
        'Issue Reported',
        'Your issue has been reported and we will investigate it promptly'
      );

    } catch (error) {
      console.error('Error reporting issue:', error);
      notificationService.showError(
        'Error',
        'Failed to report the issue. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue || !order) return;

    try {
      const resolution = prompt('Enter resolution description:');
      if (!resolution) return;

      const nextSteps = prompt('Enter next steps for customer:') || 'No further action required';

      // Update issue status
      const updatedIssues = issues.map(i => 
        i.id === issueId 
          ? { 
              ...i, 
              status: 'resolved' as const, 
              resolvedAt: new Date().toISOString(),
              resolution,
              nextSteps
            }
          : i
      );
      setIssues(updatedIssues);

      // Send resolution notification
      await orderService.reportOrderIssue(
        order.id,
        issue.description,
        resolution,
        nextSteps
      );

      notificationService.showSuccess(
        'Issue Resolved',
        'Resolution notification sent to customer'
      );

    } catch (error) {
      console.error('Error resolving issue:', error);
      notificationService.showError(
        'Error',
        'Failed to resolve the issue. Please try again.'
      );
    }
  };

  const getIssueTypeIcon = (type: Issue['type']): string => {
    const icons = {
      delivery: '🚚',
      damage: '📦',
      missing: '❓',
      quality: '⭐',
      other: '❗'
    };
    return icons[type] || '❗';
  };

  const getIssueTypeLabel = (type: Issue['type']): string => {
    const labels = {
      delivery: 'Delivery Issue',
      damage: 'Damaged Item',
      missing: 'Missing Item',
      quality: 'Quality Issue',
      other: 'Other Issue'
    };
    return labels[type] || 'Other Issue';
  };

  const getStatusColor = (status: Issue['status']): string => {
    const colors = {
      reported: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      investigating: 'bg-blue-100 text-blue-800 border-blue-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: Issue['priority']): string => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <p className="text-gray-500">Order not found or not specified</p>
            {onClose && (
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Issue Resolution</h2>
            <p className="text-gray-600">Order {order.id}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Report Issue
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Order Summary</h3>
              <p className="text-sm text-gray-600">
                Status: <span className="capitalize">{order.status}</span> | 
                Total: {order.currency} {order.totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Placed: {new Date(order.createdAt).toLocaleDateString()}
              </p>
              {order.trackingNumber && (
                <p className="text-sm text-gray-600">
                  Tracking: {order.trackingNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Report Issue Form */}
        {showReportForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Report New Issue</h3>
            <form onSubmit={handleReportIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Type
                </label>
                <select
                  value={newIssue.type}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, type: e.target.value as Issue['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="delivery">Delivery Issue</option>
                  <option value="damage">Damaged Item</option>
                  <option value="missing">Missing Item</option>
                  <option value="quality">Quality Issue</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newIssue.priority}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, priority: e.target.value as Issue['priority'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newIssue.description}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Reporting...' : 'Report Issue'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Issues List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Issues ({issues.length})
          </h3>
          
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Issues Reported</h4>
              <p className="text-gray-600">
                This order has no reported issues. If you're experiencing any problems, 
                please use the "Report Issue" button above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`border rounded-lg p-4 ${getStatusColor(issue.status)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getIssueTypeIcon(issue.type)}</span>
                      <div>
                        <h4 className="font-semibold">{getIssueTypeLabel(issue.type)}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
                            {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority
                          </span>
                          <span className="text-xs text-gray-600">
                            Reported: {new Date(issue.reportedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(issue.status)}`}>
                        {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                      </span>
                      
                      {issue.status === 'reported' && (
                        <button
                          onClick={() => handleResolveIssue(issue.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">Description:</p>
                    <p className="text-sm text-gray-700">{issue.description}</p>
                  </div>

                  {issue.resolution && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Resolution:</p>
                      <p className="text-sm text-gray-700">{issue.resolution}</p>
                      {issue.resolvedAt && (
                        <p className="text-xs text-gray-600 mt-1">
                          Resolved: {new Date(issue.resolvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {issue.nextSteps && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Next Steps:</p>
                      <p className="text-sm text-gray-700">{issue.nextSteps}</p>
                    </div>
                  )}

                  {issue.status === 'resolved' && issue.customerSatisfied !== undefined && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Customer Satisfaction:</span>
                      <span className={`text-sm ${issue.customerSatisfied ? 'text-green-600' : 'text-red-600'}`}>
                        {issue.customerSatisfied ? '✅ Satisfied' : '❌ Not Satisfied'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Issue Resolution Process</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>1. <strong>Report:</strong> Customer or support team reports an issue</p>
            <p>2. <strong>Investigate:</strong> Support team investigates the problem</p>
            <p>3. <strong>Resolve:</strong> Issue is resolved and customer is notified</p>
            <p>4. <strong>Close:</strong> Customer confirms satisfaction and issue is closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueResolution;