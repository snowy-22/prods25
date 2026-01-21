import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess, hasPermission } from '@/lib/admin-security';
import { supabase } from '@/lib/db/supabase-client';

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data with security checks
 */
export async function GET(req: NextRequest) {
  try {
    const adminEmail = req.headers.get('x-admin-email');
    
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin email required' },
        { status: 401 }
      );
    }

    const access = await checkAdminAccess(adminEmail);
    
    if (!access.isAdmin || !hasPermission(access.role!, 'analytics:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch real dashboard data from database
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('is_banned', false);

    const { data: bangedUsers } = await supabase
      .from('users')
      .select('id')
      .eq('is_banned', true);

    const dashboardData = {
      stats: {
        totalUsers: users?.length || 0,
        bannedUsers: bangedUsers?.length || 0,
        lastUpdated: new Date().toISOString(),
      },
      systemHealth: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      adminInfo: {
        email: adminEmail,
        role: access.role,
        lastLogin: new Date().toISOString(),
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/actions
 * Perform admin actions
 * TODO: Add admin permission middleware
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.action || !body.target) {
      return NextResponse.json(
        { error: 'Action and target are required' },
        { status: 400 }
      );
    }

    // TODO: Perform admin action (ban user, delete content, etc.)
    const result = {
      action: body.action,
      target: body.target,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform admin action' },
      { status: 500 }
    );
  }
}