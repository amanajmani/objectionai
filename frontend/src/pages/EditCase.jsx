import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc.js';
import Layout from '../components/Layout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { 
  ArrowLeft, 
  Save, 
  Briefcase,
  AlertCircle,
  Eye,
  ExternalLink
} from 'lucide-react';

const EditCase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    relatedIpAssetId: '',
    suspectedUrl: '',
    description: '',
    status: 'open'
  });
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: caseData, isLoading: caseLoading } = trpc.cases.getById.useQuery({
    id: id
  });

  const { data: assetsData, isLoading: assetsLoading } = trpc.assets.list.useQuery({
    limit: 100,
    offset: 0
  });

  const updateMutation = trpc.cases.update.useMutation({
    onSuccess: () => {
      setHasChanges(false);
      navigate(`/cases/${id}`);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    }
  });

  useEffect(() => {
    if (caseData?.case) {
      setFormData({
        title: caseData.case.title || '',
        relatedIpAssetId: caseData.case.related_ip_asset_id || '',
        suspectedUrl: caseData.case.suspected_url || '',
        description: caseData.case.description || '',
        status: caseData.case.status || 'open'
      });
    }
  }, [caseData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
    
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

    updateMutation.mutate({
      id: id,
      title: formData.title.trim(),
      suspectedUrl: formData.suspectedUrl.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status
    });
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/cases/${id}`);
      }
    } else {
      navigate(`/cases/${id}`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.open;
  };

  const assets = assetsData?.assets || [];

  if (caseLoading || assetsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!caseData?.case) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Case not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The case you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/cases')}
              className="btn-primary py-2 px-4"
            >
              Back to Cases
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const caseItem = caseData.case;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Case</h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                  {caseItem.status.replace('_', ' ')}
                </span>
                {hasChanges && (
                  <span className="text-sm text-orange-600 font-medium">
                    • Unsaved changes
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/cases/${id}`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Case
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <div className="text-sm text-red-700">{errors.submit}</div>
                </div>
              </div>
            </div>
          )}

          {/* Case Status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Case Status</h2>
            </div>
            <div className="p-6">
              <div>
                <label htmlFor="status" className="form-label">
                  Status *
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
                <p className="mt-1 text-sm text-gray-500">
                  Update the case status to track its progress through your workflow.
                </p>
              </div>
            </div>
          </div>

          {/* Case Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Briefcase className="h-6 w-6 text-primary-600" />
                <h2 className="text-lg font-medium text-gray-900">Case Information</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
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
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 bg-white shadow rounded-lg p-6">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-outline py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading || !hasChanges}
              className="btn-primary py-2 px-4"
            >
              {updateMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditCase;