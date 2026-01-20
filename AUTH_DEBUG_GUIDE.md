# OAuth Bağlantı Hatası - Debug Kılavuzu

## 🔴 Hata Mesajı
```
Bağlantı Hatası - OAuth bağlantısı kurulamadı
```

## ✅ Önceki Kontroller (Doğrulandı)
1. ✅ Redirect URL doğru (`https://tv25.app/auth/callback`)
2. ✅ Google OAuth credentials doğru (Client ID/Secret)
3. ❓ **CORS/Domain restrictions → BİLİNMİYOR**
4. ✅ PKCE flow doğru (`flowType: 'pkce'`)

---

## 🔍 Debug Adımları

### 1️⃣ Browser Konsolunda Hata Detaylarını Gör
```
F12 → Console → "Google ile Devam Et" tıkla
Konsoldaki kırmızı hata mesajını kopyala
```

### 2️⃣ Supabase Dashboard'da Google Provider'ı Kontrol Et

#### 2A: Google Provider Enabled Mi?
```
https://app.supabase.com/
 ↓
Projene git: canvasflow
 ↓
Authentication (Sol menu)
 ↓
Providers
 ↓
Google → Enabled toggle (yeşil mi?)
```

**Eğer disabled ise:**
- Enable toggle'ını aç
- Client ID/Secret doğru mu kontrol et
- Save

#### 2B: Redirect URL Doğru Mu?
```
Google Provider sayfasında:
Redirect URL: https://tv25.app/auth/callback
```

**Eğer eksik ise:**
- Redirect URL input'unda `https://tv25.app/auth/callback` ekle
- Başka domain'ler (gerekirse):
  ```
  https://tv25.app/auth/callback
  https://localhost:3000/auth/callback
  http://localhost:3000/auth/callback
  ```

#### 2C: Site URL Doğru Mu?
```
Settings → General → Site URL
Kontrol: https://tv25.app
```

---

## 🧪 Ek Test: Google OAuth URL Düzgün Oluşmuş Mu?

### 3️⃣ Network Tab'ında OAuth Request'ini Gör
```
F12 → Network tab
"Google ile Devam Et" tıkla
 ↓
Filter: "auth"
 ↓
Request'i bul ve tıkla
 ↓
URL'i kontrol et:
  https://accounts.google.com/o/oauth2/v2/auth?...
     ↓ parametreleri kontrol:
  - client_id=xxx
  - redirect_uri=https%3A%2F%2Ftv25.app%2Fauth%2Fcallback
  - response_type=code
  - scope=...
```

---

## 🔴 Olası Sorunlar & Çözümler

### Problem 1: "Network Error"
**Sebep**: Supabase Auth API'sı ulaşılamıyor  
**Çözüm**:
- Firewall/VPN kapalı mı?
- Supabase Status: https://status.supabase.com

### Problem 2: "CORS Error"
**Sebep**: Google OAuth domain kısıtlanmış  
**Çözüm**:
```
Supabase → Authentication → Providers → Google
 ↓
Additional Authorized Redirect URLs:
+ https://tv25.app/auth/callback
```

### Problem 3: "Unauthorized" (401)
**Sebep**: Client ID/Secret yanlış veya expired  
**Çözüm**:
```
Google Cloud Console → Credentials
 ↓
OAuth 2.0 Client ID
 ↓
Client ID & Secret'ı Supabase'de güncelle
```

### Problem 4: "Invalid Request"
**Sebep**: Supabase Site URL ≠ Production URL  
**Çözüm**:
```
Supabase → Settings → General → Site URL
Değiştir: https://tv25.app
```

---

## 📝 Kontrol Listesi

- [ ] Google Provider: Enabled ✅
- [ ] Client ID: Doğru ✅
- [ ] Client Secret: Doğru ✅
- [ ] Redirect URL: `https://tv25.app/auth/callback` ✅
- [ ] Site URL: `https://tv25.app` ✅
- [ ] Code: Deployed ✅
- [ ] Browser: Cache temizle (Ctrl+Shift+Delete) ✅

---

## 🚀 Test Kodu

Eğer auth/page.tsx'te debug yapmak istersen:

```typescript
// src/app/auth/page.tsx - handleOAuthLogin içinde

const handleOAuthLogin = async (provider: 'google') => {
  try {
    console.log('🔐 OAuth başlıyor:', { provider });
    await signInWithOAuth(provider);
  } catch (error: any) {
    console.error('❌ OAuth hatası:', {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      fullError: error
    });
    toast({
      title: "OAuth Hatası",
      description: error.message || `${provider} girişi başarısız`,
      variant: "destructive"
    });
  }
};
```

---

## ✨ Başarılı Olursa
- ✅ Google login page açılacak
- ✅ Email onay sonrası
- ✅ https://tv25.app/auth/callback'e redirect
- ✅ Session oluşturulacak
- ✅ Dashboard'a gidecek

---

## 📞 Hala Sorun Varsa
1. Supabase logs'da auth error'ları kontrol et
2. Vercel deployment logs'a bak
3. Google Cloud Console'da OAuth settings'i verify et
