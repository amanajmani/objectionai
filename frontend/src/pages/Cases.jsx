import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { trpc } from '../lib/trpc.js';
import { useUserRole } from '../hooks/useUserRole.js';
import Layout from '../components/Layout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { 
  Briefcase, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const Cases = () => {
  const { canCreate, canEdit, isReviewer } = useUserRole();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  // Read status from URL parameter
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilterStatus(statusParam);
    }
  }, [searchParams]);

  // Fetch cases
  const { data: casesData, isLoading, refetch } = trpc.cases.list.useQuery({
    limit: 50,
    offset: 0,
    status: filterStatus || undefined
  });

  // Real-time updates for case collaboration
  useEffect(() => {
    console.log('Setting up real-time case updates...');
    
    // Immediate refresh on mount
    refetch();
    
    // Smart polling for real-time collaboration
    const interval = setInterval(() => {
      console.log('Real-time refresh: updating cases...');
      refetch();
      setLastUpdate(new Date());
    }, 5000); // Poll every 5 seconds for team collaboration

    return () => clearInterval(interval);
  }, [refetch]);

  const cases = casesData?.cases || [];

  // Delete all cases mutation
  const deleteAllCases = trpc.cases.deleteAll.useMutation({
    onSuccess: (result) => {
      refetch();
      alert(result.message);
    },
    onError: (error) => {
      console.error('Failed to delete all cases:', error);
      alert('Failed to delete all cases. Please try again.');
    },
  });

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete ALL cases? This action cannot be undone and will remove all case data including evidence and documents.')) {
      deleteAllCases.mutate();
    }
  };

  // Filter cases based on search term
  const filteredCases = cases.filter(caseItem =>
    caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (caseItem.suspected_url && caseItem.suspected_url.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IP Infringement Cases</h1>
            <div className="flex items-center space-x-3">
              <p className="text-gray-600">Track and manage intellectual property violations</p>
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            {canEdit && (
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllCases.isLoading || cases.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteAllCases.isLoading ? 'Deleting...' : 'Delete All'}
              </button>
            )}
            {canCreate && (
              <Link
                to="/cases/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Case
              </Link>
            )}
          </div>
        </div>

        {/* Helpful Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-500 rounded-full p-1">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">How to Generate Legal Documents</h3>
              <p className="mt-1 text-sm text-blue-800">
                Click the <strong>"Generate Document"</strong> button on any case to create professional legal letters with AI. 
                Our system analyzes your case details and evidence to automatically generate cease & desist letters, DMCA notices, and more.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cases..."
                className="pl-10 input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                className="pl-10 input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cases List */}
        <div className="bg-white shadow rounded-lg">
          {filteredCases.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredCases.map((caseItem) => (
                <CaseCard key={caseItem.id} case={caseItem} onUpdate={refetch} canEdit={canEdit} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cases</h3>
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
    </Layout>
  );
};

const CaseCard = ({ case: caseItem, onUpdate, canEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deleteMutation = trpc.cases.delete.useMutation({
    onSuccess: () => {
      onUpdate();
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      setIsDeleting(true);
      deleteMutation.mutate({ id: caseItem.id });
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {caseItem.title}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
              {caseItem.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
            {caseItem.ip_assets && (
              <span>IP Asset: {caseItem.ip_assets.title}</span>
            )}
            <span>Created: {new Date(caseItem.created_at).toLocaleDateString()}</span>
          </div>
          
          {caseItem.suspected_url && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Suspected URL:</span>
              <a
                href={caseItem.suspected_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-500 flex items-center space-x-1"
              >
                <span className="truncate max-w-md">{caseItem.suspected_url}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          
          {caseItem.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {caseItem.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Link
            to={`/cases/${caseItem.id}/generate-document`}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
            title="Generate AI Document"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Generate Document
          </Link>
          <Link
            to={`/cases/${caseItem.id}`}
            className="p-2 text-gray-400 hover:text-gray-500"
            title="View case"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {canEdit && (
            <>
              <Link
                to={`/cases/${caseItem.id}/edit`}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Edit case"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                title="Delete case"
              >
                {isDeleting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cases;