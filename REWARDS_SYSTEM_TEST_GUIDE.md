# 🎯 Ödül Sistemi Test Rehberi

## 📋 Test Bilgileri

### Dummy Hesaplar
- **Test User 1 (Davet Eden)**
  - Email: `test1@example.com`
  - Password: `Test123456!`
  - Username: `doruk2025`
  - Referral Code: `doruk2025`

- **Test User 2 (Davet Edilen)**
  - Email: `test2@example.com`
  - Password: `Test123456!`
  - Referral Link: `http://localhost:3000/auth?ref=doruk2025`

### Referans Linkleri
```
http://localhost:3000/auth?ref=doruk2025
http://localhost:3000/auth?ref=DORUK2025
```

---

## 🚀 Test Adımları

### 1️⃣ Database Migration'ları Çalıştır

```bash
# Supabase Dashboard'a git
# SQL Editor'da bu dosyaları sırayla çalıştır:

1. supabase/migrations/20260120_profile_referral_system.sql
2. supabase/migrations/20260120_achievements_system.sql
```

**Beklenen Sonuç:**
- ✅ Tüm tablolar oluşturuldu
- ✅ RLS policy'leri aktif
- ✅ Trigger'lar çalışıyor
- ✅ 6 default achievement tanımı eklendi

---

### 2️⃣ İlk Kullanıcıyı Oluştur (Test1 - Davet Eden)

1. `http://localhost:3000/auth` adresine git
2. **Sign Up** sekmesine geç
3. Form:
   - Email: `test1@example.com`
   - Password: `Test123456!`
   - Full Name: `Test User 1`
   - Username: `doruk2025`
4. **Sign Up** butonuna tıkla

**Beklenen Sonuç:**
- ✅ Kullanıcı oluşturuldu
- ✅ Profile `username` ve `referral_code` otomatik atandı
- ✅ "Hoş Geldin! 🎉" ödülü otomatik verildi (trigger ile)
- ✅ `user_slugs` tablosuna slug kaydı oluştu

**Kontrol:**
```sql
-- Supabase SQL Editor
SELECT * FROM profiles WHERE email = 'test1@example.com';
SELECT * FROM user_achievements WHERE user_id = (SELECT id FROM profiles WHERE email = 'test1@example.com');
SELECT * FROM user_slugs WHERE user_id = (SELECT id FROM profiles WHERE email = 'test1@example.com');
```

---

### 3️⃣ İkinci Kullanıcıyı Referans Linki ile Oluştur (Test2 - Davet Edilen)

1. Tarayıcıda yeni incognito/gizli pencere aç
2. Bu linke git: `http://localhost:3000/auth?ref=doruk2025`
3. **Sign Up** sekmesinde form:
   - Email: `test2@example.com`
   - Password: `Test123456!`
   - Full Name: `Test User 2`
   - Username: `testuser2`
4. **Sign Up** butonuna tıkla

**Beklenen Sonuç:**
- ✅ Kullanıcı oluşturuldu
- ✅ `referred_by` alanına `doruk2025` kaydedildi
- ✅ `referrals` tablosuna kayıt eklendi (status: 'pending')
- ✅ "Hoş Geldin! 🎉" ödülü verildi
- ✅ "Ebedi Dostum 💝" ödülü verildi (referrer_id ile)

**Kontrol:**
```sql
-- Test2 kullanıcısı
SELECT * FROM profiles WHERE email = 'test2@example.com';

-- Referral kaydı
SELECT * FROM referrals 
WHERE referred_id = (SELECT id FROM profiles WHERE email = 'test2@example.com');

-- Test2'nin ödülleri
SELECT ua.*, ad.title, ad.icon 
FROM user_achievements ua
LEFT JOIN achievement_definitions ad ON ad.id = ua.achievement_def_id
WHERE ua.user_id = (SELECT id FROM profiles WHERE email = 'test2@example.com');
```

---

### 4️⃣ Referral'ı Tamamla ve "Sosyal Kelebek" Ödülünü Ver

Test2 kullanıcısı bir işlem yaptığında (örnek: ilk canvas oluşturma), referral "completed" olarak işaretlenir:

```sql
-- Referral'ı complete yap (manuel test için)
UPDATE referrals 
SET status = 'completed', completed_at = now()
WHERE referred_id = (SELECT id FROM profiles WHERE email = 'test2@example.com');
```

**Beklenen Sonuç:**
- ✅ Referral status → 'completed'
- ✅ Test1 (davet eden) kullanıcısının `referral_count` +1 oldu
- ✅ Test1'e "Sosyal Kelebek 🦋" ödülü verildi (trigger ile)

**Kontrol:**
```sql
-- Test1'in referral count'u
SELECT username, referral_count FROM profiles WHERE email = 'test1@example.com';

-- Test1'in ödülleri
SELECT ua.*, ad.title, ad.icon 
FROM user_achievements ua
LEFT JOIN achievement_definitions ad ON ad.id = ua.achievement_def_id
WHERE ua.user_id = (SELECT id FROM profiles WHERE email = 'test1@example.com');
```

---

## 🎨 UI Testleri

