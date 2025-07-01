import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { trpc } from '../lib/trpc';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import QuickRoleAssignment from '../components/QuickRoleAssignment';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Settings, 
  Bell,
  Key,
  Save,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { role, isLoading: roleLoading, canManageUsers } = useUserRole();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    organization: '',
    jobTitle: '',
    phone: '',
    timezone: 'UTC'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Get user stats for profile summary
  const { data: userStats } = trpc.auth.getUserStats.useQuery();

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

  useEffect(() => {
    // Load profile data from localStorage or API
    const savedProfile = localStorage.getItem(`profile_${user?.id}`);
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (in real app, this would be an API call)
      localStorage.setItem(`profile_${user?.id}`, JSON.stringify(profileData));
      setSaveMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  if (roleLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="mt-2 text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {saveMessage && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                  saveMessage.includes('success') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {saveMessage.includes('success') ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{saveMessage}</span>
                </div>
              )}
              {isEditing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {profileData.displayName || user?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-gray-600">{user?.email}</p>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IP Assets</span>
                    <span className="font-medium">{userStats?.assets || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cases</span>
                    <span className="font-medium">{userStats?.cases || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Documents</span>
                    <span className="font-medium">{userStats?.documents || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monitoring Jobs</span>
                    <span className="font-medium">{userStats?.monitoringJobs || 0}</span>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Account Info</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Joined {new Date(user?.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Key className="h-4 w-4 mr-2" />
                    <span>ID: {user?.id?.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <User className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.displayName || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{user?.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.organization}
                      onChange={(e) => handleInputChange('organization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your organization"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.organization || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your job title"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.jobTitle || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.phone || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  {isEditing ? (
                    <select
                      value={profileData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profileData.timezone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Notifications</h4>
                      <p className="text-sm text-blue-700">
                        Notifications are managed through the notification panel in the top navigation bar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Account Security</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Your account is secured through Supabase authentication. 
                      Password changes and security settings are managed through your authentication provider.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Data Management</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      All your IP assets, cases, and documents are securely stored and can be accessed through their respective sections.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Role Management - Only visible to admins */}
            {canManageUsers && (
              <QuickRoleAssignment />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;