import React, { useState } from 'react';
import { 
  Book, 
  ShoppingCart, 
  User, 
  Settings,
  Search,
  ExternalLink,
  Play
} from 'lucide-react';
import UserGuides from './UserGuides';

const HelpDocumentation = () => {
  const [showGuides, setShowGuides] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">Help Documentation</h2>
        <p className="text-gray-600">
          Comprehensive guides to help you make the most of CultureAft
        </p>
        
        {/* Toggle between Documentation and Guides */}
        <div className="flex justify-center mt-6">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setShowGuides(false)}
              className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                !showGuides ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <Book className="h-4 w-4" />
              <span>Documentation</span>
            </button>
            <button
              onClick={() => setShowGuides(true)}
              className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                showGuides ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <Play className="h-4 w-4" />
              <span>Interactive Guides</span>
            </button>
          </div>
        </div>
      </div>

      {showGuides ? (
        <UserGuides />
      ) : (
        <div>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shopping Guide</h3>
              <p className="text-gray-600 text-sm mb-4">Learn how to browse, select, and purchase products</p>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                View Guide <ExternalLink className="h-4 w-4 inline ml-1" />
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Management</h3>
              <p className="text-gray-600 text-sm mb-4">Manage your profile, orders, and preferences</p>
              <button className="text-green-600 hover:text-green-700 font-medium">
                Learn More <ExternalLink className="h-4 w-4 inline ml-1" />
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Troubleshooting</h3>
              <p className="text-gray-600 text-sm mb-4">Common issues and their solutions</p>
              <button className="text-orange-600 hover:text-orange-700 font-medium">
                Get Help <ExternalLink className="h-4 w-4 inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpDocumentation;