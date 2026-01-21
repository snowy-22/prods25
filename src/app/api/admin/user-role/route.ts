/**
 * User Role Update Endpoint
 * POST /api/admin/user-role - Update user role
 */

import { supabase } from '@/lib/db/supabase-client';
import { checkAdminAccess, hasPermission } from '@/lib/admin-security';

export async function POST(request: Request) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    
    if (!adminEmail) {
      return Response.json(
        { error: 'Admin email required' },
        { status: 401 }
      );
    }

    const access = await checkAdminAccess(adminEmail);
    
    if (!access.isAdmin || !hasPermission(access.role!, 'users:write')) {
      return Response.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return Response.json(
        { error: 'Missing userId or newRole' },
        { status: 400 }
      );
    }

    const validRoles = ['user', 'moderator', 'admin', 'super_admin', 'analyst'];
    if (!validRoles.includes(newRole)) {
      return Response.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Update user role in custom users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (updateError) {
      console.error('Role update error:', updateError);
      return Response.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminEmail,
        action: 'user_role_update',
        target_user_id: userId,
        details: { old_role: 'user', new_role: newRole },
        timestamp: new Date().toISOString(),
      });

    return Response.json(
      {
        success: true,
        message: `User role updated to ${newRole}`,
        userId,
        newRole,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Role update error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
