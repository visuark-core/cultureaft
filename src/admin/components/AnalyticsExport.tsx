import React, { useState } from 'react';
import { Download, FileText, Table, BarChart3, Calendar } from 'lucide-react';

interface AnalyticsExportProps {
  data: any;
  onExport: (format: string, dateRange: string) => void;
}

const AnalyticsExport: React.FC<AnalyticsExportProps> = ({ data, onExport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedRange, setSelectedRange] = useState('current');

  const exportFormats = [
    { id: 'csv', name: 'CSV', icon: Table, description: 'Comma-separated values' },
    { id: 'pdf', name: 'PDF', icon: FileText, description: 'Formatted report' },
    { id: 'excel', name: 'Excel', icon: BarChart3, description: 'Excel spreadsheet' }
  ];

  const dateRanges = [
    { id: 'current', name: 'Current Period', description: 'Selected time range' },
    { id: 'last30', name: 'Last 30 Days', description: 'Previous 30 days' },
    { id: 'last90', name: 'Last 90 Days', description: 'Previous 90 days' },
    { id: 'ytd', name: 'Year to Date', description: 'From Jan 1st to today' }
  ];

  const handleExport = () => {
    onExport(selectedFormat, selectedRange);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Export Analytics</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="space-y-2">
                {exportFormats.map(format => {
                  const Icon = format.icon;
                  return (
                    <label key={format.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="format"
                        value={format.id}
                        checked={selectedFormat === format.id}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        className="mr-3"
                      />
                      <Icon className="w-5 h-5 mr-3 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{format.name}</p>
                        <p className="text-sm text-gray-500">{format.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Date Range
              </label>
              <div className="space-y-2">
                {dateRanges.map(range => (
                  <label key={range.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="range"
                      value={range.id}
                      checked={selectedRange === range.id}
                      onChange={(e) => setSelectedRange(e.target.value)}
                      className="mr-3"
                    />
                    <Calendar className="w-5 h-5 mr-3 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{range.name}</p>
                      <p className="text-sm text-gray-500">{range.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsExport;