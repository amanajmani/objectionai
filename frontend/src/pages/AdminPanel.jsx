import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useUserRole } from '../hooks/useUserRole';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import RoleGuard from '../components/RoleGuard';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Settings, 
  Activity,
  Crown,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Mail
} from 'lucide-react';

const AdminPanel = () => {
  const { user: currentUser } = useAuth();
  const { isAdmin, canManageUsers } = useUserRole();
  const [selectedTab, setSelectedTab] = useState('users');
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Fetch all users and their roles
  const { 
    data: usersData, 
    isLoading: usersLoading, 
    refetch: refetchUsers 
  } = trpc.userRoles.listUsers.useQuery(undefined, {
    enabled: canManageUsers
  });

  // Fetch role statistics
  const { 
    data: roleStats, 
    isLoading: statsLoading 
  } = trpc.userRoles.getRoleStats.useQuery(undefined, {
    enabled: canManageUsers
  });

  // Role assignment mutation
  const assignRoleMutation = trpc.userRoles.assignRole.useMutation({
    onSuccess: (data) => {
      setActionMessage(`✅ ${data.message}`);
      setIsAssigningRole(false);
      setSelectedUser(null);
      setNewRole('');
      refetchUsers();
      setTimeout(() => setActionMessage(''), 3000);
    },
    onError: (error) => {
      setActionMessage(`❌ ${error.message}`);
      setTimeout(() => setActionMessage(''), 5000);
    }
  });

  // Role removal mutation
  const removeRoleMutation = trpc.userRoles.removeRole.useMutation({
    onSuccess: (data) => {
      setActionMessage(`✅ ${data.message}`);
      refetchUsers();
      setTimeout(() => setActionMessage(''), 3000);
    },
    onError: (error) => {
      setActionMessage(`❌ ${error.message}`);
      setTimeout(() => setActionMessage(''), 5000);
    }
  });

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;
    
    setIsAssigningRole(true);
    await assignRoleMutation.mutateAsync({
      userId: selectedUser.id,
      role: newRole
    });
  };

  const handleRemoveRole = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user\'s role?')) {
      await removeRoleMutation.mutateAsync({ userId });
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reviewer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitter':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'reviewer':
        return <Eye className="h-3 w-3" />;
      case 'submitter':
        return <Edit3 className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  if (usersLoading || statsLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  const users = usersData?.users || [];
  const stats = roleStats?.stats || { total: 0, byRole: {} };

  return (
    <Layout>
      <RoleGuard requiredPermission="manageUsers">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-gray-600">Manage users, roles, and team permissions</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <Crown className="h-4 w-4 mr-1" />
                  Administrator
                </span>
              </div>
            </div>
          </div>

          {/* Action Message */}
          {actionMessage && (
            <div className={`p-4 rounded-lg border ${
              actionMessage.includes('✅') 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {actionMessage}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Crown className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byRole.admin || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reviewers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byRole.reviewer || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Edit3 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Submitters</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byRole.submitter || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setSelectedTab('users')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  User Management
                </button>
                <button
                  onClick={() => setSelectedTab('roles')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'roles'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Shield className="h-4 w-4 inline mr-2" />
                  Role Assignment
                </button>
                <button
                  onClick={() => setSelectedTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Activity className="h-4 w-4 inline mr-2" />
                  Team Activity
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* User Management Tab */}
              {selectedTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                    <span className="text-sm text-gray-500">{users.length} total users</span>
                  </div>

                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Mail className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.email?.split('@')[0] || 'Unknown'}
                                  </div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.user_roles && user.user_roles.length > 0 ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.user_roles[0].role)}`}>
                                  {getRoleIcon(user.user_roles[0].role)}
                                  <span className="ml-1">{user.user_roles[0].role}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                  No Role
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(user.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewRole(user.user_roles?.[0]?.role || 'submitter');
                                  setSelectedTab('roles');
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit Role
                              </button>
                              {/* Only show Remove Role if: 1) User has a role, 2) It's not the current admin user */}
                              {user.user_roles && user.user_roles.length > 0 && user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleRemoveRole(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove Role
                                </button>
                              )}
                              {/* Show protection message for current admin */}
                              {user.id === currentUser?.id && user.user_roles?.[0]?.role === 'admin' && (
                                <span className="text-xs text-gray-500 italic">
                                  (Cannot remove own admin role)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Role Assignment Tab */}
              {selectedTab === 'roles' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign User Role</h3>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select User
                          </label>
                          <select
                            value={selectedUser?.id || ''}
                            onChange={(e) => {
                              const user = users.find(u => u.id === e.target.value);
                              setSelectedUser(user);
                              setNewRole(user?.user_roles?.[0]?.role || 'submitter');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Choose a user...</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.email} {user.user_roles?.[0]?.role ? `(${user.user_roles[0].role})` : '(No Role)'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign Role
                          </label>
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="submitter">Submitter - Can create cases and evidence</option>
                            <option value="reviewer">Reviewer - Can view and comment only</option>
                            <option value="admin">Admin - Full access to everything</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setSelectedUser(null);
                            setNewRole('');
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAssignRole}
                          disabled={!selectedUser || !newRole || isAssigningRole}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAssigningRole ? 'Assigning...' : 'Assign Role'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Role Descriptions */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Role Permissions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-center mb-2">
                          <Crown className="h-5 w-5 text-red-600 mr-2" />
                          <h5 className="font-medium text-red-900">Admin</h5>
                        </div>
                        <ul className="text-sm text-red-800 space-y-1">
                          <li>• Full system access</li>
                          <li>• Manage users and roles</li>
                          <li>• Create, edit, delete everything</li>
                          <li>• View admin panel</li>
                        </ul>
                      </div>

                      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center mb-2">
                          <Eye className="h-5 w-5 text-blue-600 mr-2" />
                          <h5 className="font-medium text-blue-900">Reviewer</h5>
                        </div>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• View cases and documents</li>
                          <li>• Add comments and reviews</li>
                          <li>• Cannot create or edit</li>
                          <li>• Read-only access</li>
                        </ul>
                      </div>

                      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                        <div className="flex items-center mb-2">
                          <Edit3 className="h-5 w-5 text-green-600 mr-2" />
                          <h5 className="font-medium text-green-900">Submitter</h5>
                        </div>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>• Create cases and evidence</li>
                          <li>• Upload files and documents</li>
                          <li>• Generate AI documents</li>
                          <li>• Basic user access</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Team Activity Tab */}
              {selectedTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Team Activity Overview</h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">Team Activity Dashboard</span>
                    </div>
                    <p className="text-blue-700 mt-2">
                      Real-time activity monitoring and user analytics will be available in Part 5 implementation.
                      This will include user login history, action logs, and performance metrics.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-3">Current Team Composition</h4>
                      <div className="space-y-2">
                        {Object.entries(stats.byRole).map(([role, count]) => (
                          <div key={role} className="flex justify-between items-center">
                            <div className="flex items-center">
                              {getRoleIcon(role)}
                              <span className="ml-2 capitalize">{role}s</span>
                            </div>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-3">Recent User Registrations</h4>
                      <div className="space-y-2">
                        {users.slice(0, 5).map((user) => (
                          <div key={user.id} className="flex justify-between items-center text-sm">
                            <span>{user.email?.split('@')[0]}</span>
                            <span className="text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </RoleGuard>
    </Layout>
  );
};

export default AdminPanel;