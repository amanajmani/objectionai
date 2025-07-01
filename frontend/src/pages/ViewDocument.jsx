import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc.js';
import Layout from '../components/Layout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PDFViewer from '../components/PDFViewer.jsx';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Edit,
  Copy,
  Check,
  Eye
} from 'lucide-react';

const ViewDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  const { data: documentData, isLoading, error, refetch } = trpc.documents.getById.useQuery({
    id: id
  });

  const generatePdf = trpc.documents.generatePdf.useMutation({
    onSuccess: () => {
      refetch(); // Refresh to get the updated pdf_url
    },
  });

  const handleCopyToClipboard = async () => {
    if (documentData?.document?.content) {
      try {
        await navigator.clipboard.writeText(documentData.document.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const handleDownload = async () => {
    if (!documentData?.document?.content) return;

    const content = documentData.document.content;
    const filename = `${documentData.document.type}_letter_v${documentData.document.version}.txt`;

    try {
      // Try modern File System Access API first (Chrome/Edge)
      if ('showSaveFilePicker' in window) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Text files',
            accept: { 'text/plain': ['.txt'] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      }
    } catch (err) {
      // User cancelled or API not supported, fall back to blob download
    }

    try {
      // Fallback: Traditional blob download
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      // Final fallback: Copy to clipboard and show instructions
      try {
        await navigator.clipboard.writeText(content);
        alert(`Download not supported in this browser. The document content has been copied to your clipboard. Please paste it into a text editor and save as "${filename}".`);
      } catch (clipboardError) {
        // Show content in new window as last resort
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`<pre style="white-space: pre-wrap; font-family: monospace; padding: 20px;">${content}</pre>`);
        newWindow.document.title = filename;
        alert('Download not supported. The document has been opened in a new window. Please copy the text and save it manually.');
      }
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

  if (error || !documentData?.document) {
    return (
      <Layout>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Document not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The document you're looking for doesn't exist or you don't have permission to view it.
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
              onClick={() => document?.cases?.id ? navigate(`/cases/${document.cases.id}`) : navigate('/cases')}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {document.type.replace('_', ' ').toUpperCase()} Letter
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
                <span className="text-sm text-gray-500">
                  Version {document.version}
                </span>
                <span className="text-sm text-gray-500">
                  Created: {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
            {!document.pdf_url && (
              <button
                onClick={() => generatePdf.mutate({ id: document.id })}
                disabled={generatePdf.isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {generatePdf.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => navigate(`/documents/${document.id}/edit`)}
              className="btn-primary py-2 px-3"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
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

        {/* PDF Viewer */}
        {document.pdf_url && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">PDF Preview</h2>
              </div>
            </div>
            <div className="p-6">
              <PDFViewer 
                url={document.pdf_url} 
                title={`${document.type}_letter_v${document.version}.pdf`}
              />
            </div>
          </div>
        )}

        {/* Document Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Document Content</h2>
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
                {document.content}
              </pre>
            </div>
          </div>
        </div>

        {/* Document Metadata */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Document Information</h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {document.type.replace('_', ' ').toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {document.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Version</dt>
                <dd className="mt-1 text-sm text-gray-900">{document.version}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(document.created_at).toLocaleString()}
                </dd>
              </div>
              {document.updated_at !== document.created_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(document.updated_at).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewDocument;