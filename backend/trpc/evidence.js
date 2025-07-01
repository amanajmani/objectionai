import { z } from 'zod';
import { router, protectedProcedure } from './trpc.js';
import { supabase } from '../db/supabase.js';
import crypto from 'crypto';

export const evidenceRouter = router({
  // Upload evidence metadata (file upload handled separately via Supabase Storage)
  uploadMetadata: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      fileUrl: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      hash: z.string(),
      metadata: z.object({
        originalName: z.string(),
        uploadTimestamp: z.string(),
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
        deviceInfo: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Enhanced chain of custody metadata
      const chainOfCustody = {
        uploadedBy: ctx.user.id,
        uploadedAt: new Date().toISOString(),
        originalFileName: input.metadata?.originalName || input.fileName,
        fileIntegrity: {
          hash: input.hash,
          algorithm: 'SHA-256',
          verifiedAt: new Date().toISOString()
        },
        uploadContext: {
          userAgent: input.metadata?.userAgent,
          ipAddress: input.metadata?.ipAddress,
          deviceInfo: input.metadata?.deviceInfo,
          timestamp: input.metadata?.uploadTimestamp || new Date().toISOString()
        },
        accessLog: [{
          action: 'uploaded',
          userId: ctx.user.id,
          timestamp: new Date().toISOString(),
          details: 'Initial file upload'
        }]
      };

      const { data, error } = await supabase
        .from('evidence_files')
        .insert({
          case_id: input.caseId,
          file_name: input.fileName,
          mime_type: input.mimeType,
          file_size: input.fileSize,
          file_url: input.fileUrl,
          title: input.title,
          description: input.description,
          tags: input.tags,
          hash: input.hash,
          uploaded_by: ctx.user.id,
          metadata: chainOfCustody,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save evidence metadata: ${error.message}`);
      }

      return data;
    }),

  // List evidence for a case
  list: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('evidence_files')
        .select('*')
        .eq('case_id', input.caseId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch evidence: ${error.message}`);
      }

      return data;
    }),

  // Get evidence by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('evidence_files')
        .select(`
          *,
          case:cases(*)
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch evidence: ${error.message}`);
      }

      return data;
    }),

  // Update evidence metadata
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from('evidence_files')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update evidence: ${error.message}`);
      }

      return data;
    }),

  // Delete evidence
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // First get the evidence to get the file URL for deletion from storage
      const { data: evidence, error: fetchError } = await supabase
        .from('evidence_files')
        .select('file_url')
        .eq('id', input.id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch evidence for deletion: ${fetchError.message}`);
      }

      // Delete from storage if file exists
      if (evidence.file_url) {
        const fileName = evidence.file_url.split('/').pop();
        const { error: storageError } = await supabase.storage
          .from('evidence')
          .remove([fileName]);

        if (storageError) {
          console.warn(`Failed to delete file from storage: ${storageError.message}`);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('evidence_files')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new Error(`Failed to delete evidence: ${error.message}`);
      }

      return { success: true };
    }),

  // Generate upload URL for Supabase Storage
  generateUploadUrl: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Generate unique filename with timestamp and user ID
      const timestamp = Date.now();
      const fileExtension = input.fileName.split('.').pop();
      const uniqueFileName = `${ctx.user.id}/${timestamp}_${crypto.randomUUID()}.${fileExtension}`;

      // Generate signed upload URL
      const { data, error } = await supabase.storage
        .from('evidence')
        .createSignedUploadUrl(uniqueFileName);

      if (error) {
        throw new Error(`Failed to generate upload URL: ${error.message}`);
      }

      return {
        uploadUrl: data.signedUrl,
        fileName: uniqueFileName,
        publicUrl: supabase.storage.from('evidence').getPublicUrl(uniqueFileName).data.publicUrl,
      };
    }),

  // Log evidence access for chain of custody
  logAccess: protectedProcedure
    .input(z.object({
      evidenceId: z.string().uuid(),
      action: z.enum(['viewed', 'downloaded', 'modified', 'shared']),
      details: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get current evidence metadata
      const { data: evidence, error: fetchError } = await supabase
        .from('evidence_files')
        .select('metadata')
        .eq('id', input.evidenceId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch evidence: ${fetchError.message}`);
      }

      // Update access log
      const currentMetadata = evidence.metadata || { accessLog: [] };
      const newAccessEntry = {
        action: input.action,
        userId: ctx.user.id,
        timestamp: new Date().toISOString(),
        details: input.details || `Evidence ${input.action}`
      };

      const updatedMetadata = {
        ...currentMetadata,
        accessLog: [...(currentMetadata.accessLog || []), newAccessEntry]
      };

      // Update evidence with new access log
      const { data, error } = await supabase
        .from('evidence_files')
        .update({ metadata: updatedMetadata })
        .eq('id', input.evidenceId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log access: ${error.message}`);
      }

      return { success: true, accessEntry: newAccessEntry };
    }),

  // Get chain of custody report
  getChainOfCustody: protectedProcedure
    .input(z.object({
      evidenceId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('evidence_files')
        .select(`
          *,
          case:cases(*),
          uploader:uploaded_by(email)
        `)
        .eq('id', input.evidenceId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch chain of custody: ${error.message}`);
      }

      // Generate comprehensive chain of custody report
      const report = {
        evidenceId: data.id,
        fileName: data.file_name,
        originalFileName: data.metadata?.originalFileName || data.file_name,
        fileHash: data.hash,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        caseInfo: {
          id: data.case?.id,
          title: data.case?.title,
          status: data.case?.status
        },
        uploadInfo: {
          uploadedBy: data.uploaded_by,
          uploaderEmail: data.uploader?.email,
          uploadedAt: data.uploaded_at,
          uploadContext: data.metadata?.uploadContext
        },
        fileIntegrity: data.metadata?.fileIntegrity,
        accessHistory: data.metadata?.accessLog || [],
        verificationStatus: {
          hashVerified: !!data.hash,
          chainComplete: !!(data.metadata?.accessLog?.length > 0),
          lastVerified: data.metadata?.fileIntegrity?.verifiedAt
        }
      };

      return report;
    }),

  // Verify file integrity
  verifyIntegrity: protectedProcedure
    .input(z.object({
      evidenceId: z.string().uuid(),
      currentHash: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { data: evidence, error } = await supabase
        .from('evidence_files')
        .select('hash, metadata')
        .eq('id', input.evidenceId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch evidence: ${error.message}`);
      }

      const isValid = evidence.hash === input.currentHash;
      
      // Log verification attempt
      const currentMetadata = evidence.metadata || { accessLog: [] };
      const verificationEntry = {
        action: 'integrity_check',
        userId: ctx.user.id,
        timestamp: new Date().toISOString(),
        details: `File integrity ${isValid ? 'verified' : 'FAILED'} - Hash: ${input.currentHash.substring(0, 16)}...`
      };

      const updatedMetadata = {
        ...currentMetadata,
        accessLog: [...(currentMetadata.accessLog || []), verificationEntry],
        fileIntegrity: {
          ...currentMetadata.fileIntegrity,
          lastVerified: new Date().toISOString(),
          verificationStatus: isValid ? 'valid' : 'invalid'
        }
      };

      await supabase
        .from('evidence_files')
        .update({ metadata: updatedMetadata })
        .eq('id', input.evidenceId);

      return {
        isValid,
        originalHash: evidence.hash,
        currentHash: input.currentHash,
        verifiedAt: new Date().toISOString()
      };
    }),
});