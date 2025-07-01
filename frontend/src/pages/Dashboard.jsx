import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useUserRole } from '../hooks/useUserRole.js';
import { trpc } from '../lib/trpc.js';
import Layout from '../components/Layout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import WelcomeGuide from '../components/WelcomeGuide.jsx';
import QuickStartCard from '../components/QuickStartCard.jsx';
import RoleGuard from '../components/RoleGuard.jsx';
import { 
  Shield, 
  FileText, 
  Briefcase, 
  Plus,
  TrendingUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { canCreate, role } = useUserRole();
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  
  // Check if user is new (no assets, cases, or documents)
  const isNewUser = (assetsStats, casesStats, documentsStats) => {
    return (!assetsStats?.stats?.total || assetsStats.stats.total === 0) &&
           (!casesStats?.stats?.total || casesStats.stats.total === 0) &&
           (!documentsStats?.stats?.total || documentsStats.stats.total === 0);
  };
  
  // Fetch dashboard data
  const { data: assetsStats, isLoading: assetsLoading } = trpc.assets.getStats.useQuery();
  const { data: casesStats, isLoading: casesLoading } = trpc.cases.getStats.useQuery();
  const { data: documentsStats, isLoading: documentsLoading } = trpc.documents.getStats.useQuery();
  const { data: recentCases, isLoading: recentCasesLoading } = trpc.cases.list.useQuery({ limit: 5 });

  // Show welcome guide for new users
  useEffect(() => {
    if (!assetsLoading && !casesLoading && !documentsLoading) {
      if (isNewUser(assetsStats, casesStats, documentsStats)) {
        const hasSeenGuide = localStorage.getItem('hasSeenWelcomeGuide');
        if (!hasSeenGuide) {
          setShowWelcomeGuide(true);
        }
      }
    }
  }, [assetsStats, casesStats, documentsStats, assetsLoading, casesLoading, documentsLoading]);

  const handleCloseWelcomeGuide = () => {
    setShowWelcomeGuide(false);
    localStorage.setItem('hasSeenWelcomeGuide', 'true');
  };

  const handleShowGuide = () => {
    setShowWelcomeGuide(true);
  };

  if (assetsLoading || casesLoading || documentsLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  // Prepare stats for display
  const stats = [
    {
      name: 'IP Assets',
      value: assetsStats?.stats?.total || 0,
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/assets'
    },
    {
      name: 'Active Cases',
      value: casesStats?.stats?.total || 0,
      icon: Briefcase,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      href: '/cases'
    },
    {
      name: 'Documents',
      value: documentsStats?.stats?.total || 0,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/cases'
    }
  ];

  const userStatsForGuide = {
    assets: assetsStats?.stats?.total || 0,
    cases: casesStats?.stats?.total || 0,
    documents: documentsStats?.stats?.total || 0
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's what's happening with your IP protection.
          </p>
        </div>

        {/* Quick Start Card for New Users */}
        {isNewUser(assetsStats, casesStats, documentsStats) && (
          <QuickStartCard 
            userStats={userStatsForGuide}
            onShowGuide={handleShowGuide}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.name}
                to={stat.href}
                className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-md ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Role-Aware Workflow Guide */}
        {canCreate && role !== 'submitter' ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 p-3 rounded-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your IP Protection Workflow
                </h3>
                <p className="text-gray-600 mb-4">
                  Follow this simple 3-step process to protect your intellectual property effectively.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Register IP Assets</p>
                      <p className="text-xs text-gray-500">Add your trademarks, copyrights, patents</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Create Cases</p>
                      <p className="text-xs text-gray-500">Report infringement with evidence</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Generate Documents</p>
                      <p className="text-xs text-gray-500">AI creates legal letters automatically</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Link
                    to="/assets/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add IP Asset
                  </Link>
                  <button
                    onClick={handleShowGuide}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Show Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : canCreate && role === 'submitter' ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex justify-end">
              <button
                onClick={handleShowGuide}
                className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Show Guide
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-green-500 p-3 rounded-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Review & Monitor IP Protection
                </h3>
                <p className="text-gray-600 mb-4">
                  As a reviewer, you can analyze cases, generate legal documents, and monitor IP infringement activities.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Review Cases</p>
                      <p className="text-xs text-gray-500">Analyze infringement reports and evidence</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Generate Documents</p>
                      <p className="text-xs text-gray-500">Create legal letters and notices</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Monitor Progress</p>
                      <p className="text-xs text-gray-500">Track case status and outcomes</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Link
                    to="/cases"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Review Cases
                  </Link>
                  <button
                    onClick={handleShowGuide}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Show Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Cases */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Cases</h3>
              <Link
                to="/cases"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentCasesLoading ? (
              <div className="px-6 py-8">
                <LoadingSpinner />
              </div>
            ) : recentCases && recentCases.cases && recentCases.cases.length > 0 ? (
              recentCases.cases.map((caseItem) => (
                <div key={caseItem.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/cases/${caseItem.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate block"
                      >
                        {caseItem.title}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">
                        {caseItem.ip_assets?.title} • {caseItem.suspected_url}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        caseItem.status === 'open' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : caseItem.status === 'in_review'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {caseItem.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No cases yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first IP infringement case.
                </p>
                {canCreate && (
                  <div className="mt-6">
                    <Link
                      to="/cases/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Case
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Welcome Guide Modal */}
        {showWelcomeGuide && (
          <WelcomeGuide 
            onClose={handleCloseWelcomeGuide}
            userStats={userStatsForGuide}
          />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;