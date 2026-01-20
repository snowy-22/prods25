# 🧪 OAuth PKCE Test Senaryosu - Lokal Ortam

## ✅ Ön Hazırlık Tamamlandı
- ✅ SQL migration çalıştırıldı (user_storage_quotas + RLS policies)
- ✅ Dev server başlatıldı: http://localhost:3000
- ✅ Cookie-based PKCE storage aktif

---

## 📋 Test Senaryosu 1: Normal Email ile OAuth

### Adım 1: Temiz Başlangıç
```powershell
# Browser'ı tamamen kapat ve yeniden aç (tüm cookie'leri temizlemek için)
# Veya Incognito/Private mode kullan
```

### Adım 2: Login Sayfasına Git
1. Tarayıcıda aç: **http://localhost:3000/auth**
2. DevTools Console'u aç (F12 → Console sekmesi)
3. Console'u temizle (Clear console)

### Adım 3: Google OAuth ile Giriş
1. **"Google ile Giriş Yap"** butonuna tıkla
2. **Console'da şu loglara dikkat et:**
   ```
   ✅ OLMASI GEREKENLER:
   - "🔐 OAuth code detected: xxxxxx..."
   - "Auth state changed: SIGNED_IN email@gmail.com"
   - "✓ Loaded tabs from cloud: X"
   - "Cloud storage initialized"
   - "Realtime subscription status: SUBSCRIBED"
   
   ❌ OLMAMASI GEREKENLER:
   - "PKCE code verifier not found in storage"
   - "406 (Not Acceptable)"
   - "401 (Unauthorized)"
   - "new row violates row-level security"
   ```

### Adım 4: Auth Callback'i İzle
1. Google authorization ekranında **izin ver**
2. Redirect olurken URL'e dikkat et:
   - ✅ Başarılı: `/auth/callback?code=...` → sonra ana sayfa
   - ❌ Hata: `/auth?error=pkce_missing` → cookie cleanup tetiklenir

