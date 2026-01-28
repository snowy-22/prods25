# Canvas Export & Paylaşım Sistemi - Yol Haritası

## 📍 URI/URL Rehberi

### Canvas'a Ne URI Vermem Gerekiyor?

Farklı senaryolar için farklı URI formatları kullanılır:

#### 1. **OAuth Callback URI** (API Entegrasyonları için)
```
Production: https://tv25.app/auth/callback
Development: http://localhost:3000/auth/callback
Supabase: https://qukzepteomenikeelzno.supabase.co/auth/v1/callback
```

#### 2. **Canvas Share URL** (Paylaşım Linki)
```
Format: https://tv25.app/shared/{share_token}
Örnek: https://tv25.app/shared/abc123xyz
```

#### 3. **Embed/Iframe URL**
```
Format: https://tv25.app/embed/{item_id}?theme=dark&controls=1
Params:
  - theme: dark|light|auto
  - controls: 0|1
  - autoplay: 0|1
  - watermark: 0|1
```

#### 4. **Export URL** (Statik HTML/JSON)
```
Format: https://tv25.app/export/{export_id}.{format}
Örnek: https://tv25.app/export/exp_abc123.html
        https://tv25.app/export/exp_abc123.json
```

#### 5. **UTM Takip Parametreleri**
```
Örnek: https://tv25.app/shared/abc123?utm_source=twitter&utm_medium=social&utm_campaign=launch
```

---

## 🎯 Özellik Planı

### Faz 1: Export Altyapısı
- [ ] `src/lib/export-manager.ts` - Merkezi export yönetimi
- [ ] `src/lib/screenshot-service.ts` - html2canvas ile ekran görüntüsü
- [ ] `src/lib/watermark-service.ts` - Export watermark sistemi
- [ ] Database: `exports` tablosu oluştur

### Faz 2: Export API
- [ ] `POST /api/export` - Export oluştur
- [ ] `GET /api/export/{id}` - Export indir/görüntüle
- [ ] `GET /api/export/{id}/analytics` - Export analytics
- [ ] `DELETE /api/export/{id}` - Export sil

### Faz 3: Paylaşım Sayfası
- [ ] `/share/[token]` - Public paylaşım sayfası
- [ ] HTML Editor (Monaco) - HTML export düzenleme
- [ ] JSON Editor (Monaco) - JSON export düzenleme
- [ ] Iframe Preview - Canlı önizleme

### Faz 4: Üretici Arşivi
- [ ] `/dashboard/exports` - Tüm exportlar
- [ ] `/dashboard/analytics` - Paylaşım analytics
- [ ] Filter: URL, HTML, JSON, iframe türleri
- [ ] UTM tracking dashboard

---

## 📊 Database Schema

### exports tablosu
```sql
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Export Türü
  type TEXT NOT NULL CHECK (type IN ('html', 'json', 'image', 'pdf', 'iframe')),
  format TEXT NOT NULL, -- 'standalone', 'embed', 'responsive'
  
  -- Kaynak İçerik
  source_type TEXT NOT NULL, -- 'canvas', 'folder', 'item', 'selection'
  source_id TEXT NOT NULL,
  source_items JSONB, -- Export edilen item ID'leri
  
  -- Export İçeriği
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- HTML veya JSON içerik
  thumbnail_url TEXT, -- Önizleme görüntüsü
  file_url TEXT, -- S3/Storage URL
  file_size INTEGER,
  
  -- Ayarlar
  settings JSONB DEFAULT '{}'::jsonb,
  -- settings örnek: {"watermark": true, "watermark_text": "tv25.app", "responsive": true, "theme": "dark"}
  
  -- Paylaşım
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  short_code TEXT UNIQUE, -- Kısa link: tv25.app/e/abc123
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);

-- Index'ler
CREATE INDEX idx_exports_user ON exports(user_id);
CREATE INDEX idx_exports_share_token ON exports(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_exports_short_code ON exports(short_code) WHERE short_code IS NOT NULL;
```

