# Bulut Depolama Sistemi Dağıtım Kontrol Listesi

## ✅ Tamamlanan İşler (Kod Hazır)

- [x] Supabase migration dosyası oluşturdu: `supabase/migrations/storage_management.sql`
- [x] Cloud storage manager modülü: `src/lib/cloud-storage-manager.ts`
- [x] Zustand store entegrasyonu: `src/lib/store.ts` (state + actions)
- [x] Storage settings UI: `src/components/storage-settings.tsx`
- [x] Settings dialog entegrasyonu: `src/components/settings-dialog.tsx`
- [x] Cloud storage hook: `src/lib/use-cloud-storage.ts`
- [x] Cloud storage initializer: `src/components/cloud-storage-initializer.tsx`
- [x] Cloud sync provider entegrasyonu: `src/components/cloud-sync-provider.tsx`
- [x] Supabase sync re-export: `src/lib/supabase-sync.ts`
- [x] Türkçe dokümantasyon: `docs/CLOUD_STORAGE_SYSTEM_TR.md`

## 📋 Dağıtım Adımları (Sırasıyla)

### Aşama 1: Veritabanı Migrationı (5-10 dakika)

**Seçenek A: Supabase CLI kullanarak (Önerilen)**
```bash
# Terminal'de çalışma dizinine git
cd c:\Users\doruk\canvasflowapp

# Supabase CLI yüklü mü kontrol et
supabase --version

# Migration'ı çalıştır
supabase db push

# Veya manuel olarak:
supabase migration up
```

**Seçenek B: Supabase Dashboard üzerinden (Manuel)**
1. https://app.supabase.com login
2. Proje seç
3. "SQL Editor" tıkla
4. "New Query" tıkla
5. `supabase/migrations/storage_management.sql` dosyasını aç
6. İçeriği kopyala → SQL Editor'e yapıştır
7. "Run" tıkla
8. Başarı mesajını doğrula

**Başarı Kontrolleri:**
```sql
-- SQL Editor'de şu sorguları çalıştır:

-- 1. Tabloların oluştuğunu kontrol et
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%storage%';
-- Dönen: user_storage_quotas, folder_items_cloud, storage_distribution, 
--        storage_transactions, storage_sync_status

-- 2. RLS politikalarını kontrol et
SELECT policyname FROM pg_policies 
WHERE tablename = 'user_storage_quotas';
-- Dönen: en az 3 policy (SELECT, INSERT, UPDATE)

-- 3. Index'leri kontrol et
SELECT indexname FROM pg_indexes 
WHERE tablename = 'folder_items_cloud';
-- Dönen: birkaç index
```

---

### Aşama 2: TypeScript Compilation Kontrolü (5 dakika)

```bash
# Terminal'de
cd c:\Users\doruk\canvasflowapp

# Type checking
npm run typecheck

# Hata varsa:
# ❌ Error: cloud-storage-manager.ts line X
# → read_file ile satırı kontrol et
# → require/import'ları doğrula
# → Supabase client import'unun doğru olduğunu kontrol et
```

**Olası Hatalar ve Çözümler:**

| Hata | Çözüm |
|------|-------|
| `Cannot find module 'cloud-storage-manager'` | Import path'i kontrol et: `@/lib/cloud-storage-manager` |
| `Type 'UserStorageQuota' not found` | Interface tanımını kontrol et |
| `createClient is not exported` | `supabase/client.ts` kontrol et |
| `Missing type for FolderItemCloud` | `store.ts` tanımını kontrol et |

---

### Aşama 3: Uygulamayı Başlat (2 dakika)

```bash
# Dev sunucusu başlat
npm run dev

# Çıkış: "✓ Ready in 1234ms"
# URL: http://localhost:3000
```

**Browser Console Kontrolleri:**

