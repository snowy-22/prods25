# 📧 CanvasFlow Email Templates

**Profesyonel HTML email template'leri - tv25.app branding ile hazırlanmış**

```
src/emails/
├── templates/
│   ├── 1-welcome.html                    # Hoş geldiniz mesajı
│   ├── 2-password-reset.html            # Şifre sıfırlama
│   ├── 3-email-confirmation.html        # Email doğrulama
│   ├── 4-two-factor-auth.html          # İki faktörlü doğrulama
│   ├── 5-magic-link.html                # Şifresiz giriş
│   ├── 6-account-suspended.html         # Hesap askıya alma
│   └── index.md                          # Hızlı rehber
├── TEMPLATE_USAGE.md                     # Detaylı kılavuz
└── email-service.ts                      # İmplementasyon (örnek)
```

---

## 🎯 Hızlı Başlangıç

### 1. Template Seçin
```bash
cd src/emails/templates/
ls -la
```

### 2. HTML'i Kopyalayın
```bash
cat 3-email-confirmation.html
# Tüm çıktıyı kopyala (Ctrl+C)
```

### 3. Supabase'e Ekleyin
- https://app.supabase.com → Authentication → Email Templates
- İlgili email türünü seç
- HTML editor'a yapıştır
- Save

### 4. Test Edin
Şu adresi ziyaret et: https://tv25.app/auth/test-email

---

## 📝 Template'ler

### 1. Welcome Email `1-welcome.html`
Yeni hesap oluşturma sonrası
- Hoş geldiniz mesajı
- CanvasFlow özellikleri
- Başlama butonu

### 2. Password Reset `2-password-reset.html`
Şifre sıfırlama isteği
- Şifre sıfırlama bağlantısı
- Geçerlilik süresi (30 dakika)
- Güvenlik uyarısı

### 3. Email Confirmation `3-email-confirmation.html`
Email doğrulama (signup)
- Email doğrulama bağlantısı
- Doğrulama kodu
- Adım adım talimatlar

### 4. Two-Factor Auth `4-two-factor-auth.html`
İki faktörlü doğrulama kodu
- 6-haneli OTP
- Cihaz ve konum info
- Güvenlik uyarısı

### 5. Magic Link `5-magic-link.html`
Şifresiz giriş (passwordless)
- Sihirli bağlantı
- Tek tık giriş
- 15 dakika geçerli

### 6. Account Suspended `6-account-suspended.html`
Güvenlik nedeniyle hesap askıya alma
- Askıya alma nedeni
- Çözüm adımları
- Destek iletişim

---

## 🎨 Tasarım

**Renkler:**
- Primary: `#667eea` (Mavi-Mor Gradient)
- Secondary: `#764ba2` (Mor)
- Accent: `#dc3545` (Kırmızı - Uyarılar)

**Tipografi:**
- Font: System fonts (Inter, Segoe UI, vb.)
- Responsive: Max 600px width
- Mobile friendly: ✅

**Branding:**
- Logo: "TV25" + "CanvasFlow"
- Footer: Company info + Social links + Copyright

---

## 📱 Uyumluluk

✅ Gmail
✅ Outlook
✅ Apple Mail
✅ Yahoo Mail
✅ Mobile Mail (iOS, Android)
✅ Thunderbird
✅ All modern email clients

---

## 🔒 Güvenlik

✅ HTTPS links
✅ Token expiry
✅ Inline CSS (sanitized HTML)
✅ GDPR compliant
✅ No tracking pixels (privacy-first)

---

## 📖 Rehberler

**Hızlı Başlangıç**: → `templates/index.md`
**Detaylı Rehber**: → `TEMPLATE_USAGE.md`
**İmplementasyon**: → Email service API dosyaları

---

## 🚀 Deployment

### Supabase
1. Auth → Email Templates
2. HTML yapıştır
3. Save & Test

### Email Provider (Resend, SendGrid)
```typescript
import { sendEmail } from '@/lib/email-service';

await sendEmail({
  to: user.email,
  template: 'welcome',
  data: { 
    email: user.email 
  }
});
```

---

## ✨ Özellikler

- ✅ Profesyonel tasarım
- ✅ Responsive layout
- ✅ TV25 branding
- ✅ Çoklu dil (TR/EN)
- ✅ GDPR uyumlu
- ✅ Accessibility (a11y)
- ✅ Dark mode support
- ✅ Dynamic variables

---

## 📊 Dinamik Değişkenler

```html
<!-- Supabase Standart -->
{{ .SiteURL }}           # https://tv25.app
{{ .ConfirmationURL }}   # Email doğrulama linki
{{ .Token }}             # Auth token
{{ .Email }}             # Kullanıcı email'i

<!-- Özel Değişkenler -->
{{ .OTPCode }}           # 2FA kodu
{{ .MagicToken }}        # Magic link token
{{ .ResetCode }}         # Şifre reset kodu
{{ .IPAddress }}         # Client IP
{{ .DeviceType }}        # Device info
{{ .Timestamp }}         # Tarih ve saat
{{ .SuspensionReason }}  # Askıya alma nedeni
```

---

## 🔧 Özelleştirme

### Logo Değiştir
```html
<!-- Before -->
<div class="logo">TV25</div>

<!-- After -->
<img src="YOUR_LOGO_URL" alt="CanvasFlow" width="60" />
```

### Renkler
```css
/* Find and replace */
#667eea → YOUR_PRIMARY_COLOR
#764ba2 → YOUR_SECONDARY_COLOR
#dc3545 → YOUR_ACCENT_COLOR
```

### İletişim Info
```
support@tv25.app → YOUR_EMAIL
https://tv25.app → YOUR_WEBSITE
İstanbul, Türkiye → YOUR_ADDRESS
```

---

## 📝 Checklist

```
Supabase Setup:
☐ Email provider configured
☐ Redirect URLs set
☐ CORS configured
☐ SMTP credentials added

Template Setup:
☐ All 6 templates added
☐ Dynamic variables tested
☐ Test emails sent
☐ Links verified

Production Ready:
☐ DNS records verified
☐ SPF/DKIM/DMARC enabled
☐ Rate limiting configured
☐ Error handling in place
☐ Monitoring/logging enabled
```

---

## 🎯 Next Steps

1. **Copy templates** to your email provider
2. **Configure** Supabase email settings
3. **Test** with test email address
4. **Monitor** delivery and engagement
5. **Optimize** based on metrics

---

## 💬 Support

**Email**: support@tv25.app
**Website**: https://tv25.app
**Docs**: See TEMPLATE_USAGE.md

---

## 📄 License

© 2026 CanvasFlow. All rights reserved.

---

**Status**: ✅ Production Ready
**Version**: 1.0
**Last Updated**: 2026-01-XX