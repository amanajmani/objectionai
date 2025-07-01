import { router, publicProcedure, protectedProcedure, z } from './trpc.js';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      fullName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { email, password, fullName } = input;
      
      try {
        const { data, error } = await ctx.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || '',
            }
          }
        });

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return {
          user: data.user,
          session: data.session,
          message: 'Registration successful'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;
      
      try {
        const { data, error } = await ctx.supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message,
          });
        }

        return {
          user: data.user,
          session: data.session,
          message: 'Login successful'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const { error } = await ctx.supabase.auth.signOut();
        
        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          });
        }

        return { message: 'Logout successful' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        user: ctx.user,
        message: 'User data retrieved successfully'
      };
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      fullName: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const updates = {};
        
        if (input.fullName) {
          updates.data = { full_name: input.fullName };
        }
        
        if (input.email) {
          updates.email = input.email;
        }

        const { data, error } = await ctx.supabase.auth.updateUser(updates);

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return {
          user: data.user,
          message: 'Profile updated successfully'
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  resetPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { error } = await ctx.supabase.auth.resetPasswordForEmail(input.email);

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return { message: 'Password reset email sent' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),
});