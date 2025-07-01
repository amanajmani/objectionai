import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { supabase } from '../lib/supabase';
import { calculateFileHash, formatFileSize, isValidFileType, getFileIcon } from '../lib/fileUtils';
import LoadingSpinner from './LoadingSpinner';

const evidenceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.string().optional(),
});

const EvidenceUpload = ({ caseId, onUploadComplete }) => {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(evidenceSchema),
  });

  const uploadMetadata = trpc.evidence.uploadMetadata.useMutation();

  const onDrop = useCallback(async (acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => {
      if (!isValidFileType(file)) {
        alert(`File type not supported: ${file.name}`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert(`File too large: ${file.name}. Maximum size is 50MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingFiles(validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'preparing',
      progress: 0,
    })));

    for (const file of validFiles) {
      const fileId = Math.random().toString(36).substr(2, 9);
      
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: { status: 'hashing', progress: 10 } }));
        
        // Calculate file hash
        const hash = await calculateFileHash(file);
        
        setUploadProgress(prev => ({ ...prev, [fileId]: { status: 'uploading', progress: 30 } }));
        
        // Generate unique filename with timestamp and user ID
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

        // Upload file to Supabase Storage using direct upload
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(uniqueFileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('evidence')
          .getPublicUrl(uniqueFileName);

        setUploadProgress(prev => ({ ...prev, [fileId]: { status: 'saving-metadata', progress: 80 } }));

        // Save metadata to database
        await uploadMetadata.mutateAsync({
          caseId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          fileUrl: publicUrl,
          hash,
        });

        setUploadProgress(prev => ({ ...prev, [fileId]: { status: 'complete', progress: 100 } }));

      } catch (error) {
        console.error('Upload failed:', error);
        setUploadProgress(prev => ({ ...prev, [fileId]: { status: 'error', progress: 0, error: error.message } }));
      }
    }

    // Clean up after a delay
    setTimeout(() => {
      setUploadingFiles([]);
      setUploadProgress({});
      if (onUploadComplete) onUploadComplete();
    }, 2000);

  }, [caseId, uploadMetadata, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  const removeUploadingFile = (fileId) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop evidence files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports: Images (JPG, PNG, GIF), PDF, Word documents, Text files
            </p>
            <p className="text-sm text-gray-500">Maximum file size: 50MB</p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploading Files</h4>
          {uploadingFiles.map((uploadFile) => {
            const progress = uploadProgress[uploadFile.id] || { status: 'preparing', progress: 0 };
            
            return (
              <div key={uploadFile.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(uploadFile.file.type)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{uploadFile.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {progress.status === 'complete' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {progress.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {progress.status !== 'complete' && progress.status !== 'error' && (
                      <LoadingSpinner size="sm" />
                    )}
                    <button
                      onClick={() => removeUploadingFile(uploadFile.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.status === 'error' ? 'bg-red-500' : 
                      progress.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                
                {/* Status Text */}
                <p className="text-sm text-gray-600">
                  {progress.status === 'preparing' && 'Preparing upload...'}
                  {progress.status === 'hashing' && 'Calculating file hash...'}
                  {progress.status === 'generating-url' && 'Generating upload URL...'}
                  {progress.status === 'uploading' && 'Uploading file...'}
                  {progress.status === 'saving-metadata' && 'Saving metadata...'}
                  {progress.status === 'complete' && 'Upload complete!'}
                  {progress.status === 'error' && `Error: ${progress.error}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvidenceUpload;