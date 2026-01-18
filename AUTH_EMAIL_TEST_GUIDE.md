## 🧪 AUTH & EMAIL SYSTEM - KAPSAMLI TEST KALABUZU

### ✅ DEPLOYMENT STATUS
- **Commit**: feat: Complete email system with auth endpoints and cloud sync fix
- **Push**: ✅ Main branch'e başarıyla pushlandi (4f16bed)
- **Dev Server**: ✅ http://localhost:3000 (running)

---

### 📋 KURULUM KONTROL LİSTESİ

#### 1. Supabase Auth Ayarları
```
KONTROL NOKTASI: https://app.supabase.com
☐ Authentication > Providers > Email enabled
☐ Email Templates > Confirm signup özelleştirildi mi?
☐ Database > auth.users tablosu erişilebilir
☐ Database > public.profiles tablosu oluşturuldu
```

#### 2. Environment Variables
```
KONTROL NOKTASI: .env.local
☐ NEXT_PUBLIC_SUPABASE_URL=...
☐ NEXT_PUBLIC_SUPABASE_ANON_KEY=...
☐ SUPABASE_SERVICE_ROLE_KEY=... (server-side)
☐ ENCRYPTION_KEY=... (32-byte hex)
☐ NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3. Email Provider Seçimi (TODO)
```
SEÇENEKLER:
☐ Resend (Recommended) - https://resend.com
☐ SendGrid - https://sendgrid.com
☐ AWS SES - https://aws.amazon.com/ses
☐ Supabase Email Service - (included, limited)

NOTU: Şu anda emailler QUEUE'DE tutulmaktadır. 
Gerçek gönderim için provider entegrasyonu gerekli.
```

---

### 🚀 TEST SENARYOLARI

#### Test 1: İkinci Hesap Oluşturma (Signup)
```bash
# PowerShell: .\test-auth-email.ps1
# Bash: bash test-auth-email.sh

EXPECTED:
✅ 200 OK response
✅ user: { id, email, user_metadata }
✅ profile: { id, email, full_name, display_name }
✅ message: "Signup başarılı. Lütfen email'inizi doğrulayın"

KONTROL:
- Supabase Dashboard > auth.users'da yeni user var mı?
- Supabase Dashboard > public.profiles'da yeni profile var mı?
- Email queue'sinde welcome email var mı?
  GET http://localhost:3000/api/email?action=queue-status
```

#### Test 2: İkinci Hesapla Giriş (Signin)
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signin",
    "email": "test2-TIMESTAMP@example.com",
    "password": "SecurePassword123!"
  }'

EXPECTED:
✅ 200 OK response
✅ user: { id, email, user_metadata }
✅ profile: { id, email, full_name, display_name }
✅ session: { access_token, refresh_token }

KONTROL:
- Token geçerli mi?
- Multi-tab sync'te bu hesapta oturum açılmış mı?
```

#### Test 3: Şifremi Unuttum (Password Reset)
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "password-reset",
    "email": "test2-TIMESTAMP@example.com"
  }'

EXPECTED:
✅ 200 OK response
✅ message: "Reset linki email adresine gönderildi"

KONTROL:
- Password reset email queue'de var mı?
  GET http://localhost:3000/api/email?action=queue-status
- Email şu değişkenleri içeriyor mu?
  - Reset link
  - 1 saat expiry
  - "Şifre sıfırlama talebinde bulunmadınız mı?" uyarısı
```

#### Test 4: Email Doğrulama (Confirm Email)
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "confirm-email",
    "email": "test2-TIMESTAMP@example.com"
  }'

EXPECTED:
✅ 200 OK response
✅ message: "Doğrulama emaili gönderildi"

KONTROL:
- Confirmation email queue'de var mı?
- Email'de 24 saatlik link var mı?
```

#### Test 5: Email Queue Status
```bash
GET http://localhost:3000/api/email?action=queue-status

EXPECTED:
{
  "pending": 2,
  "sent": 0,
  "failed": 0,
  "message": "Queue durumu: 2 beklemede, 0 gönderilen, 0 başarısız"
}

KONTROL:
- Welcome email queue'de
- Reset/Confirmation email queue'de
```

#### Test 6: Email Templates Listesi
```bash
GET http://localhost:3000/api/email?action=templates

EXPECTED:
6 template:
✅ welcome
✅ password-reset
✅ account-activation
✅ referral
✅ promotional
✅ notification

Tüm template'ler Turkish locale'de mi?
```

#### Test 7: Multi-Device Sync
```
SENARYO:
1. Device A'da: test-user-1@example.com ile signup
2. Device B'de: Aynı hesapla signin
3. Device A'da: Yeni klasör oluştur
4. Device B'de: Klasör görünüyor mu?

EXPECTED:
✅ Data real-time sync olması
✅ İkinci cihazda 1-2 saniye içinde görünmesi
✅ Hiçbir data loss olmaması
```

#### Test 8: Referral Email (Multi-Account)
```
SENARYO:
1. Account A (referrer): signup
2. Account B (referral): Account A'nın referral link'i ile signup
3. Account A'da: Referral email queue'de

EXPECTED:
✅ Referral email queue'de
✅ Email Template:
  - Friend bilgileri
  - Bonus credit amount
  - Referral program açıklaması
```