Tarayıcı DevTools açarak (F12):
```javascript
// Console'a yazıp Enter'a bas:

// 1. Store'u kontrol et
useAppStore.getState().user
// Dönen: { id: "...", email: "..." } veya null

// 2. Storage state'ini kontrol et
useAppStore.getState().cloudStorageQuota
// Dönen: undefined (ilk kez) veya { quota_bytes: 1073741824, ... }

// 3. Action'ları kontrol et
typeof useAppStore.getState().initializeCloudStorage
// Dönen: "function"
```

---

### Aşama 4: Giriş Yapın (1 dakika)

1. Ana sayfa → Login butonu
2. Email + Password ile giriş yap
3. Dashboard'a yönlendirilmelisin
4. Ekranın sol altında "(Loading)" mesajı görmelisin → "Depolama bilgileri yükleniyor..."

**Beklenen Davranış:**
- CloudStorageInitializer otomatik çalışır
- useCloudStorage hook başlatılır
- initializeCloudStorage() action'ı tetiklenir
- Supabase: user_storage_quotas'a 1 GB quota satırı eklenir

---

### Aşama 5: Depolama Ayarlarını Kontrol Et (3 dakika)

1. Sağ üstte ⚙️ (Ayarlar) tıkla
2. "Depolama" sekmesini bul (Veritabanı ikonu)
3. Tıkla

**Beklenen UI Elemanları:**

✅ Başlık: "Depolama"
✅ Ana Gösterge: "% 0.0 kullanıldı" (0 ise normal, henüz dosya yok)
✅ Üç Kart:
  - Toplam: "1.0 GB"
  - Kullanılan: "0 B"
  - Kullanılabilir: "1.0 GB"

✅ Kategori Dağılımı:
  - Videos: 📹 0 B
  - Images: 🖼️ 0 B
  - Widgets: 🎨 0 B
  - Files: 📄 0 B
  - Other: 📦 0 B

✅ Cihaz Senkronizasyon Durumu:
  - Başlık: "Cihaz Senkronizasyon Durumu"
  - Boş tablo (henüz senkronizasyon yok)

✅ Butonlar:
  - "Depolama Analitiklerini Yenile" (mavi)
  - "Tüm Cihazlarda Senkronize Et" (yeşil)

✅ Bilgi Kutusu:
  - "Her kullanıcı 1 GB depolama alanı alır."

**Hata Kontrolü:**

| Semptom | Kontrol |
|---------|--------|
| "Depolama Analitikleri Yükleniyor..." message kalıyor | DevTools → Network → API çağrılarını kontrol et |
| Kırmızı hata mesajı görünüyor | Error message'in tam metnini oku ve not et |
| "Depolama" sekmesi görünmüyor | Ayarlar dialog'unu kapat-aç, refresh yap |
| UI kapalı | Console'da hatalar var mı kontrol et |

---

### Aşama 6: Dosya Yükleme Testi (5 dakika)

1. Ana sayfaya dön (Depolama sekmesini kapat)
2. Bir klasör açıp bir dosya ekle (örn: Video)
3. Depolama sekmesine geri dön

**Beklenen Sonuçlar:**
- Kullanım %'si güncellenmiş görünecek
- Kategori dağılımında Videos artacak
- Senkronizasyon Durumu'nda cihaz eklenecek

---

### Aşama 7: Cihazlar Arası Senkronizasyon (2 dakika)

1. Depolama sekmesinde "Tüm Cihazlarda Senkronize Et" butonu tıkla
2. İşlem tamamlanmasını bekle (progress gösterecek)
3. Başarı mesajı doğrula: "Başarıyla senkronize edildi!"

**Beklenen Sonuçlar:**
- "Senkronizasyon Durumu" tablosu güncellenecek
- `items_synced` ve `bytes_synced` gösterilecek
- `last_sync_at` zaman damgası güncellenecek

---

## 🔍 Veritabanı Doğrulama Sorguları

