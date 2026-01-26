import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const { style, timestamp } = await request.json();

    if (!itemId || !style) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Get auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update item style in database
    const { data, error } = await supabase
      .from('content_items')
      .update({
        metadata: {
          styles: style,
          lastStyleUpdate: timestamp,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Style update error:', error);
      return NextResponse.json(
        { error: 'Failed to update style' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      itemId,
      style,
      timestamp,
    });
  } catch (error) {
    console.error('Style sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
