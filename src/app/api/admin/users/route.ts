/**
 * Admin Users Endpoint
 * GET /api/admin/users - List all users with role info
 * Requires admin authentication
 */

import { supabase } from '@/lib/db/supabase-client';
import { checkAdminAccess, hasPermission } from '@/lib/admin-security';

export async function GET(request: Request) {
  try {
    // Get admin email from header
    const adminEmail = request.headers.get('x-admin-email');
    
    if (!adminEmail) {
      return Response.json(
        { error: 'Admin email required' },
        { status: 401 }
      );
    }

    // Check admin access
    const access = await checkAdminAccess(adminEmail);
    
    if (!access.isAdmin || !hasPermission(access.role!, 'users:read')) {
      return Response.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get users from Supabase auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      // Fallback: Get from custom users table if exists
      const { data: customUsers } = await supabase
        .from('users')
        .select('id, email, role, created_at, last_sign_in_at');
      
      return Response.json(
        customUsers || [],
        { status: 200 }
      );
    }

    // Transform auth users
    const transformedUsers = (users || []).map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name,
      avatar: user.user_metadata?.avatar_url,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      isBanned: user.banned_until ? new Date(user.banned_until) > new Date() : false,
    }));

    return Response.json(transformedUsers, { status: 200 });
  } catch (error) {
    console.error('Admin users error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
