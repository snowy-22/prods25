/**
 * Export Manager - Canvas Export Yönetim Sistemi
 * 
 * HTML, JSON, Image, PDF formatlarında export
 * Watermark, UTM tracking, analytics desteği
 */

import { ContentItem } from './initial-content';
import { createClient } from './supabase/client';

// ============ TYPES ============

export type ExportType = 'html' | 'json' | 'image' | 'pdf' | 'iframe';
export type ExportFormat = 'standalone' | 'embed' | 'responsive';
export type WatermarkPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
export type SourceType = 'canvas' | 'folder' | 'item' | 'selection';

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  logo?: string;
  padding?: number;
}

export interface ExportSettings {
  watermark: WatermarkOptions;
  includeStyles: boolean;
  minify: boolean;
  responsive: boolean;
  theme: 'light' | 'dark' | 'auto';
  includeMetadata: boolean;
  compressImages: boolean;
}

export interface ExportOptions {
  type: ExportType;
  format: ExportFormat;
  settings: ExportSettings;
  title: string;
  description?: string;
  password?: string;
  expiresAt?: Date;
  maxViews?: number;
}

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface Export {
  id: string;
  userId: string;
  type: ExportType;
  format: ExportFormat;
  sourceType: SourceType;
  sourceId: string;
  sourceItems?: string[];
  title: string;
  description?: string;
  content?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
  fileSize?: number;
  settings: ExportSettings;
  isPublic: boolean;
  shareToken?: string;
  shortCode?: string;
  passwordHash?: string;
  expiresAt?: string;
  maxViews?: number;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

export interface ExportResult {
  success: boolean;
  export?: Export;
  content?: string;
  blob?: Blob;
  dataUrl?: string;
  error?: string;
}

export interface ExportAnalytics {
  exportId: string;
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  uniqueVisitors: number;
  topCountries: Array<{ country: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  utmBreakdown: {
    sources: Array<{ source: string; count: number }>;
    mediums: Array<{ medium: string; count: number }>;
    campaigns: Array<{ campaign: string; count: number }>;
  };
  dailyViews: Array<{ date: string; count: number }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

// ============ DEFAULT VALUES ============

export const DEFAULT_WATERMARK: WatermarkOptions = {
  enabled: false,
  text: 'tv25.app',
  position: 'bottom-right',
  opacity: 0.7,
  fontSize: 14,
  color: '#ffffff',
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: 8,
};

export const DEFAULT_SETTINGS: ExportSettings = {
  watermark: DEFAULT_WATERMARK,
  includeStyles: true,
  minify: false,
  responsive: true,
  theme: 'auto',
  includeMetadata: true,
  compressImages: true,
};

// ============ UTILITIES ============

/**
 * Kısa kod üret (6 karakter)
 */
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Share token üret (24 karakter)
 */
function generateShareToken(): string {
  const array = new Uint8Array(18);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * UTM parametreleri ile URL oluştur
 */
export function buildUrlWithUtm(baseUrl: string, utm: UTMParams): string {
  const url = new URL(baseUrl);
  if (utm.source) url.searchParams.set('utm_source', utm.source);
  if (utm.medium) url.searchParams.set('utm_medium', utm.medium);
  if (utm.campaign) url.searchParams.set('utm_campaign', utm.campaign);
  if (utm.term) url.searchParams.set('utm_term', utm.term);
  if (utm.content) url.searchParams.set('utm_content', utm.content);
  return url.toString();
}

/**
 * URL'den UTM parametrelerini çıkar
 */
export function extractUtmFromUrl(url: string): UTMParams {
  try {
    const urlObj = new URL(url);
    return {
      source: urlObj.searchParams.get('utm_source') || undefined,
      medium: urlObj.searchParams.get('utm_medium') || undefined,
      campaign: urlObj.searchParams.get('utm_campaign') || undefined,
      term: urlObj.searchParams.get('utm_term') || undefined,
      content: urlObj.searchParams.get('utm_content') || undefined,
    };
  } catch {
    return {};
  }
}

// ============ HTML GENERATOR ============

/**
 * Canvas item'larını HTML'e dönüştür
 */
export function generateHTML(
  items: ContentItem[],
  options: ExportOptions
): string {
  const { settings, title, description } = options;
  
  // CSS stilleri
  const styles = settings.includeStyles ? `
    <style>
      :root {
        --bg-primary: ${settings.theme === 'dark' ? '#0f0f0f' : '#ffffff'};
        --bg-secondary: ${settings.theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
        --text-primary: ${settings.theme === 'dark' ? '#ffffff' : '#000000'};
        --text-secondary: ${settings.theme === 'dark' ? '#a0a0a0' : '#666666'};
        --border-color: ${settings.theme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
        --accent-color: #6366f1;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--bg-primary);
        color: var(--text-primary);
        line-height: 1.6;
      }
      
      .canvas-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 24px;
      }
      
      .canvas-header {
        margin-bottom: 32px;
        text-align: center;
      }
      
      .canvas-title {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 8px;
      }
      
      .canvas-description {
        color: var(--text-secondary);
        font-size: 1rem;
      }
      
      .canvas-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      
      .canvas-item {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .canvas-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      }
      
      .item-media {
        width: 100%;
        aspect-ratio: 16/9;
        object-fit: cover;
        background: var(--bg-primary);
      }
      
      .item-content {
        padding: 16px;
      }
      
      .item-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .item-description {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
      
      .item-meta {
        display: flex;
        gap: 12px;
        margin-top: 12px;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
      
      .watermark {
        position: fixed;
        ${settings.watermark.position.includes('bottom') ? 'bottom: 16px;' : 'top: 16px;'}
        ${settings.watermark.position.includes('right') ? 'right: 16px;' : 'left: 16px;'}
        ${settings.watermark.position === 'center' ? 'top: 50%; left: 50%; transform: translate(-50%, -50%);' : ''}
        padding: ${settings.watermark.padding || 8}px 12px;
        background: ${settings.watermark.backgroundColor || 'rgba(0,0,0,0.5)'};
        color: ${settings.watermark.color};
        font-size: ${settings.watermark.fontSize}px;
        opacity: ${settings.watermark.opacity};
        border-radius: 6px;
        font-weight: 500;
        pointer-events: none;
        z-index: 9999;
      }
      
      @media (max-width: 768px) {
        .canvas-grid {
          grid-template-columns: 1fr;
        }
        
        .canvas-container {
          padding: 16px;
        }
        
        .canvas-title {
          font-size: 1.5rem;
        }
      }
    </style>
  ` : '';
  
  // Items HTML
  const itemsHtml = items.map(item => {
    const mediaHtml = getItemMediaHtml(item);
    return `
      <div class="canvas-item" data-item-id="${item.id}" data-item-type="${item.type}">
        ${mediaHtml}
        <div class="item-content">
          <h3 class="item-title">${escapeHtml(item.title || 'Untitled')}</h3>
          ${item.content ? `<p class="item-description">${escapeHtml(String(item.content).slice(0, 150))}${String(item.content).length > 150 ? '...' : ''}</p>` : ''}
          <div class="item-meta">
            <span>📅 ${new Date(item.createdAt || Date.now()).toLocaleDateString('tr-TR')}</span>
            ${item.type ? `<span>🏷️ ${item.type}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('\n');
  
  // Watermark HTML
  const watermarkHtml = settings.watermark.enabled ? `
    <div class="watermark">${escapeHtml(settings.watermark.text)}</div>
  ` : '';
  
  // Metadata
  const metadata = settings.includeMetadata ? `
    <meta name="description" content="${escapeHtml(description || title)}">
    <meta name="generator" content="tv25.app Canvas Export">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description || '')}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
  ` : '';
  
  // Full HTML
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${metadata}
  ${styles}
</head>
<body>
  <div class="canvas-container">
    <header class="canvas-header">
      <h1 class="canvas-title">${escapeHtml(title)}</h1>
      ${description ? `<p class="canvas-description">${escapeHtml(description)}</p>` : ''}
    </header>
    
    <main class="canvas-grid">
      ${itemsHtml}
    </main>
  </div>
  
  ${watermarkHtml}
  
  <!-- Generated by tv25.app Canvas Export -->
  <!-- Export Date: ${new Date().toISOString()} -->
  <!-- Items: ${items.length} -->
</body>
</html>`;

  return settings.minify ? minifyHtml(html) : html;
}

/**
 * Item için media HTML üret
 */
function getItemMediaHtml(item: ContentItem): string {
  const type = item.type;
  
  // Video/Player
  if (type === 'player' || type === 'video' || type === 'audio') {
    const url = (item as any).url || (item as any).src || '';
    const youtubeId = extractYouTubeId(url);
    
    if (youtubeId) {
      return `<img class="item-media" src="https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg" alt="${escapeHtml(item.title || '')}" loading="lazy">`;
    }
    return `<div class="item-media" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">🎬</div>`;
  }
  
  // Image
  if (type === 'image') {
    const src = (item as any).src || (item as any).url || '';
    if (src) {
      return `<img class="item-media" src="${escapeHtml(src)}" alt="${escapeHtml(item.title || '')}" loading="lazy">`;
    }
  }
  
  // Folder
  if (type === 'folder') {
    return `<div class="item-media" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">📁</div>`;
  }
  
  // Widget
  if (type?.includes('widget')) {
    return `<div class="item-media" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">🔧</div>`;
  }
  
  // Default
  return `<div class="item-media" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">📄</div>`;
}

/**
 * YouTube video ID çıkar
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * HTML escape
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Basit HTML minify
 */
function minifyHtml(html: string): string {
  return html
    .replace(/\n\s+/g, '\n')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ============ JSON GENERATOR ============

/**
 * Canvas item'larını JSON'a dönüştür
 */
export function generateJSON(
  items: ContentItem[],
  options: ExportOptions
): string {
  const exportData = {
    meta: {
      title: options.title,
      description: options.description,
      exportedAt: new Date().toISOString(),
      exportType: options.type,
      exportFormat: options.format,
      itemCount: items.length,
      generator: 'tv25.app Canvas Export v1.0',
    },
    settings: options.settings,
    items: items.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.content,
      url: (item as any).url || (item as any).src,
      position: {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      },
      metadata: {
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        parentId: item.parentId,
        order: item.order,
        tags: (item as any).tags,
      },
      styles: item.styles,
    })),
  };

  return options.settings.minify
    ? JSON.stringify(exportData)
    : JSON.stringify(exportData, null, 2);
}

// ============ IFRAME GENERATOR ============

/**
 * Iframe embed kodu üret
 */
export function generateIframeEmbed(
  exportId: string,
  options: {
    width?: string;
    height?: string;
    theme?: 'light' | 'dark' | 'auto';
    controls?: boolean;
    responsive?: boolean;
  } = {}
): string {
  const {
    width = '100%',
    height = '600px',
    theme = 'auto',
    controls = true,
    responsive = true,
  } = options;
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tv25.app';
  const embedUrl = `${baseUrl}/embed/${exportId}?theme=${theme}&controls=${controls ? '1' : '0'}`;
  
  if (responsive) {
    return `<div style="position:relative;width:100%;padding-bottom:56.25%;height:0;overflow:hidden;">
  <iframe 
    src="${embedUrl}"
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
    allowfullscreen
    loading="lazy"
  ></iframe>
</div>`;
  }
  
  return `<iframe 
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  style="border:0;"
  allowfullscreen
  loading="lazy"
></iframe>`;
}

// ============ EXPORT MANAGER CLASS ============

export class ExportManager {
  private supabase = createClient();

  /**
   * HTML olarak export et
   */
  async exportAsHTML(
    items: ContentItem[],
    options: ExportOptions,
    sourceType: SourceType = 'canvas',
    sourceId: string = 'main'
  ): Promise<ExportResult> {
    try {
      const html = generateHTML(items, options);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      
      // Database'e kaydet
      const exportRecord = await this.saveExport({
        type: 'html',
        format: options.format,
        sourceType,
        sourceId,
        sourceItems: items.map(i => i.id),
        title: options.title,
        description: options.description,
        content: html,
        settings: options.settings,
        fileSize: blob.size,
        password: options.password,
        expiresAt: options.expiresAt,
        maxViews: options.maxViews,
      });
      
      return {
        success: true,
        export: exportRecord,
        content: html,
        blob,
      };
    } catch (error) {
      console.error('HTML export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HTML export failed',
      };
    }
  }

  /**
   * JSON olarak export et
   */
  async exportAsJSON(
    items: ContentItem[],
    options: ExportOptions,
    sourceType: SourceType = 'canvas',
    sourceId: string = 'main'
  ): Promise<ExportResult> {
    try {
      const json = generateJSON(items, options);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      
      // Database'e kaydet
      const exportRecord = await this.saveExport({
        type: 'json',
        format: options.format,
        sourceType,
        sourceId,
        sourceItems: items.map(i => i.id),
        title: options.title,
        description: options.description,
        content: json,
        settings: options.settings,
        fileSize: blob.size,
        password: options.password,
        expiresAt: options.expiresAt,
        maxViews: options.maxViews,
      });
      
      return {
        success: true,
        export: exportRecord,
        content: json,
        blob,
      };
    } catch (error) {
      console.error('JSON export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON export failed',
      };
    }
  }

  /**
   * Export'u database'e kaydet
   */
  async saveExport(data: {
    type: ExportType;
    format: ExportFormat;
    sourceType: SourceType;
    sourceId: string;
    sourceItems?: string[];
    title: string;
    description?: string;
    content?: string;
    thumbnailUrl?: string;
    fileUrl?: string;
    settings: ExportSettings;
    fileSize?: number;
    password?: string;
    expiresAt?: Date;
    maxViews?: number;
  }): Promise<Export> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const shareToken = generateShareToken();
    const shortCode = generateShortCode();

    const { data: exportRecord, error } = await this.supabase
      .from('exports')
      .insert({
        user_id: userData.user.id,
        type: data.type,
        format: data.format,
        source_type: data.sourceType,
        source_id: data.sourceId,
        source_items: data.sourceItems,
        title: data.title,
        description: data.description,
        content: data.content,
        thumbnail_url: data.thumbnailUrl,
        file_url: data.fileUrl,
        file_size: data.fileSize,
        settings: data.settings,
        is_public: false,
        share_token: shareToken,
        short_code: shortCode,
        password_hash: data.password ? await this.hashPassword(data.password) : null,
        expires_at: data.expiresAt?.toISOString(),
        max_views: data.maxViews,
        view_count: 0,
        download_count: 0,
        share_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapExportRecord(exportRecord);
  }

  /**
   * Export'u ID ile getir
   */
  async getExport(exportId: string): Promise<Export | null> {
    const { data, error } = await this.supabase
      .from('exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (error || !data) return null;
    return this.mapExportRecord(data);
  }

  /**
   * Export'u share token ile getir (public access)
   */
  async getExportByToken(token: string): Promise<Export | null> {
    const { data, error } = await this.supabase
      .from('exports')
      .select('*')
      .eq('share_token', token)
      .single();

    if (error || !data) return null;
    return this.mapExportRecord(data);
  }

  /**
   * Export'u short code ile getir
   */
  async getExportByShortCode(code: string): Promise<Export | null> {
    const { data, error } = await this.supabase
      .from('exports')
      .select('*')
      .eq('short_code', code)
      .single();

    if (error || !data) return null;
    return this.mapExportRecord(data);
  }

  /**
   * Kullanıcının tüm export'larını getir
   */
  async getUserExports(options?: {
    type?: ExportType;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'view_count' | 'download_count';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Export[]> {
    const { data: userData } = await this.supabase.auth.getUser();
    if (!userData.user) return [];

    let query = this.supabase
      .from('exports')
      .select('*')
      .eq('user_id', userData.user.id);

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get user exports:', error);
      return [];
    }

    return (data || []).map(this.mapExportRecord);
  }

  /**
   * Export'u güncelle
   */
  async updateExport(exportId: string, updates: Partial<{
    title: string;
    description: string;
    isPublic: boolean;
    settings: ExportSettings;
    expiresAt: Date;
    maxViews: number;
  }>): Promise<Export | null> {
    const { data, error } = await this.supabase
      .from('exports')
      .update({
        title: updates.title,
        description: updates.description,
        is_public: updates.isPublic,
        settings: updates.settings,
        expires_at: updates.expiresAt?.toISOString(),
        max_views: updates.maxViews,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exportId)
      .select()
      .single();

    if (error || !data) return null;
    return this.mapExportRecord(data);
  }

  /**
   * Export'u sil
   */
  async deleteExport(exportId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('exports')
      .delete()
      .eq('id', exportId);

    return !error;
  }

  /**
   * View count artır
   */
  async incrementViewCount(exportId: string): Promise<void> {
    await this.supabase.rpc('increment_export_view', { export_id: exportId });
  }

  /**
   * Download count artır
   */
  async incrementDownloadCount(exportId: string): Promise<void> {
    await this.supabase.rpc('increment_export_download', { export_id: exportId });
  }

  /**
   * Analytics kaydet
   */
  async logAnalytics(exportId: string, data: {
    eventType: 'view' | 'download' | 'share' | 'embed';
    utm?: UTMParams;
    visitorId?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
    referrer?: string;
    country?: string;
    city?: string;
  }): Promise<void> {
    await this.supabase.from('export_analytics').insert({
      export_id: exportId,
      event_type: data.eventType,
      utm_source: data.utm?.source,
      utm_medium: data.utm?.medium,
      utm_campaign: data.utm?.campaign,
      utm_term: data.utm?.term,
      utm_content: data.utm?.content,
      visitor_id: data.visitorId,
      device_type: data.deviceType,
      browser: data.browser,
      os: data.os,
      referrer: data.referrer,
      country: data.country,
      city: data.city,
    });
  }

  /**
   * Export analytics getir
   */
  async getExportAnalytics(exportId: string): Promise<ExportAnalytics | null> {
    const { data: analytics, error } = await this.supabase
      .from('export_analytics')
      .select('*')
      .eq('export_id', exportId);

    if (error || !analytics) return null;

    const events = analytics;
    
    return {
      exportId,
      totalViews: events.filter(e => e.event_type === 'view').length,
      totalDownloads: events.filter(e => e.event_type === 'download').length,
      totalShares: events.filter(e => e.event_type === 'share').length,
      uniqueVisitors: new Set(events.map(e => e.visitor_id).filter(Boolean)).size,
      topCountries: this.aggregateCountries(events),
      topReferrers: this.aggregateReferrers(events),
      utmBreakdown: {
        sources: this.aggregateSources(events),
        mediums: this.aggregateMediums(events),
        campaigns: this.aggregateCampaigns(events),
      },
      dailyViews: this.aggregateByDate(events.filter(e => e.event_type === 'view')),
      deviceBreakdown: {
        desktop: events.filter(e => e.device_type === 'desktop').length,
        mobile: events.filter(e => e.device_type === 'mobile').length,
        tablet: events.filter(e => e.device_type === 'tablet').length,
      },
    };
  }

  /**
   * Password hash
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Alan bazlı aggregation - country için
   */
  private aggregateCountries(events: any[]): Array<{ country: string; count: number }> {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      if (e.country) {
        counts[e.country] = (counts[e.country] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Alan bazlı aggregation - referrer için
   */
  private aggregateReferrers(events: any[]): Array<{ referrer: string; count: number }> {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      if (e.referrer) {
        counts[e.referrer] = (counts[e.referrer] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * UTM Sources aggregation
   */
  private aggregateSources(events: any[]): Array<{ source: string; count: number }> {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      if (e.utm_source) {
        counts[e.utm_source] = (counts[e.utm_source] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * UTM Mediums aggregation
   */
  private aggregateMediums(events: any[]): Array<{ medium: string; count: number }> {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      if (e.utm_medium) {
        counts[e.utm_medium] = (counts[e.utm_medium] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([medium, count]) => ({ medium, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * UTM Campaigns aggregation
   */
  private aggregateCampaigns(events: any[]): Array<{ campaign: string; count: number }> {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      if (e.utm_campaign) {
        counts[e.utm_campaign] = (counts[e.utm_campaign] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([campaign, count]) => ({ campaign, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Tarih bazlı aggregation
   */
  private aggregateByDate(events: any[]): Array<{ date: string; count: number }> {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      const date = new Date(e.created_at).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Database record'u Export tipine map et
   */
  private mapExportRecord(record: any): Export {
    return {
      id: record.id,
      userId: record.user_id,
      type: record.type,
      format: record.format,
      sourceType: record.source_type,
      sourceId: record.source_id,
      sourceItems: record.source_items,
      title: record.title,
      description: record.description,
      content: record.content,
      thumbnailUrl: record.thumbnail_url,
      fileUrl: record.file_url,
      fileSize: record.file_size,
      settings: record.settings,
      isPublic: record.is_public,
      shareToken: record.share_token,
      shortCode: record.short_code,
      passwordHash: record.password_hash,
      expiresAt: record.expires_at,
      maxViews: record.max_views,
      viewCount: record.view_count,
      downloadCount: record.download_count,
      shareCount: record.share_count,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      lastAccessedAt: record.last_accessed_at,
    };
  }
}

// Singleton instance
export const exportManager = new ExportManager();
