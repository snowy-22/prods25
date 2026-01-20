# CanvasFlow Ödül Sistemi - Hızlı Test Kurulumu

## 🎯 Test Adımları

### 1. Migration'ları Çalıştır

Supabase SQL Editor'de sırayla çalıştır:

```bash
# 1. Profile System Migration
supabase/migrations/20260120_profile_referral_system.sql

# 2. Achievements System Migration
supabase/migrations/20260120_achievements_system.sql
```

### 2. Dummy Test Hesapları

#### Test Kullanıcı 1 (Davet Eden)
```
Email: test1@example.com
Password: Test123456!
Username: doruk2025
Referral Code: doruk2025
```

#### Test Kullanıcı 2 (Davet Edilen)
```
Email: test2@example.com
Password: Test123456!
Referral Link: http://localhost:3000/auth?ref=doruk2025
```

### 3. Test Senaryosu

#### Adım 1: Test1 Hesabı Oluştur
1. `npm run dev` ile uygulamayı başlat
2. http://localhost:3000/auth sayfasına git
3. "Sign Up" ile Test1 hesabını oluştur:
   - Email: `test1@example.com`
   - Password: `Test123456!`
   - Full Name: `Test User 1`
4. **Beklenen:** "Hoş Geldin" ödülü otomatik verilmeli 🎉

#### Adım 2: Referral Link Kontrolü
1. Test1 ile giriş yap
2. Profile panel'i aç (sağ üst)
3. "Ödüller" sekmesine git
4. Davet kodunu kopyala: `doruk2025`
5. **Referral Link:** `http://localhost:3000/auth?ref=doruk2025`

#### Adım 3: Test2 Hesabı Oluştur (Referral ile)
1. Oturumu kapat (Log out)
2. Yeni gizli pencere aç
3. Referral link ile git: `http://localhost:3000/auth?ref=doruk2025`
4. "Sign Up" ile Test2 hesabını oluştur:
   - Email: `test2@example.com`
   - Password: `Test123456!`
   - Full Name: `Test User 2`
5. **Beklenen:**
   - Test2: "Hoş Geldin" 🎉 + "Ebedi Dostum" 💝 ödülleri
   - Test2'nin "Ebedi Dostum" ödülünde Test1'in profil fotosu + ismi görünmeli
   - Link: `/doruk2025`

#### Adım 4: Sosyal Kelebek Ödülü
1. Test1'e geri dön
2. Profile panel → "Ödüller" sekmesi
3. **Beklenen:** "Sosyal Kelebek" 🦋 ödülü otomatik verilmiş olmalı
4. Ödül kartında "1 arkadaş davet edildi" yazmalı

#### Adım 5: Ayarlar Testi
1. Test2 hesabında "Ebedi Dostum" ödülüne tıkla
2. Sağ üstteki ⚙️ (Settings) ikonuna tıkla
3. "Davet Edeni Göster" seçeneğini kapat
4. **Beklenen:** Test1'in profil bilgisi gizlenmeli
5. Tekrar aç
6. **Beklenen:** Test1'in profil bilgisi görünmeli

#### Adım 6: Ödül Alma (Claim)
1. Henüz alınmamış bir ödüle tıkla
2. "Ödülü Al" butonuna tıkla
3. **Beklenen:**
   - Buton "Alındı ✓" olmalı
   - Storage/premium bonus hesaba yansımalı
   - Toast bildirimi: "Ödül başarıyla alındı!"

### 4. Database Doğrulama

Test sonrası SQL ile kontrol et:

```sql
-- Test1'in ödüllerini göster
SELECT 
  ua.id,
  ad.title,
  ad.icon,
  ua.referrer_username,
  ua.show_referrer,
  ua.reward_claimed,
  ua.earned_at
FROM user_achievements ua
JOIN achievement_definitions ad ON ua.achievement_key = ad.key
JOIN profiles p ON ua.user_id = p.id
WHERE p.username = 'doruk2025'
ORDER BY ua.earned_at DESC;

-- Test2'nin ödüllerini göster (referrer bilgisi ile)
SELECT 
  ua.id,
  ad.title,
  ad.icon,
  ua.referrer_id,
  ua.referrer_username,
  ua.referrer_avatar_url,
  ua.show_referrer,
  ua.referrer_hash,
  ua.earned_at
FROM user_achievements ua
JOIN achievement_definitions ad ON ua.achievement_key = ad.key
JOIN profiles p ON ua.user_id = p.id
WHERE p.email = 'test2@example.com'
ORDER BY ua.earned_at DESC;

-- Referral ilişkisini kontrol et
SELECT 
  r.id,
  p1.username as referrer,
  p2.username as referred,
  r.status,
  r.created_at
FROM referrals r
JOIN profiles p1 ON r.referrer_id = p1.id
JOIN profiles p2 ON r.referred_id = p2.id
WHERE p1.username = 'doruk2025';

-- Privacy hash kontrolü
SELECT 
  ad.title,
  LEFT(ua.referrer_hash, 16) || '...' as hash_preview,
  ua.referrer_username,
  ua.earned_at
FROM user_achievements ua
JOIN achievement_definitions ad ON ua.achievement_key = ad.key
WHERE ua.referrer_hash IS NOT NULL;
```

