import React, { useState, useEffect } from 'react';
import { 
  X, 
  User as UserIcon, 
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  Ban,
  Activity,
  FileText,
  Plus,
  EyeOff,
  ShoppingBag
} from 'lucide-react';
import { User } from '../../../types/user';
import userService from '../../../services/userService';

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdate
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(false);
  const [showAddFlag, setShowAddFlag] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newFlag, setNewFlag] = useState({
    type: 'manual_review',
    reason: '',
    severity: 'medium'
  });
  const [newNote, setNewNote] = useState({
    content: '',
    isPrivate: false
  });

  useEffect(() => {
    if (user) {
      setEditedUser(user);
      setActiveTab('profile');
      setIsEditing(false);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await userService.updateUser(user._id, editedUser);
      if (response.success) {
        onUserUpdate(response.data.user);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await userService.updateUserStatus(user._id, newStatus);
      if (response.success) {
        onUserUpdate(response.data.user);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlag = async () => {
    if (!user || !newFlag.reason.trim()) return;
    
    setLoading(true);
    try {
      const response = await userService.addUserFlag(user._id, newFlag);
      if (response.success) {
        onUserUpdate(response.data.user);
        setShowAddFlag(false);
        setNewFlag({ type: 'manual_review', reason: '', severity: 'medium' });
      }
    } catch (error) {
      console.error('Failed to add flag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFlag = async (flagId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await userService.resolveUserFlag(user._id, flagId);
      if (response.success) {
        onUserUpdate(response.data.user);
      }
    } catch (error) {
      console.error('Failed to resolve flag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!user || !newNote.content.trim()) return;
    
    setLoading(true);
    try {
      const response = await userService.addUserNote(user._id, newNote.content, newNote.isPrivate);
      if (response.success) {
        onUserUpdate(response.data.user);
        setShowAddNote(false);
        setNewNote({ content: '', isPrivate: false });
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-600 bg-green-100',
      inactive: 'text-gray-600 bg-gray-100',
      suspended: 'text-yellow-600 bg-yellow-100',
      banned: 'text-red-600 bg-red-100',
      pending_verification: 'text-blue-600 bg-blue-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getFlagSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-blue-600 bg-blue-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      className="h-12 w-12 rounded-full"
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {user.flags && user.flags.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Flag className="w-3 h-3 mr-1" />
                        {user.flags.length} Flag{user.flags.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedUser(user);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'profile', name: 'Profile', icon: UserIcon },
                { id: 'activity', name: 'Activity', icon: Activity },
                { id: 'orders', name: 'Orders', icon: ShoppingBag },
                { id: 'flags', name: 'Flags', icon: Flag },
                { id: 'notes', name: 'Notes', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                    {tab.id === 'flags' && user.flags && user.flags.length > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs rounded-full px-2 py-0.5">
                        {user.flags.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.firstName || ''}
                          onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{user.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedUser.lastName || ''}
                          onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{user.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <p className="text-sm text-gray-900">{user.email}</p>
                        {user.emailVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <p className="text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                        {user.phone && (
                          user.phoneVerified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{user.customerId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                      <p className="mt-1 text-sm text-gray-900">{userService.formatDateTime(user.registrationDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Status Management */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Status Management</h4>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                      {user.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {!isEditing && (
                      <div className="flex space-x-2">
                        {user.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange('active')}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activate
                          </button>
                        )}
                        {user.status !== 'suspended' && (
                          <button
                            onClick={() => handleStatusChange('suspended')}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-1 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Suspend
                          </button>
                        )}
                        {user.status !== 'banned' && (
                          <button
                            onClick={() => handleStatusChange('banned')}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Analytics Summary */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Analytics Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{user.analytics?.totalOrders || 0}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {userService.formatCurrency(user.analytics?.totalSpent || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Spent</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {userService.formatCurrency(user.analytics?.averageOrderValue || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Avg Order Value</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {userService.formatCurrency(user.analytics?.lifetimeValue || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Lifetime Value</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'flags' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">User Flags</h4>
                  <button
                    onClick={() => setShowAddFlag(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Flag
                  </button>
                </div>

                {showAddFlag && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Flag Type</label>
                        <select
                          value={newFlag.type}
                          onChange={(e) => setNewFlag({ ...newFlag, type: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="manual_review">Manual Review</option>
                          <option value="suspicious_activity">Suspicious Activity</option>
                          <option value="policy_violation">Policy Violation</option>
                          <option value="fraud_suspected">Fraud Suspected</option>
                          <option value="payment_issues">Payment Issues</option>
                          <option value="security_concern">Security Concern</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Severity</label>
                        <select
                          value={newFlag.severity}
                          onChange={(e) => setNewFlag({ ...newFlag, severity: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reason</label>
                        <textarea
                          value={newFlag.reason}
                          onChange={(e) => setNewFlag({ ...newFlag, reason: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          placeholder="Describe the reason for this flag..."
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddFlag}
                          disabled={loading || !newFlag.reason.trim()}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          Add Flag
                        </button>
                        <button
                          onClick={() => setShowAddFlag(false)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!user.flags || user.flags.length === 0 ? (
                  <div className="text-center py-8">
                    <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No flags on this user</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user.flags.map((flag) => (
                      <div key={flag._id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFlagSeverityColor(flag.severity)}`}>
                                {flag.severity.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {flag.type.replace('_', ' ').toUpperCase()}
                              </span>
                              {flag.resolved && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  RESOLVED
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{flag.reason}</p>
                            <div className="text-xs text-gray-500">
                              Created {userService.formatDateTime(flag.createdAt)}
                              {flag.createdBy && (
                                <span> by {flag.createdBy.profile.firstName} {flag.createdBy.profile.lastName}</span>
                              )}
                            </div>
                            {flag.resolved && flag.resolvedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                Resolved {userService.formatDateTime(flag.resolvedAt)}
                                {flag.resolvedBy && (
                                  <span> by {flag.resolvedBy.profile.firstName} {flag.resolvedBy.profile.lastName}</span>
                                )}
                              </div>
                            )}
                          </div>
                          {!flag.resolved && (
                            <button
                              onClick={() => handleResolveFlag(flag._id)}
                              disabled={loading}
                              className="ml-4 inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Admin Notes</h4>
                  <button
                    onClick={() => setShowAddNote(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </button>
                </div>

                {showAddNote && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Note Content</label>
                        <textarea
                          value={newNote.content}
                          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                          rows={4}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Add a note about this user..."
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPrivate"
                          checked={newNote.isPrivate}
                          onChange={(e) => setNewNote({ ...newNote, isPrivate: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
                          Private note (only visible to admins)
                        </label>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddNote}
                          disabled={loading || !newNote.content.trim()}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add Note
                        </button>
                        <button
                          onClick={() => setShowAddNote(false)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!user.notes || user.notes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No notes for this user</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user.notes.map((note) => (
                      <div key={note._id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {note.createdBy.profile.firstName} {note.createdBy.profile.lastName}
                            </span>
                            {note.isPrivate && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Private
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {userService.formatDateTime(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add other tabs content as needed */}
            {activeTab === 'activity' && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Activity tracking coming soon</p>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Order history coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;