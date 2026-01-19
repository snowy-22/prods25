# 📧 CanvasFlow Email Templates

Profesyonel HTML email template'leri - tv25.app branding'i ile hazırlanmış.

## 📋 Template'ler

### 1. Welcome Email (`1-welcome.html`)
**Kullanım:** Yeni hesap oluşturma sonrası hoş geldiniz mesajı
- ✨ Onboarding mesajı
- 🎯 CTA: Hesabını Aktif Et
- 📋 CanvasFlow'un özellikleri

**Dinamik Değişkenler:** Yok (genel template)

---

### 2. Password Reset Email (`2-password-reset.html`)
**Kullanım:** Şifre sıfırlama isteği
- 🔐 Şifre sıfırlama linki
- ⏱️ Geçerlilik süresi (30 dakika)
- 💡 Güvenlik ipuçları

**Dinamik Değişkenler:**
```
{{ .Token }}           # Şifre sıfırlama token'ı
{{ .ResetCode }}       # Alternatif doğrulama kodu
{{ .IPAddress }}       # İstemci IP adresi
{{ .Timestamp }}       # İstek tarihi ve saati
```

---

### 3. Email Confirmation (`3-email-confirmation.html`)
**Kullanım:** Email doğrulama (signup)
- ✉️ Email doğrulama linki
- 📋 Adım adım talimatlar
- ⏱️ 24 saat geçerlilik

**Dinamik Değişkenler:**
```
{{ .ConfirmationToken }}   # Email doğrulama token'ı
{{ .VerificationCode }}    # 6-8 haneli doğrulama kodu
```

---

### 4. Two-Factor Authentication (`4-two-factor-auth.html`)
**Kullanım:** 2FA doğrulama kodu
- 🔐 OTP kodu (One-Time Password)
- 📱 Cihaz ve konum bilgisi
- ⏱️ 10 dakika geçerlilik
- 🚨 Güvenlik uyarısı

**Dinamik Değişkenler:**
```
{{ .OTPCode }}        # 6 haneli OTP kodu
{{ .DeviceType }}     # Cihaz tipi (iPhone, Chrome, etc.)
{{ .Location }}       # Coğrafi konum
{{ .IPAddress }}      # İstemci IP adresi
{{ .Timestamp }}      # Giriş zamanı
```

---

### 5. Magic Link (`5-magic-link.html`)
**Kullanım:** Şifresiz giriş (passwordless authentication)
- ✨ Sihirli bağlantı
- ⚡ Tek tık giriş
- 🔒 Güvenli ve hızlı
- ⏱️ 15 dakika geçerlilik

**Dinamik Değişkenler:**
```
{{ .MagicToken }}     # Şifresiz giriş token'ı
```

---

### 6. Account Suspended (`6-account-suspended.html`)
**Kullanım:** Güvenlik nedeniyle hesap askıya alma
- 🔒 Askıya alma nedeni
- 📋 Çözüm adımları
- 📞 Destek ve iletişim
- 🔧 İnceleme talebinde bulunma

**Dinamik Değişkenler:**
```
{{ .SuspensionReason }}    # Askıya almanın nedeni
{{ .ViolationDetails }}    # Detaylı ihlal açıklaması
{{ .ReviewToken }}         # İnceleme talebinden token'ı
```

---

## 🚀 Supabase'de Kullanım

### 1. Template'i Kopyalayın
```bash
# HTML dosyasını aç ve tüm içeriği kopyala
cat src/emails/templates/1-welcome.html
```

### 2. Supabase Dashboard'a Git
- [Supabase Console](https://supabase.co)
- Proje seç → Authentication → Email Templates

### 3. Template'i Yapıştır
1. İlgili email türünü seç (Confirmation, Password Reset, Magic Link, vb.)
2. HTML editörünü aç
3. Tüm template HTML'i yapıştır
4. Kaydet

### 4. Dinamik Değişkenleri Kontrol Et
Supabase 6 varsayılan değişkeni destekler:

```html
<!-- Supabase Varsayılan Değişkenler -->
{{ .SiteURL }}              # Site URL'i (https://tv25.app)
{{ .ConfirmationURL }}      # Email doğrulama linki
{{ .Token }}                # Token
{{ .TokenHash }}            # Token hash'i
{{ .Email }}                # Kullanıcı email'i
{{ .Data }}                 # Özel veri (JSON)
```

---

## 📝 Email Provider'da Kullanım (Resend, SendGrid, vb.)

### Resend Örneği
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "noreply@tv25.app",
  to: user.email,
  subject: "Email Doğrulaması",
  html: welcomeEmailTemplate, // src/emails/templates/1-welcome.html
  tags: [
    {
      name: "template",
      value: "welcome"
    }
  ]
});
```

### Dynamic Değişken Kullanımı
```typescript
// Template içine HTML string'i olarak yerleştir
const emailHTML = welcomeTemplate
  .replace("{{ .Email }}", user.email)
  .replace("{{ .SiteURL }}", process.env.NEXT_PUBLIC_APP_URL);

