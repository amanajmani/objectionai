import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc.js';
import Layout from '../components/Layout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { ArrowLeft, Shield } from 'lucide-react';

const CreateAsset = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    type: 'trademark',
    description: '',
    registrationNumber: '',
    jurisdiction: '',
    tags: ''
  });
  const [errors, setErrors] = useState({});

  const createMutation = trpc.assets.create.useMutation({
    onSuccess: () => {
      navigate('/assets');
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
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Process tags
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    createMutation.mutate({
      title: formData.title.trim(),
      type: formData.type,
      description: formData.description.trim() || undefined,
      registrationNumber: formData.registrationNumber.trim() || undefined,
      jurisdiction: formData.jurisdiction.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined
    });
  };

  return (
    <Layout>
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
            <h1 className="text-2xl font-bold text-gray-900">Register IP Asset</h1>
            <p className="text-gray-600">Add a new intellectual property asset to your portfolio</p>
          </div>
        </div>

        {/* Getting Started Tip */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-green-500 rounded-full p-1">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">Step 1: Register Your IP Assets</h3>
              <p className="mt-1 text-sm text-green-800">
                Start by adding the intellectual property you want to protect. This could be your company logo, 
                brand name, creative content, or inventions. Once registered, you can create cases to track infringement.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-primary-600" />
              <h2 className="text-lg font-medium text-gray-900">Asset Information</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{errors.submit}</div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="form-label">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="mt-1 input"
                placeholder="Enter the name of your IP asset"
                value={formData.title}
                onChange={handleChange}
              />
              {errors.title && (
                <p className="mt-1 form-error">{errors.title}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="form-label">
                Type *
              </label>
              <select
                id="type"
                name="type"
                required
                className="mt-1 input"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="trademark">Trademark</option>
                <option value="copyright">Copyright</option>
                <option value="patent">Patent</option>
                <option value="trade_secret">Trade Secret</option>
                <option value="other">Other</option>
              </select>
              {errors.type && (
                <p className="mt-1 form-error">{errors.type}</p>
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
                rows={3}
                className="mt-1 textarea"
                placeholder="Describe your intellectual property asset"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Registration Number */}
            <div>
              <label htmlFor="registrationNumber" className="form-label">
                Registration Number
              </label>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                className="mt-1 input"
                placeholder="e.g., USPTO Registration #1234567"
                value={formData.registrationNumber}
                onChange={handleChange}
              />
            </div>

            {/* Jurisdiction */}
            <div>
              <label htmlFor="jurisdiction" className="form-label">
                Jurisdiction
              </label>
              <input
                type="text"
                id="jurisdiction"
                name="jurisdiction"
                className="mt-1 input"
                placeholder="e.g., United States, European Union"
                value={formData.jurisdiction}
                onChange={handleChange}
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="form-label">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                className="mt-1 input"
                placeholder="Enter tags separated by commas (e.g., logo, brand, software)"
                value={formData.tags}
                onChange={handleChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/assets')}
                className="btn-outline py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="btn-primary py-2 px-4"
              >
                {createMutation.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Register Asset'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateAsset;