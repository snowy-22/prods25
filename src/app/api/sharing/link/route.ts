import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/sharing/link
 * Create a sharing link for an item
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      sharedItemId,
      permission,
      expiresAt,
      maxAccesses,
      password,
      canDownload,
      canPrint,
      metadata,
    } = body;

    // Validate input
    if (!sharedItemId) {
      return NextResponse.json(
        { error: 'sharedItemId is required' },
        { status: 400 }
      );
    }

    // Verify user owns the shared item
    const { data: sharedItem, error: fetchError } = await supabase
      .from('shared_items')
      .select('*')
      .eq('id', sharedItemId)
      .single();

    if (fetchError || !sharedItem) {
      return NextResponse.json(
        { error: 'Shared item not found' },
        { status: 404 }
      );
    }

    if (sharedItem.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this shared item' },
        { status: 403 }
      );
    }

    // Generate secure tokens
    const token = crypto.randomBytes(32).toString('hex');
    const shortCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');
    }

    // Create share link
    const newShareLink = {
      shared_item_id: sharedItemId,
      created_by: user.id,
      token,
      short_code: shortCode,
      permission: permission || 'view',
      expires_at: expiresAt || null,
      max_accesses: maxAccesses || null,
      access_count: 0,
      is_active: true,
      can_download: canDownload || false,
      can_print: canPrint || false,
      password_hash: passwordHash,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: shareLink, error } = await supabase
      .from('share_links')
      .insert(newShareLink)
      .select()
      .single();

    if (error) {
      console.error('Error creating share link:', error);
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    // Build public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const publicUrl = `${baseUrl}/share/${shortCode}`;

    return NextResponse.json({
      success: true,
      shareLink: {
        ...shareLink,
        publicUrl,
        // Don't expose password_hash in response
        password_hash: undefined,
      },
      message: 'Share link created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sharing/link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sharing/link?sharedItemId=xxx
 * Get all share links for a shared item
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sharedItemId = searchParams.get('sharedItemId');

    if (!sharedItemId) {
      return NextResponse.json(
        { error: 'sharedItemId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify user owns the shared item
    const { data: sharedItem } = await supabase
      .from('shared_items')
      .select('*')
      .eq('id', sharedItemId)
      .single();

    if (!sharedItem || sharedItem.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Fetch all share links
    const { data: shareLinks, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('shared_item_id', sharedItemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching share links:', error);
      return NextResponse.json(
        { error: 'Failed to fetch share links' },
        { status: 500 }
      );
    }

    // Build public URLs and remove sensitive data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const links = (shareLinks || []).map((link: any) => ({
      ...link,
      publicUrl: `${baseUrl}/share/${link.short_code}`,
      password_hash: undefined, // Don't expose password hash
    }));

    return NextResponse.json({
      success: true,
      shareLinks: links,
      count: links.length,
    });
  } catch (error) {
    console.error('Error in GET /api/sharing/link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sharing/link?linkId=xxx
 * Revoke a share link
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json(
        { error: 'linkId query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch the link and verify ownership
    const { data: shareLink } = await supabase
      .from('share_links')
      .select('*, shared_items(*)')
      .eq('id', linkId)
      .single();

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    if (shareLink.shared_items.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Deactivate the link (soft delete)
    const { error } = await supabase
      .from('share_links')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId);

    if (error) {
      console.error('Error revoking share link:', error);
      return NextResponse.json(
        { error: 'Failed to revoke share link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Share link revoked successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/sharing/link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
