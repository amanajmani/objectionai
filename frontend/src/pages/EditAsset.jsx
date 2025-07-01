import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../lib/trpc';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import RoleGuard from '../components/RoleGuard';
import { ArrowLeft, Shield, Save } from 'lucide-react';

const assetSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['trademark', 'copyright', 'patent', 'trade_secret', 'other']),
  description: z.string().optional(),
  registrationNumber: z.string().optional(),
  jurisdiction: z.string().optional(),
  tags: z.string().optional(),
});

const EditAsset = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: assetData, isLoading: assetLoading } = trpc.assets.getById.useQuery({
    id: id
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(assetSchema),
  });

  const updateAsset = trpc.assets.update.useMutation({
    onSuccess: () => {
      navigate('/assets');
    },
    onError: (error) => {
      console.error('Failed to update asset:', error);
    },
  });

  // Set form values when asset data loads
  React.useEffect(() => {
    if (assetData?.asset) {
      const asset = assetData.asset;
      setValue('title', asset.title);
      setValue('type', asset.type);
      setValue('description', asset.description || '');
      setValue('registrationNumber', asset.registration_number || '');
      setValue('jurisdiction', asset.jurisdiction || '');
      setValue('tags', asset.tags ? asset.tags.join(', ') : '');
    }
  }, [assetData, setValue]);

  const onSubmit = async (data) => {
    try {
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      
      await updateAsset.mutateAsync({
        id: id,
        title: data.title,
        type: data.type,
        description: data.description,
        registrationNumber: data.registrationNumber,
        jurisdiction: data.jurisdiction,
        tags: tags,
      });
    } catch (error) {
      // Error handling is done in onError
    }
  };

  if (assetLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!assetData?.asset) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Asset not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The IP asset you're looking for doesn't exist or you don't have permission to edit it.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/assets')}
              className="btn-primary py-2 px-4"
            >
              Back to Assets
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <RoleGuard requiredPermission="edit">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/assets')}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit IP Asset</h1>
              <p className="text-gray-600">Update your intellectual property information</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Asset Information
              </h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Title *
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the name of your IP asset"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Type *
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select asset type</option>
                  <option value="trademark">Trademark</option>
                  <option value="copyright">Copyright</option>
                  <option value="patent">Patent</option>
                  <option value="trade_secret">Trade Secret</option>
                  <option value="other">Other</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your IP asset in detail..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  {...register('registrationNumber')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., USPTO #12345678"
                />
                {errors.registrationNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.registrationNumber.message}</p>
                )}
              </div>

              {/* Jurisdiction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  {...register('jurisdiction')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., United States, European Union"
                />
                {errors.jurisdiction && (
                  <p className="mt-1 text-sm text-red-600">{errors.jurisdiction.message}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  {...register('tags')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tags separated by commas"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separate multiple tags with commas (e.g., brand, logo, marketing)
                </p>
                {errors.tags && (
                  <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/assets')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateAsset.isLoading}
                  className="btn-primary py-2 px-4 disabled:opacity-50"
                >
                  {updateAsset.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Asset
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

export default EditAsset;