/**
 * Barcode Scanning & Recognition API
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/barcode/scan - Scan barcode
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const barcode = body.barcode;

    // Check if barcode already exists in user's products
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .eq('barcode', barcode)
      .single();

    if (existingProduct) {
      return NextResponse.json({
        found: true,
        product: existingProduct,
        message: 'Product already in your inventory',
      });
    }

    // Try to fetch from external barcode database
    let productData: any = null;
    try {
      // You can integrate with https://www.barcodable.com or similar API
      const response = await fetch(`https://api.barcodable.com/barcode/${barcode}`);
      if (response.ok) {
        productData = await response.json();
      }
    } catch (err) {
      console.log('External barcode lookup failed, continuing...');
    }

    // Log the scan
    const { data: scan } = await supabase
      .from('barcode_scans')
      .insert({
        user_id: user.id,
        barcode,
        scan_result: productData || {},
      })
      .select()
      .single();

    return NextResponse.json({
      found: !!productData,
      scan_id: scan?.id,
      product: productData,
      auto_filled_fields: productData ? {
        title: productData.name || productData.title,
        description: productData.description,
        images: productData.image ? [productData.image] : [],
        category: productData.category,
      } : {},
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/barcode/history - Get scanning history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '20');

    const { data, error } = await supabase
      .from('barcode_scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
