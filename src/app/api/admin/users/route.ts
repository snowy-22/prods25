/**
 * Admin Users Endpoint
 * GET /api/admin/users - List all users
 */

import { supabase } from '@/lib/db/supabase-client';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    // Check authorization
    const auth = await requireAdmin(request);
    if (!auth.isAuthorized || !auth.userId) {
      return new Response(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Replace with actual auth users query
    // For MVP, return empty array
    const users = [];

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
