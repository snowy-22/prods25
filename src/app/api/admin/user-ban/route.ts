/**
 * User Ban/Unban Endpoint
 * POST /api/admin/user-ban - Ban user
 * DELETE /api/admin/user-ban - Unban user
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
    const { userId, reason } = body;

    if (!userId) {
      return Response.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Update user ban status
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_banned: true,
        ban_reason: reason || 'No reason provided',
        banned_at: new Date().toISOString(),
        banned_by: adminEmail
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Ban error:', updateError);
      return Response.json(
        { error: 'Failed to ban user' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminEmail,
        action: 'user_ban',
        target_user_id: userId,
        details: { reason: reason || 'No reason provided' },
        timestamp: new Date().toISOString(),
      });

    return Response.json(
      {
        success: true,
        message: 'User banned successfully',
        userId,
        reason: reason || 'No reason provided',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ban error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
    const { userId } = body;

    if (!userId) {
      return Response.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Update user ban status
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_banned: false,
        ban_reason: null,
        banned_at: null,
        banned_by: null
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Unban error:', updateError);
      return Response.json(
        { error: 'Failed to unban user' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminEmail,
        action: 'user_unban',
        target_user_id: userId,
        details: {},
        timestamp: new Date().toISOString(),
      });

    return Response.json(
      {
        success: true,
        message: 'User unbanned successfully',
        userId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unban error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
