# CanvasFlow Database Setup & Migration Guide

Bu kılavuz, CanvasFlow projesinin veritabanı yapısını ve migration süreçlerini detaylandırır.

## İçindekiler

- [Veritabanı Mimarisi](#veritabanı-mimarisi)
- [Supabase Kurulumu](#supabase-kurulumu)
- [Migration Yapısı](#migration-yapısı)
- [Lokal Development](#lokal-development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Veritabanı Mimarisi

CanvasFlow, aşağıdaki ana tablolardan oluşan bir PostgreSQL veritabanı kullanır:

### Core Tables

#### 1. **items** - Ana İçerik Depolama
Tüm kullanıcı içeriklerini (klasörler, videolar, widget'lar) saklar.

```sql
items (
  id TEXT PRIMARY KEY,
  parent_id TEXT,              -- Hiyerarşik yapı için
  owner_id UUID,               -- Sahip kullanıcı
  type TEXT,                   -- 'folder', 'video', 'widget', vb.
  title TEXT,                  -- Başlık
  content TEXT,                -- İçerik/notlar
  url TEXT,                    -- Video/iframe URL'i
  metadata JSONB,              -- Ekstra veriler (boyut, konum, vb.)
  is_public BOOLEAN,           -- Herkese açık mı?
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**İndeksler:**
- `idx_items_owner_id` - Kullanıcıya göre sorgular için
- `idx_items_parent_id` - Hiyerarşi sorguları için
- `idx_items_type` - Tip filtreleme için
- `idx_items_metadata_gin` - JSONB içinde arama için

### User & Social Tables

#### 2. **profiles** - Kullanıcı Profilleri
```sql
profiles (
  id UUID PRIMARY KEY,          -- auth.users.id ile eşleşir
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  follower_count INTEGER,       -- Takipçi sayısı
  following_count INTEGER,      -- Takip edilen sayısı
  is_verified BOOLEAN,          -- Doğrulanmış hesap mı?
  created_at TIMESTAMP
)
```

#### 3. **follows** - Takip İlişkileri
```sql
follows (
  follower_id UUID,             -- Takip eden
  following_id UUID,            -- Takip edilen
  created_at TIMESTAMP,
  UNIQUE(follower_id, following_id)
)
```

#### 4. **organizations** - Organizasyonlar
```sql
organizations (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  organization_type TEXT,       -- 'company', 'school', vb.
  follower_count INTEGER,
  member_count INTEGER,
  is_verified BOOLEAN
)
```

### Interaction Tables

#### 5. **comments** - Yorumlar
```sql
comments (
  id UUID PRIMARY KEY,
  item_id TEXT,                 -- Hangi içeriğe yorum
  user_id UUID,                 -- Yorum yapan
  parent_comment_id UUID,       -- İç içe yorumlar için
  content TEXT,
  like_count INTEGER
)
```

#### 6. **ratings** - Puanlamalar
```sql
ratings (
  item_id TEXT,
  user_id UUID,
  rating DECIMAL(3,2),          -- 0.00 - 10.00 arası
  review TEXT,                  -- Yorum metni
  UNIQUE(item_id, user_id)
)
```

#### 7. **saved_items** - Kaydedilen İçerikler
```sql
saved_items (
  item_id TEXT,
  user_id UUID,
  collection_name TEXT,         -- "Favoriler", "İzlenecekler" vb.
  UNIQUE(item_id, user_id, collection_name)
)
```

### AI & Analytics Tables

#### 8. **analyses** - AI Analizleri
```sql
analyses (
  id UUID PRIMARY KEY,
  item_id TEXT,
  user_id UUID,
  analysis_type TEXT,           -- 'sentiment', 'summary', vb.
  result JSONB,                 -- Analiz sonuçları
  created_at TIMESTAMP
)
```

#### 9. **logs** - Event Tracking
```sql
logs (
  user_id UUID,
  event_type TEXT,              -- 'page_load', 'item_click', vb.
  loading_time_ms INTEGER,
  device_info JSONB,
  metadata JSONB
)
```

### Communication Tables

#### 10. **messages** - Mesajlaşma
```sql
messages (
  conversation_id UUID,         -- Konuşma grubu
  sender_id UUID,
  recipient_id UUID,
  content TEXT,
  is_read BOOLEAN
)
```

#### 11. **notifications** - Bildirimler
```sql
notifications (
  user_id UUID,
  type TEXT,                    -- 'follow', 'comment', 'like', vb.
  title TEXT,
  content TEXT,
  action_url TEXT,              -- Bildirime tıklanınca gidilecek yer
  is_read BOOLEAN
)
```

### Device & Space Management

#### 12. **spaces** - Mekanlar
```sql
spaces (
  owner_id UUID,
  name TEXT,
  description TEXT,
  location TEXT,                -- "Salon TV", "Ofis Ekranı", vb.
  device_count INTEGER
)
```

#### 13. **devices** - Cihazlar
```sql
devices (
  owner_id UUID,
  space_id UUID,
  name TEXT,
  device_type TEXT,             -- 'tv', 'tablet', 'desktop', vb.
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  last_seen TIMESTAMP
)
```

---

## Supabase Kurulumu

### 1. Supabase Projesi Oluşturma

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. "New Project" butonuna tıklayın
3. Proje adı: `canvasflow`
4. Database şifresi oluşturun (güvenli bir yerde saklayın!)
5. Region seçin (en yakın: Europe (Frankfurt))
6. "Create new project" tıklayın

### 2. Supabase CLI Kurulumu

```bash
# Windows (Scoop)
scoop install supabase

# macOS (Homebrew)
brew install supabase/tap/supabase

# Linux
curl -sSfL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
```

### 3. Supabase Login

```bash
# CLI ile login
supabase login

# Project ID'yi al
supabase projects list

# Local projeyi bağla
supabase link --project-ref <PROJECT_REF>
```

### 4. Environment Variables Ayarlama

`.env.local` dosyasını oluşturun (`.env.local.example`'dan kopyalayın):

```bash
cp .env.local.example .env.local
```

Supabase Dashboard'dan alın:
- **Settings → API → URL**: `NEXT_PUBLIC_SUPABASE_URL`
- **Settings → API → anon/public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Settings → API → service_role**: `SUPABASE_SERVICE_ROLE_KEY`

---

## Migration Yapısı

### Migration Dosya Formatı

Migration dosyaları `supabase/migrations/` klasöründe saklanır:

```
supabase/
├── config.toml
├── migrations/
│   ├── 20260101000000_complete_schema.sql       # İlk schema
│   ├── 20260201000000_add_spaces_devices.sql    # Mekan/cihaz ekleme
│   └── 20260301000000_add_analytics.sql         # Analytics ekleme
└── seed.sql                                      # Test verisi
```

**Dosya adlandırma:**
- Format: `YYYYMMDDHHMMSS_description.sql`
- Timestamp: UTC timezone
- Description: Snake case, açıklayıcı

### Migration Komutları

#### Yeni Migration Oluşturma
```bash
# Boş migration dosyası oluştur
supabase migration new add_feature_name

# SQL yazdıktan sonra, local'de test et
supabase db reset

# Migration'ı production'a push et
supabase db push
```

#### Mevcut Durumu Kontrol Etme
```bash
# Migration statusu
supabase migration list

# Migration geçmişi
supabase db diff
```

#### Migration Geri Alma
```bash
# Son migration'ı geri al
supabase migration repair <TIMESTAMP> --status reverted

# Database'i sıfırla (dikkatli!)
supabase db reset
```

---

## Lokal Development

### 1. Supabase Local Start

```bash
# Supabase local instance başlat (Docker gerekli)
supabase start

# Output:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

### 2. Database Sync

```bash
# Remote'daki schema'yı local'e çek
supabase db pull

# Local değişiklikleri remote'a push et
supabase db push
```

### 3. Seed Data Oluşturma

`supabase/seed.sql` dosyası oluşturun:

```sql
-- Test kullanıcıları
INSERT INTO profiles (id, username, full_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'testuser', 'Test User'),
  ('00000000-0000-0000-0000-000000000002', 'demouser', 'Demo User');

-- Test içerikleri
INSERT INTO items (id, owner_id, type, title, content) VALUES
  ('item-001', '00000000-0000-0000-0000-000000000001', 'folder', 'Projelerim', 'Test klasör'),
  ('item-002', '00000000-0000-0000-0000-000000000001', 'video', 'Deneme Videosu', null);
```

Seed data'yı yükle:
```bash
# Local database'e seed uygula
supabase db reset --seed

# Veya doğrudan SQL çalıştır
psql $DATABASE_URL < supabase/seed.sql
```

### 4. Realtime Subscriptions Test

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Items tablosundaki değişiklikleri dinle
supabase
  .channel('items-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'items' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe();
```

---

## Production Deployment

### Vercel ile Deploy

#### 1. Environment Variables Ayarlama

Vercel Dashboard → Project Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

#### 2. Automatic Migrations (GitHub Actions)

`.github/workflows/supabase-migrate.yml` oluşturun:

```yaml
name: Supabase Migration

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Link Supabase Project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      - name: Run Migrations
        run: supabase db push
```

**Secrets ekleyin** (GitHub repo → Settings → Secrets):
- `SUPABASE_PROJECT_REF`: Project ID
- `SUPABASE_ACCESS_TOKEN`: Personal access token (Supabase Dashboard → Account → Access Tokens)

#### 3. Manual Migration

```bash
# Production'a manual push
SUPABASE_ACCESS_TOKEN=<token> supabase db push --project-ref <ref>
```

### Rollback Stratejisi

```bash
# Migration geçmişini gör
supabase migration list

# Belirli bir migration'a geri dön
supabase db reset --version <TIMESTAMP>

# Production'da geri alma (DİKKATLİ!)
# 1. Önce yeni migration oluştur (eski haline döndürecek SQL)
supabase migration new rollback_feature_name

# 2. Rollback SQL'i yaz
# 3. Push et
supabase db push
```

---

## Row Level Security (RLS)

Tüm tablolarda RLS aktif. Kullanıcılar sadece kendi verilerine erişebilir.

### Temel RLS Patterns

#### 1. Kullanıcı Sadece Kendi Verisini Görebilir
```sql
CREATE POLICY "Users can view own items" ON items
  FOR SELECT USING (auth.uid() = owner_id);
```

#### 2. Public İçerikler Herkes Görebilir
```sql
CREATE POLICY "Public items viewable by all" ON items
  FOR SELECT USING (is_public = true);
```

#### 3. Kullanıcı Sadece Kendi Verisini Güncelleyebilir
```sql
CREATE POLICY "Users can update own items" ON items
  FOR UPDATE USING (auth.uid() = owner_id);
```

#### 4. Kullanıcı Yeni Veri Ekleyebilir (Kendine)
```sql
CREATE POLICY "Users can insert own items" ON items
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
```

### RLS Debugging

```sql
-- Hangi policy'ler aktif?
SELECT * FROM pg_policies WHERE tablename = 'items';

-- Kullanıcı olarak query test et
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-id-here';
SELECT * FROM items; -- Sadece kullanıcının verilerini görecek
```

---

## Database Backup & Restore

### Automatic Backups (Supabase)

Supabase otomatik olarak günlük backup alır:
- **Frequency**: Her gün 03:00 UTC
- **Retention**: 7 gün (Free tier), 30 gün (Pro)
- **Access**: Dashboard → Settings → Database → Backups

### Manual Backup

```bash
# Full database dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Sadece schema (data olmadan)
pg_dump $DATABASE_URL --schema-only > schema.sql

# Sadece data (schema olmadan)
pg_dump $DATABASE_URL --data-only > data.sql

# Specific table
pg_dump $DATABASE_URL --table=items > items_backup.sql
```

### Restore

```bash
# Full restore
psql $DATABASE_URL < backup_20260101.sql

# Specific table restore
psql $DATABASE_URL < items_backup.sql
```

---

## Performance Optimization

### İndeks Stratejisi

```sql
-- 1. Foreign key'lere indeks (JOIN performance)
CREATE INDEX idx_items_parent_id ON items(parent_id);
CREATE INDEX idx_items_owner_id ON items(owner_id);

-- 2. Sık filter edilen kolonlar
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_is_public ON items(is_public);

-- 3. JSONB kolonlar için GIN indeks
CREATE INDEX idx_items_metadata_gin ON items USING gin(metadata);

-- 4. Full-text search için
CREATE INDEX idx_items_title_trgm ON items USING gin(title gin_trgm_ops);
```

### Query Optimization Tips

```sql
-- ❌ BAD: N+1 query problem
SELECT * FROM items WHERE owner_id = 'user-123';
-- Her item için ayrı query: SELECT * FROM comments WHERE item_id = ?

-- ✅ GOOD: JOIN ile tek query
SELECT items.*, COUNT(comments.id) as comment_count
FROM items
LEFT JOIN comments ON comments.item_id = items.id
WHERE items.owner_id = 'user-123'
GROUP BY items.id;
```

### Connection Pooling

`src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';

export const createClient = (cookies: any) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies,
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false, // Server-side: session persist etme
      },
      global: {
        fetch: (...args) => fetch(...args), // Connection pooling
      },
    }
  );
};
```

---

## Troubleshooting

### Common Issues

#### 1. "relation does not exist"

**Problem**: Tablo bulunamadı

**Çözüm**:
```bash
# Migration'lar uygulanmış mı?
supabase migration list

# Uygulanmadıysa
supabase db push
```

#### 2. "new row violates row-level security policy"

**Problem**: RLS policy izin vermiyor

**Çözüm**:
```sql
-- Policy'leri kontrol et
SELECT * FROM pg_policies WHERE tablename = 'items';

-- Geçici olarak RLS'i kapat (sadece development!)
ALTER TABLE items DISABLE ROW LEVEL SECURITY;

-- Policy ekle/düzelt
CREATE POLICY "..." ON items ...;

-- RLS'i tekrar aç
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
```

#### 3. "column does not exist"

**Problem**: Migration eksik veya sıra yanlış

**Çözüm**:
```bash
# Local database'i sıfırla
supabase db reset

# Migration'ları kontrol et
ls -la supabase/migrations/

# Timestamp sırasını kontrol et (eskiden yeniye)
```

#### 4. "permission denied for schema public"

**Problem**: Role izni yok

**Çözüm**:
```sql
-- Authenticated role'e izin ver
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

#### 5. Slow Queries

**Problem**: Query çok yavaş

**Çözüm**:
```sql
-- Query plan'ı gör
EXPLAIN ANALYZE SELECT ...;

-- Eksik indeks ekle
CREATE INDEX ...;

-- Stats güncelle
ANALYZE items;
```

---

## Monitoring & Analytics

### Supabase Dashboard Metrics

Dashboard → Reports:
- **Database Health**: CPU, Memory, Disk usage
- **API Requests**: Request count, latency
- **Auth Metrics**: Sign-ups, logins
- **Storage**: File count, bandwidth

### Custom Logging

```sql
-- Slow query monitoring
CREATE TABLE query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT,
  execution_time_ms INTEGER,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Log slow queries (> 1000ms)
CREATE OR REPLACE FUNCTION log_slow_queries()
RETURNS event_trigger AS $$
BEGIN
  IF current_setting('log_min_duration_statement')::int > 1000 THEN
    INSERT INTO query_logs (query, execution_time_ms, user_id)
    VALUES (current_query(), ...);
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## Best Practices

### 1. Migration Workflow

```bash
# ✅ DO
1. Yeni migration oluştur: supabase migration new
2. SQL yaz ve test et: supabase db reset
3. Git commit: git add supabase/migrations/
4. Pull request oluştur
5. Review sonrası merge
6. Automatic deploy ile production'a push

# ❌ DON'T
- Production'da doğrudan SQL çalıştırma
- Migration dosyalarını sonradan düzenleme (timestamp'i değiştir)
- Breaking changes yapmadan önce backup almamak
```

### 2. Security Checklist

- [ ] Tüm tablolarda RLS aktif
- [ ] Service role key sadece server-side kullanılıyor
- [ ] Sensitive data şifreli (encryption.ts)
- [ ] Rate limiting aktif (rate-limiter.ts)
- [ ] SQL injection'dan korunma (Parametrized queries)
- [ ] GDPR compliance (gdpr.ts)

### 3. Performance Checklist

- [ ] Tüm foreign key'lerde indeks var
- [ ] Sık filtrelenen kolonlarda indeks var
- [ ] JSONB kolonlarda GIN indeks var
- [ ] N+1 query problemi yok (JOIN kullan)
- [ ] Connection pooling aktif
- [ ] Realtime subscriptions optimize edilmiş

---

## Destek & Kaynaklar

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Migration Guide**: https://supabase.com/docs/guides/cli/managing-environments
- **Discord Community**: https://discord.supabase.com/

---

**Son Güncelleme**: 2026-01-01  
**Versiyon**: 1.0.0
