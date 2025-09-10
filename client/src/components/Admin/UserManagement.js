import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  User,
  Shield,
  GraduationCap,
  Trash2,
  Edit,
  Check,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  Mail,
  Calendar,
  Crown,
  AlertTriangle,
  Loader,
  Save
} from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser, canManageUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (canManageUsers) {
      loadUsers();
    }
  }, [canManageUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(`Failed to load users: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (user) => {
    setEditingUser(user._id);
    setSelectedRole(user.role);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedRole('');
  };

  const handleSaveRole = async (userId) => {
    const currentUser = users.find(u => u._id === userId);
    
    if (!selectedRole || selectedRole === currentUser?.role) {
      handleCancelEdit();
      return;
    }

    try {
      setUpdatingRole(true);
      await adminAPI.updateUserRole(userId, selectedRole);
      
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: selectedRole } : user
      ));
      
      const userName = getSafeUserProperty(currentUser, 'name', 'User');
      toast.success(`${userName}'s role updated to ${selectedRole} successfully!`);
      
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(`Failed to update user role: ${error.response?.data?.message || error.message}`);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser._id) {
      toast.error('You cannot delete your own account!');
      return;
    }

    const userToDelete = users.find(u => u._id === userId);
    const userName = getSafeUserProperty(userToDelete, 'name', 'Unknown User');

    if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(userId);
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(user => user._id !== userId));
      toast.success(`User "${userName}" deleted successfully!`);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.response?.data?.message || error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleConfig = (role) => {
    switch (role) {
      case 'admin':
        return {
          icon: Shield,
          label: 'Admin',
          textColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          badge: 'bg-gradient-to-r from-red-500 to-red-600 text-white'
        };
      case 'mentor':
        return {
          icon: GraduationCap,
          label: 'Mentor',
          textColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          badge: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
        };
      default:
        return {
          icon: User,
          label: 'Student',
          textColor: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          badge: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
        };
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedAndFilteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const name = (user?.name || '').toLowerCase();
      const email = (user?.email || '').toLowerCase();
      const role = (user?.role || '').toLowerCase();
      const search = (searchTerm || '').toLowerCase();
      
      return name.includes(search) || 
             email.includes(search) || 
             role.includes(search);
    });

    return filtered.sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];
      
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';
      
      if (sortKey === 'createdAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchTerm, sortKey, sortOrder]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getSafeUserProperty = (user, property, defaultValue = '') => {
    return user && user[property] !== undefined && user[property] !== null 
      ? user[property] 
      : defaultValue;
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-4">
        <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-500/30">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access user management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Users...</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch user data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                User Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage user roles and permissions across the platform
              </p>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-500/30 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Users</div>
              </div>
            </div>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-500/30 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{users.filter(u => getSafeUserProperty(u, 'role') === 'admin').length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Admins</div>
              </div>
            </div>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-500/30 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.filter(u => getSafeUserProperty(u, 'role') === 'mentor').length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Mentors</div>
              </div>
            </div>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-500/30 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{users.filter(u => getSafeUserProperty(u, 'role') === 'student').length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Students</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value || '')}
              className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-indigo-200/50 dark:border-indigo-500/30 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-indigo-200/50 dark:border-indigo-500/30 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-800/50 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      User
                      {sortKey === 'name' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-800/50 transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                      {sortKey === 'email' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-800/50 transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Role
                      {sortKey === 'role' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-800/50 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Joined
                      {sortKey === 'createdAt' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 dark:bg-slate-800/50 divide-y divide-indigo-200/30 dark:divide-indigo-500/20">
                {sortedAndFilteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <User className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {users.length === 0 ? 'No users found.' : 'No users match your search.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredUsers.map((user, index) => {
                    const userName = getSafeUserProperty(user, 'name', 'Unknown User');
                    const userEmail = getSafeUserProperty(user, 'email', 'No Email');
                    const userRole = getSafeUserProperty(user, 'role', 'student');
                    const userProfilePicture = getSafeUserProperty(user, 'profilePicture', '/default-avatar.png');
                    const userCreatedAt = getSafeUserProperty(user, 'createdAt', null);
                    
                    const roleConfig = getRoleConfig(userRole);
                    const Icon = roleConfig.icon;
                    const isEditing = editingUser === user._id;
                    const isCurrentUser = user._id === currentUser._id;
                    const isDeleting = deletingId === user._id;

                    return (
                      <tr 
                        key={user._id}
                        className={`${index % 2 === 0 ? 'bg-white/80 dark:bg-slate-800/80' : 'bg-indigo-50/80 dark:bg-indigo-900/20'} hover:bg-indigo-100/80 dark:hover:bg-indigo-800/30 transition-colors`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              className="h-12 w-12 rounded-full ring-2 ring-white/20 object-cover"
                              src={userProfilePicture}
                              alt={userName}
                              onError={(e) => {
                                e.target.src = '/default-avatar.png';
                              }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {userName}
                                </div>
                                {isCurrentUser && (
                                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                    YOU
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userEmail !== 'No Email' ? (
                            <a
                              href={`mailto:${userEmail}`}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                            >
                              {userEmail}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No Email</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                disabled={updatingRole}
                                className="text-sm bg-white/90 dark:bg-slate-700 backdrop-blur-sm border border-indigo-300 dark:border-indigo-600 rounded-lg px-3 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="student">Student</option>
                                <option value="mentor">Mentor</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${roleConfig.textColor}`} />
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleConfig.badge}`}>
                                {roleConfig.label}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(userCreatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!isCurrentUser && (
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveRole(user._id)}
                                    disabled={updatingRole}
                                    className="p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Save changes"
                                  >
                                    {updatingRole ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={updatingRole}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(user)}
                                    disabled={editingUser !== null || updatingRole || isDeleting}
                                    className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Edit role"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user._id)}
                                    disabled={editingUser !== null || updatingRole || isDeleting}
                                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    title="Delete user"
                                  >
                                    {isDeleting ? (
                                      <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
