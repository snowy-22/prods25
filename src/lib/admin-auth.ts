/**
 * Admin Authorization Module
 * 
 * Provides role-based access control for admin features
 * RBAC with three tiers: user, moderator, admin
 */

import { supabase } from './db/supabase-client';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface AdminPermissions {
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canModerateContent: boolean;
  canVerifyAchievements: boolean;
  canRefundPayments: boolean;
  canViewAdminPanel: boolean;
}

/**
 * Permission matrix based on roles
 */
const ROLE_PERMISSIONS: Record<UserRole, AdminPermissions> = {
  user: {
    canViewAnalytics: false,
    canManageUsers: false,
    canModerateContent: false,
    canVerifyAchievements: false,
    canRefundPayments: false,
    canViewAdminPanel: false,
  },
  moderator: {
    canViewAnalytics: true,
    canManageUsers: false,
    canModerateContent: true,
    canVerifyAchievements: true,
    canRefundPayments: false,
    canViewAdminPanel: true,
  },
  admin: {
    canViewAnalytics: true,
    canManageUsers: true,
    canModerateContent: true,
    canVerifyAchievements: true,
    canRefundPayments: true,
    canViewAdminPanel: true,
  },
};

/**
 * Get user's role from database
 * Caches result for 5 minutes
 */
const roleCache = new Map<string, { role: UserRole; expiry: number }>();

export async function getUserRole(userId: string): Promise<UserRole> {
  // Check cache
  const cached = roleCache.get(userId);
  if (cached && cached.expiry > Date.now()) {
    return cached.role;
  }

  try {
    // Try to fetch from custom roles table or user metadata
    // For MVP, default to 'user' - extend this to check actual DB
    const { data, error } = await supabase
      .from('admin_logs')
      .select('admin_id')
      .eq('admin_id', userId)
      .limit(1);

    if (error) {
      console.error('Failed to fetch user role:', error);
      return 'user';
    }

    // If user has admin logs, they're an admin
    const role: UserRole = data && data.length > 0 ? 'admin' : 'user';

    // Cache for 5 minutes
    roleCache.set(userId, {
      role,
      expiry: Date.now() + 5 * 60 * 1000,
    });

    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

/**
 * Check if user has admin access
 */
export async function checkAdminRole(userId?: string): Promise<boolean> {
  if (!userId) {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id;
  }

  if (!userId) return false;

  const role = await getUserRole(userId);
  return role === 'admin' || role === 'moderator';
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: keyof AdminPermissions
): Promise<boolean> {
  const role = await getUserRole(userId);
  const permissions = ROLE_PERMISSIONS[role];
  return permissions[permission];
}

/**
 * Get all permissions for a user
 */
export async function getAdminPermissions(
  userId: string
): Promise<AdminPermissions> {
  const role = await getUserRole(userId);
  return ROLE_PERMISSIONS[role];
}

/**
 * Server-side authorization middleware for API routes
 * Usage: const auth = requireAdmin(req);
 */
export async function requireAdmin(
  request: Request
): Promise<{
  isAuthorized: boolean;
  userId?: string;
  role?: UserRole;
  error?: string;
}> {
  try {
    // Get user from session
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return {
        isAuthorized: false,
        error: 'Unauthorized: No user session',
      };
    }

    const userId = data.user.id;
    const role = await getUserRole(userId);

    if (role !== 'admin' && role !== 'moderator') {
      return {
        isAuthorized: false,
        userId,
        role,
        error: 'Forbidden: Insufficient permissions',
      };
    }

    return {
      isAuthorized: true,
      userId,
      role,
    };
  } catch (error) {
    return {
      isAuthorized: false,
      error: `Authorization error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Check specific permission in API route
 */
export async function checkPermission(
  userId: string,
  permission: keyof AdminPermissions
): Promise<boolean> {
  return hasPermission(userId, permission);
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify admin making the change
    const adminRole = await getUserRole(adminUserId);
    if (adminRole !== 'admin') {
      return {
        success: false,
        error: 'Only admins can change user roles',
      };
    }

    // Log the change
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminUserId,
        action: 'user_role_update',
        target_table: 'auth.users',
        target_id: targetUserId,
        new_data: { role: newRole },
        reason: 'Role update via admin panel',
      });

    if (error) throw error;

    // Invalidate cache
    roleCache.delete(targetUserId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Ban/unban user (admin only)
 */
export async function banUser(
  targetUserId: string,
  reason: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify admin
    const adminRole = await getUserRole(adminUserId);
    if (adminRole !== 'admin') {
      return {
        success: false,
        error: 'Only admins can ban users',
      };
    }

    // Log the ban
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminUserId,
        action: 'user_ban',
        target_table: 'auth.users',
        target_id: targetUserId,
        new_data: { banned: true, ban_reason: reason },
        reason,
      });

    if (error) throw error;

    // TODO: Also update auth.users if using custom user metadata
    // await supabase.auth.admin?.updateUserById(targetUserId, {
    //   user_metadata: { is_banned: true, ban_reason: reason }
    // });

    roleCache.delete(targetUserId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unban user
 */
export async function unbanUser(
  targetUserId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify admin
    const adminRole = await getUserRole(adminUserId);
    if (adminRole !== 'admin') {
      return {
        success: false,
        error: 'Only admins can unban users',
      };
    }

    // Log the unban
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminUserId,
        action: 'user_unban',
        target_table: 'auth.users',
        target_id: targetUserId,
        new_data: { banned: false },
        reason: 'User unbanned via admin panel',
      });

    if (error) throw error;

    roleCache.delete(targetUserId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clear role cache for a user (after role changes)
 */
export function invalidateRoleCache(userId: string): void {
  roleCache.delete(userId);
}

/**
 * Clear all role caches
 */
export function clearRoleCache(): void {
  roleCache.clear();
}

/**
 * Log admin action
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetTable: string,
  targetId: string,
  oldData?: any,
  newData?: any,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        target_table: targetTable,
        target_id: targetId,
        old_data: oldData,
        new_data: newData,
        reason,
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get admin logs for a user
 */
export async function getAdminLogs(adminId?: string, limit: number = 100) {
  try {
    let query = supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