### 5️⃣ Profil Panelinde Ödülleri Görüntüle

1. Test1 veya Test2 ile giriş yap
2. Sol sidebar → Profile sekmesi
3. "Achievements" veya "Ödüllerim" bölümüne git

**Beklenen Görünüm:**
- ✅ Ödül kartları görünüyor
- ✅ Her ödül icon, title, description ile
- ✅ "Ebedi Dostum" ödülünde referrer bilgisi (Test1'in profil fotosu + username)
- ✅ Referrer'a tıklanınca `/doruk2025` sayfasına gidiyor
- ✅ Ödül ayarları (settings) ikonu var
- ✅ Referrer görünürlüğü toggle edilebiliyor (göster/gizle)

### 6️⃣ Ödül Kartı Ayarları

1. Bir ödül kartının sağ üstündeki **Settings** ikonuna tıkla
2. "Referansı Göster" checkbox'ını toggle et

**Beklenen Davranış:**
- ✅ Toggle kapalı olunca referrer bilgisi gizleniyor
- ✅ Toggle açık olunca tekrar görünüyor
- ✅ Ayar database'e kaydediliyor (show_referrer field)
- ✅ Sayfa yenilenince ayar korunuyor

### 7️⃣ Ödül Talep Etme

1. Henüz talep edilmemiş bir ödül kartı bul
2. "Ödülü Al" butonuna tıkla

**Beklenen Davranış:**
- ✅ Buton "Alınıyor..." oldu
- ✅ API `/api/rewards` çağrıldı (action: claim)
- ✅ Database'de `reward_claimed = true` oldu
- ✅ Ödül active duruma geçti (storage/premium gün uygulandı)

---

## 🔐 Gizlilik (Privacy Hash) Testleri

### 8️⃣ Çift Hashleme Kontrolü

```sql
-- User Achievement'ların hash değerlerini kontrol et
SELECT 
  id,
  user_id,
  achievement_key,
  referrer_id,
  referrer_hash,
  timestamp_hash,
  earned_at
FROM user_achievements
WHERE referrer_id IS NOT NULL;
```

**Beklenen Sonuç:**
- ✅ `referrer_hash` SHA256 formatında (64 karakter hex)
- ✅ `timestamp_hash` SHA256 formatında
- ✅ Her ödül için unique hash
- ✅ Hash'ler ödül kartı alt kısmında gösteriliyor (ilk 16 karakter)

---

## 📊 Bonus Testler

### 9️⃣ Leaderboard Testi

```sql
SELECT * FROM achievement_leaderboard LIMIT 10;
```

**Beklenen Sonuç:**
- ✅ En çok ödül alan kullanıcılar sıralanmış
- ✅ Badge icon'ları array olarak

### 🔟 Public Profile'da Ödül Gösterimi

1. Test1'in public profile'ine git: `http://localhost:3000/doruk2025`
2. Achievements bölümünü kontrol et

**Beklenen Görünüm:**
- ✅ Public olarak gösterilebilir ödüller listeleniyor
- ✅ Badge/icon'lar görünüyor
- ✅ Referrer bilgisi gizli (privacy ayarına göre)

---

## 🐛 Hata Senaryoları

### Test 11: Aynı Referral Code ile Tekrar Kayıt

1. Üçüncü bir kullanıcı ile aynı referral link'i kullan
2. Kayıt ol

**Beklenen Davranış:**
- ✅ Her iki kullanıcıya da "Ebedi Dostum" ödülü verilir
- ✅ Test1'in `referral_count` 2'ye çıkar
- ✅ Duplicate referral kaydı oluşmaz (UNIQUE constraint)

### Test 12: Geçersiz Referral Code

1. `http://localhost:3000/auth?ref=invalid123` ile kayıt ol

**Beklenen Davranış:**
- ✅ Kayıt başarılı
- ✅ "Hoş Geldin" ödülü verilir
- ✅ "Ebedi Dostum" ödülü verilmez
- ✅ `referred_by` alanı boş kalır

---

## 📝 Notlar

- ✅ Tüm ödüller otomatik trigger ile verilir
- ✅ Manuel ödül vermek için: `POST /api/rewards` (action: 'grant')
- ✅ Privacy hash'ler INSERT sırasında otomatik oluşturulur
- ✅ Referral complete olunca trigger otomatik "Sosyal Kelebek" verir
- ✅ Organization ödülleri için `organization_id` parametresi kullanılır

---

## 🎯 Başarı Kriterleri

✅ Tüm migrations hatasız çalıştı  
✅ Kayıt sırasında "Hoş Geldin" ödülü otomatik verildi  
✅ Referral link ile kayıtta "Ebedi Dostum" ödülü verildi  
✅ Referral complete olunca "Sosyal Kelebek" ödülü verildi  
✅ Ödül kartlarında referrer profil bilgisi doğru gösterildi  
✅ Referrer'a tıklanınca profil sayfasına gidildi  
✅ Ödül ayarları (göster/gizle) çalıştı  
✅ Privacy hash'ler doğru oluşturuldu  
✅ Ödül talep etme (claim) çalıştı  

---

**Test Tamamlandı! 🎉**
