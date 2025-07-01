import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import RoleGuard from '../components/RoleGuard';
import { useUserRole } from '../hooks/useUserRole';
import { 
  Plus, 
  Eye, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Search,
  Sparkles,
  Trash2
} from 'lucide-react';

const Monitoring = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { canCreate } = useUserRole();

  const { data: jobsData, isLoading, refetch } = trpc.monitoring.list.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const { data: statsData, refetch: refetchStats } = trpc.monitoring.getStats.useQuery();
  
  // Get auto-generated cases (Part 1 feature)
  const { data: autoCasesData, refetch: refetchAutoCases } = trpc.monitoring.getAutoCases.useQuery({
    limit: 10
  });

  // Smart polling for real-time monitoring updates
  useEffect(() => {
    console.log('Setting up real-time monitoring updates...');
    
    // Immediate refresh on mount
    refetch();
    refetchStats();
    refetchAutoCases();
    
    // Smart polling: frequent updates for responsive monitoring
    const interval = setInterval(() => {
      console.log('Real-time refresh: updating monitoring data...');
      refetch();
      refetchStats();
      refetchAutoCases();
      setLastUpdate(new Date());
    }, 3000); // Poll every 3 seconds for near real-time updates

    return () => clearInterval(interval);
  }, [refetch, refetchStats, refetchAutoCases]);

  const executeJob = trpc.monitoring.executeJob.useMutation({
    onSuccess: (result) => {
      refetch();
      refetchStats();
      refetchAutoCases();
      
      // Show auto-case creation success
      if (result.autoCaseCreated) {
        setAutoCase({
          created: true,
          caseId: result.autoCaseId,
          message: result.message
        });
      }
    },
    onError: (error) => {
      console.error('Failed to execute monitoring job:', error);
      // Show user-friendly error message
      if (error.message.includes('already running')) {
        alert('This job is already running. Please wait for it to complete.');
      } else if (error.message.includes('already been completed')) {
        alert('This job has already been completed. Create a new monitoring job if you want to run another scan.');
      } else {
        alert('Failed to execute monitoring job. Please try again.');
      }
    },
  });

  const deleteJob = trpc.monitoring.delete.useMutation({
    onSuccess: () => {
      refetch();
      refetchStats();
      refetchAutoCases();
    },
    onError: (error) => {
      console.error('Failed to delete monitoring job:', error);
    },
  });

  const deleteAllJobs = trpc.monitoring.deleteAll.useMutation({
    onSuccess: (result) => {
      refetch();
      refetchStats();
      refetchAutoCases();
      alert(result.message);
    },
    onError: (error) => {
      console.error('Failed to delete all monitoring jobs:', error);
      alert('Failed to delete all monitoring jobs. Please try again.');
    },
  });

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete ALL monitoring jobs? This action cannot be undone and will remove all monitoring data including logs and evidence.')) {
      deleteAllJobs.mutate();
    }
  };

  const [autoCase, setAutoCase] = useState({ created: false, caseId: null, message: '' });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <LoadingSpinner size="sm" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 70) return 'text-red-600 bg-red-50';
    if (riskScore >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const handleExecuteJob = async (jobId) => {
    try {
      await executeJob.mutateAsync({ id: jobId });
    } catch (error) {
      console.error('Failed to execute job:', error);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this monitoring job? This action cannot be undone.')) {
      try {
        await deleteJob.mutateAsync({ id: jobId });
      } catch (error) {
        console.error('Failed to delete job:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const jobs = jobsData?.jobs || [];
  const stats = statsData?.stats || {};
  const autoCases = autoCasesData?.cases || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitoring Dashboard</h1>
            <p className="text-gray-600">
              Real-time IP infringement surveillance � Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex space-x-3">
            <RoleGuard allowedRoles={['admin']}>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllJobs.isLoading || jobs.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteAllJobs.isLoading ? 'Deleting...' : 'Delete All'}
              </button>
            </RoleGuard>
            <RoleGuard allowedRoles={['admin', 'submitter']}>
              <Link
                to="/monitoring/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Monitoring Job
              </Link>
            </RoleGuard>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.jobsByStatus?.completed || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Risk Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRiskScore || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Auto Cases</p>
                <p className="text-2xl font-bold text-gray-900">{autoCases.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Auto-Case Creation Success */}
        {autoCase.created && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-green-900">
                  🎉 Auto-Case Created Successfully!
                </h3>
                <p className="text-green-700 mt-1">
                  {autoCase.message}
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  to={`/cases/${autoCase.caseId}`}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                >
                  View Auto-Generated Case
                </Link>
                <button
                  onClick={() => setAutoCase({ created: false, caseId: null, message: '' })}
                  className="text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two-column layout for clear separation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Auto-Generated Cases Column */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-green-600" />
                Auto-Generated Cases
                <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full">
                  {autoCases.length}
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                High-risk monitoring detections (70%+) automatically create cases
              </p>
            </div>
            
            {autoCases.length === 0 ? (
              <div className="p-6 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500 font-medium">No auto-generated cases yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Cases will appear here when high-risk monitoring jobs (70%+) are executed.
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {autoCases.slice(0, 10).map((autoCase) => (
                    <div key={autoCase.id} className="border border-green-200 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {autoCase.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {autoCase.ip_assets?.title} • {autoCase.ip_assets?.type}
                          </p>
                          
                          {/* Evidence indicators */}
                          <div className="flex items-center mt-2 space-x-1">
                            {autoCase.monitoring_evidence?.map((evidence, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {evidence.evidence_type.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                          
                          {/* Risk score */}
                          {autoCase.monitoring_evidence?.[0]?.monitoring_logs?.risk_score && (
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                autoCase.monitoring_evidence[0].monitoring_logs.risk_score >= 70
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                Risk: {autoCase.monitoring_evidence[0].monitoring_logs.risk_score}%
                              </span>
                            </div>
                          )}
                          
                          <div className="mt-2 text-xs text-gray-500">
                            Created: {new Date(autoCase.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <Link
                          to={`/cases/${autoCase.id}`}
                          className="ml-3 text-blue-600 hover:text-blue-800 flex-shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                {autoCases.length > 10 && (
                  <div className="mt-4 text-center border-t pt-4">
                    <Link
                      to="/cases?filter=auto_generated"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View {autoCases.length - 10} more auto-generated cases →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Monitoring Jobs Column */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Search className="h-5 w-5 mr-2 text-blue-600" />
                  Monitoring Jobs
                  <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full">
                    {jobs.length}
                  </span>
                </h2>
                {canCreate && (
                  <Link 
                    to="/monitoring/create" 
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Job
                  </Link>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Monitor specific URLs for IP infringement
              </p>
            </div>
            
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No monitoring jobs</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new monitoring job.
                </p>
                {canCreate && (
                  <div className="mt-6">
                    <Link
                      to="/monitoring/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Monitoring Job
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {jobs.map((job) => (
                  <div key={job.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(job.job_status)}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {job.ip_assets?.title || 'Unknown IP Asset'}
                            </h3>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {job.url}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.job_status)}`}>
                            {job.job_status}
                          </span>
                          
                          <span className="text-xs text-gray-500">
                            {job.ip_assets?.type}
                          </span>
                          
                          <span className="text-xs text-gray-500">
                            Created: {new Date(job.created_at).toLocaleDateString()}
                          </span>
                          
                          {job.monitoring_logs && job.monitoring_logs.length > 0 && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(job.monitoring_logs[0].risk_score)}`}>
                              Risk: {job.monitoring_logs[0].risk_score}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {job.job_status === 'pending' && (
                          <button
                            onClick={() => handleExecuteJob(job.id)}
                            disabled={executeJob.isLoading}
                            className="btn-secondary py-1 px-3 text-sm"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Execute
                          </button>
                        )}
                        
                        <Link
                          to={`/monitoring/${job.id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                            title="Open target URL"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={deleteJob.isLoading}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                          title="Delete monitoring job"
                        >
                          {deleteJob.isLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Monitoring;