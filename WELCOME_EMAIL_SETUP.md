# 📧 Welcome Email - Supabase'e Yükle (Adım Adım)

## 🎯 5 Dakikalık Hızlı Rehber

### 1️⃣ **Supabase Dashboard'ı Aç**

```
https://app.supabase.com/project/qukzepteomenikeelzno/auth/templates
```

Veya manuel:
- https://app.supabase.com adresine git
- Projeye giriş yap
- Left sidebar: **Authentication** → **Email Templates**

---

### 2️⃣ **Email Türünü Seç**

Email Templates listesinde:
- **Confirmation** → Seç (welcome email için kullanacağız)
- Veya **+ New Template** ile custom oluştur

---

### 3️⃣ **HTML'i Kopyala**

**Option A: VS Code'dan**
```
1. src/emails/templates/1-welcome.html aç
2. Ctrl+A (tümünü seç)
3. Ctrl+C (kopyala)
```

**Option B: Terminal'den**
```bash
cat src/emails/templates/1-welcome.html > clipboard
# Windows: Get-Content src/emails/templates/1-welcome.html | Set-Clipboard
```

**Option C: Dosya İçeriğini Kopyala**
- Aşağıdaki "HTML İçeriği" bölümünden kopyala

---

### 4️⃣ **Supabase'e Yapıştır**

Supabase Email Templates dashboard'da:

1. **HTML Tab'ını Seç**
   - "HTML" tab'ına tıkla
   
2. **Mevcut HTML'i Sil**
   - Ctrl+A
   - Delete

