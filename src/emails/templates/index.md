# 📧 Email Template'leri - Hızlı Başlangıç

## ✨ Hazır Template'ler

Tüm template'ler **tv25.app branding** ile tasarlanmış, responsive ve production-ready.

### Template Listesi

| # | Template | Amaç | Geçerlilik |
|---|----------|------|-----------|
| 1️⃣ | Welcome | Yeni hesap oluşturma sonrası | - |
| 2️⃣ | Password Reset | Şifre sıfırlama | 30 dakika |
| 3️⃣ | Email Confirmation | Email doğrulama | 24 saat |
| 4️⃣ | Two-Factor Auth | 2FA kodu | 10 dakika |
| 5️⃣ | Magic Link | Şifresiz giriş | 15 dakika |
| 6️⃣ | Account Suspended | Güvenlik uyarısı | - |

---

## 🚀 Supabase'e Ekleme (5 Adım)

### Adım 1: Template Dosyasını Aç
```bash
cd src/emails/templates/
# İlgili template dosyasını text editor'da aç
```

### Adım 2: HTML'i Kopyala
- Tüm HTML içeriğini seç (Ctrl+A)
- Kopyala (Ctrl+C)

### Adım 3: Supabase Dashboard'a Git
1. https://app.supabase.com
2. Proje seçini tıkla
3. Authentication → Email Templates

### Adım 4: Template'i Yapıştır
1. İlgili email türünü seç:
   - Confirmation → `3-email-confirmation.html`
   - Password Reset → `2-password-reset.html`
   - Magic Link → `5-magic-link.html`
   - Custom → Diğer template'ler
2. HTML editor'a tıkla
3. Eski içeriği temizle
4. Yeni HTML'i yapıştır
5. **Save** tuşuna tıkla

### Adım 5: Test Et
- Test email gönder
- Bağlantıları kontrol et
- Mobilde görünümü kontrol et

---

## 📋 Template Kopyalama Rehberi

### 1️⃣ Welcome Email
```
Dosya: 1-welcome.html
Supabase Bölümü: Custom Template (Email Templates sekmesinde)
Gönderiş: Yeni hesap oluşturma sonrası
```

### 2️⃣ Password Reset
```
Dosya: 2-password-reset.html
Supabase Bölümü: Email Templates → Password Reset
Dinamik: {{ .Token }}, {{ .ResetCode }}, {{ .IPAddress }}
```

### 3️⃣ Email Confirmation
```
Dosya: 3-email-confirmation.html
Supabase Bölümü: Email Templates → Confirm Signup
Dinamik: {{ .ConfirmationToken }}, {{ .VerificationCode }}
```

### 4️⃣ Two-Factor Auth
```
Dosya: 4-two-factor-auth.html
Supabase Bölümü: Custom Template
Dinamik: {{ .OTPCode }}, {{ .DeviceType }}, {{ .Timestamp }}
```

### 5️⃣ Magic Link
```
Dosya: 5-magic-link.html
Supabase Bölümü: Email Templates → Magic Link
Dinamik: {{ .MagicToken }}
```

### 6️⃣ Account Suspended
```
Dosya: 6-account-suspended.html
Supabase Bölümü: Custom Template
Dinamik: {{ .SuspensionReason }}, {{ .ReviewToken }}
```

---

## 🎨 Özelleştirme

### Logo Değiştir
```html
<!-- Bunu bul -->
<div class="logo">TV25</div>

<!-- Bunu yap -->
<img src="YOUR_LOGO_URL" alt="CanvasFlow" />
```

### İletişim Bilgileri
```html
<!-- Email -->
support@tv25.app → YOUR_EMAIL

<!-- Website -->
https://tv25.app → YOUR_URL

<!-- Adres -->
İstanbul, Türkiye → YOUR_ADDRESS
```

### Renkler
```css
Primary: #667eea (Mavi)
Secondary: #764ba2 (Mor)
```

---

## ✅ Kontrol Listesi

### Supabase Setup
- [ ] Authentication etkinleştirildi mi?
- [ ] Email provider bağlantılı mı? (Supabase default, Resend, SendGrid)
- [ ] Redirect URLs doğru mu?
- [ ] CORS ayarlanmış mı?
- [ ] SMTP credentials girildimi?

### Email Testing
- [ ] Test email gönderildi mi?
- [ ] Email geldi mi?
- [ ] Bağlantılar çalışıyor mu?
- [ ] Tasarım düzgün mi?
- [ ] Mobilde görünüyor mu?

### Production Ready
- [ ] Tüm 6 template eklendi mi?
- [ ] DNS records doğrulandı mı?
- [ ] SPF/DKIM/DMARC ayarlandı mı?
- [ ] Rate limiting var mı?
- [ ] Logging ayarlandı mı?

---

## 📊 Template Dosya Yapısı

```
src/emails/
├── templates/
│   ├── 1-welcome.html
│   ├── 2-password-reset.html
│   ├── 3-email-confirmation.html
│   ├── 4-two-factor-auth.html
│   ├── 5-magic-link.html
│   ├── 6-account-suspended.html
│   └── index.md (bu dosya)
├── TEMPLATE_USAGE.md (Detaylı rehber)
└── email-service.ts (İmplementasyon)
```

---

## 🔥 Hızlı Kopyala-Yapıştır

### Eğer Supabase Email şemasını kullanıyorsanız:

**Step 1**: Template dosyasını aç
```bash
cat src/emails/templates/3-email-confirmation.html
```

**Step 2**: Tüm çıktıyı kopyala

**Step 3**: Supabase Editor'a git ve yapıştır

**Step 4**: Kaydet ve test et

---

## 🎯 Supabase Supordu

**Supabase Email Templates** → Her template tipi için varsayılan template vardır:
- ✅ Confirm Signup Email
- ✅ Confirm Email Change  
- ✅ Magic Link
- ✅ Invite User
- ✅ Reset Password
- ✅ Welcome Email

**Custom Email Providers** (Resend, SendGrid, vb.):
- API kullanarak custom HTML gönder
- Template dosyasından HTML oku
- Dinamik değişkenleri değiştir
- Email provider API'sine gönder

---

## 💡 İpuçları

1. **Test Etme**: Production'a geçmeden önce test address ile gönder
2. **Spam**: SPF/DKIM/DMARC kurularını yap (önemli!)
3. **Tracking**: Email açılırsa ve link tıklanırsa log tutma
4. **Analytics**: Kaç email gönderildi, kaç açıldı, hangisi başarısız oldu
5. **Backup**: Template dosyalarını güvenli yerde tut

---

## 📞 İletişim

**Sorular veya sorunlar?**
- Email: support@tv25.app
- Website: https://tv25.app
- Docs: See TEMPLATE_USAGE.md for detailed guide

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-01-XX
**Version**: 1.0