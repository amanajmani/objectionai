import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useUserRole } from '../hooks/useUserRole.js';
import { 
  Shield, 
  FileText, 
  Briefcase, 
  User, 
  LogOut,
  Home,
  Search,
  Users,
  Menu,
  X,
  Crown
} from 'lucide-react';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { canView, canManageUsers } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/assets', label: 'IP Assets', icon: Shield },
    { path: '/cases', label: 'Cases', icon: Briefcase },
    { path: '/monitoring', label: 'Monitoring', icon: Search, requiresPermission: 'view' },
    { path: '/admin', label: 'Admin Panel', icon: Crown, requiresPermission: 'manageUsers' },
  ].filter(item => {
    if (item.requiresPermission === 'view') return canView;
    if (item.requiresPermission === 'manageUsers') return canManageUsers;
    return true;
  });

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-primary-600">
                ObjectionAI
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
                <Link
                  to="/profile"
                  className="p-2 rounded-full text-gray-400 hover:text-gray-500"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-500"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-base font-medium ${
                      isActive
                        ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.user_metadata?.full_name || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center w-full px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;