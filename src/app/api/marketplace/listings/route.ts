/**
 * Marketplace Listings API
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/marketplace/listings - Get public listings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sort') || 'created_at';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('marketplace_listings')
      .select(`
        *,
        products (
          title,
          images,
          description,
          condition
        ),
        seller:user_id (
          username,
          avatar_url
        )
      `)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .range(offset, offset + limit - 1)
      .order(sortBy, { ascending: false });

    if (category) {
      query = query.eq('marketplace_category', category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/marketplace/listings - Create listing
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Create listing
    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert({
        product_id: body.product_id,
        seller_id: user.id,
        title: body.title,
        description: body.description,
        price: body.price,
        quantity_available: body.quantity_available,
        status: 'active',
        visibility: body.visibility || 'public',
        marketplace_category: body.marketplace_category,
        tags: body.tags || [],
        shipping_available: body.shipping_available !== false,
        shipping_price: body.shipping_price,
        estimated_delivery_days: body.estimated_delivery_days,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create marketplace profile if doesn't exist
    await supabase
      .from('user_marketplace_profiles')
      .upsert({
        user_id: user.id,
        is_active: true,
      }, {
        onConflict: 'user_id',
      });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
