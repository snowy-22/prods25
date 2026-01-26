/**
 * Product Detail API Routes
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products/[id] - Get product details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: productId } = await params;

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get attachments
    const { data: attachments } = await supabase
      .from('product_attachments')
      .select('*')
      .eq('product_id', productId);

    // Get reviews
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId);

    // Get lifecycle
    const { data: lifecycle } = await supabase
      .from('product_lifecycle')
      .select('*')
      .eq('product_id', productId)
      .single();

    // Get marketplace listing if exists
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'active')
      .single();

    return NextResponse.json({
      product,
      attachments: attachments || [],
      reviews: reviews || [],
      lifecycle,
      listing,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();

    // Check ownership
    const { data: product, error: checkError } = await supabase
      .from('products')
      .select('user_id')
      .eq('id', productId)
      .single();

    if (checkError || product.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update product
    const { data, error } = await supabase
      .from('products')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    // Check ownership
    const { data: product, error: checkError } = await supabase
      .from('products')
      .select('user_id')
      .eq('id', productId)
      .single();

    if (checkError || product.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
