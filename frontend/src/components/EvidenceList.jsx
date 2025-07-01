import React, { useState } from 'react';
import { Download, Eye, Trash2, Edit3, Tag, Calendar, User } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { formatFileSize, getFileIcon } from '../lib/fileUtils';
import LoadingSpinner from './LoadingSpinner';

const EvidenceList = ({ caseId, evidence, onEvidenceUpdate }) => {
  const [editingEvidence, setEditingEvidence] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', tags: '' });

  const deleteEvidence = trpc.evidence.delete.useMutation({
    onSuccess: () => {
      if (onEvidenceUpdate) onEvidenceUpdate();
    },
  });

  const updateEvidence = trpc.evidence.update.useMutation({
    onSuccess: () => {
      setEditingEvidence(null);
      if (onEvidenceUpdate) onEvidenceUpdate();
    },
  });

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const handlePreview = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const handleDelete = async (evidenceId, fileName) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        await deleteEvidence.mutateAsync({ id: evidenceId });
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete evidence');
      }
    }
  };

  const startEdit = (evidenceItem) => {
    setEditingEvidence(evidenceItem.id);
    setEditForm({
      title: evidenceItem.title || '',
      description: evidenceItem.description || '',
      tags: evidenceItem.tags ? evidenceItem.tags.join(', ') : '',
    });
  };

  const handleUpdate = async (evidenceId) => {
    try {
      const tags = editForm.tags
        ? editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      await updateEvidence.mutateAsync({
        id: evidenceId,
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update evidence');
    }
  };

  const cancelEdit = () => {
    setEditingEvidence(null);
    setEditForm({ title: '', description: '', tags: '' });
  };

  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Eye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>No evidence uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Evidence Files</h3>
      
      <div className="grid gap-4">
        {evidence.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            {editingEvidence === item.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Evidence title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Evidence description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdate(item.id)}
                    disabled={updateEvidence.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {updateEvidence.isLoading && <LoadingSpinner size="sm" />}
                    <span>Save</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getFileIcon(item.mime_type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item.title || item.file_name}
                      </h4>
                      <p className="text-sm text-gray-500">{item.file_name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(item.file_size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePreview(item.file_url)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(item.file_url, item.file_name)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.file_name)}
                      disabled={deleteEvidence.isLoading}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                      title="Delete"
                    >
                      {deleteEvidence.isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {item.description && (
                  <p className="text-gray-600 mb-3">{item.description}</p>
                )}
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex items-center space-x-2 mb-3">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(item.uploaded_at).toLocaleDateString()} at{' '}
                      {new Date(item.uploaded_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvidenceList;