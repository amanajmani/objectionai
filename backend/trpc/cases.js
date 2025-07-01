import { router, protectedProcedure, z } from './trpc.js';
import { TRPCError } from '@trpc/server';

export const casesRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1, 'Title is required'),
      relatedIpAssetId: z.string().uuid('Invalid IP asset ID'),
      suspectedUrl: z.string().url('Invalid URL format'),
      description: z.string().optional(),
      status: z.enum(['open', 'in_review', 'resolved']).optional().default('open'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify the IP asset exists (shared data model - no user restriction)
        const { data: asset, error: assetError } = await ctx.supabase
          .from('ip_assets')
          .select('id')
          .eq('id', input.relatedIpAssetId)
          .single();

        if (assetError || !asset) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'IP asset not found or access denied',
          });
        }

        const { data, error } = await ctx.supabase
          .from('cases')
          .insert({
            title: input.title,
            status: input.status,
            related_ip_asset_id: input.relatedIpAssetId,
            suspected_url: input.suspectedUrl,
            description: input.description,
            created_by: ctx.user.id,
          })
          .select(`
            *,
            ip_assets:related_ip_asset_id (
              id,
              title,
              type
            )
          `)
          .single();

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return {
          case: data,
          message: 'Case created successfully'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
      status: z.enum(['open', 'in_review', 'resolved']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        let query = ctx.supabase
          .from('cases')
          .select(`
            *,
            ip_assets:related_ip_asset_id (
              id,
              title,
              type
            )
          `)
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (input.status) {
          query = query.eq('status', input.status);
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return {
          cases: data || [],
          message: 'Cases retrieved successfully'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { data, error } = await ctx.supabase
          .from('cases')
          .select(`
            *,
            ip_assets:related_ip_asset_id (
              id,
              title,
              type,
              description,
              registration_number,
              jurisdiction
            ),
            documents (
              id,
              content,
              pdf_url,
              created_at
            ),
            evidence_files (
              id,
              file_name,
              file_url,
              mime_type,
              file_size,
              title,
              description,
              tags,
              uploaded_at
            ),
            monitoring_evidence (
              id,
              evidence_type,
              evidence_url,
              evidence_data,
              auto_generated,
              created_at
            )
          `)
          .eq('id', input.id)
          
          .single();

        if (error) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Case not found',
          });
        }

        return {
          case: data,
          message: 'Case retrieved successfully'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      status: z.enum(['open', 'in_review', 'resolved']).optional(),
      suspectedUrl: z.string().url().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, suspectedUrl, ...otherUpdates } = input;
        
        // Map camelCase to snake_case for database
        const updates = {
          ...otherUpdates,
          ...(suspectedUrl !== undefined && { suspected_url: suspectedUrl })
        };
        
        const { data, error } = await ctx.supabase
          .from('cases')
          .update(updates)
          .eq('id', id)
          
          .select(`
            *,
            ip_assets:related_ip_asset_id (
              id,
              title,
              type
            )
          `)
          .single();

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return {
          case: data,
          message: 'Case updated successfully'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { error } = await ctx.supabase
          .from('cases')
          .delete()
          .eq('id', input.id)
          ;

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return {
          message: 'Case deleted successfully'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const { data, error } = await ctx.supabase
          .from('cases')
          .select('status')
          ;

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        const stats = {
          total: data.length,
          byStatus: {}
        };

        data.forEach(caseItem => {
          stats.byStatus[caseItem.status] = (stats.byStatus[caseItem.status] || 0) + 1;
        });

        return {
          stats,
          message: 'Case statistics retrieved successfully'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  // Delete all cases
  deleteAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        // First, get all case IDs
        const { data: cases, error: casesError } = await ctx.supabase
          .from('cases')
          .select('id');

        if (casesError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: casesError.message,
          });
        }

        if (!cases || cases.length === 0) {
          return {
            deletedCount: 0,
            message: 'No cases to delete'
          };
        }

        const caseIds = cases.map(caseItem => caseItem.id);

        // Delete all related evidence first
        const { error: evidenceError } = await ctx.supabase
          .from('evidence')
          .delete()
          .in('case_id', caseIds);

        if (evidenceError) {
          console.error('Failed to delete evidence:', evidenceError);
          // Continue with case deletion
        }

        // Delete all related monitoring evidence
        const { error: monitoringEvidenceError } = await ctx.supabase
          .from('monitoring_evidence')
          .delete()
          .in('case_id', caseIds);

        if (monitoringEvidenceError) {
          console.error('Failed to delete monitoring evidence:', monitoringEvidenceError);
          // Continue with case deletion
        }

        // Delete all related documents
        const { error: documentsError } = await ctx.supabase
          .from('documents')
          .delete()
          .in('case_id', caseIds);

        if (documentsError) {
          console.error('Failed to delete documents:', documentsError);
          // Continue with case deletion
        }

        // Delete all cases
        const { error: deleteError } = await ctx.supabase
          .from('cases')
          .delete()
          .in('id', caseIds);

        if (deleteError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: deleteError.message,
          });
        }

        return {
          deletedCount: cases.length,
          message: `Successfully deleted ${cases.length} case${cases.length !== 1 ? 's' : ''} and related data`
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),
});