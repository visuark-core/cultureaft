import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle, Book, ShoppingCart, Truck, RotateCcw, CreditCard } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const faqData: FAQItem[] = [
    // General Questions
    {
      id: '1',
      category: 'general',
      question: 'What is CultureAft?',
      answer: 'CultureAft is a premium online marketplace specializing in authentic Indian handicrafts, furniture, and home decor items. We connect skilled artisans with customers worldwide, offering unique, handcrafted pieces that celebrate Indian heritage and craftsmanship.'
    },
    {
      id: '2',
      category: 'general',
      question: 'Are your products authentic?',
      answer: 'Yes, all our products are 100% authentic and handcrafted by skilled artisans. We work directly with craftspeople and cooperatives across India to ensure authenticity and quality. Each product comes with information about its origin and the artisan who created it.'
    },
    {
      id: '3',
      category: 'general',
      question: 'Do you ship internationally?',
      answer: 'Currently, we ship within India and to select international destinations. Please check our shipping policy for the complete list of countries we serve. International shipping rates and delivery times vary by location.'
    },

    // Orders & Shopping
    {
      id: '4',
      category: 'orders',
      question: 'How do I place an order?',
      answer: 'To place an order: 1) Browse our products and add items to your cart, 2) Click on the cart icon and review your items, 3) Proceed to checkout and enter your shipping information, 4) Choose your payment method and complete the purchase. You\'ll receive an order confirmation email immediately.'
    },
    {
      id: '5',
      category: 'orders',
      question: 'Can I modify or cancel my order?',
      answer: 'You can modify or cancel your order within 2 hours of placing it, provided it hasn\'t been processed for shipping. Contact our customer support team immediately if you need to make changes. Once an order is shipped, modifications are not possible.'
    },
    {
      id: '6',
      category: 'orders',
      question: 'How can I track my order?',
      answer: 'Once your order is shipped, you\'ll receive a tracking number via email and SMS. You can track your order status in your account dashboard or use the tracking number on our courier partner\'s website. You\'ll also receive updates at each stage of delivery.'
    },

    // Shipping & Delivery
    {
      id: '7',
      category: 'shipping',
      question: 'What are your shipping charges?',
      answer: 'Shipping charges vary based on the size, weight, and destination of your order. We offer free shipping on orders above ₹2,000 within India. For international orders, shipping costs are calculated at checkout based on the destination country.'
    },
    {
      id: '8',
      category: 'shipping',
      question: 'How long does delivery take?',
      answer: 'Delivery times vary by location: Metro cities: 3-5 business days, Other cities: 5-7 business days, Remote areas: 7-10 business days. International deliveries take 10-15 business days. Custom or made-to-order items may take additional time.'
    },
    {
      id: '9',
      category: 'shipping',
      question: 'Do you provide installation services?',
      answer: 'Yes, we provide installation services for furniture items in major cities. Our team will contact you after delivery to schedule the installation. This service may have additional charges depending on the complexity of the item.'
    },

    // Returns & Refunds
    {
      id: '10',
      category: 'returns',
      question: 'What is your return policy?',
      answer: 'We offer a 7-day return policy for most items from the date of delivery. Items must be in original condition with all packaging. Custom-made items, perishables, and personalized products are not eligible for returns. Please check our detailed return policy for specific conditions.'
    },
    {
      id: '11',
      category: 'returns',
      question: 'How do I return an item?',
      answer: 'To return an item: 1) Log into your account and go to "My Orders", 2) Select the item you want to return and click "Return", 3) Choose the reason for return and schedule a pickup, 4) Pack the item securely in original packaging, 5) Our courier will collect the item from your address.'
    },
    {
      id: '12',
      category: 'returns',
      question: 'When will I receive my refund?',
      answer: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method. For cash on delivery orders, refunds are processed via bank transfer or digital wallet.'
    },

    // Payments
    {
      id: '13',
      category: 'payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including: Credit/Debit cards (Visa, MasterCard, RuPay), Net banking, UPI payments, Digital wallets (Paytm, PhonePe, Google Pay), Cash on Delivery (for eligible orders), and EMI options for orders above ₹5,000.'
    },
    {
      id: '14',
      category: 'payments',
      question: 'Is it safe to pay online?',
      answer: 'Yes, our payment gateway is completely secure and encrypted. We use industry-standard SSL encryption to protect your financial information. We never store your card details on our servers. All transactions are processed through trusted payment partners.'
    },
    {
      id: '15',
      category: 'payments',
      question: 'Do you offer EMI options?',
      answer: 'Yes, we offer EMI options for orders above ₹5,000. You can choose from 3, 6, 9, or 12-month EMI plans. EMI is available on most credit cards and select debit cards. The EMI option will be displayed at checkout if your order is eligible.'
    },

    // Account & Support
    {
      id: '16',
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click on "Sign Up" in the top right corner of our website. Enter your name, email, phone number, and create a password. You\'ll receive a verification email - click the link to activate your account. You can also sign up using your Google or Facebook account.'
    },
    {
      id: '17',
      category: 'account',
      question: 'I forgot my password. How do I reset it?',
      answer: 'Click on "Forgot Password" on the login page. Enter your registered email address or phone number. You\'ll receive a password reset link via email or SMS. Click the link and create a new password. Make sure to use a strong password for security.'
    },
    {
      id: '18',
      category: 'account',
      question: 'How can I contact customer support?',
      answer: 'You can reach our customer support team through: Phone: +91-XXXXX-XXXXX (Mon-Sat, 9 AM - 7 PM), Email: support@cultureaft.com, Live Chat: Available on our website, Support Form: Fill out the form on our Contact page. We aim to respond within 24 hours.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: HelpCircle },
    { id: 'general', name: 'General', icon: Book },
    { id: 'orders', name: 'Orders & Shopping', icon: ShoppingCart },
    { id: 'shipping', name: 'Shipping & Delivery', icon: Truck },
    { id: 'returns', name: 'Returns & Refunds', icon: RotateCcw },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'account', name: 'Account & Support', icon: HelpCircle }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">Frequently Asked Questions</h2>
        <p className="text-gray-600">
          Find answers to common questions about our products, services, and policies.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No FAQs found matching your search criteria.</p>
          </div>
        ) : (
          filteredFAQs.map((faq) => (
            <div key={faq.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <button
                onClick={() => toggleExpanded(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                {expandedItems.has(faq.id) ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              
              {expandedItems.has(faq.id) && (
                <div className="px-6 pb-4">
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Contact Support */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
        <HelpCircle className="h-12 w-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Still have questions?
        </h3>
        <p className="text-blue-700 mb-4">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <button
          onClick={() => window.location.href = '/support'}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default FAQ;