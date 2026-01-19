# 🚀 Welcome Email'i Supabase'e Yükle - Hızlı Kılavuz

## 📌 TL;DR (Çok Hızlı)

1. **Supabase Dashboard'ı Aç:**
   ```
   https://app.supabase.com/project/qukzepteomenikeelzno/auth/templates
   ```

2. **Welcome Template'i Seç:**
   - Sidebar: Authentication → Email Templates
   - Select: `Confirmation` (veya Email Templates listesinde)

3. **1-welcome.html'den Kopyala:**
   ```bash
   # Terminal'de
   cat src/emails/templates/1-welcome.html
   # Tüm HTML'i kopyala (Ctrl+A, Ctrl+C)
   ```

4. **Supabase'e Yapıştır:**
   - HTML tab'ını seç
   - Ctrl+V ile yapıştır
   - **Save** butonuna tıkla

5. **Test Et:**
   - `Test` butonuna tıkla
   - E-postanı kontrol et ✅

---

## 📋 Tüm Template'leri Yükle

```bash
# Option 1: Otomatik script (API kullanarak)
npm run upload:email:all

# Option 2: Tek tek yapıştır (manuel)
# Supabase dashboard'da her template'i manual yapıştır
# src/emails/templates/ klasöründen
```

---

## 🎯 Template Sırası (Öneri)

1. **Email Confirmation** (`3-email-confirmation.html`)
   - İlk signup'ta kullanılır
   - Most important ⭐⭐⭐

2. **Welcome** (`1-welcome.html`)
   - Email doğrulama sonrası
   - Important ⭐⭐

3. **Password Reset** (`2-password-reset.html`)
   - Şifre recovery için
   - Important ⭐⭐

4. **Magic Link** (`5-magic-link.html`)
   - Şifresiz giriş
   - Nice to have ⭐

5. **Two-Factor Auth** (`4-two-factor-auth.html`)
   - 2FA code delivery
   - Custom implementation needed

6. **Account Suspended** (`6-account-suspended.html`)
   - Security alerts
   - Custom implementation needed

---

## 📂 Dosyalar

```
src/emails/templates/
├── 1-welcome.html                    # Hoş geldiniz
├── 2-password-reset.html            # Şifre sıfırlama
├── 3-email-confirmation.html        # Email doğrulama (ÖNEMLİ!)
├── 4-two-factor-auth.html          # 2FA
├── 5-magic-link.html                # Şifresiz giriş
├── 6-account-suspended.html         # Hesap askıya alma
├── UPLOAD_GUIDE.md                  # Detaylı rehber
├── TEMPLATE_USAGE.md                # İmplementasyon rehberi
├── index.md                         # Hızlı başlangıç
└── README.md                        # Genel bilgi
```

---

## 🔗 Supabase Links

| Sayfa | URL |
|-------|-----|
| Email Templates | https://app.supabase.com/project/qukzepteomenikeelzno/auth/templates |
| Auth Settings | https://app.supabase.com/project/qukzepteomenikeelzno/auth/providers |
| Project Settings | https://app.supabase.com/project/qukzepteomenikeelzno/settings/general |
| SMTP Settings | https://app.supabase.com/project/qukzepteomenikeelzno/settings/auth |

---

## ✅ Checklist

```
[ ] 1. Supabase dashboard'a gir
[ ] 2. Email Templates'ı aç
[ ] 3. Confirmation template'ini seç
[ ] 4. 3-email-confirmation.html'i yapıştır
[ ] 5. Save'e tıkla
[ ] 6. Test'e tıkla
[ ] 7. E-postayı kontrol et
[ ] 8. Welcome template'ini yapıştır
[ ] 9. Password Reset template'ini yapıştır
[ ] 10. Magic Link template'ini yapıştır
```

---

## 🐛 Sorun Giderme

### E-posta gelmiyorsa?

1. **SMTP Settings'i kontrol et:**
   - Project Settings → Auth
   - "SMTP Credentials" bölümü
   - Doğru email provider configure edilmiş mi?

2. **Redirect URLs'i ekle:**
   - Auth → Redirect URLs
   - Add: `https://tv25.app/**`

3. **CORS Settings'i güncelle:**
   - Auth → CORS
   - Add: `https://tv25.app`

### Template HTML gösterilmiyorsa?

1. Tüm HTML'i seçip yapıştırdığından emin ol
2. DOCTYPE ile başlamalı
3. `</html>` ile bitmelidir

### Dinamik değişkenler değişmiyor?

Supabase'in desteklediği standart değişkenler:
- `{{ .ConfirmationURL }}`
- `{{ .Token }}`
- `{{ .Email }}`
- `{{ .SiteURL }}`

Özel değişkenler için backend'de custom logic gerekir.

---

## 🎨 Template Özelleştirme

Yapıştırmadan önce değiştirebilirsin:

```html
<!-- Logo -->
<div class="logo">TV25</div>  ← Burası

<!-- Renkler -->
#667eea  ← Primary (mavi-mor)
#764ba2  ← Secondary (mor)
#dc3545  ← Danger (kırmızı)

<!-- Email (footer) -->
support@tv25.app  ← Burası

<!-- Website -->
https://tv25.app  ← Burası

<!-- Sosyal linkler -->
<a href="https://twitter.com/tv25app">𝕏</a>
```

---

## 📊 Next Steps (Sırasıyla)

1. ✅ **Email Templates Yükle** ← Şu an
2. ⏳ **Email Provider Configure Et** (Resend, SendGrid, veya Supabase SMTP)
3. ⏳ **Test Email Gönder** (signup ile)
4. ⏳ **DNS Records Ekle** (SPF, DKIM, DMARC)
5. ⏳ **Production Deploy** (tv25.app)

---

## 🎯 Quick Start (Tek Sayfada)

```bash
# 1. Terminal'de dosyaya git
cd src/emails/templates

# 2. HTML'i aç
cat 3-email-confirmation.html

# 3. Ctrl+A, Ctrl+C ile kopyala

# 4. Supabase'e git:
# https://app.supabase.com/project/qukzepteomenikeelzno/auth/templates

# 5. Confirmation → HTML tab → Ctrl+V → Save

# 6. Test et ve bitir! 🎉
```

---

**Status:** ✅ Ready
**Difficulty:** Easy (Kopyala-Yapıştır)
**Time:** 5 dakika