### Adım 5: Login Sonrası Kontrol
1. **Ana sayfaya yönlendirildiniz mi?** (http://localhost:3000)
2. **Sağ üst köşede email adresiniz görünüyor mu?**
3. **Console'da hata var mı?**

---

## 📋 Test Senaryosu 2: Developer Test (Otomatik)

### Console'da Çalıştırılacak Komutlar

#### Test 1: Cookie Storage Kontrolü
```javascript
// Application tab → Storage → Cookies → localhost:3000
// Şu cookie'ler OLMALI:
// - sb-auth-token (değer: code_verifier değeri içermeli)
// - sb-access-token
// - sb-refresh-token

// Console'da kontrol:
document.cookie.split(';').filter(c => c.includes('sb-'))
// Çıktı: 3 adet sb- cookie olmalı
```

#### Test 2: Supabase Session Kontrolü
```javascript
// Console'da çalıştır:
const { createClient } = await import('./src/lib/supabase/client');
const supabase = createClient();
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session?.user?.email);
// Beklenen: Email adresi görünmeli
```

#### Test 3: Storage Quota Kontrolü
```javascript
const { createClient } = await import('./src/lib/supabase/client');
const supabase = createClient();
const { data } = await supabase.from('user_storage_quotas').select('*');
console.log('Storage Quota:', data);
// Beklenen: quota_bytes: 1073741824 (1GB), used_bytes: 0
```

#### Test 4: Realtime Connection
```javascript
// Console'da "Realtime subscription status" logunu ara
// Beklenen: "SUBSCRIBED" (CLOSED değil)
```

---

## 🐛 Hata Durumları ve Çözümleri

### Hata 1: PKCE Verifier Not Found
**Belirti:**
```
❌ PKCE code verifier not found in storage
⚠️ PKCE verifier expired or missing. Clearing cookies and redirecting...
```

**Çözüm:**
1. Browser'ı tamamen kapat ve yeniden aç
2. Incognito mode'da dene
3. `localStorage.clear()` ve `document.cookie = ''` ile tüm storage'ı temizle
4. Eğer devam ederse: **PKCE localStorage hybrid mode**'a geçeceğiz

### Hata 2: 406 Not Acceptable
**Belirti:**
```
GET /rest/v1/user_preferences?select=*&user_id=eq.XXX 406 (Not Acceptable)
```

**Çözüm:**
- Bu SQL migration ile düzelmeli
- Eğer devam ederse: Supabase → SQL Editor'da `SELECT * FROM user_preferences;` çalıştır
- Tablo yoksa migration tekrar çalıştır

### Hata 3: 401 Unauthorized (Storage Quotas)
**Belirti:**
```
POST /rest/v1/user_storage_quotas?select=* 401 (Unauthorized)
Could not create storage quota: new row violates row-level security
```

**Çözüm:**
- Bu SQL migration ile düzelmeli (Bölüm 6)
- Eğer devam ederse: Supabase → Database → user_storage_quotas → RLS Policies kontrol et

### Hata 4: Realtime CLOSED
**Belirti:**
```
Realtime subscription status: CLOSED
```

**Çözüm:**
1. Supabase Dashboard → Database → Replication
2. Şu tabloları "Enable" et:
   - user_preferences
   - canvas_data
   - user_storage_quotas

---

## 📊 Test Sonuçları Tablosu

| Test Adımı | Durum | Notlar |
|-----------|-------|--------|
| ✅ SQL Migration | ✅ Başarılı | user_storage_quotas eklendi |
| ⏳ Dev Server | 🟢 Çalışıyor | http://localhost:3000 |
| ⏳ OAuth Login | - | Test edilecek |
| ⏳ PKCE Verifier | - | Cookie storage test edilecek |
| ⏳ 406 Hatası | - | Düzelmeli (migration sonrası) |
| ⏳ 401 Hatası | - | Düzelmeli (RLS policy eklendi) |
| ⏳ Realtime | - | SUBSCRIBED olmalı |

---

## 🚀 Test Sonrası Adımlar

### Başarılı Test:
1. ✅ Tüm loglar yeşil
2. ✅ PKCE verifier cookie'de saklanıyor
3. ✅ 406/401 hataları yok
4. ✅ Realtime SUBSCRIBED

**Sonraki adım:** Production deploy (Vercel'e push zaten yapıldı)

### Başarısız Test (PKCE Devam Ediyor):
1. ❌ PKCE verifier cookie'de kayboluyor
2. ❌ Exchange error tekrarlanıyor

**Sonraki adım:** PKCE Hybrid Mode (localStorage + cookie fallback)

---

## 🎯 Kritik Kontrol Noktaları

1. **OAuth Redirect URL:** Supabase → Auth → URL Configuration
   - Allowed redirect URLs: `http://localhost:3000/auth/callback`
   
2. **Cookie Names:** (Application tab → Cookies)
   - `sb-auth-token` - PKCE verifier içermeli
   - `sb-access-token` - JWT token
   - `sb-refresh-token` - Refresh token

3. **RLS Policies:** (Supabase SQL Editor)
   ```sql
   SELECT tablename, policyname FROM pg_policies 
   WHERE tablename IN ('user_storage_quotas', 'user_preferences', 'canvas_data');
   ```
   Her tablo için en az 1 policy olmalı

4. **Realtime Replication:** (Supabase Dashboard)
   - Database → Replication → Publication: supabase_realtime
   - Tables: user_preferences, canvas_data, user_storage_quotas ✅ enabled

---

**TEST BAŞLATMAK İÇİN:**
```
1. Browser'da: http://localhost:3000/auth
2. DevTools Console aç
3. "Google ile Giriş Yap" tıkla
4. Bu dokümandaki kontrol listesini takip et
```

**Test sonuçlarını buraya yazın!** 📝
