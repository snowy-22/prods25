# ✅ Supabase OAuth Configuration Checklist

## 🔴 KRITIK: Supabase Dashboard'da Manuel Kontrol Gerekli

Auth hatası düzeltmek için aşağıdaki adımları gerçekleştirin:

### 1️⃣ Google OAuth Configuration (Supabase Dashboard)
**URL**: https://app.supabase.com/project/qukzepteomenikeelzno/auth/providers

1. **Google Provider**'ı açın
2. **Authorized redirect URIs** bölümüne şu URL'leri ekleyin:
   ```
   http://localhost:3000/auth/callback
   https://www.tv25.org/auth/callback
   https://qukzepteomenikeelzno.supabase.co/auth/v1/callback
   ```
3. **Save** butonuna tıklayın
4. **Provider** enabled olduğundan emin olun ✓

### 2️⃣ Client ID Verification
- ✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID: Check `.env.local` file
- ✅ GOOGLE_CLIENT_SECRET: Check `.env.local` file
- ✅ Bu değerler Supabase Google Provider'ında da görünmelidir

### 3️⃣ Supabase URL & Key Verification
- ✅ NEXT_PUBLIC_SUPABASE_URL: Check `.env.local` file
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Check `.env.local` file

Değerler `https://app.supabase.com/project/[YOUR_PROJECT_ID]/settings/api` sayfasında görülebilir.

### 4️⃣ RLS Policy Check
**Supabase Dashboard** → **Authentication** → **Policies** sayfasında:

1. `auth.users` tablosuna erişim olduğundan emin olun
2. `public` schema'da `profiles` tablosunun INSERT/UPDATE izni olduğundan emin olun

```sql
-- Profiles table policy örneği
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

### 5️⃣ Test OAuth Flow
**Browser'da aşağıdaki adımları izleyin:**

1. `http://localhost:3000/auth` adresine gidin
2. **Google** butonu ile giriş yapın
3. Google login sayfası açılmalı
4. Credentials girin
5. Redirect: `http://localhost:3000/auth/callback` olmalı
6. Başarılı: `http://localhost:3000/canvas` e yönlendirilmelisiniz

**Başarısız olursa:**
- Browser Console'u açın (F12)
- **Console** sekmesinde hataları okuyun
- **Network** sekmesinde `/auth/callback` isteğini kontrol edin
- `/auth/callback` response'unda hata mesajı varsa SSS'de bul

### 6️⃣ SSS - Common Auth Errors

| Error | Sebebi | Çözüm |
|-------|--------|-------|
| `invalid_request` | Redirect URI eşleşmiyor | Supabase Google Provider'da /auth/callback URL'sini kontrol et |
| `PKCE code verifier not found` | Cookie'ler temizleniyor | Browser cache temizle, incognito mod kullan |
| `session_expired` | Session timeout | Şifre sıfırla ve tekrar giriş yap |
| OAuth popup kapatıldı | User popup'ı kapadı | Tekrar try yap |

---

## ✅ Local Env Configuration (TAMAMLANDI)
- [x] NEXT_PUBLIC_APP_URL = `http://localhost:3000`
- [x] Google OAuth env variables set
- [x] Supabase URL & keys set
- [x] Server çalışıyor: `http://localhost:3000`

## 🚀 Next Steps
1. Supabase Dashboard Google Provider'ı yukarıdaki adımları izle ayarla
2. Browser'da giriş test et
3. Başarısız ise console errors SS'si paylaş
