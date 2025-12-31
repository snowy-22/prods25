/**
 * User Ban/Unban Endpoint
 * POST /api/admin/user-ban - Ban user
 * DELETE /api/admin/user-ban - Unban user
 */

import { supabase } from '@/lib/db/supabase-client';
import { requireAdmin, banUser, unbanUser } from '@/lib/admin-auth';

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
    const { userId, reason } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ban user
    const result = await banUser(userId, reason || 'No reason provided', auth.userId);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User banned successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ban error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: Request) {
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
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Unban user
    const result = await unbanUser(userId, auth.userId);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User unbanned successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unban error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
