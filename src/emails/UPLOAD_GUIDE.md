# Supabase Email Templates - Manuel Yükleme Rehberi

## ✅ Otomatik Yükleme

### Adım 1: Script'i Çalıştır

```bash
# Belirli bir template yükle
npm run upload:email:welcome

# Tüm template'leri yükle
npm run upload:email:all

# Veya doğrudan Node'la
node scripts/upload-email-templates.mjs welcome
node scripts/upload-email-templates.mjs all
```

### Gerekli Environment Variables

`.env.local` dosyasında olması gerekli:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qukzepteomenikeelzno.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service role key
# veya
SUPABASE_ADMIN_KEY=eyJhbGc...
```

---

## 📝 Manuel Yükleme (Supabase Dashboard)

API yöntemi sorun çıkarsa, bu yöntemi kullan:

### Adım 1: Supabase Dashboard'a Git
1. https://app.supabase.com adresine git
2. Projenize giriş yap (qukzepteomenikeelzno)
3. Sol menüden **Authentication** → **Email Templates** seç

### Adım 2: Template'leri Yükle

#### 1️⃣ **Welcome Email** (Onboarding)
```
Dosya: src/emails/templates/1-welcome.html
Adı: Confirmation (veya Custom: "Welcome")
Konu: Hoş Geldiniz! 🎉
HTML: [Dosyadaki tüm HTML'i kopyala-yapıştır]
```

#### 2️⃣ **Password Reset**
```
Dosya: src/emails/templates/2-password-reset.html
Adı: Recovery
Konu: Şifre Sıfırlama Talebiniz
HTML: [Dosyadaki tüm HTML'i kopyala-yapıştır]
```

#### 3️⃣ **Email Confirmation**
```
Dosya: src/emails/templates/3-email-confirmation.html
Adı: Confirmation
Konu: Email Adresini Doğrula
HTML: [Dosyadaki tüm HTML'i kopyala-yapıştır]
```

#### 4️⃣ **Magic Link**
```
Dosya: src/emails/templates/5-magic-link.html
Adı: Magic Link
Konu: Giriş Linkini Tıkla
HTML: [Dosyadaki tüm HTML'i kopyala-yapıştır]
```

### Adım 3: HTML'i Doğru Kopyala

Her template dosyasında:
1. Tüm dosyayı aç: `src/emails/templates/X-template.html`
2. **Ctrl+A** ile tamamını seç
3. **Ctrl+C** ile kopyala
4. Supabase Email Template editor'unda **HTML** sekmesine yapıştır
5. **Save**'e tıkla

---

## 🔍 Dinamik Değişkenleri Ayarla

Supabase otomatik olarak bu değişkenleri değiştirir:

```html
<!-- Supabase tarafından otomatik -->
{{ .ConfirmationURL }}    →  Email doğrulama linki
{{ .Token }}              →  Token
{{ .Email }}              →  Kullanıcı email'i
{{ .SiteURL }}            →  https://tv25.app

<!-- Özel değişkenler (custom) -->
{{ .OTPCode }}            →  2FA kodu
{{ .IPAddress }}          →  IP adresi
{{ .DeviceType }}         →  Cihaz tipi
{{ .Timestamp }}          →  Tarih/Saat
```

**⚠️ Not:** Supabase'in desteklediği standart değişkenler sınırlı olabilir. Özel değişkenler için backend'de manuel değiştirme yapman gerekebilir.

---

## 🧪 Test Et

### Supabase Dashboard'da Test
1. Email Templates → Seçili template
2. **Test** butonuna tıkla
3. Test email gönderilir

### Kendi Email Adresine Gönder
```bash
# Signup yaparak test et
npm run dev
# http://localhost:3000/auth/signup
# Email adresini gir
# Template'i alacaksın
```

---

## 📊 Template Checklist

```
Welcome Email
☐ Dosya: 1-welcome.html
☐ Tür: Confirmation
☐ Konu: Hoş Geldiniz! 🎉
☐ HTML yüklendi
☐ Test email alındı ✅

Password Reset
☐ Dosya: 2-password-reset.html
☐ Tür: Recovery
☐ Konu: Şifre Sıfırlama
☐ HTML yüklendi
☐ Test email alındı ✅

Email Confirmation
☐ Dosya: 3-email-confirmation.html
☐ Tür: Confirmation
☐ Konu: Email Doğrula
☐ HTML yüklendi
☐ Test email alındı ✅

Magic Link
☐ Dosya: 5-magic-link.html
☐ Tür: Magic Link
☐ Konu: Şifresiz Giriş
☐ HTML yüklendi
☐ Test email alındı ✅

Two-Factor Auth
☐ Dosya: 4-two-factor-auth.html
☐ Tür: Custom
☐ Konu: 2FA Kodu
☐ HTML yüklendi
☐ Test email alındı ✅

Account Suspended
☐ Dosya: 6-account-suspended.html
☐ Tür: Custom
☐ Konu: Hesap Askıya Alındı
☐ HTML yüklendi
☐ Test email alındı ✅
```

---

## 🚀 Supabase URL'si

```
https://app.supabase.com/project/qukzepteomenikeelzno/auth/templates
```

---

## 💡 İpuçları

1. **Template Dosyaları Değiştirildiyse:** Script'i yeniden çalıştır
2. **Supabase API Hatası:** Manuel yükleme yöntemini kullan
3. **Email Alınamıyorsa:** SMTP ayarlarını kontrol et
4. **HTML Sorunları:** Browser dev tools'da test et (F12)

---

## 📞 Destek

Sorun yaşarsan:
1. [Supabase Email Docs](https://supabase.com/docs/guides/auth/auth-email)
2. Email: support@tv25.app
3. GitHub Issues: Soru sor

---

**Status:** ✅ Ready to Deploy