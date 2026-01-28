/**
 * Export API - GET, POST, DELETE handlers
 * 
 * POST /api/export - Yeni export oluştur
 * GET /api/export - Kullanıcının export'larını listele
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  exportManager, 
  ExportType, 
  ExportFormat, 
  ExportSettings,
  DEFAULT_SETTINGS 
} from '@/lib/export-manager';

// POST - Yeni export oluştur
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      items,
      type = 'html',
      format = 'standalone',
      title = 'Canvas Export',
      description,
      sourceType = 'canvas',
      sourceId = 'main',
      settings = {},
      password,
      expiresAt,
      maxViews,
    } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    const validTypes: ExportType[] = ['html', 'json', 'image', 'pdf', 'iframe'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validFormats: ExportFormat[] = ['standalone', 'embed', 'responsive'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Merge settings with defaults
    const mergedSettings: ExportSettings = {
      ...DEFAULT_SETTINGS,
      ...settings,
      watermark: {
        ...DEFAULT_SETTINGS.watermark,
        ...settings.watermark,
      },
    };

    const options = {
      type: type as ExportType,
      format: format as ExportFormat,
      settings: mergedSettings,
      title,
      description,
      password,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxViews,
    };

    // Export türüne göre işlem yap
    let result;
    if (type === 'html') {
      result = await exportManager.exportAsHTML(items, options, sourceType, sourceId);
    } else if (type === 'json') {
      result = await exportManager.exportAsJSON(items, options, sourceType, sourceId);
    } else {
      // Image, PDF, iframe için henüz implementasyon yok
      return NextResponse.json(
        { error: `Export type '${type}' is not yet implemented` },
        { status: 501 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Export failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      export: result.export,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tv25.app'}/share/${result.export?.shareToken}`,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tv25.app'}/e/${result.export?.shortCode}`,
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Kullanıcının export'larını listele
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ExportType | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = (searchParams.get('sortBy') || 'created_at') as 'created_at' | 'view_count' | 'download_count';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const exports = await exportManager.getUserExports({
      type: type || undefined,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    // Total count için ayrı query
    const { count } = await supabase
      .from('exports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      exports,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Export list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