**Tüm tabloları liste:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%storage%';
```

**User storage quotasını kontrol:**
```sql
SELECT * FROM user_storage_quotas LIMIT 5;
```

**Klasör öğelerini kontrol:**
```sql
SELECT 
  folder_id, 
  item_type, 
  COUNT(*) as item_count,
  SUM(size_bytes) as total_bytes
FROM folder_items_cloud
GROUP BY folder_id, item_type;
```

**Senkronizasyon durumunu kontrol:**
```sql
SELECT * FROM storage_sync_status 
ORDER BY last_sync_at DESC 
LIMIT 10;
```

**İşlem günlüğünü kontrol:**
```sql
SELECT 
  transaction_type, 
  COUNT(*) as count,
  SUM(size_bytes) as total_bytes
FROM storage_transactions
GROUP BY transaction_type;
```

---

## 🚨 Hata Giderme

### Problem: "Depolama" sekmesi görünmüyor
**Çözüm:**
1. Browser cache temizle (Ctrl+Shift+Delete)
2. Sayfayı refresh et (Ctrl+R)
3. Yeniden giriş yap

### Problem: "Hata: Depolama analitikleri yüklenemedi"
**Çözüm:**
1. Supabase'de user_storage_quotas tablosuna bakın
2. Sorgu: `SELECT COUNT(*) FROM user_storage_quotas;`
3. Eğer 0 dönüyorsa, initializeCloudStorage() hata verdi
4. Logs'a bakın (Supabase → Database → Logs)

### Problem: 1 GB'den fazla dosya eklenemiyor
**Çözüm:**
1. Supabase RLS politikaları doğru mu kontrol et
2. Sorgu: `SELECT COUNT(*) FROM pg_policies WHERE tablename='user_storage_quotas';`
3. Dönen 3+ olmalı
4. Eğer az ise, migration'ı yeniden çalıştır

### Problem: Senkronizasyon başlamıyor
**Çözüm:**
1. DevTools → Network → Pending request'leri kontrol et
2. Supabase endpoint'leri çalışıyor mu kontrol et
3. API key'ler `.env.local` dosyasında doğru mu?
4. storage_sync_status tablosunda hiç satır var mı? (Olmayabilir, normal)

---

## ✅ Tamamlama Kontrol Listesi

- [ ] Migration başarıyla çalıştırıldı (5 tablo oluştu)
- [ ] TypeScript compilation hatasız (`npm run typecheck`)
- [ ] Dev sunucusu başlatılabilir (`npm run dev`)
- [ ] Giriş yapabiliyorum
- [ ] "Depolama" sekmesi görünüyor (Ayarlar)
- [ ] Ana gösterge doğru görünüyor (% 0.0 veya gerçek %)
- [ ] Kategori dağılımı listelenmiş
- [ ] Senkronizasyon durumu görünüyor
- [ ] Butonlar tıklanabilir
- [ ] Dosya ekleme/silme depolama'yı güncelliyor

---

## 📞 Destek

Sorun yaşıyorsan:

1. **DevTools Console**: F12 → Console → Hataları oku
2. **Network Tab**: F12 → Network → API çağrılarını kontrol et
3. **Supabase Logs**: app.supabase.com → Logs → SQL/API hatalarını ara
4. **GitHub Issues**: Hataları raporla
5. **Dokümantasyon**: `docs/CLOUD_STORAGE_SYSTEM_TR.md` oku

---

## 🎉 Başarılı Dağıtım

Tamamlanılırsa, şunlara erişim sahibi olursun:

✨ **Bulut Senkronizasyon**: Dosyalar otomatik cihazlar arasında senkronize edilir
📊 **Depolama Yönetimi**: 1 GB'lık korunun kullanımını izle
🔄 **Cihazlar Arası Sync**: Manuel veya otomatik senkronizasyon
📈 **Analitikler**: Kategori başına depolama dağılımı görüntüle
🛡️ **Güvenlik**: RLS politikaları verilerinizi korur

---

**Son Güncelleme**: 2024
**Sürüm**: 1.0