#### Test 9: Error Handling
```bash
# Invalid email
curl -X POST http://localhost:3000/api/auth \
  -d '{"action":"signup","email":"invalid"}'
EXPECTED: ❌ 400 "Invalid email format"

# Weak password
curl -X POST http://localhost:3000/api/auth \
  -d '{"action":"signup","password":"123"}'
EXPECTED: ❌ 400 "Password must be at least 8 characters"

# Duplicate email
curl -X POST http://localhost:3000/api/auth \
  -d '{"action":"signup","email":"existing@example.com"}'
EXPECTED: ❌ 400 "Email already registered"

# Missing required field
curl -X POST http://localhost:3000/api/auth \
  -d '{"action":"signup"}'
EXPECTED: ❌ 400 "Missing required fields"
```

---

### 📊 SONUÇLAR ÖZETİ

| Test | Status | Notes |
|------|--------|-------|
| Signup | ✅ Ready | Auth route + email service |
| Signin | ✅ Ready | Token creation working |
| Password Reset | ⏳ Queue ready | Email provider needed |
| Email Verification | ⏳ Queue ready | Email provider needed |
| Cloud Sync | ✅ Fixed | Device-specific tracking |
| Email Templates | ✅ 6/6 Created | All Turkish + HTML |
| Email Queue | ✅ Working | Retry logic active |

---

### 📌 ÖNEMLİ NOTLAR

#### 1. Email Provider Entegrasyonu (CRITICAL)
```
Şu anda:
- Emailler src/lib/email-service.ts'de kuyruğa alınmakta
- Gerçek gönderim yapılmamakta

Yapılması Gerekenler:
☐ Resend, SendGrid, veya AWS SES seç
☐ API key'ini .env.local'e ekle
☐ sendEmailViaSupabase() içinde provider entegrasyonunu yap
☐ Queue system'i test et
```

#### 2. Supabase Public.Profiles Tablosu
```sql
-- Eğer oluşturulmadıysa:
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 3. Device ID Tracking
```
Cloud Sync'te cihaz tanımlama:
- localStorage'da device_id kaydediliyor
- Migration flag: migration_done_{userId}_{deviceId}
- Her cihazdan farklı data set'i üretiliyor
- Smart merge ile data loss önleniyor
```

#### 4. Email Queue & Retry
```
Retry Logic:
- Başarısız: 5 dakika sonra retry
- 2. başarısız: 15 dakika sonra retry
- 3. başarısız: 30 dakika sonra retry
- 3 retry sonra failed olarak işaretleniyor

Queue Status:
GET /api/email?action=queue-status
```

---

### 🔧 TROUBLESHOOTING

#### Problem: "Signup başarılı ama user auth.users'da yok"
```
Çözüm:
1. Supabase > Authentication > Email Template kontrol et
2. Email verification zorunlu mu? (Settings > Email provider)
3. Confirm signup email gidiyor mu? (Test via queue status)
```

#### Problem: "Cloud sync data kaybı devam ediyor"
```
Çözüm:
1. Device ID kontrol: localStorage > device_id
2. Migration flag kontrol: localStorage > migration_done_{id}_{deviceId}
3. Console'da "Cloud data is empty" warning'i var mı?
4. Browser cache temizle (localStorage reset)
```

#### Problem: "Email queue'de beklemede emailler var ama gönderiilmiyor"
```
Çözüm:
1. Email provider API key'i .env.local'de var mı?
2. sendEmailViaSupabase() 'den error message al
3. Resend/SendGrid/SES test endpoint'ini kontrol et
```

---

### ✨ NEXT STEPS

1. **Immediate (Today)**:
   - Test signup/signin flows ✅
   - Verify email queue system ✅
   - Check cloud sync across devices

2. **Short-term (This Week)**:
   - [ ] Email provider seç ve entegre et (Resend recommended)
   - [ ] Gerçek email'leri test et
   - [ ] Password reset flow'u end-to-end test et
   - [ ] Multi-account cloud sync test et

3. **Medium-term (Next Week)**:
   - [ ] Email preferences/unsubscribe system
   - [ ] Referral bonus tracking
   - [ ] Email analytics integration
   - [ ] Load testing (bulk emails)

4. **Production Checklist**:
   - [ ] Email provider'dan DKIM/SPF records al
   - [ ] Email template'leri staging'de test et
   - [ ] Rate limiting (signup, password-reset)
   - [ ] Spam filter kuralları kontrol et
   - [ ] GDPR compliance (privacy policy linki)
   - [ ] Email footer'ında unsubscribe link

---

### 📞 SUPPORT

API Endpoints:
- `POST /api/auth` - Signup, Signin, Password Reset, Email Confirmation
- `GET /api/auth` - Token verification
- `GET /api/email` - Queue status, templates list, test email

Need help?
- Check console logs: `npm run dev`
- Supabase logs: Dashboard > Logs
- Email service logs: `GET /api/email?action=queue-status`
