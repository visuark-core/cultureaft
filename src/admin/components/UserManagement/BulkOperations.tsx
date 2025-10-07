import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Users, 
  Ban, 
  CheckCircle, 
  AlertTriangle, 
  Trash2,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import userService from '../../../services/userService';
import { BulkOperationResult } from '../../../types/user';

interface BulkOperationsProps {
  selectedUsers: string[];
  onClearSelection: () => void;
  onOperationComplete: () => void;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedUsers,
  onClearSelection,
  onOperationComplete
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<{
    type: string;
    title: string;
    description: string;
    data?: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState({
    dryRun: true,
    updateExisting: false
  });

  const handleBulkOperation = (type: string, title: string, description: string, data?: any) => {
    setPendingOperation({ type, title, description, data });
    setShowConfirmDialog(true);
  };

  const executeBulkOperation = async () => {
    if (!pendingOperation) return;

    setLoading(true);
    try {
      let result: BulkOperationResult;

      switch (pendingOperation.type) {
        case 'activate':
          const activateResponse = await userService.bulkUpdateUserStatus(selectedUsers, 'active', 'Bulk activation');
          result = activateResponse.data;
          break;
        case 'suspend':
          const suspendResponse = await userService.bulkUpdateUserStatus(selectedUsers, 'suspended', 'Bulk suspension');
          result = suspendResponse.data;
          break;
        case 'ban':
          const banResponse = await userService.bulkUpdateUserStatus(selectedUsers, 'banned', 'Bulk ban');
          result = banResponse.data;
          break;
        case 'delete':
          const deleteResponse = await userService.bulkDeleteUsers(selectedUsers, 'Bulk deletion');
          result = deleteResponse.data;
          break;
        default:
          throw new Error('Unknown operation type');
      }

      setOperationResult(result);
      onOperationComplete();
      onClearSelection();
    } catch (error) {
      console.error('Bulk operation failed:', error);
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
      setPendingOperation(null);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const blob = await userService.exportUsersCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setLoading(true);
      const result = await userService.importUsersCSV(importFile, importOptions);
      setOperationResult(result.data);
      setShowImportDialog(false);
      setImportFile(null);
      onOperationComplete();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await userService.getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'user-import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download failed:', error);
    }
  };

  if (selectedUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Bulk Operations</h3>
            <p className="text-sm text-gray-600">Select users to perform bulk operations</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-medium text-gray-900">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleBulkOperation(
                'activate',
                'Activate Users',
                `Are you sure you want to activate ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}?`
              )}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </button>
            
            <button
              onClick={() => handleBulkOperation(
                'suspend',
                'Suspend Users',
                `Are you sure you want to suspend ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}?`
              )}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Suspend
            </button>
            
            <button
              onClick={() => handleBulkOperation(
                'ban',
                'Ban Users',
                `Are you sure you want to ban ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}? This action will prevent them from accessing the platform.`
              )}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
            >
              <Ban className="h-4 w-4 mr-2" />
              Ban
            </button>
            
            <button
              onClick={() => handleBulkOperation(
                'delete',
                'Delete Users',
                `Are you sure you want to delete ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}? This action cannot be undone.`
              )}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>

            <button
              onClick={handleExport}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingOperation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {pendingOperation.title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {pendingOperation.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={executeBulkOperation}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setPendingOperation(null);
                  }}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Import Users
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          CSV File
                        </label>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importOptions.dryRun}
                            onChange={(e) => setImportOptions({ ...importOptions, dryRun: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Dry run (preview only, don't import)
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importOptions.updateExisting}
                            onChange={(e) => setImportOptions({ ...importOptions, updateExisting: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Update existing users
                          </span>
                        </label>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <button
                          onClick={downloadTemplate}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Download CSV template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleImport}
                  disabled={loading || !importFile}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Import'}
                </button>
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportFile(null);
                  }}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operation Result Dialog */}
      {operationResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    operationResult.totalFailed === 0 ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {operationResult.totalFailed === 0 ? (
                      <Check className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Operation Complete
                    </h3>
                    <div className="mt-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{operationResult.totalProcessed}</div>
                          <div className="text-sm text-gray-600">Total Processed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{operationResult.totalSuccessful}</div>
                          <div className="text-sm text-gray-600">Successful</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{operationResult.totalFailed}</div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                      </div>
                      
                      {operationResult.failed.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Failed Operations:</h4>
                          <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                            {operationResult.failed.map((failure, index) => (
                              <div key={index} className="text-sm text-red-600 mb-1">
                                User {failure.userId}: {failure.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setOperationResult(null)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkOperations;