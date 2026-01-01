import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { folderId, items, timestamp } = await request.json();

    if (!folderId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Get current user
    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Sync each item
    const results = await Promise.all(
      items.map((item: any) =>
        supabase.from('content_items').upsert(
          {
            id: item.id,
            parent_id: folderId,
            title: item.title,
            type: item.type,
            content: item.content,
            metadata: item.metadata || {},
            user_id: user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      )
    );

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Sync errors:', errors);
      return NextResponse.json(
        {
          success: false,
          synced: results.length - errors.length,
          errors: errors.map((e) => e.error?.message),
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      synced: items.length,
      timestamp,
    });
  } catch (error) {
    console.error('Content sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
