import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc.js';
import Layout from '../components/Layout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { 
  ArrowLeft, 
  Save, 
  FileText,
  AlertCircle,
  Eye
} from 'lucide-react';

const EditDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content: '',
    status: 'draft'
  });
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: documentData, isLoading } = trpc.documents.getById.useQuery({
    id: id
  });

  const updateMutation = trpc.documents.update.useMutation({
    onSuccess: () => {
      setHasChanges(false);
      navigate(`/documents/${id}`);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    }
  });

  useEffect(() => {
    if (documentData?.document) {
      setFormData({
        content: documentData.document.content || '',
        status: documentData.document.status || 'draft'
      });
    }
  }, [documentData]);

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
    if (!formData.content.trim()) {
      newErrors.content = 'Document content is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateMutation.mutate({
      id: id,
      content: formData.content.trim(),
      status: formData.status
    });
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/documents/${id}`);
      }
    } else {
      navigate(`/documents/${id}`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      reviewed: 'bg-blue-100 text-blue-800',
      finalized: 'bg-green-100 text-green-800',
      sent: 'bg-purple-100 text-purple-800',
      archived: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.draft;
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

  if (!documentData?.document) {
    return (
      <Layout>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Document not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The document you're trying to edit doesn't exist or you don't have permission to edit it.
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

  const document = documentData.document;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
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
              <h1 className="text-2xl font-bold text-gray-900">
                Edit {document.type.replace('_', ' ').toUpperCase()} Letter
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
                <span className="text-sm text-gray-500">
                  Version {document.version}
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
              onClick={() => navigate(`/documents/${id}`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </button>
          </div>
        </div>

        {/* Case Information */}
        {document.cases && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Related Case</h3>
                <p className="text-sm text-blue-700">{document.cases.title}</p>
                {document.cases.suspected_url && (
                  <p className="text-xs text-blue-600">
                    URL: {document.cases.suspected_url}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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

          {/* Document Status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Document Status</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="status" className="form-label">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="mt-1 input"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="draft">Draft</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="finalized">Finalized</option>
                    <option value="sent">Sent</option>
                    <option value="archived">Archived</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Update the document status to track its progress through your workflow.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Document Content</h2>
            </div>
            <div className="p-6">
              <div>
                <label htmlFor="content" className="form-label">
                  Legal Document Text
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={25}
                  className="mt-1 textarea font-mono text-sm"
                  placeholder="Enter the legal document content..."
                  value={formData.content}
                  onChange={handleChange}
                />
                {errors.content && (
                  <p className="mt-1 form-error">{errors.content}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Edit the AI-generated content to match your specific requirements and legal standards.
                </p>
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

export default EditDocument;