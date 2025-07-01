import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../lib/trpc';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import RoleGuard from '../components/RoleGuard';
import { ArrowLeft, Search, Shield } from 'lucide-react';

const monitoringJobSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  ipAssetId: z.string().min(1, 'Please select an IP asset'),
});

const CreateMonitoringJob = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(monitoringJobSchema),
  });

  const { data: assetsData, isLoading: assetsLoading } = trpc.assets.list.useQuery({});

  const createJob = trpc.monitoring.createJob.useMutation({
    onSuccess: (data) => {
      navigate(`/monitoring/${data.job.id}`);
    },
    onError: (error) => {
      console.error('Failed to create monitoring job:', error);
    },
  });

  const onSubmit = async (data) => {
    try {
      await createJob.mutateAsync(data);
    } catch (error) {
      // Error handling is done in onError
    }
  };

  const assets = assetsData?.assets || [];

  return (
    <Layout>
      <RoleGuard requiredPermission="create">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/monitoring')}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Monitoring Job</h1>
              <p className="text-gray-600">Set up automated monitoring for potential IP infringement</p>
            </div>
          </div>

          {/* Getting Started Tip */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-purple-500 rounded-full p-1">
                <Search className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-purple-900">Advanced IP Protection</h3>
                <p className="mt-1 text-sm text-purple-800">
                  Monitoring jobs automatically scan websites for potential infringement of your IP assets. 
                  Perfect for tracking competitor sites, marketplaces, or any URL where your IP might be misused.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Monitoring Configuration
              </h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* IP Asset Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="h-4 w-4 inline mr-1" />
                  IP Asset to Monitor
                </label>
                {assetsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-gray-500">Loading IP assets...</span>
                  </div>
                ) : (
                  <select
                    {...register('ipAssetId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an IP asset to monitor</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.title} ({asset.type})
                      </option>
                    ))}
                  </select>
                )}
                {errors.ipAssetId && (
                  <p className="mt-1 text-sm text-red-600">{errors.ipAssetId.message}</p>
                )}
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target URL
                </label>
                <input
                  type="url"
                  {...register('url')}
                  placeholder="https://example.com/page-to-monitor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Enter the URL you want to monitor for potential IP infringement
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">How Monitoring Works</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• The system will take screenshots of the target URL</li>
                  <li>• AI will analyze the content for potential IP infringement</li>
                  <li>• Risk scores will be calculated based on similarity to your IP assets</li>
                  <li>• You'll be notified of any high-risk findings</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/monitoring')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJob.isLoading}
                  className="btn-primary py-2 px-4 disabled:opacity-50"
                >
                  {createJob.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Create Monitoring Job
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </RoleGuard>
    </Layout>
  );
};

export default CreateMonitoringJob;