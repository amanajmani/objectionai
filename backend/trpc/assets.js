import { router, protectedProcedure, z } from './trpc.js';
import { TRPCError } from '@trpc/server';

export const assetsRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1, 'Title is required'),
      type: z.enum(['trademark', 'copyright', 'patent', 'trade_secret', 'other']),
      description: z.string().optional(),
      registrationNumber: z.string().optional(),
      jurisdiction: z.string().optional(),
      tags: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { data, error } = await ctx.supabase
          .from('ip_assets')
          .insert({
            title: input.title,
            type: input.type,
            description: input.description,
            registration_number: input.registrationNumber,
            jurisdiction: input.jurisdiction,
            tags: input.tags,
            owner_id: ctx.user.id,
          })
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return {
          asset: data,
          message: 'IP asset created successfully'
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
      type: z.enum(['trademark', 'copyright', 'patent', 'trade_secret', 'other']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        let query = ctx.supabase
          .from('ip_assets')
          .select('*')
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (input.type) {
          query = query.eq('type', input.type);
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return {
          assets: data || [],
          message: 'IP assets retrieved successfully'
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
          .from('ip_assets')
          .select('*')
          .eq('id', input.id)
          
          .single();

        if (error) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'IP asset not found',
          });
        }

        return {
          asset: data,
          message: 'IP asset retrieved successfully'
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
      type: z.enum(['trademark', 'copyright', 'patent', 'trade_secret', 'other']).optional(),
      description: z.string().optional(),
      registrationNumber: z.string().optional(),
      jurisdiction: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...updates } = input;
        
        const { data, error } = await ctx.supabase
          .from('ip_assets')
          .update(updates)
          .eq('id', id)
          
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return {
          asset: data,
          message: 'IP asset updated successfully'
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
          .from('ip_assets')
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
          message: 'IP asset deleted successfully'
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
          .from('ip_assets')
          .select('type')
          ;

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        const stats = {
          total: data.length,
          byType: {}
        };

        data.forEach(asset => {
          stats.byType[asset.type] = (stats.byType[asset.type] || 0) + 1;
        });

        return {
          stats,
          message: 'IP asset statistics retrieved successfully'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),
});