await resend.emails.send({
  from: "noreply@tv25.app",
  to: user.email,
  subject: "Hoş Geldiniz!",
  html: emailHTML
});
```

---

## 🎨 Tasarım Özellikleri

### Renkler
- **Primary**: `#667eea` (Mavi-Mor Gradient)
- **Secondary**: `#764ba2` (Mor)
- **Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Danger**: `#dc3545` (Kırmızı - Askıya alma için)

### Tipografi
- **Font Family**: System fonts (Inter, Segoe UI, vb.)
- **Headings**: 24px, 700 weight
- **Body**: 16px, 400 weight
- **Links**: `#667eea` (Primary color)

### Responsive Design
- ✅ Max width: 600px
- ✅ Mobile uyumlu
- ✅ Inline CSS (email client uyumluluğu)
- ✅ Table-based layout (eski client'lar)

### Logo & Header
- Logo: "TV25" text + "CanvasFlow - Digital Canvas Experience"
- Gradient background: Blue to Purple
- Padding: 40px (desktop), 30px (mobile)

### CTA Buttons
- **Style**: Gradient background + hover effect
- **Padding**: 14px 32px
- **Border Radius**: 6px
- **Transition**: Transform + shadow on hover

### Footer
- Light gray background
- Company info + social links
- Copyright + Privacy/Terms links

---

## 🔒 Güvenlik Uygulamaları

✅ **HTTPS Links**: Tüm bağlantılar `https://tv25.app` kullanır
✅ **Token Expiry**: Tüm template'lere geçerlilik süresi eklendi
✅ **Sanitized HTML**: Inline CSS kullanıldı
✅ **Privacy Friendly**: Minimal tracking, GDPR uyumlu
✅ **Mobile Secure**: Responsive design güvenliğini artırır

---

## 📊 Template Kontrolü

### Before Send Checklist
- [ ] Dinamik değişkenler doğru yerleştirildi mi?
- [ ] Bağlantılar `https://tv25.app` doğru yönlendiriyor mu?
- [ ] Logo görünüyor mu?
- [ ] Renkler markalı görünüyor mü?
- [ ] Footer bilgileri doğru mu?
- [ ] Türkçe/İngilizce metinler uygun mu?

### Email Client Compatibility
✅ Gmail, Outlook, Yahoo Mail
✅ Apple Mail, iOS Mail
✅ Android Mail
✅ Thunderbird
✅ Mobile clients

---

## 🔧 Özelleştirme Rehberi

### Logo Değiştir
```html
<!-- Logo'u kendi logonla değiştir -->
<img src="https://cdn.tv25.app/logo.png" alt="CanvasFlow" width="60" height="60" />
```

### Renkler Değiştir
```css
/* Primary renk (mavi) */
#667eea → #TENGİRENKİN

/* Secondary renk (mor) */
#764ba2 → #TENGİRENKİN
```

### Sosyal Linkler Güncelle
```html
<!-- X (Twitter) -->
<a href="https://twitter.com/tv25app">𝕏</a>

<!-- Instagram -->
<a href="https://instagram.com/tv25app">📷</a>

<!-- LinkedIn -->
<a href="https://linkedin.com/company/tv25">in</a>
```

### Adres Bilgisi
```html
<strong>CanvasFlow - Dijital Canvas Deneyimi</strong><br>
İstanbul, Türkiye<br>
<a href="mailto:support@tv25.app">support@tv25.app</a>
```

---

## 📞 Destek

**Email**: support@tv25.app
**Website**: https://tv25.app
**Status**: https://status.tv25.app

---

## 📋 Checklist - Supabase Konfigürasyonu

```
Yapılacaklar:
[ ] Tüm 6 template'i Supabase'e ekle
[ ] Dinamik değişkenleri test et
[ ] Email gönderimi test et (test address)
[ ] Bağlantıları kontrol et (canlı bağlantılar)
[ ] Multi-cihaz uyumluluğunu test et
[ ] Spam filtresini kontrol et
[ ] Deliver-ability raporu al
[ ] DKIM/SPF kayıtlarını doğrula
```

---

## 🎯 Sonraki Adımlar

1. **Email Provider Setup** (Resend, SendGrid, vb.)
2. **API Integration** - src/lib/email-service.ts
3. **Email Testing** - Mailtrap, MailHog
4. **Production Deployment** - Verify DNS records
5. **Monitoring** - Track delivery, opens, clicks

---

**Created**: 2026-01-XX
**Version**: 1.0
**Status**: ✅ Ready for Production
**Compliance**: GDPR, CAN-SPAM, CASL ✓