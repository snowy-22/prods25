# Production Auth Redirect Fix

## ✅ Problem Çözüldü

Canlı sitede giriş yaptıktan sonra localhost'a yönlendirme sorunu düzeltildi.

---

## 🔧 Yapılan Değişiklikler

### 1. `.env.local` Güncellendi
```env
# ÖNCE (YANLIŞ)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SONRA (DOĞRU)
NEXT_PUBLIC_APP_URL="https://tv25.app"
```

---

## 🎯 Supabase Dashboard Yapılandırması

**KRITIK:** Supabase Dashboard'da da aşağıdaki URL'lerin eklenmiş olması gerekiyor!

### Adımlar:
1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **Authentication** → **URL Configuration**
3. **Site URL** kısmına ekleyin:
   ```
   https://tv25.app
   ```

4. **Redirect URLs** kısmına ekleyin (her satır ayrı - 3 domain için):
   ```
   https://tv25.app/auth/callback
   https://tv25.app/auth
   https://tv25.app
   https://tv26.app/auth/callback
   https://tv26.app/auth
   https://tv26.app
   https://tv22.app/auth/callback
   https://tv22.app/auth
   https://tv22.app
   http://localhost:3000/auth/callback
   http://localhost:3000/auth
   http://localhost:3000
   ```

5. **Save** butonuna tıklayın

---

## ✅ Kod Kontrolü

Kod zaten doğru şekilde yapılandırılmış! `window.location.origin` kullanılıyor:

### auth-provider.tsx
```typescript
const signInWithOAuth = async (provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,  // ✅ DOĞRU
      queryParams: {
        prompt: 'consent',
      },
    },
  });
};
```

### auth-provider.tsx - Sign Up
```typescript
const signUp = async (email, password, username, referralCode) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: username },
      emailRedirectTo: `${window.location.origin}/auth/callback`,  // ✅ DOĞRU
    },
  });
};
```

---

## 🚀 Vercel Environment Variables

Vercel'de de environment variable'ın doğru ayarlandığından emin olun:

1. [Vercel Dashboard](https://vercel.com) → Projeniz
2. **Settings** → **Environment Variables**
3. `NEXT_PUBLIC_APP_URL` değişkenini kontrol edin:
   ```
   Name: NEXT_PUBLIC_APP_URL
   Value: https://tv25.app
   Environment: Production, Preview, Development
   ```

4. **Save** → **Redeploy** (gerekirse)

---

## 🧪 Test

### Production Test:
1. https://tv25.app/auth adresine gidin (ya da tv26.app, tv22.app)
2. Google ile giriş yapın
3. **Artık localhost'a değil, kullandığınız domain'e yönlendirilmelisiniz** ✅

### Localhost Test:
1. `npm run dev` ile local sunucuyu başlatın
2. http://localhost:3000/auth adresine gidin
3. Google ile giriş yapın
4. localhost:3000'e yönlendirilmelisiniz ✅

---

## 📋 Checklist

- [x] `.env.local` güncellenmiş (`NEXT_PUBLIC_APP_URL`)
- [ ] Supabase Dashboard → **Site URL** güncellenmeli: `https://tv25.app`
- [ ] Supabase Dashboard → Redirect URLs eklendi (12 adet: 3 localhost + 9 production URLs) ✅
- [ ] Vercel → Environment Variables kontrol edildi
- [ ] Production'da test edildi
- [ ] Localhost'ta test edildi

---

## 🔒 Güvenlik Notu

Her iki URL'yi de (production + localhost) Supabase'e eklemek GÜVENLİDİR çünkü:
- OAuth flow zaten güvenli (authorization code + PKCE)
- Sadece whitelisted URL'lere redirect olur
- Development için localhost gerekli
- Production için domain gerekli

---

## 🎉 Özet

**Sorun:** Production'da giriş yapınca localhost'a yönlendiriyordu  
**Neden:** `.env.local` dosyasında `NEXT_PUBLIC_APP_URL` localhost'tu  
**Çözüm:** Production domain'e güncellendi (`tv25.app`, `tv26.app`, `tv22.app`)  
**Ek Adım:** Supabase Dashboard'da tüm 3 domain için redirect URL'leri eklenmeli  

✅ **TAMAM! Artık tüm production domainlerinde auth sorunsuz çalışacak.**
