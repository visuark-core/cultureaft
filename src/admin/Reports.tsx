import React, { useState } from 'react';
import { FileText, Calendar, Download } from 'lucide-react'; // Removed unused AlertCircle

// --- MOCK DATA ---
const generatedReports = [
  { id: 'rep-001', name: 'Monthly Sales Report - July 2025', dateGenerated: '2025-08-01', fileType: 'CSV' },
  { id: 'rep-002', name: 'Inventory Stock Levels', dateGenerated: '2025-07-31', fileType: 'PDF' },
  { id: 'rep-003', name: 'Customer List - All Time', dateGenerated: '2025-07-30', fileType: 'CSV' },
  { id: 'rep-004', name: 'Quarterly Revenue Report (Q2 2025)', dateGenerated: '2025-07-15', fileType: 'PDF' },
];

const Reports = () => {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // --- FIX: Added type for the form event ---
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setShowSuccess(false);
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Generate New Report Section */}
      <div className="bg-white p-8 rounded-xl shadow border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Generate a New Report</h3>
        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="md:col-span-2">
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="customers">Customer Report</option>
              <option value="revenue">Revenue Summary</option>
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="md:col-start-4">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center justify-center"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>
        {showSuccess && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">
            Your report is being generated and will appear in the list below shortly.
          </div>
        )}
      </div>

      {/* Generated Reports Table */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Generated Reports</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold"><FileText className="inline-block mr-2" />Report Name</th>
                <th className="p-4 font-semibold"><Calendar className="inline-block mr-2" />Date Generated</th>
                <th className="p-4 font-semibold">File Type</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {generatedReports.map(report => (
                <tr key={report.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{report.name}</td>
                  <td className="p-4 text-gray-600">{report.dateGenerated}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                        report.fileType === 'CSV' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {report.fileType}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-bold flex items-center justify-end ml-auto">
                      <Download size={16} className="mr-1" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;