3. **Yeni HTML'i Yapıştır**
   - Ctrl+V (kopyaladığın HTML'i yapıştır)

4. **Konu Satırını Ayarla** (Optional)
   - Subject: `Hoş Geldiniz! 🎉` veya otomatik olarak ayarlanabilir

5. **Save Düğmesine Tıkla**
   - Sağ üst köşede **Save** veya **Update**

---

### 5️⃣ **Test Et**

Supabase dashboard'da:
- **Test** butonuna tıkla
- Kendi e-posta adresine test email gönderilecek
- E-posta kutunu kontrol et ✅

---

## 📋 HTML İçeriği (Kopyala)

```html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CanvasFlow'a Hoş Geldiniz</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background-color: #f5f7fa;
            color: #333;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -1px;
            margin-bottom: 10px;
        }
        
        .logo-subtext {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        
        .text {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 20px;
        }
        
        .highlight {
            background-color: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 16px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 14px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 14px 32px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 25px 0;
            font-size: 16px;
            transition: transform 0.2s;
            border: 0;
            cursor: pointer;
            text-align: center;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 12px rgba(102, 126, 234, 0.4);
        }
        
        .features {
            margin: 30px 0;
        }
        
        .feature-item {
            display: flex;
            margin-bottom: 16px;
            align-items: flex-start;
        }
        
        .feature-icon {
            font-size: 20px;
            margin-right: 12px;
            min-width: 30px;
        }
        
        .feature-text {
            font-size: 15px;
            color: #555;
            line-height: 1.5;
        }
        
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
        }
        
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
        }
        
        .footer-text {
            font-size: 13px;
            color: #999;
            line-height: 1.8;
            margin-bottom: 15px;
        }
        
        .social-links {
            margin: 15px 0;
        }
        
        .social-links a {
            display: inline-block;
            width: 32px;
            height: 32px;
            margin: 0 6px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            line-height: 32px;
            border-radius: 50%;
            text-decoration: none;
            font-size: 14px;
        }
        
        .copyright {
            font-size: 12px;
            color: #bbb;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
        }
        
        .copyright a {
            color: #667eea;
            text-decoration: none;
        }
        
        .copyright a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">TV25</div>
            <div class="logo-subtext">CanvasFlow - Digital Canvas Experience</div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">Hoş Geldiniz! 🎉</div>
            
            <div class="text">
                Merhaba,<br><br>
                CanvasFlow ailesine katıldığınız için teşekkür ederiz! Dijital yaratıcılığınız için sınırsız tuval hazırlandı.
            </div>
            
            <div class="highlight">
                <strong>Başlamaya Hazır Mısınız?</strong><br>
                Hesabınızı aktif hale getirmek için aşağıdaki butona tıklayın ve ilk canvas'ınızı oluşturmaya başlayın.
            </div>
            
            <a href="https://tv25.app/auth/setup" class="cta-button">Hesabımı Aktif Et</a>
            
            <div class="text" style="margin-top: 30px; margin-bottom: 15px;">
                <strong>CanvasFlow ile neler yapabilirsiniz?</strong>
            </div>
            
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">🎬</div>
                    <div class="feature-text"><strong>Video & Medya:</strong> YouTube, Vimeo, kendi videolarınızı ekleyin</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🎨</div>
                    <div class="feature-text"><strong>Yaratıcı Araçlar:</strong> Notlar, çizimleri ve widgetleri kullanın</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🌐</div>
                    <div class="feature-text"><strong>Web İçeriği:</strong> İstediğiniz websiteleri canvas'a gömün</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">☁️</div>
                    <div class="feature-text"><strong>Bulut Senkronizasyonu:</strong> Tüm cihazlarınızda senkronize kalın</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🤖</div>
                    <div class="feature-text"><strong>AI Asistan:</strong> Yapay zeka destekli öneriler alın</div>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="text">
                Soruşunuz varsa veya yardıma ihtiyacınız olursa, her zaman bize <a href="mailto:support@tv25.app" style="color: #667eea; text-decoration: none;">support@tv25.app</a> adresinden yazabilirsiniz.
            </div>
            
            <div class="text" style="font-size: 14px; color: #999; font-style: italic;">
                Eğer bu e-postayı istemediğiniz birisi tarafından gönderiline açılıyorsa, lütfen <a href="https://tv25.app/security" style="color: #667eea;">güvenlik ayarlarını</a> kontrol edin.
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                <strong>CanvasFlow - Dijital Canvas Deneyimi</strong><br>
                İstanbul, Türkiye<br>
                <a href="mailto:support@tv25.app" style="color: #667eea; text-decoration: none;">support@tv25.app</a>
            </div>
            
            <div class="social-links">
                <a href="https://twitter.com/tv25app">𝕏</a>
                <a href="https://instagram.com/tv25app">📷</a>
                <a href="https://linkedin.com/company/tv25">in</a>
            </div>
            
            <div class="copyright">
                © 2026 CanvasFlow. Tüm hakları saklıdır.<br>
                <a href="https://tv25.app">tv25.app</a> - 
                <a href="https://tv25.app/privacy">Gizlilik Politikası</a> - 
                <a href="https://tv25.app/terms">Hizmet Şartları</a>
            </div>
        </div>
    </div>
</body>
</html>
```

---

## ✅ Checklist

```
[ ] 1. Supabase dashboard açıldı
[ ] 2. Authentication → Email Templates
[ ] 3. Confirmation template seçildi
[ ] 4. HTML tab'ı aktif
[ ] 5. Mevcut HTML silindi
[ ] 6. Yeni HTML yapıştırıldı
[ ] 7. Save'e tıklandı
[ ] 8. Test email gönderildi
[ ] 9. E-posta alındı ve görüntülendi ✅
```

---

## 🎨 Özelleştirme (Opsiyonel)

Yapıştırmadan önce bu kısımları düzenleyebilirsin:

```html
<!-- Logo adını değiştir -->
<div class="logo">TV25</div>  ← İstediğin metni yaz

<!-- Renkler (3 yerde bulunur) -->
#667eea   ← Birincil renk (mavi-mor)
#764ba2   ← İkincil renk (mor)
#dc3545   ← Uyarı rengi (kırmızı)

<!-- Email adresi -->
support@tv25.app  ← Kendi email'ini yaz

<!-- Website URL -->
https://tv25.app  ← Kendi siteni yaz

<!-- Sosyal medya -->
https://twitter.com/tv25app  ← Kendi hesaplarını yaz
https://instagram.com/tv25app
https://linkedin.com/company/tv25
```

---

## 🚀 Sonraki Adımlar

1. ✅ **Welcome Email Yüklendi** ← Tamamlandı
2. ⏳ **Diğer template'leri yükle** (Email Confirmation, Password Reset, vb.)
3. ⏳ **Email provider yapılandır** (Resend, SendGrid, veya Supabase SMTP)
4. ⏳ **Test et** (signup ile)
5. ⏳ **Production deploy** (tv25.app)

---

## 🔗 Faydalı Linkler

| Sayfalar | URL |
|----------|-----|
| Email Templates | https://app.supabase.com/project/qukzepteomenikeelzno/auth/templates |
| Auth Settings | https://app.supabase.com/project/qukzepteomenikeelzno/auth/providers |
| Supabase Docs | https://supabase.com/docs/guides/auth/auth-email |

---

## 💡 İpuçları

✅ **Hızlı kopyala:** Tüm HTML'i seçip kopyalamak için `Ctrl+A` → `Ctrl+C`
✅ **Formatting:** HTML formatting otomatik olarak yapılır
✅ **Test:** `Test` butonuna tıkla, test email gönderilir
✅ **Edit:** İstediğin zaman tekrar düzenleyebilirsin

---

**Hazırsın! 🎉 Adımları takip et ve 5 dakikada bitir!**