import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc.js';
import Layout from '../components/Layout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { ArrowLeft, Briefcase, ExternalLink } from 'lucide-react';

const CreateCase = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    relatedIpAssetId: '',
    suspectedUrl: '',
    description: '',
    status: 'open'
  });
  const [errors, setErrors] = useState({});

  // Fetch user's IP assets for the dropdown
  const { data: assetsData, isLoading: assetsLoading } = trpc.assets.list.useQuery({
    limit: 100,
    offset: 0
  });

  const createMutation = trpc.cases.create.useMutation({
    onSuccess: () => {
      navigate('/cases');
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.relatedIpAssetId) {
      newErrors.relatedIpAssetId = 'IP Asset is required';
    }
    if (!formData.suspectedUrl.trim()) {
      newErrors.suspectedUrl = 'Suspected URL is required';
    } else {
      // Basic URL validation
      try {
        new URL(formData.suspectedUrl);
      } catch {
        newErrors.suspectedUrl = 'Please enter a valid URL';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createMutation.mutate({
      title: formData.title.trim(),
      relatedIpAssetId: formData.relatedIpAssetId,
      suspectedUrl: formData.suspectedUrl.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status
    });
  };

  const assets = assetsData?.assets || [];

  if (assetsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/cases')}
            className="p-2 text-gray-400 hover:text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create IP Infringement Case</h1>
            <p className="text-gray-600">Report a new intellectual property violation</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Briefcase className="h-6 w-6 text-primary-600" />
              <h2 className="text-lg font-medium text-gray-900">Case Information</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{errors.submit}</div>
              </div>
            )}

            {/* Check if user has IP assets */}
            {assets.length === 0 && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="text-sm text-yellow-700">
                  You need to register at least one IP asset before creating a case.{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/assets/new')}
                    className="font-medium underline hover:no-underline"
                  >
                    Register an IP asset first
                  </button>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="form-label">
                Case Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="mt-1 input"
                placeholder="Brief description of the infringement"
                value={formData.title}
                onChange={handleChange}
              />
              {errors.title && (
                <p className="mt-1 form-error">{errors.title}</p>
              )}
            </div>

            {/* Related IP Asset */}
            <div>
              <label htmlFor="relatedIpAssetId" className="form-label">
                Related IP Asset *
              </label>
              <select
                id="relatedIpAssetId"
                name="relatedIpAssetId"
                required
                className="mt-1 input"
                value={formData.relatedIpAssetId}
                onChange={handleChange}
                disabled={assets.length === 0}
              >
                <option value="">Select an IP asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.title} ({asset.type})
                  </option>
                ))}
              </select>
              {errors.relatedIpAssetId && (
                <p className="mt-1 form-error">{errors.relatedIpAssetId}</p>
              )}
            </div>

            {/* Suspected URL */}
            <div>
              <label htmlFor="suspectedUrl" className="form-label">
                Suspected Infringing URL *
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="url"
                  id="suspectedUrl"
                  name="suspectedUrl"
                  required
                  className="input"
                  placeholder="https://example.com/infringing-content"
                  value={formData.suspectedUrl}
                  onChange={handleChange}
                />
                {formData.suspectedUrl && (
                  <a
                    href={formData.suspectedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              {errors.suspectedUrl && (
                <p className="mt-1 form-error">{errors.suspectedUrl}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="mt-1 textarea"
                placeholder="Describe the infringement in detail..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="form-label">
                Initial Status
              </label>
              <select
                id="status"
                name="status"
                className="mt-1 input"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/cases')}
                className="btn-outline py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading || assets.length === 0}
                className="btn-primary py-2 px-4"
              >
                {createMutation.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Case'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateCase;