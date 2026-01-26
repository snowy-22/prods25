# Canvas Database Deployment Guide

## 🎯 Özet

Canvas veritabanı şimdi enterprise-grade güvenlik ile hazır:
- ✅ Rate limiting sistemi
- ✅ Audit logging 
- ✅ Birleşik canvas_items tablosu (canvas_id dahil)
- ✅ RLS politikaları
- ✅ Cross-device sync
- ✅ Real-time presence
- ✅ Storage quota yönetimi
- ✅ XSS koruması

## 📋 Yapılan Değişiklikler

### 1. TypeScript Sync Kodu Güncellendi
`src/lib/supabase-sync.ts`:
- `canvas_id` alanı eklendi (varsayılan: 'default')
- `item_data` alanı eklendi (tam item JSON)

### 2. Yeni Migration Dosyası
`supabase/migrations/20260126_secure_canvas_database.sql`:
- 735 satır kapsamlı migration
- Tüm güvenlik özellikleri dahil

### 3. Eski Migration'lar Güncellendi
- `20250129_social_feed_canvas_sync.sql` - canvas_items kaldırıldı
- `20260107000001_live_data_sync_comprehensive.sql` - canvas_items kaldırıldı

## 🚀 Deployment Adımları

### Seçenek 1: Supabase Dashboard (Önerilen)

1. **Supabase Dashboard'a git**: https://supabase.com/dashboard
2. **Projenizi seçin**
3. **SQL Editor** bölümüne gidin
4. Aşağıdaki migration dosyasının içeriğini yapıştırın:
   - `supabase/migrations/20260126_secure_canvas_database.sql`
5. **Run** butonuna tıklayın

### Seçenek 2: Supabase CLI

```bash
# Supabase CLI yüklü değilse
npm install -g supabase

# Login
npx supabase login

# Link your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push
```

### Seçenek 3: Direct SQL Upload Script

```javascript
// Node.js ile
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const migration = fs.readFileSync('./supabase/migrations/20260126_secure_canvas_database.sql', 'utf8');

// SQL sections'ı tek tek çalıştırın
```

## 🔧 Migration İçeriği

```sql
-- Tablolar:
1. rate_limit_log       - Rate limiting kayıtları
2. audit_log            - Tüm değişikliklerin audit kaydı
3. canvas_items         - Birleşik canvas item tablosu
4. canvas_folders       - Klasör yapısı
5. canvas_sync_status   - Cihazlar arası sync durumu
6. canvas_presence      - Real-time presence
7. user_storage_quota   - Kullanıcı depolama kotası

-- Güvenlik Fonksiyonları:
- check_rate_limit()    - Rate limit kontrolü
- log_canvas_changes()  - Audit trigger
- validate_content()    - XSS koruması
- update_storage_quota()- Kota takibi
```

## 🧪 Test Etme

Migration uygulandıktan sonra test edin:

```sql
-- Tabloların var olduğunu kontrol et
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('canvas_items', 'canvas_folders', 'rate_limit_log', 'audit_log');

-- canvas_id column'ın var olduğunu kontrol et
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'canvas_items' AND column_name = 'canvas_id';

-- RLS politikalarını kontrol et
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'canvas_items';
```

## ⚠️ Önemli Notlar

1. **Backup Alın**: Migration'dan önce mevcut veritabanınızı yedekleyin
2. **Sıralı Çalıştırın**: Migration bölümlerini sırayla çalıştırın
3. **Error Handling**: `IF NOT EXISTS` kullanıldığından güvenli

## 🔒 Güvenlik Özellikleri

### Rate Limiting
- Dakikada maksimum 100 işlem (özelleştirilebilir)
- IP bazlı + User bazlı tracking

### Audit Logging
- Tüm INSERT, UPDATE, DELETE otomatik loglanır
- old_data ve new_data JSONB olarak saklanır

### RLS Politikaları
- Her kullanıcı sadece kendi verisini görebilir
- Service role tüm veriye erişebilir
- Anon kullanıcılar sadece public itemları okuyabilir

### Data Validation
- XSS pattern kontrolü
- URL validation
- Size limits

## 📊 Performans İndeksleri

```sql
-- Hızlı sorgular için indexler:
- idx_canvas_items_user_canvas   (user_id, canvas_id)
- idx_canvas_items_parent        (parent_id)
- idx_canvas_items_type          (type)
- idx_canvas_items_position      (x, y)
- idx_canvas_items_metadata      GIN index
- idx_canvas_items_search        Full-text search
```

## ✅ Checklist

- [ ] Migration SQL'ini Supabase'e yükle
- [ ] Tabloların oluştuğunu kontrol et
- [ ] canvas_id column'ı kontrol et
- [ ] RLS politikalarını kontrol et
- [ ] Uygulamayı test et
- [ ] Sync'in çalıştığını doğrula

---

Son Güncelleme: 2025-01-26