### export_analytics tablosu
```sql
CREATE TABLE export_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES exports(id) ON DELETE CASCADE,
  
  -- Event
  event_type TEXT NOT NULL, -- 'view', 'download', 'share', 'embed'
  
  -- UTM Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Visitor Info
  visitor_id TEXT, -- Anonim visitor ID
  user_id UUID REFERENCES auth.users(id),
  ip_hash TEXT, -- Gizlilik için hash'lenmiş IP
  country TEXT,
  city TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  referrer TEXT,
  
  -- Context
  session_id TEXT,
  page_url TEXT,
  embed_url TEXT, -- Iframe embed edildiği URL
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX idx_export_analytics_export ON export_analytics(export_id);
CREATE INDEX idx_export_analytics_created ON export_analytics(created_at DESC);
CREATE INDEX idx_export_analytics_utm ON export_analytics(utm_source, utm_medium, utm_campaign);
```

---

## 🔧 Implementasyon Detayları

### 1. Screenshot Service
```typescript
// src/lib/screenshot-service.ts
import html2canvas from 'html2canvas';

export async function captureCanvasScreenshot(
  elementId: string,
  options: {
    watermark?: boolean;
    watermarkText?: string;
    quality?: number;
    format?: 'png' | 'jpeg' | 'webp';
  }
): Promise<Blob> {
  // html2canvas ile capture
  // Watermark ekleme
  // Format dönüşümü
}
```

### 2. Watermark Service
```typescript
// src/lib/watermark-service.ts
export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  opacity: number;
  fontSize: number;
  color: string;
  logo?: string; // Logo URL
}

export function addWatermark(canvas: HTMLCanvasElement, options: WatermarkOptions): HTMLCanvasElement;
export function addWatermarkToHTML(html: string, options: WatermarkOptions): string;
```

### 3. Export Manager
```typescript
// src/lib/export-manager.ts
export interface ExportOptions {
  type: 'html' | 'json' | 'image' | 'pdf' | 'iframe';
  format: 'standalone' | 'embed' | 'responsive';
  watermark: WatermarkOptions;
  includeStyles: boolean;
  minify: boolean;
  title: string;
  description?: string;
}

export class ExportManager {
  async exportAsHTML(items: ContentItem[], options: ExportOptions): Promise<ExportResult>;
  async exportAsJSON(items: ContentItem[], options: ExportOptions): Promise<ExportResult>;
  async exportAsImage(elementId: string, options: ExportOptions): Promise<ExportResult>;
  async generateIframeEmbed(exportId: string): Promise<string>;
  async saveExport(result: ExportResult): Promise<Export>;
  async getExportAnalytics(exportId: string): Promise<ExportAnalytics>;
}
```

### 4. Share Page Components
```
src/app/share/[token]/
├── page.tsx           # Ana paylaşım sayfası
├── html-editor.tsx    # HTML düzenleyici
├── json-editor.tsx    # JSON düzenleyici
├── iframe-preview.tsx # Iframe önizleme
└── analytics.tsx      # Paylaşım analytics
```

---

## 🎨 UI Tasarım

### Export Modal
- Source seçimi (Tüm canvas / Seçili itemler / Folder)
- Format seçimi (HTML / JSON / Image / PDF)
- Watermark toggle + özelleştirme
- Preview panel
- UTM builder
- Share options

### Üretici Arşivi Dashboard
- Tüm exportlar listesi (tablo/grid view)
- Filter: Tür, tarih, erişim sayısı
- Her export için quick actions: Kopyala, Düzenle, Sil, Analytics
- Bulk actions: Toplu silme, toplu paylaşım ayarları
- Analytics özet kartları

---

## 📅 Öncelik Sırası

1. **P0 - Kritik**
   - Export manager core
   - HTML/JSON export
   - exports tablosu migration

2. **P1 - Yüksek**
   - Screenshot service
   - Watermark service
   - Share page (basic)

3. **P2 - Orta**
   - Monaco editors
   - UTM tracking
   - Analytics dashboard

4. **P3 - Düşük**
   - PDF export
   - Embed analytics
   - Advanced watermark options
