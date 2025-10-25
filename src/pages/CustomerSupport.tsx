import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, Clock, Send, User, FileText, HelpCircle, Book } from 'lucide-react';
import { supportService } from '../services/supportService';
import { SupportFormData } from '../types/support';
import FAQ from '../components/FAQ';
import HelpDocumentation from '../components/HelpDocumentation';

const CustomerSupport = () => {
  const [activeTab, setActiveTab] = useState<'contact' | 'faq' | 'help'>('contact');
  const [formData, setFormData] = useState<SupportFormData>({
    name: '',
    email: '',
    phone: '',
    category: '',
    priority: 'medium',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const supportCategories = [
    { value: 'order', label: 'Order Issues' },
    { value: 'product', label: 'Product Information' },
    { value: 'shipping', label: 'Shipping & Delivery' },
    { value: 'returns', label: 'Returns & Refunds' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'general', label: 'General Inquiry' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const ticket = await supportService.createTicket(formData);
      
      // Send email notification
      await supportService.sendEmailNotification(ticket.id, 'created');
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: '',
        priority: 'medium',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting support request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Customer Support</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're here to help! Get in touch with our support team for any questions or assistance you need.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 flex">
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'contact'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Contact Support</span>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'faq'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <HelpCircle className="h-5 w-5" />
              <span>FAQ</span>
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'help'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Book className="h-5 w-5" />
              <span>Help Docs</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Contact Methods</h2>
              
              <div className="space-y-4">
                {/* Phone Support */}
                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-600 p-2 rounded-full">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Phone Support</h3>
                    <p className="text-gray-600 text-sm mb-2">Call us for immediate assistance</p>
                    <p className="font-medium text-blue-600">+917878539633</p>
                    <p className="text-xs text-gray-500">Mon-Fri: 9AM-6PM IST</p>
                  </div>
                </div>

                {/* Email Support */}
                <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg">
                  <div className="bg-orange-600 p-2 rounded-full">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Email Support</h3>
                    <p className="text-gray-600 text-sm mb-2">Send us a detailed message</p>
                    <p className="font-medium text-orange-600">support@culturaft.com</p>
                    <p className="text-xs text-gray-500">Response within 24 hours</p>
                  </div>
                </div>

                {/* Live Chat */}
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                  <div className="bg-green-600 p-2 rounded-full">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Live Chat</h3>
                    <p className="text-gray-600 text-sm mb-2">Chat with our support team</p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                      Start Chat
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Available 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Business Hours
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM IST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM IST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Support Request Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Submit a Support Request</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    Your support request has been submitted successfully! We'll get back to you within 24 hours.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    There was an error submitting your request. Please try again or contact us directly.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {supportCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description of your issue"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Please provide detailed information about your issue or question..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'faq' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <FAQ />
          </div>
        )}

        {activeTab === 'help' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <HelpDocumentation />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSupport;