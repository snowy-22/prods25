import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/sharing/stats/[itemId]
 * Get sharing statistics for an item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the shared item
    const { data: sharedItem, error: fetchError } = await supabase
      .from('shared_items')
      .select('*')
      .eq('item_id', itemId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching shared item:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch shared item' },
        { status: 500 }
      );
    }

    if (!sharedItem) {
      return NextResponse.json({
        success: true,
        isShared: false,
        stats: null,
      });
    }

    // Verify user owns the shared item (for privacy)
    if (sharedItem.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this shared item' },
        { status: 403 }
      );
    }

    // Get all share links for this item
    const { data: shareLinks } = await supabase
      .from('share_links')
      .select('*')
      .eq('shared_item_id', sharedItem.id);

    // Get all permissions for this item
    const { data: permissions } = await supabase
      .from('share_permissions')
      .select('*')
      .eq('shared_item_id', sharedItem.id);

    // Get access logs
    const { data: accessLogs } = await supabase
      .from('share_access_logs')
      .select('*')
      .eq('shared_item_id', sharedItem.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate statistics
    const totalLinks = shareLinks?.length || 0;
    const activeLinks = shareLinks?.filter((link: any) => link.is_active).length || 0;
    const totalPermissions = permissions?.length || 0;
    const totalAccesses = accessLogs?.length || 0;

    // Calculate access breakdown
    const accessByAction = (accessLogs || []).reduce((acc: any, log: any) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    // Get unique users who accessed
    const uniqueUsers = new Set((accessLogs || []).map((log: any) => log.user_id).filter(Boolean));

    // Get permission breakdown
    const permissionByRole = (permissions || []).reduce((acc: any, perm: any) => {
      acc[perm.permission_role] = (acc[perm.permission_role] || 0) + 1;
      return acc;
    }, {});

    // Get most recent accesses
    const recentAccesses = (accessLogs || [])
      .slice(0, 10)
      .map((log: any) => ({
        userId: log.user_id,
        action: log.action,
        ipAddress: log.ip_address,
        createdAt: log.created_at,
      }));

    const stats = {
      itemId: sharedItem.item_id,
      sharedItemId: sharedItem.id,
      isPublic: sharedItem.is_public,
      publicUrl: sharedItem.public_url,
      createdAt: sharedItem.created_at,
      links: {
        total: totalLinks,
        active: activeLinks,
        inactive: totalLinks - activeLinks,
      },
      permissions: {
        total: totalPermissions,
        byRole: permissionByRole,
      },
      access: {
        total: totalAccesses,
        uniqueUsers: uniqueUsers.size,
        byAction: accessByAction,
        recent: recentAccesses,
      },
    };

    return NextResponse.json({
      success: true,
      isShared: true,
      stats,
    });
  } catch (error) {
    console.error('Error in GET /api/sharing/stats/[itemId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
