import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = ({ url, title }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = title || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Page Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-gray-600">
                Page {pageNumber} of {numPages || '?'}
              </span>
              
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={zoomIn}
                disabled={scale >= 3.0}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Rotate */}
            <button
              onClick={rotate}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex justify-center bg-gray-100 p-4 overflow-auto max-h-[600px]">
        {loading && (
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner />
          </div>
        )}
        
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className="shadow-lg"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="border border-gray-300"
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;