/**
 * User Role Update Endpoint
 * POST /api/admin/user-role - Update user role
 */

import { supabase } from '@/lib/db/supabase-client';
import { requireAdmin, updateUserRole, UserRole } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    // Check authorization
    const auth = await requireAdmin(request);
    if (!auth.isAuthorized || !auth.userId) {
      return new Response(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or newRole' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['user', 'moderator', 'admin'].includes(newRole)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update role
    const result = await updateUserRole(userId, newRole as UserRole, auth.userId);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User role updated to ${newRole}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Role update error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