### 5. Beklenen Sonuçlar

#### Test1 (doruk2025)
- ✅ "Hoş Geldin" ödülü (kayıt sırasında)
- ✅ "Sosyal Kelebek" ödülü (Test2 kayıt olunca)
- ✅ Referral count: 1
- ✅ Davet kodu: doruk2025

#### Test2
- ✅ "Hoş Geldin" ödülü (kayıt sırasında)
- ✅ "Ebedi Dostum" ödülü (referral ile kayıt)
- ✅ "Ebedi Dostum" ödülünde:
  - Referrer: Test User 1 (doruk2025)
  - Avatar görünüyor
  - Link: /doruk2025
  - Privacy hash: sha256(referrer_id + timestamp)
  - Ayarlardan göster/gizle yapılabiliyor

### 6. UI Kontrolleri

#### Profile Panel
- [x] "Ödüller" sekmesi görünüyor
- [x] Achievement kartları listeleniyor
- [x] Referrer profil fotosu + ismi görünüyor
- [x] Referrer ismine tıklanınca profil sayfası açılıyor
- [x] Settings dropdown çalışıyor
- [x] "Göster/Gizle" ayarları işe yarıyor
- [x] "Ödülü Al" butonu çalışıyor
- [x] Loading state doğru çalışıyor
- [x] Boş durum (ödül yok) görünümü

#### Achievement Card
- [x] Icon + Title + Date görünüyor
- [x] Referrer section (mor gradient)
- [x] Organization section (mavi gradient)
- [x] Reward section (amber gradient)
- [x] Privacy hash footer (ilk 16 karakter)
- [x] Animasyonlar çalışıyor

### 7. Hata Senaryoları

#### Geçersiz Referral Kodu
```
Link: http://localhost:3000/auth?ref=invalid123
Beklenen: Kayıt başarılı ama referral ödülü yok
```

#### Aynı Kullanıcı Tekrar Davet
```
Test2 ile Test1'i tekrar davet etmeye çalış
Beklenen: Duplicate referral hatası
```

## 🎨 UI Screenshot Beklentileri

### Profile Panel - Ödüller Sekmesi
```
┌─────────────────────────────────┐
│ 🎉 Hoş Geldin                   │
│ 3 gün önce                      │
│ ───────────────────────────    │
│ 🎁 +100MB storage              │
│ [Alındı ✓]                     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 💝 Ebedi Dostum                 │
│ 2 gün önce                      │
│ ───────────────────────────    │
│ 👤 Test User 1 (doruk2025) →   │
│ ───────────────────────────    │
│ 🎁 +200MB storage              │
│ [Ödülü Al]                     │
│                                │
│ 🔒 a3f9c8e1d2b4...             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🦋 Sosyal Kelebek               │
│ 1 gün önce                      │
│ ───────────────────────────    │
│ 🎁 +50MB storage               │
│ [Ödülü Al]                     │
└─────────────────────────────────┘
```

## ✅ Başarı Kriterleri

1. **Auto-Grant Çalışıyor:**
   - [ ] Welcome achievement (her kayıtta)
   - [ ] Eternal Friend (referral ile kayıtta)
   - [ ] Social Butterfly (referral tamamlanınca)

2. **Referrer Display:**
   - [ ] Avatar görünüyor
   - [ ] Username görünüyor
   - [ ] Link çalışıyor (/[username])
   - [ ] ExternalLink ikonu hover'da

3. **Settings Dropdown:**
   - [ ] Açılıyor/kapanıyor
   - [ ] Show/Hide referrer çalışıyor
   - [ ] Show/Hide organization çalışıyor
   - [ ] Database'e kaydediliyor

4. **Privacy Hashes:**
   - [ ] SHA256 hash oluşturuluyor
   - [ ] referrer_hash dolu
   - [ ] timestamp_hash dolu
   - [ ] İlk 16 karakter görünüyor

5. **Claim Flow:**
   - [ ] Ödülü Al butonu çalışıyor
   - [ ] reward_claimed güncelleniyor
   - [ ] Toast bildirimi geliyor
   - [ ] Button state değişiyor

## 🚀 Sonraki Adımlar

1. Migration'ları production'a deploy et
2. Email notification ekle (ödül kazanınca)
3. Achievement leaderboard sayfası
4. Özel organizasyon ödülleri
5. Sezonluk achievement'lar
6. Badge sistemi

---

**NOT:** Test hesaplarını test sonrası Supabase'den silebilirsin:
```sql
DELETE FROM profiles WHERE email IN ('test1@example.com', 'test2@example.com');
```
