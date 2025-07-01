import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { trpc } from '../lib/trpc.js';
import Layout from '../components/Layout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EvidenceUpload from '../components/EvidenceUpload.jsx';
import EvidenceList from '../components/EvidenceList.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import { useCasesHybridRealtime, useEvidenceHybridRealtime } from '../hooks/useHybridRealtime.js';
import { 
  ArrowLeft, 
  Briefcase, 
  Edit,
  ExternalLink,
  FileText,
  Shield,
  Calendar,
  User,
  Upload,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';

const ViewCase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const { data: caseData, isLoading, error, refetch } = trpc.cases.getById.useQuery({
    id: id
  });

  // Real-time subscription for case updates
  const { 
    subscription: casesSubscription, 
    status: casesStatus,
    connectionMethod: casesMethod 
  } = useCasesHybridRealtime((payload) => {
    console.log(`Real-time case update via ${casesMethod}:`, payload);
    // Only refetch if this specific case was updated
    if (payload.new?.id === id || payload.old?.id === id) {
      setLastUpdate(new Date());
      setTimeout(() => {
        console.log('Refetching case due to real-time update...');
        refetch();
      }, 100);
    }
  });

  // Real-time subscription for evidence updates
  const { 
    subscription: evidenceSubscription, 
    status: evidenceStatus,
    connectionMethod: evidenceMethod 
  } = useEvidenceHybridRealtime((payload) => {
    console.log(`Real-time evidence update via ${evidenceMethod}:`, payload);
    // Only refetch if evidence belongs to this case
    if (payload.new?.case_id === id || payload.old?.case_id === id) {
      setLastUpdate(new Date());
      setTimeout(() => {
        console.log('Refetching case due to evidence update...');
        refetch();
      }, 100);
    }
  }, id);

  // Monitor connection status
  useEffect(() => {
    const isConnected = casesStatus === 'SUBSCRIBED' || evidenceStatus === 'SUBSCRIBED';
    setRealtimeConnected(isConnected);
  }, [casesStatus, evidenceStatus]);

  const handleEvidenceUpdate = () => {
    refetch();
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.open;
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

  if (error || !caseData?.case) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Case not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The case you're looking for doesn't exist or you don't have permission to view it.
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Navigation and Actions Row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/cases')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Back to Cases</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/cases/${caseItem.id}/generate-document`}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Document
              </Link>
              <Link
                to={`/cases/${caseItem.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Case
              </Link>
            </div>
          </div>

          {/* Title and Status Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 truncate">
                {caseItem.title}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseItem.status)}`}>
                  {caseItem.status.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(caseItem.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Real-time Status */}
            <div className="flex items-center space-x-4">
              {lastUpdate && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <div className="flex items-center gap-2">
                {realtimeConnected ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-md" title={`Real-time updates active via ${casesMethod || evidenceMethod}`}>
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      Live {casesMethod === 'polling' || evidenceMethod === 'polling' ? '(Poll)' : '(WS)'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-1 rounded-md" title="Real-time updates disconnected">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs font-medium">Offline</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Generated Case Banner */}
        {caseItem.auto_generated && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Auto-Generated Case
                </h3>
                <p className="text-sm text-blue-700">
                  This case was automatically created from high-risk monitoring detection (70%+ risk score) with comprehensive evidence attached.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Case Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Case Information</h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Case Title
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{caseItem.title}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Status
                </dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>

              {caseItem.suspected_url && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Suspected Infringing URL
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={caseItem.suspected_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-500 flex items-center space-x-1"
                    >
                      <span>{caseItem.suspected_url}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              )}

              {caseItem.description && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {caseItem.description}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(caseItem.created_at).toLocaleString()}
                </dd>
              </div>

              {caseItem.updated_at !== caseItem.created_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(caseItem.updated_at).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Related IP Asset */}
        {caseItem.ip_assets && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Related IP Asset</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <Shield className="h-8 w-8 text-primary-600 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {caseItem.ip_assets.title}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {caseItem.ip_assets.type.replace('_', ' ')}
                  </p>
                  {caseItem.ip_assets.description && (
                    <p className="mt-2 text-sm text-gray-700">
                      {caseItem.ip_assets.description}
                    </p>
                  )}
                  {caseItem.ip_assets.registration_number && (
                    <p className="mt-1 text-sm text-gray-500">
                      Registration: {caseItem.ip_assets.registration_number}
                    </p>
                  )}
                  {caseItem.ip_assets.jurisdiction && (
                    <p className="text-sm text-gray-500">
                      Jurisdiction: {caseItem.ip_assets.jurisdiction}
                    </p>
                  )}
                </div>
                <Link
                  to={`/assets/${caseItem.ip_assets.id}`}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  View Asset
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Evidence</h2>
              <button
                onClick={() => setShowEvidenceUpload(!showEvidenceUpload)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Evidence</span>
                {showEvidenceUpload ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Evidence Upload */}
            {showEvidenceUpload && (
              <div className="mb-6">
                <EvidenceUpload 
                  caseId={caseItem.id} 
                  onUploadComplete={() => {
                    handleEvidenceUpdate();
                    setShowEvidenceUpload(false);
                  }} 
                />
              </div>
            )}
            
            {/* Unified Evidence Display */}
            <div className="space-y-8">
              {/* Monitoring Evidence (Auto-Generated) */}
              {caseItem.monitoring_evidence && caseItem.monitoring_evidence.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-green-600" />
                      Auto-Generated Evidence
                    </h3>
                    <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
                      {caseItem.monitoring_evidence.length} items
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caseItem.monitoring_evidence.map((evidence) => (
                      <div key={evidence.id} className="border border-green-200 rounded-xl p-5 bg-gradient-to-br from-green-50 to-green-100 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-base font-semibold text-gray-900 capitalize">
                            {evidence.evidence_type.replace('_', ' ')}
                          </span>
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">
                            Auto
                          </span>
                        </div>
                        <div className="flex-grow">
                        
                        {evidence.evidence_type === 'screenshot' && evidence.evidence_url && (
                          <div>
                            <div className="relative">
                              <img 
                                src={evidence.evidence_url} 
                                alt="Monitoring Screenshot"
                                className="w-full h-32 object-cover rounded border mb-2"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/300x200?text=Screenshot+Unavailable";
                                }}
                              />
                              <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-tl">
                                Screenshot
                              </div>
                            </div>
                            <a 
                              href={evidence.evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              View Full Screenshot <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                        
                        {evidence.evidence_type === 'risk_analysis' && evidence.evidence_data && (
                          <div>
                            <div className="bg-white rounded-lg p-4 mb-3 border border-red-200">
                              <div className="flex items-center justify-center mb-3">
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-red-600">
                                    {evidence.evidence_data.risk_score}%
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">Risk Score</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800 text-center">
                                {evidence.evidence_data.analysis_result}
                              </div>
                            </div>
                            {evidence.evidence_data.confidence && (
                              <div className="mt-2 text-xs text-gray-500">
                                Confidence: {evidence.evidence_data.confidence}%
                              </div>
                            )}
                            {evidence.evidence_data.details && (
                              <div className="mt-2">
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Analysis Details</summary>
                                  <div className="mt-2 p-2 bg-gray-100 rounded-md overflow-auto max-h-32 text-gray-700">
                                    <pre className="whitespace-pre-wrap text-xs">
                                      {JSON.stringify(evidence.evidence_data.details, null, 2)}
                                    </pre>
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {evidence.evidence_type === 'html_content' && evidence.evidence_data && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Page Title:</div>
                            <div className="text-sm font-medium text-gray-900 mb-2 break-words">
                              {evidence.evidence_data.page_title || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">URL:</div>
                            <div className="text-sm text-blue-600 break-all mb-2">
                              {evidence.evidence_data.page_url}
                            </div>
                            <div className="flex space-x-3 mb-2">
                              {evidence.evidence_data.word_count && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-medium">Words:</span> {evidence.evidence_data.word_count}
                                </div>
                              )}
                              {evidence.evidence_data.image_count && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-medium">Images:</span> {evidence.evidence_data.image_count}
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <details className="text-xs">
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View HTML Content</summary>
                                <div className="mt-2 p-2 bg-gray-100 rounded-md overflow-auto max-h-32 text-gray-700">
                                  <code className="whitespace-pre-wrap text-xs">
                                    {evidence.evidence_data.html_content?.substring(0, 500)}
                                    {evidence.evidence_data.html_content?.length > 500 ? '...' : ''}
                                  </code>
                                </div>
                              </details>
                            </div>
                          </div>
                        )}
                        
                        </div>
                        <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-green-200">
                          <div className="flex items-center justify-between">
                            <span>Collected: {new Date(evidence.created_at).toLocaleDateString()}</span>
                            <span className="text-green-600 font-medium">AI Generated</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Uploaded Evidence (Manual) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-blue-600" />
                    Uploaded Evidence
                  </h3>
                  <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                    {(caseItem.evidence_files || []).length} items
                  </span>
                </div>
                <EvidenceList 
                  caseId={caseItem.id}
                  evidence={caseItem.evidence_files || []}
                  onEvidenceUpdate={handleEvidenceUpdate}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Related Documents */}
        {caseItem.documents && caseItem.documents.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Generated Documents</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {caseItem.documents.map((document) => (
                <div key={document.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-primary-600" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {document.type?.replace('_', ' ').toUpperCase()} Letter
                        </h3>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/documents/${document.id}`}
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      View Document
                    </Link>
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

export default ViewCase;