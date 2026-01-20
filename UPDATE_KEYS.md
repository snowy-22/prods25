# Supabase Key Update Guide

## 🔑 Yeni Anahtarlar

**Publishable Key (Client-side):**
```
[REDACTED - Use environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY]
```

**Secret Key (Server-side):**
```
[REDACTED - Use environment variable: SUPABASE_SECRET_KEY]
[⚠️ NEVER commit actual secret keys to git!]
```

---

## ✅ Tamamlanan Güncellemeler

- [x] Local `.env.local` dosyası güncellendi
- [x] Tüm kod dosyalarında `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY` migration tamamlandı
- [x] Git commit yapıldı (bd978b7)

---

## 📋 Manuel Güncelleme Gereken Yerler

### 1. Vercel Environment Variables

**Yöntem 1: Vercel Dashboard (Kolay)**
1. https://vercel.com/snowy-22/prods25/settings/environment-variables adresine git
2. Aşağıdaki 3 değişkeni güncelle:

   **NEXT_PUBLIC_SUPABASE_ANON_KEY:**
   ```
   [Get from .env.local - Publishable Key]
   ```

   **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:**
   ```
   [Get from .env.local - Publishable Key]
   ```

   **SUPABASE_SECRET_KEY** (yeni - eskiden SERVICE_ROLE_KEY):
   ```
   [Get from .env.local - SECRET KEY - Keep private!]
   ```

3. Eski `SUPABASE_SERVICE_ROLE_KEY` değişkenini SİL
4. Redeploy tetikle: `Deployments` → `Redeploy` (son deployment üzerine)

**Yöntem 2: Vercel CLI (Otomatik)**
```bash
# Vercel CLI kurulu değilse:
npm i -g vercel

# Login (gerekirse):
vercel login

# Environment variables güncelle:
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
vercel env rm SUPABASE_SERVICE_ROLE_KEY preview
vercel env rm SUPABASE_SERVICE_ROLE_KEY development

vercel env add SUPABASE_SECRET_KEY production
# [Use value from .env.local - Do NOT hardcode!]

vercel env add SUPABASE_SECRET_KEY preview
# [Use value from .env.local - Do NOT hardcode!]

vercel env add SUPABASE_SECRET_KEY development
# [Use value from .env.local - Do NOT hardcode!]

vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# [Use value from .env.local - Publishable Key]

vercel env rm NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
# [Use value from .env.local - Publishable Key]

# Redeploy:
vercel --prod
```

---

### 2. Supabase CLI Config

Supabase CLI config dosyanızı güncelleyin:

**Dosya:** `~/.supabase/access-token` veya `.supabase/config.toml`

```bash
# Supabase CLI login (gerekirse):
supabase login

# Project link güncelle:
supabase link --project-ref qukzepteomenikeelzno

# Migration push testi:
supabase db push
```

**NOT:** Supabase CLI genellikle publishable key ile çalışır, secret key'e ihtiyaç duymaz.

---

### 3. GitHub Secrets (GitHub Actions için)

Eğer GitHub Actions kullanıyorsanız:

1. https://github.com/snowy-22/prods25/settings/secrets/actions adresine git
2. `SUPABASE_SERVICE_ROLE_KEY` sil
3. Yeni secret ekle:
   - Name: `SUPABASE_SECRET_KEY`
   - Value: `[Get from .env.local - Do NOT hardcode in docs!]`

4. `NEXT_PUBLIC_SUPABASE_ANON_KEY` güncelle:
   - Value: `[Get from .env.local - Publishable Key]`

---

### 4. Resend & Gmail

**Resend:** ✅ Güncellemeye gerek YOK
- Resend sadece kendi API key'ini kullanır
- Supabase key değişikliği Resend'i etkilemez

**Gmail OAuth:** ✅ Güncellemeye gerek YOK
- Gmail OAuth credentials zaten `.env.local`'de mevcut
- `GOOGLE_CLIENT_SECRET` değişikliği gerekmiyor

---

## 🔐 Güvenlik Önlemleri

### Eski Anahtarların İptal Edildiğinden Emin Ol

1. **Supabase Dashboard:** https://supabase.com/dashboard/project/qukzepteomenikeelzno/settings/api
2. Eski publishable key (`sb_publishable_pOysGok_...`) iptal edildi mi kontrol et
3. Eski service role key artık geçersiz (yeni sistem client secret kullanıyor)

### GitHub Secret Scanning Alert

1. https://github.com/snowy-22/prods25/security/secret-scanning adresine git
2. Eski `SUPABASE_SERVICE_ROLE_KEY` alert'ini `Revoked` olarak işaretle
3. "The secret has been rotated" seçeneğini işaretle

---

## ✅ Test Checklist

Güncellemeler tamamlandıktan sonra:

```bash
# 1. Local test:
npm run dev
# Auth flow'u test et (login, logout)

# 2. Production test (Vercel'de):
# https://tv25.app adresini ziyaret et
# Login yapabildiğini doğrula

# 3. Database erişim test:
# Herhangi bir data read/write işlemi yap
```

---

## 📌 Önemli Notlar

1. **Anahtar Formatı Değişti:**
   - Eski: JWT token (eyJhbGc...)
   - Yeni: Client secret (sb_secret_...)

2. **Değişken İsimleri:**
   - `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` aynı kalıyor (değeri değişti)

3. **Backwards Compatibility:**
   - Tüm kod `SUPABASE_SECRET_KEY` kullanacak şekilde güncellendi
   - Eski `SERVICE_ROLE_KEY` artık kullanılmıyor

---

## 🚀 Quick Deploy Komutları

```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel otomatik deploy yapar, ya da:
vercel --prod

# 3. Test et:
curl https://tv25.app/api/health
```

---

## 📞 Yardım

Sorun yaşarsan:
1. `.env.local` dosyasını kontrol et (anahtarlar doğru mu?)
2. Vercel logs: https://vercel.com/snowy-22/prods25/logs
3. Supabase logs: https://supabase.com/dashboard/project/qukzepteomenikeelzno/logs/explorer
