/**
 * Product API Routes
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Create product
    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        title: body.title,
        description: body.description,
        category: body.category,
        sku: body.sku,
        barcode: body.barcode,
        purchase_date: body.purchase_date,
        purchase_price: body.purchase_price,
        estimated_value: body.estimated_value,
        condition: body.condition,
        quantity: body.quantity || 1,
        images: body.images || [],
        tags: body.tags || [],
        is_visible: body.is_visible !== false,
        visibility_type: body.visibility_type || 'private',
      })
      .select()
      .single();

    if (error) {
      console.error('Product creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/products - Get user's products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const visibility = searchParams.get('visibility');

    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    
    if (visibility) {
      query = query.eq('visibility_type', visibility);
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
