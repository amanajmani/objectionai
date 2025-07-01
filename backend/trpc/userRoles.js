import { z } from 'zod';
import { router, protectedProcedure } from './trpc.js';
import { supabase } from '../db/supabase.js';

export const userRolesRouter = router({
  // Get current user's role
  getMyRole: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', ctx.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw new Error(`Failed to fetch user role: ${error.message}`);
        }

        return {
          role: data?.role || 'submitter', // Default role if none assigned
          hasRole: !!data,
          message: 'User role retrieved successfully'
        };
      } catch (error) {
        throw new Error(`Failed to fetch user role: ${error.message}`);
      }
    }),

  // List all users and their roles (admin only)
  listUsers: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Check if user is admin
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', ctx.user.id)
          .single();

        if (!userRole || userRole.role !== 'admin') {
          throw new Error('Access denied: Admin role required');
        }

        // Get all users with their roles using Supabase Admin API
        const { createClient } = await import('@supabase/supabase-js');
        
        // Create admin client with service role key
        const adminSupabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        // Get all users from auth.users using admin client
        const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers();
        
        if (authError) {
          throw new Error(`Failed to fetch auth users: ${authError.message}`);
        }

        // Get all user roles
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');

        if (rolesError) {
          throw new Error(`Failed to fetch user roles: ${rolesError.message}`);
        }

        // Combine real user data with roles
        const users = authUsers.users.map(authUser => ({
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          user_roles: userRoles.filter(role => role.user_id === authUser.id)
        }));

        const error = null;

        if (error) {
          throw new Error(`Failed to fetch users: ${error.message}`);
        }

        return {
          users: users || [],
          message: 'Users retrieved successfully'
        };
      } catch (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }
    }),

  // Assign role to user (admin only)
  assignRole: protectedProcedure
    .input(z.object({
      userId: z.string().uuid(),
      role: z.enum(['admin', 'reviewer', 'submitter']),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if current user is admin
        const { data: currentUserRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', ctx.user.id)
          .single();

        if (!currentUserRole || currentUserRole.role !== 'admin') {
          throw new Error('Access denied: Admin role required');
        }

        // Assign or update role
        const { data, error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: input.userId,
            role: input.role,
            assigned_by: ctx.user.id,
            assigned_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to assign role: ${error.message}`);
        }

        return {
          userRole: data,
          message: `Role ${input.role} assigned successfully`
        };
      } catch (error) {
        throw new Error(`Failed to assign role: ${error.message}`);
      }
    }),

  // Remove role from user (admin only)
  removeRole: protectedProcedure
    .input(z.object({
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if current user is admin
        const { data: currentUserRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', ctx.user.id)
          .single();

        if (!currentUserRole || currentUserRole.role !== 'admin') {
          throw new Error('Access denied: Admin role required');
        }

        // Don't allow removing own admin role
        if (input.userId === ctx.user.id) {
          throw new Error('Cannot remove your own admin role');
        }

        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', input.userId);

        if (error) {
          throw new Error(`Failed to remove role: ${error.message}`);
        }

        return {
          message: 'Role removed successfully'
        };
      } catch (error) {
        throw new Error(`Failed to remove role: ${error.message}`);
      }
    }),

  // Get role statistics (admin only)
  getRoleStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Check if user is admin
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', ctx.user.id)
          .single();

        if (!userRole || userRole.role !== 'admin') {
          throw new Error('Access denied: Admin role required');
        }

        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role');

        if (error) {
          throw new Error(`Failed to fetch role stats: ${error.message}`);
        }

        const stats = {
          total: roles.length,
          byRole: {}
        };

        roles.forEach(role => {
          stats.byRole[role.role] = (stats.byRole[role.role] || 0) + 1;
        });

        return {
          stats,
          message: 'Role statistics retrieved successfully'
        };
      } catch (error) {
        throw new Error(`Failed to fetch role statistics: ${error.message}`);
      }
    }),
});