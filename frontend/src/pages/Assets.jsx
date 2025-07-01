import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../lib/trpc.js';
import { useUserRole } from '../hooks/useUserRole.js';
import Layout from '../components/Layout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import RoleGuard from '../components/RoleGuard.jsx';
import { 
  Shield, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react';

const Assets = () => {
  const { canCreate, canEdit, role } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  // Fetch assets
  const { data: assetsData, isLoading, refetch } = trpc.assets.list.useQuery({
    limit: 50,
    offset: 0,
    type: filterType || undefined
  });

  const assets = assetsData?.assets || [];

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset =>
    asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-gray-900">IP Assets</h1>
            <p className="text-gray-600">Manage your intellectual property portfolio</p>
          </div>
          {canCreate && (
            <Link
              to="/assets/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Register IP Asset
            </Link>
          )}
        </div>

        {/* What are IP Assets? */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-green-500 rounded-full p-1">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">What are IP Assets?</h3>
              <p className="mt-1 text-sm text-green-800">
                IP Assets are your valuable intellectual property that need protection. This includes:
                <strong> Trademarks</strong> (brand names, logos), <strong>Copyrights</strong> (creative content, images), 
                <strong> Patents</strong> (inventions), and <strong>Trade Secrets</strong> (confidential business information).
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
                placeholder="Search assets..."
                className="pl-10 input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                className="pl-10 input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="trademark">Trademark</option>
                <option value="copyright">Copyright</option>
                <option value="patent">Patent</option>
                <option value="trade_secret">Trade Secret</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-white shadow rounded-lg">
          {filteredAssets.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onUpdate={refetch} canEdit={canEdit} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No IP assets</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by registering your first intellectual property asset.
              </p>
              {canCreate && (
                <div className="mt-6">
                  <Link
                    to="/assets/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Register IP Asset
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

const AssetCard = ({ asset, onUpdate, canEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deleteMutation = trpc.assets.delete.useMutation({
    onSuccess: () => {
      onUpdate();
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this IP asset?')) {
      setIsDeleting(true);
      deleteMutation.mutate({ id: asset.id });
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      trademark: 'bg-blue-100 text-blue-800',
      copyright: 'bg-green-100 text-green-800',
      patent: 'bg-purple-100 text-purple-800',
      trade_secret: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {asset.title}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(asset.type)}`}>
              {asset.type.replace('_', ' ')}
            </span>
          </div>
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
            {asset.registration_number && (
              <span>Reg: {asset.registration_number}</span>
            )}
            {asset.jurisdiction && (
              <span>Jurisdiction: {asset.jurisdiction}</span>
            )}
            <span>Created: {new Date(asset.created_at).toLocaleDateString()}</span>
          </div>
          {asset.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {asset.description}
            </p>
          )}
          {asset.tags && asset.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {asset.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center space-x-2">
            <Link
              to={`/assets/${asset.id}/edit`}
              className="p-2 text-gray-400 hover:text-gray-500"
              title="Edit asset"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
              title="Delete asset"
            >
              {isDeleting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assets;