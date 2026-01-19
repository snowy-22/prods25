import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/sharing/create
 * Create a new shared item
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
    const { itemId, itemType, itemName, isPublic, permissions } = body;

    // Validate input
    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'itemId and itemType are required' },
        { status: 400 }
      );
    }

    // Check if item is already shared
    const { data: existing } = await supabase
      .from('shared_items')
      .select('*')
      .eq('item_id', itemId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Item is already shared', sharedItem: existing },
        { status: 409 }
      );
    }

    // Create shared item
    const newSharedItem = {
      owner_id: user.id,
      item_id: itemId,
      item_type: itemType,
      item_name: itemName || 'Untitled',
      is_public: isPublic || false,
      public_url: isPublic ? `share/${itemId}` : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: sharedItem, error } = await supabase
      .from('shared_items')
      .insert(newSharedItem)
      .select()
      .single();

    if (error) {
      console.error('Error creating shared item:', error);
      return NextResponse.json(
        { error: 'Failed to create shared item' },
        { status: 500 }
      );
    }

    // Add initial permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const permissionRecords = permissions.map((perm: any) => ({
        shared_item_id: sharedItem.id,
        grantee_user_id: perm.userId,
        grantee_email: perm.email,
        permission_role: perm.role || 'view',
        granted_by: user.id,
        expires_at: perm.expiresAt || null,
        created_at: new Date().toISOString(),
      }));

      const { error: permError } = await supabase
        .from('share_permissions')
        .insert(permissionRecords);

      if (permError) {
        console.error('Error creating permissions:', permError);
        // Continue anyway - shared item is created
      }
    }

    return NextResponse.json({
      success: true,
      sharedItem,
      message: 'Item shared successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sharing/create:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
