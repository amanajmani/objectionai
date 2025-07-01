import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import RoleGuard from '../components/RoleGuard';
import { useUserRole } from '../hooks/useUserRole';
import { 
  ArrowLeft, 
  ExternalLink, 
  Play, 
  Eye, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Calendar,
  Image,
  Trash2
} from 'lucide-react';

const ViewMonitoringJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canCreate } = useUserRole();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: jobData, isLoading, error, refetch } = trpc.monitoring.getById.useQuery({
    id: id
  });

  const executeJob = trpc.monitoring.executeJob.useMutation({
    onSuccess: () => {
      refetch();
      setLastUpdate(new Date());
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
      navigate('/monitoring');
    },
    onError: (error) => {
      console.error('Failed to delete monitoring job:', error);
    },
  });

  // Real-time updates for this specific monitoring job
  useEffect(() => {
    console.log(`Setting up real-time updates for monitoring job: ${id}`);
    
    // Immediate refresh on mount
    refetch();
    
    // Smart polling: frequent updates for job status changes
    const interval = setInterval(() => {
      console.log(`Real-time refresh: updating job ${id}...`);
      refetch();
      setLastUpdate(new Date());
    }, 2000); // Poll every 2 seconds for individual job (more frequent for detailed view)

    return () => clearInterval(interval);
  }, [id, refetch]);

  const handleExecuteJob = async () => {
    try {
      await executeJob.mutateAsync({ id });
    } catch (error) {
      console.error('Failed to execute job:', error);
    }
  };

  const handleDeleteJob = async () => {
    if (window.confirm('Are you sure you want to delete this monitoring job? This action cannot be undone and will remove all associated logs and evidence.')) {
      try {
        await deleteJob.mutateAsync({ id });
      } catch (error) {
        console.error('Failed to delete job:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <LoadingSpinner size="sm" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
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
    if (riskScore >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (riskScore >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskLevel = (riskScore) => {
    if (riskScore >= 70) return 'HIGH RISK';
    if (riskScore >= 40) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !jobData?.job) {
    return (
      <Layout>
        <div className="text-center py-12">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Monitoring job not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The monitoring job you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/monitoring')}
              className="btn-primary py-2 px-4"
            >
              Back to Monitoring
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const job = jobData.job;
  const logs = job.monitoring_logs || [];
  const latestLog = logs[0];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/monitoring')}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Monitoring Job Details
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                {getStatusIcon(job.job_status)}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.job_status)}`}>
                  {job.job_status.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  Created: {new Date(job.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-500">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {job.job_status === 'pending' && canCreate && (
              <button
                onClick={handleExecuteJob}
                disabled={executeJob.isLoading}
                className="btn-primary py-2 px-4 disabled:opacity-50"
              >
                {executeJob.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Job
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={handleDeleteJob}
              disabled={deleteJob.isLoading}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
            >
              {deleteJob.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </>
              )}
            </button>
          </div>
        </div>

        {/* Job Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Job Information</h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Protected IP Asset
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.ip_assets?.title} ({job.ip_assets?.type})
                </dd>
                {job.ip_assets?.description && (
                  <dd className="mt-1 text-sm text-gray-500">
                    {job.ip_assets.description}
                  </dd>
                )}
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Target URL
                </dt>
                <dd className="mt-1">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-500 flex items-center space-x-1"
                  >
                    <span>{job.url}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(job.created_at).toLocaleString()}
                </dd>
              </div>

              {job.completed_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Completed
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(job.completed_at).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>

            {job.error_message && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{job.error_message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Analysis Results */}
        {latestLog && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Latest Analysis Results</h2>
            </div>
            <div className="p-6">
              {/* Risk Score */}
              <div className={`p-4 rounded-lg border-2 ${getRiskColor(latestLog.risk_score)} mb-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6" />
                    <div>
                      <h3 className="font-medium">Risk Assessment</h3>
                      <p className="text-sm opacity-75">
                        {getRiskLevel(latestLog.risk_score)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{latestLog.risk_score}%</div>
                    <div className="text-sm opacity-75">Risk Score</div>
                  </div>
                </div>
              </div>

              {/* Analysis Result */}
              {latestLog.result && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Analysis Summary</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {latestLog.result}
                  </p>
                </div>
              )}

              {/* Screenshot */}
              {latestLog.screenshot_url && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Image className="h-4 w-4 mr-2" />
                    Screenshot Evidence
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={latestLog.screenshot_url}
                      alt="Website screenshot"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <a
                      href={latestLog.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Full Size
                    </a>
                    <a
                      href={latestLog.screenshot_url}
                      download
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {latestLog.metadata && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Technical Details</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(latestLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis History */}
        {logs.length > 1 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Analysis History</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {logs.slice(1).map((log) => (
                <div key={log.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">{log.result}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(log.risk_score)}`}>
                      {log.risk_score}% Risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ViewMonitoringJob;