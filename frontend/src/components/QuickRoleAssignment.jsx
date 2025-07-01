import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useUserRole } from '../hooks/useUserRole';
import { Crown, Eye, Edit3, Users, AlertCircle, CheckCircle } from 'lucide-react';

const QuickRoleAssignment = () => {
  const { canManageUsers } = useUserRole();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('submitter');
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch all users
  const { data: usersData, refetch: refetchUsers } = trpc.userRoles.listUsers.useQuery(
    undefined,
    { enabled: canManageUsers }
  );

  // Role assignment mutation
  const assignRoleMutation = trpc.userRoles.assignRole.useMutation({
    onSuccess: (data) => {
      setMessage(`✅ ${data.message}`);
      setIsAssigning(false);
      setSelectedUser('');
      setSelectedRole('submitter');
      refetchUsers();
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (error) => {
      setMessage(`❌ ${error.message}`);
      setIsAssigning(false);
      setTimeout(() => setMessage(''), 5000);
    }
  });

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    
    setIsAssigning(true);
    await assignRoleMutation.mutateAsync({
      userId: selectedUser,
      role: selectedRole
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-red-600" />;
      case 'reviewer':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'submitter':
        return <Edit3 className="h-4 w-4 text-green-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!canManageUsers) {
    return null;
  }

  const users = usersData?.users || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Crown className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Role Assignment</h3>
        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Admin Only</span>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
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
          <div className="space-y-2">
            {['submitter', 'reviewer', 'admin'].map((role) => (
              <label key={role} className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  {getRoleIcon(role)}
                  <span className="capitalize font-medium">{role}</span>
                  <span className="text-sm text-gray-500">
                    {role === 'admin' && '- Full access to everything'}
                    {role === 'reviewer' && '- View and comment only'}
                    {role === 'submitter' && '- Can create cases and evidence'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setSelectedUser('');
              setSelectedRole('submitter');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={handleAssignRole}
            disabled={!selectedUser || !selectedRole || isAssigning}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isAssigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Assign Role</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Demo Tip</h4>
            <p className="text-sm text-blue-700 mt-1">
              For VC demos, you can quickly switch between user roles to showcase different access levels. 
              Visit <span className="font-mono bg-blue-100 px-1 rounded">/admin</span> for the full admin panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickRoleAssignment;