/**
 * Export Detail API - GET, PATCH, DELETE by ID
 * 
 * GET /api/export/[id] - Export detayı
 * PATCH /api/export/[id] - Export güncelle
 * DELETE /api/export/[id] - Export sil
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportManager } from '@/lib/export-manager';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Export detayı
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const exportData = await exportManager.getExport(id);
    
    if (!exportData) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // Yetki kontrolü - sadece sahibi veya public export
    if (!exportData.isPublic && exportData.userId !== user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // View count artır (sadece başkaları için)
    if (user?.id !== exportData.userId) {
      await exportManager.incrementViewCount(id);
      exportData.viewCount++;
    }

    return NextResponse.json({
      success: true,
      export: exportData,
    });
  } catch (error) {
    console.error('Export get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Export güncelle
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const exportData = await exportManager.getExport(id);
    
    if (!exportData) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // Yetki kontrolü
    if (exportData.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      isPublic,
      settings,
      expiresAt,
      maxViews,
    } = body;

    const updated = await exportManager.updateExport(id, {
      title,
      description,
      isPublic,
      settings,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxViews,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update export' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      export: updated,
    });
  } catch (error) {
    console.error('Export update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Export sil
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const exportData = await exportManager.getExport(id);
    
    if (!exportData) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // Yetki kontrolü
    if (exportData.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const deleted = await exportManager.deleteExport(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete export' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Export deleted successfully',
    });
  } catch (error) {
    console.error('Export delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
