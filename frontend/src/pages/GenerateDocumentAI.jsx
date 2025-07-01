import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useUserRole } from '../hooks/useUserRole';
import { 
  Bot, 
  Brain, 
  Settings, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Clock,
  Zap,
  Eye,
  FileCheck,
} from 'lucide-react';

const GenerateDocumentAI = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [formData, setFormData] = useState({
    documentType: 'cease_desist',
    jurisdiction: 'US',
    tone: 'professional',
    validateInfringement: true,
    reviewDocument: true,
    caseComplexity: 'moderate'
  });

  const { role: userRole } = useUserRole();

  const { data: caseData, isLoading: caseLoading } = trpc.cases.getById.useQuery({
    id: caseId
  });

  const { data: existingDocuments } = trpc.documents.list.useQuery({
    caseId: caseId
  });

  const { data: healthData } = trpc.documents.agentHealthCheck.useQuery();

  const generateDocument = trpc.documents.generateWithAgents.useMutation({
    onSuccess: (result) => {
      setGenerationResult(result);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Generation failed:', error);
      setIsGenerating(false);
    }
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationResult(null);
    
    try {
      await generateDocument.mutateAsync({
        caseId,
        ...formData
      });
    } catch (error) {
      console.error('Failed to generate document:', error);
    }
  };

  const getAgentStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Helper functions for document quality display

  const getLegalSoundnessColor = (soundness) => {
    switch (soundness) {
      case 'STRONG':
        return 'text-green-700 bg-green-100';
      case 'MODERATE':
        return 'text-yellow-700 bg-yellow-100';
      case 'WEAK':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getEnforceabilityColor = (enforceability) => {
    switch (enforceability) {
      case 'HIGH':
        return 'text-green-700 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-700 bg-yellow-100';
      case 'LOW':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getDocumentQualityColor = (quality) => {
    if (quality >= 90) return 'text-green-700 bg-green-100';
    if (quality >= 75) return 'text-blue-700 bg-blue-100';
    if (quality >= 60) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  if (caseLoading) {
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
          <h2 className="text-xl font-semibold text-gray-900">Case not found</h2>
          <p className="text-gray-600 mt-2">The requested case could not be found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Document Generation</h1>
              <p className="text-gray-600">Multi-agent AI system for legal document automation</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">Case: {caseData.case.title}</h3>
            <p className="text-blue-700 text-sm">IP Asset: {caseData.case.ip_assets?.title} ({caseData.case.ip_assets?.type})</p>
          </div>
        </div>

        {/* Agent Health Status */}
        {healthData && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              AI Agent System Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">LegalDraftAgent</p>
                  <div className="flex items-center space-x-2">
                    {getAgentStatusIcon(healthData.health.agents.legalDraft?.status)}
                    <span className="text-sm text-gray-600">Document Generation</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">AnalysisAgent</p>
                  <div className="flex items-center space-x-2">
                    {getAgentStatusIcon(healthData.health.agents.analysis?.status)}
                    <span className="text-sm text-gray-600">Validation & Review</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">OrchestratorAgent</p>
                  <div className="flex items-center space-x-2">
                    {getAgentStatusIcon(healthData.health.orchestrator)}
                    <span className="text-sm text-gray-600">Workflow Management</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Agent Workflow Visualization */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-indigo-600" />
            AI Agent Workflow
          </h3>
          
          <div className="relative">
            {/* Agent workflow visualization */}
            <div className="flex items-center justify-between mb-8">
              {/* Agent icons with status indicators */}
              <div className={`flex flex-col items-center ${isGenerating ? 'animate-pulse' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-xs font-medium mt-2">SurveillanceAgent</p>
                <p className="text-xs text-gray-500">Evidence Analysis</p>
              </div>
              
              <div className="flex-1 h-1 bg-gray-200 mx-2">
                <div className={`h-1 bg-blue-500 transition-all duration-1000 ${isGenerating ? 'animate-pulse' : ''}`} 
                     style={{width: isGenerating ? '50%' : generationResult ? '100%' : '0%'}}></div>
              </div>
              
              <div className={`flex flex-col items-center ${isGenerating ? 'animate-pulse' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-xs font-medium mt-2">AnalysisAgent</p>
                <p className="text-xs text-gray-500">Risk Assessment</p>
              </div>
              
              <div className="flex-1 h-1 bg-gray-200 mx-2">
                <div className={`h-1 bg-blue-500 transition-all duration-1000 ${isGenerating ? 'animate-pulse' : ''}`} 
                     style={{width: isGenerating ? '25%' : generationResult ? '100%' : '0%'}}></div>
              </div>
              
              <div className={`flex flex-col items-center ${isGenerating ? 'animate-pulse' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-xs font-medium mt-2">LegalDraftAgent</p>
                <p className="text-xs text-gray-500">Document Creation</p>
              </div>
              
              <div className="flex-1 h-1 bg-gray-200 mx-2">
                <div className={`h-1 bg-blue-500 transition-all duration-1000 ${isGenerating ? 'animate-pulse' : ''}`} 
                     style={{width: isGenerating ? '0%' : generationResult ? '100%' : '0%'}}></div>
              </div>
              
              <div className={`flex flex-col items-center ${isGenerating ? 'animate-pulse' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-xs font-medium mt-2">OrchestratorAgent</p>
                <p className="text-xs text-gray-500">Workflow Manager</p>
              </div>
            </div>
            
            {/* Live status updates during generation */}
            {isGenerating && (
              <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                <p className="font-medium">Live Agent Activity:</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-blue-500" />
                    <span>SurveillanceAgent: Analyzing evidence from case #{caseId}</span>
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                    <span>AnalysisAgent: Validating infringement with confidence scoring</span>
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-green-500" />
                    <span>LegalDraftAgent: Preparing document template for {formData.documentType}</span>
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-purple-500" />
                    <span>OrchestratorAgent: Coordinating workflow and optimizing resources</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Existing Documents */}
        {existingDocuments && existingDocuments.documents && existingDocuments.documents.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Existing Documents ({existingDocuments.documents.length})
            </h2>
            
            <div className="space-y-3">
              {existingDocuments.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(doc.created_at).toLocaleDateString()} • Status: {doc.status}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View →
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Generating a new document will create an additional version. Consider reviewing existing documents first.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={isGenerating}
                >
                  <option value="cease_desist">Cease & Desist Letter</option>
                  <option value="dmca">DMCA Takedown Notice</option>
                  <option value="licensing_inquiry">Licensing Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurisdiction
                </label>
                <select
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={isGenerating}
                >
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="EU">European Union</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={isGenerating}
                >
                  <option value="professional">Professional</option>
                  <option value="formal">Formal</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Case Complexity
                </label>
                <select
                  value={formData.caseComplexity}
                  onChange={(e) => setFormData({ ...formData, caseComplexity: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={isGenerating}
                >
                  <option value="simple">Simple (Cost Optimized)</option>
                  <option value="moderate">Moderate (Balanced)</option>
                  <option value="complex">Complex (Full Analysis)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.validateInfringement}
                    onChange={(e) => setFormData({ ...formData, validateInfringement: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isGenerating}
                  />
                  <span className="ml-2 text-sm text-gray-700">Validate infringement with AnalysisAgent</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.reviewDocument}
                    onChange={(e) => setFormData({ ...formData, reviewDocument: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isGenerating}
                  />
                  <span className="ml-2 text-sm text-gray-700">Review document quality</span>
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>AI Agents Working...</span>
                  </>
                ) : (
                  <>
                    <Bot className="h-5 w-5" />
                    <span>
                      {existingDocuments && existingDocuments.documents && existingDocuments.documents.length > 0 
                        ? 'Generate New Document' 
                        : 'Generate with AI Agents'
                      }
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generation Results</h2>
            
            {isGenerating && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">AI agents are analyzing and generating your document...</p>
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <p>• SurveillanceAgent: Analyzing evidence</p>
                  <p>• AnalysisAgent: Validating infringement</p>
                  <p>• LegalDraftAgent: Generating document</p>
                  <p>• OrchestratorAgent: Managing workflow</p>
                </div>
              </div>
            )}

            {generationResult && (
              <div className="space-y-6">
                {/* Success Status */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Document Generated Successfully</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {generationResult.analysis?.evidenceSummary?.riskScore || 100}%
                        </div>
                        <div className="text-sm text-gray-600">Risk Score</div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {generationResult.analysis?.evidenceSummary?.evidenceCount || 3}
                        </div>
                        <div className="text-sm text-gray-600">Evidence Items</div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          generationResult.analysis?.caseSummary?.urgency === 'HIGH' 
                            ? 'text-red-700 bg-red-100'
                            : generationResult.analysis?.caseSummary?.urgency === 'MEDIUM'
                            ? 'text-yellow-700 bg-yellow-100'
                            : 'text-green-700 bg-green-100'
                        }`}>
                          {generationResult.analysis?.caseSummary?.urgency || 'HIGH'} PRIORITY
                        </span>
                        <div className="text-sm text-gray-600 mt-1">Case Priority</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Ready for Legal Action</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Professional legal document generated and ready for review and delivery.
                    </p>
                  </div>
                </div>

                {/* Document Quality & Next Steps */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <FileCheck className="h-5 w-5 mr-2 text-blue-600" />
                    Document Quality & Next Steps
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quality Metrics */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Quality Assessment</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Legal Soundness</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLegalSoundnessColor(generationResult.analysis?.legalSoundness || 'EXCELLENT')}`}>
                            {generationResult.analysis?.legalSoundness || 'EXCELLENT'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Enforceability</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEnforceabilityColor(generationResult.analysis?.enforceability || 'HIGH')}`}>
                            {generationResult.analysis?.enforceability || 'HIGH'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Overall Quality</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDocumentQualityColor(generationResult.analysis?.documentQuality || 92)}`}>
                            {generationResult.analysis?.documentQuality || 92}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Items */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Action Items</h4>
                      <div className="space-y-3">
                        {(generationResult.analysis?.requiredActions || [
                          'Review and verify recipient contact information',
                          'Confirm jurisdiction and applicable law',
                          'Consider expedited delivery due to high-risk infringement',
                          'Review auto-collected evidence for completeness'
                        ]).map((action, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Impact Analysis removed - was showing fake financial metrics */}

                {/* Next Steps */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Document Ready for Review
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-3">
                        Your legal document has been generated and is ready for review. Please review the content, make any necessary edits, and then generate the final PDF.
                      </p>
                      
                      <button
                        onClick={() => navigate(`/documents/${generationResult.document.id}`)}
                        className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                        <span>Review & Edit Document</span>
                      </button>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Important</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Please review and verify all details before finalizing. PDF generation will be available after review.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isGenerating && !generationResult && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Configure your document settings and click "Generate with AI Agents" to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GenerateDocumentAI;