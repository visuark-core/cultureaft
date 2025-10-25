/**
 * Notification history component to display past notifications
 */

import React, { useState, useEffect } from 'react';
import { orderNotificationService } from '../services/orderNotificationService';
import { notificationService, Notification } from '../services/notificationService';

interface NotificationHistoryProps {
    userId?: string;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [queueStats, setQueueStats] = useState<any>(null);
    const [deliveryStats, setDeliveryStats] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning' | 'info'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotificationData();

        // Subscribe to notification updates
        const unsubscribe = notificationService.subscribe((updatedNotifications) => {
            setNotifications(updatedNotifications);
        });

        // Refresh stats periodically
        const interval = setInterval(loadStats, 5000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const loadNotificationData = () => {
        setLoading(true);

        // Get current notifications
        const currentNotifications = notificationService.getAll();
        setNotifications(currentNotifications);

        loadStats();
        setLoading(false);
    };

    const loadStats = () => {
        // Get queue and delivery statistics
        const queueStatistics = orderNotificationService.getQueueStats();
        const deliveryStatistics = orderNotificationService.getDeliveryStats();

        setQueueStats(queueStatistics);
        setDeliveryStats(deliveryStatistics);
    };

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        return notification.type === filter;
    });

    const getTypeIcon = (type: string): string => {
        const icons: Record<string, string> = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '📋';
    };

    const getTypeColor = (type: string): string => {
        const colors: Record<string, string> = {
            success: 'text-green-600 bg-green-100 border-green-200',
            error: 'text-red-600 bg-red-100 border-red-200',
            warning: 'text-yellow-600 bg-yellow-100 border-yellow-200',
            info: 'text-blue-600 bg-blue-100 border-blue-200'
        };
        return colors[type] || 'text-gray-600 bg-gray-100 border-gray-200';
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString();
    };

    const handleClearAll = () => {
        notificationService.clearAll();
        setNotifications([]);
    };

    const handleClearByType = (type: 'success' | 'error' | 'warning' | 'info') => {
        notificationService.clearByType(type);
        const updated = notificationService.getAll();
        setNotifications(updated);
    };

    const handleExecuteAction = (notificationId: string) => {
        const success = notificationService.executeAction(notificationId);
        if (success) {
            notificationService.showSuccess('Action Executed', 'Notification action completed successfully');
        } else {
            notificationService.showError('Action Failed', 'Failed to execute notification action');
        }
    };

    const handleDismiss = (notificationId: string) => {
        notificationService.hide(notificationId);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Notification History</h2>
                    <div className="flex space-x-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Notifications</option>
                            <option value="success">Success</option>
                            <option value="error">Error</option>
                            <option value="warning">Warning</option>
                            <option value="info">Info</option>
                        </select>
                        <button
                            onClick={handleClearAll}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total Notifications</p>
                                <p className="text-2xl font-bold text-blue-900">{notifications.length}</p>
                            </div>
                            <div className="text-blue-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {queueStats && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-600">Queue Items</p>
                                    <p className="text-2xl font-bold text-purple-900">{queueStats.total}</p>
                                </div>
                                <div className="text-purple-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {deliveryStats && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Success Rate</p>
                                    <p className="text-2xl font-bold text-green-900">{deliveryStats.successRate.toFixed(1)}%</p>
                                </div>
                                <div className="text-green-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {deliveryStats && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-orange-600">Total Deliveries</p>
                                    <p className="text-2xl font-bold text-orange-900">{deliveryStats.total}</p>
                                </div>
                                <div className="text-orange-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {['success', 'error', 'warning', 'info'].map((type) => {
                        const count = notifications.filter(n => n.type === type).length;
                        return (
                            <button
                                key={type}
                                onClick={() => handleClearByType(type as any)}
                                className={`px-3 py-1 text-sm rounded-md border ${getTypeColor(type)} hover:opacity-80`}
                                disabled={count === 0}
                            >
                                Clear {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                        <p className="text-gray-600">
                            {filter === 'all'
                                ? 'No notifications to display. Create some orders to see notifications here.'
                                : `No ${filter} notifications to display.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`border rounded-lg p-4 ${getTypeColor(notification.type)}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className="flex-shrink-0 text-lg">
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-semibold">{notification.title}</h4>
                                                <span className="text-xs opacity-75">
                                                    {formatDate(notification.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm opacity-90 mb-2">{notification.message}</p>

                                            {notification.actionLabel && notification.actionCallback && (
                                                <button
                                                    onClick={() => handleExecuteAction(notification.id)}
                                                    className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded border border-current hover:bg-opacity-75 transition-colors"
                                                >
                                                    {notification.actionLabel}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                        {notification.persistent && (
                                            <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded border border-current">
                                                Persistent
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleDismiss(notification.id)}
                                            className="text-xs p-1 hover:bg-white hover:bg-opacity-25 rounded"
                                            title="Dismiss"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Queue Statistics */}
                {queueStats && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Queue Status</h3>
                            <div className="space-y-2">
                                {Object.entries(queueStats.byStatus).map(([status, count]) => (
                                    <div key={status} className="flex justify-between text-sm">
                                        <span className="capitalize text-gray-600">{status}:</span>
                                        <span className="font-medium text-gray-900">{String(count)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {deliveryStats && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Channels</h3>
                                <div className="space-y-2">
                                    {Object.entries(deliveryStats.byChannel).map(([channel, count]) => (
                                        <div key={channel} className="flex justify-between text-sm">
                                            <span className="capitalize text-gray-600">{channel}:</span>
                                            <span className="font-medium text-gray-900">{String(count)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Help Section */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">About Notifications</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                        <p>• <strong>Success:</strong> Order confirmations, successful deliveries, and completed actions</p>
                        <p>• <strong>Info:</strong> Status updates, shipping notifications, and general information</p>
                        <p>• <strong>Warning:</strong> Delivery delays, payment issues, and attention-required items</p>
                        <p>• <strong>Error:</strong> Failed operations, system errors, and critical issues</p>
                        <p>• <strong>Persistent:</strong> Important notifications that require manual dismissal</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationHistory;