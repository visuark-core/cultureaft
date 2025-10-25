/**
 * Demo page showcasing the comprehensive order notification system
 */

import React, { useState } from 'react';
import { OrderStatusDemo } from '../components/OrderStatusDemo';
import { OrderTracking } from '../components/OrderTracking';
import { NotificationHistory } from '../components/NotificationHistory';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { IssueResolution } from '../components/IssueResolution';

type DemoSection = 'overview' | 'orders' | 'tracking' | 'history' | 'preferences' | 'issues';

export const NotificationSystemDemo: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DemoSection>('overview');
  const [selectedOrderId] = useState<string>('');

  const sections = [
    { id: 'overview' as const, name: 'Overview', icon: '📋' },
    { id: 'orders' as const, name: 'Order Status Demo', icon: '📦' },
    { id: 'tracking' as const, name: 'Order Tracking', icon: '🚚' },
    { id: 'history' as const, name: 'Notification History', icon: '📜' },
    { id: 'preferences' as const, name: 'Preferences', icon: '⚙️' },
    { id: 'issues' as const, name: 'Issue Resolution', icon: '🔧' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Order Notification System Demo
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A comprehensive notification system that keeps customers informed about their orders 
                through multiple channels including email, SMS, and in-app notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">📧</span>
                  <h3 className="text-xl font-semibold text-gray-900">Email Notifications</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Rich HTML email templates for order confirmations, status updates, and shipping notifications.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Order confirmation emails</li>
                  <li>• Status update notifications</li>
                  <li>• Shipping and delivery alerts</li>
                  <li>• Issue resolution updates</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">📱</span>
                  <h3 className="text-xl font-semibold text-gray-900">SMS Notifications</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Concise SMS messages for critical order updates and time-sensitive information.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Order confirmation texts</li>
                  <li>• Shipping notifications</li>
                  <li>• Delivery confirmations</li>
                  <li>• Urgent issue alerts</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">🔔</span>
                  <h3 className="text-xl font-semibold text-gray-900">In-App Notifications</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Real-time notifications within the application for immediate user feedback.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Instant status updates</li>
                  <li>• System notifications</li>
                  <li>• Action confirmations</li>
                  <li>• Error alerts</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">📊</span>
                  <h3 className="text-xl font-semibold text-gray-900">Order Tracking</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Real-time order tracking with detailed status updates and delivery information.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Real-time status updates</li>
                  <li>• Tracking number integration</li>
                  <li>• Delivery estimates</li>
                  <li>• Order history</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">🔧</span>
                  <h3 className="text-xl font-semibold text-gray-900">Issue Resolution</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Comprehensive issue reporting and resolution workflow with customer communication.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Issue reporting system</li>
                  <li>• Resolution tracking</li>
                  <li>• Customer communication</li>
                  <li>• Satisfaction feedback</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-500">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">⚙️</span>
                  <h3 className="text-xl font-semibold text-gray-900">User Preferences</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Customizable notification preferences allowing users to control their experience.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Channel preferences</li>
                  <li>• Notification types</li>
                  <li>• Frequency settings</li>
                  <li>• Opt-out options</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">🚀 Performance</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Asynchronous notification processing</li>
                    <li>• Queue-based delivery system</li>
                    <li>• Automatic retry mechanisms</li>
                    <li>• Delivery status tracking</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">🔒 Reliability</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Fallback notification methods</li>
                    <li>• Error handling and logging</li>
                    <li>• Delivery confirmation</li>
                    <li>• Queue persistence</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">🎨 Customization</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Template-based notifications</li>
                    <li>• Variable substitution</li>
                    <li>• Multi-language support ready</li>
                    <li>• Brand customization</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">📈 Analytics</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Delivery success rates</li>
                    <li>• Channel performance metrics</li>
                    <li>• User engagement tracking</li>
                    <li>• Issue resolution statistics</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Explore the different sections using the navigation above to see the notification system in action.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {sections.slice(1).map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    {section.icon} {section.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'orders':
        return <OrderStatusDemo />;

      case 'tracking':
        return <OrderTracking orderId={selectedOrderId} />;

      case 'history':
        return <NotificationHistory userId="user123" />;

      case 'preferences':
        return <NotificationPreferences userId="user123" />;

      case 'issues':
        return <IssueResolution orderId={selectedOrderId} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Notification System Demo
              </h1>
            </div>
            <div className="flex items-center space-x-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{section.icon}</span>
                  {section.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              This demo showcases a comprehensive order notification system with email, SMS, and in-app notifications.
            </p>
            <p className="mt-1">
              In production, integrate with services like SendGrid (email), Twilio (SMS), and push notification providers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotificationSystemDemo;