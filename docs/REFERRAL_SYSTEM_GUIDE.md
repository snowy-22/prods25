# REFERRAL SYSTEM - Complete Implementation Guide

## 🎯 Özet

CanvasFlow'a **kapsamlı referral (davetiye) sistemi** eklendi:

- ✅ **Double-hash referral codes** (timestamped + hashed)
- ✅ **QR kod paylaşımı** ve tarama
- ✅ **Otomatik arkadaş ekleme** ve takip
- ✅ **Multi-tier ödül sistemi** (kayıt, doğrulama, ilk giriş)
- ✅ **Real-time senkronizasyon** (çoklu cihaz desteği)
- ✅ **Başarım (achievement) sistemi**
- ✅ **Profil ayarlarında tam yönetim paneli**

---

## 📁 Oluşturulan Dosyalar

### **1. Database Schema**
📄 `supabase/migrations/20260101_referral_system.sql`

**Tablolar:**
- `referral_codes` - Kullanıcı referans kodları (double-hash)
- `user_referrals` - Referral ilişkileri
- `referral_rewards` - Ödül tracking
- `referral_settings` - Kullanıcı tercihleri
- `device_sessions` - Multi-device yönetimi
- `sync_events` - Cross-device sync events

**Özellikler:**
- Row Level Security (RLS) aktif
- Auto-triggers (default referral code generation)
- Real-time publications enabled
- Indexes optimized for queries

---

### **2. Utility Functions**
📄 `src/lib/referral.ts`

**Fonksiyonlar:**
```typescript
generateReferralHash(userId, timestamp) // First hash
generateDoubleHash(originalCode, refereeId) // Second hash on usage
createReferralCode(userId, options)
verifyReferralCode(code)
applyReferralCode(code, refereeId, options)
verifyReferee(referralId) // Email verification
markRefereeFirstLogin(referralId)
getReferralStats(userId)
claimReferralReward(rewardId)
```

**Double-Hash Mekanizması:**
1. **Kayıt:** `SHA-256(userId + timestamp)` → İlk hash
2. **Kullanım:** `SHA-256(firstHash + refereeId + timestamp)` → Çift hash
3. **Güvenlik:** Her kullanım unique, geri dönüşü yok

---

### **3. API Endpoints**
📄 `src/app/api/referral/`

- **POST `/generate`** - Yeni referral code oluştur
- **POST `/verify`** - Kodu doğrula
- **POST `/apply`** - Signup'ta kodu uygula
- **GET `/stats`** - Kullanıcı istatistikleri
- **POST `/claim`** - Ödül talep et

---

### **4. UI Components**

#### **Auth Dialog (Güncellenmiş)**
📄 `src/components/auth-dialog.tsx`

- Signup formuna `referralCode` input eklendi
- URL'den `?ref=CODE` parametresi otomatik algılanır
- QR tarama butonu (placeholder)
- Referral code signup sonrası uygulanır

#### **Referral Verification Popup**
📄 `src/components/referral-verification-popup.tsx`

**3 Adımlı Flow:**
1. **Referral girişi** - QR veya manuel kod
2. **Email reminder** - Doğrulama hatırlatması
3. **Pending rewards** - Bekleyen ödülleri göster

**Kullanım:**
```tsx
<ReferralVerificationPopup
  isOpen={showPopup}
  onClose={() => setShowPopup(false)}
  detectedReferralCode={urlRefCode}
  userId={user.id}
  userEmail={user.email}
/>
```

#### **Referral Settings Panel**
📄 `src/components/referral-settings-panel.tsx`

**4 Sekme:**
1. **Genel** - Kod, QR, istatistikler
2. **Davetlilerim** - Refere edilen kullanıcılar
3. **Ödüllerim** - Reward geçmişi
4. **Ayarlar** - Otomatik arkadaş/takip, bildirimler

**Kullanım (Profile Settings):**
```tsx
<ReferralSettingsPanel userId={user.id} className="p-4" />
```

#### **QR Code Components**
📄 `src/components/qr-code.tsx`

**3 Component:**
```tsx
// QR gösterimi
<QRCodeDisplay value={shareUrl} size={256} />

// QR tarama
<QRCodeScanner 
  onScan={(data) => setReferralCode(extractCode(data))}
  onError={(err) => console.error(err)}
/>

// Paylaşım kartı
<QRCodeShareCard
  referralCode={code}
  username={username}
  onDownload={() => toast('QR indirildi')}
/>
```

---

### **5. Hooks & Utilities**

#### **Real-Time Sync Hook**
📄 `src/hooks/use-realtime-sync.ts`

**Özellikler:**
- Automatic device registration
- Cross-device tab sync
- Real-time referral notifications
- Heartbeat (device active tracking)

**Kullanım:**
```tsx
const { 
  deviceSession, 
  connectedDevices, 
  sendSyncEvent 
} = useRealtimeSync(user?.id);

// Sync event gönder
sendSyncEvent('tab_opened', { 
  tabTitle: 'New Tab',
  tabId: 'tab-123' 
});
```

#### **Reward System**
📄 `src/lib/rewards.ts`

**Fonksiyonlar:**
```typescript
unlockAchievement(userId, achievementId)
checkReferralAchievements(userId)
sendNotification(userId, { type, title, message })
getUserPoints(userId)
getAchievementProgress(userId)
```

**Predefined Achievements:**
- 🎯 İlk Davet (50 XP)
- 🌟 Davetiye Ustası - 5 davet (250 XP)
- 👑 Topluluk Lideri - 10 davet (500 XP)
- ✨ Tam Davetiye (100 XP)
- 👋 Hoş Geldin (25 XP)
- ✅ Doğrulanmış Üye (50 XP)

---

## 🔄 Kullanım Akışları

### **1. Yeni Kullanıcı Kaydı (Referral ile)**

```
1. Davetçi: Referral link paylaşır
   https://canvasflow.com/signup?ref=ABC123DEF456

2. Davet edilen: Link'e tıklar
   → Auth dialog açılır, ref code otomatik doldurulur

3. Signup tamamlanır
   → applyReferralCode() çağrılır
   → Double-hash oluşturulur
   → user_referrals kaydı eklenir
   → İlk ödüller oluşturulur (unclaimed)

4. Email doğrulama hatırlatması
   → ReferralVerificationPopup gösterilir

5. Email doğrulanınca
   → verifyReferee() çağrılır
   → Ek ödüller açılır
   → Bildirim gönderilir

6. İlk giriş
   → markRefereeFirstLogin()
   → Çift bonus ödül (double-hash bonus!)
   → Achievements unlock
```

### **2. OAuth/Google Signup**

```
1. Google ile giriş
   → OAuth redirect

2. Signup tamamlanınca
   → ReferralVerificationPopup otomatik açılır
   → URL'den ref code varsa gösterilir
   → Kullanıcı onaylar veya manuel girer

3. Email doğrulama ve ödüller
   → Normal flow devam eder
```

### **3. Profil Ayarları - Referral Yönetimi**

```
1. Profil → Referral Ayarları
   → ReferralSettingsPanel render edilir

2. Kullanıcı görebilir:
   - Kendi referral kodu
   - QR kod (indirilebilir)
   - Davet ettiği kullanıcılar
   - Kazanılan ödüller
   - İstatistikler

3. Ayarlar:
   - Otomatik arkadaş ekleme (ON/OFF)
   - Otomatik takip (ON/OFF)
   - Bildirimler
   - Privacy (davet sayısını göster/gizle)
```

---

## 🔒 Güvenlik Özellikleri

1. **Double-Hash Mechanism**
   - Her kullanım unique hash
   - Reverse engineering imkansız
   - Timestamp based

2. **Row Level Security (RLS)**
   - Her tablo RLS protected
   - Users can only access own data
   - System can create rewards (trusted)

3. **Usage Limits**
   - Max usage count (optional)
   - Expiration dates (optional)
   - Self-referral prevention

4. **Audit Trail**
   - Her referral işlemi loglanır
   - Sync events tracked
   - Device sessions monitored

---

## 📊 Real-Time Features

### **Supabase Realtime Subscriptions:**

```typescript
// 1. Referral Updates
channel('referrals-{userId}')
  .on('user_referrals', 'INSERT', handleNewReferral)

// 2. Reward Updates
channel('rewards-{userId}')
  .on('referral_rewards', 'INSERT', handleNewReward)

// 3. Sync Events
channel('sync-events-{userId}')
  .on('sync_events', 'INSERT', handleSyncEvent)
```

### **Cross-Device Sync Events:**
- `tab_opened` - Yeni sekme açıldı
- `content_updated` - İçerik güncellendi
- `settings_changed` - Ayarlar değişti
- `referral_reward` - Yeni ödül

---

## 🎨 UI/UX Patterns

### **Bildirim Toast'ları:**
```typescript
// Yeni davet
🎉 Yeni Davet!
"Bir arkadaşın davetini kabul etti!"

// Yeni ödül
🎁 Yeni Ödül!
"+100 XP - Arkadaşın hesabını doğruladı!"

// Başarım
🏆 Başarım Açıldı: Davetiye Ustası
"5 arkadaşını davet ettin!"

// Sync
🔄 Sync
"Sekme başka cihazda açıldı: New Tab"
```

### **Badge States:**
- ✓ Doğrulandı (verified)
- 👥 Arkadaş (friend)
- ✅ Alındı (claimed)
- 💎 +100 XP (points)

---

## 📦 Dependencies

**Yeni Paketler:**
```json
{
  "qrcode.react": "^4.x",
  "@zxing/library": "^0.x"
}
```

**Mevcut Bağımlılıklar:**
- Supabase (auth, database, realtime)
- React Hook Form + Zod
- Tailwind CSS + shadcn/ui
- Zustand (state management)

---

## 🚀 Deployment Checklist

### **1. Database Migration**
```bash
# Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20260101_referral_system.sql
```

### **2. Environment Variables**
```env
# .env.local (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_APP_URL=https://canvasflow.com
```

### **3. Supabase Realtime**
```sql
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime 
  ADD TABLE user_referrals, 
            referral_rewards, 
            device_sessions, 
            sync_events;
```

### **4. Test Flow**
1. ✅ Create account with referral code
2. ✅ Verify email
3. ✅ Check rewards in settings
4. ✅ Generate own referral code
5. ✅ Share QR code
6. ✅ Test cross-device sync

---

## 🔮 Future Enhancements

### **Phase 2 Ideas:**
1. **Advanced Analytics**
   - Referral funnel visualization
   - Conversion rate tracking
   - Revenue attribution

2. **Gamification**
   - Leaderboards
   - Seasonal challenges
   - Referral competitions
   - Badge tiers (Bronze, Silver, Gold)

3. **Social Features**
   - Referral groups
   - Team challenges
   - Social sharing templates

4. **Advanced QR**
   - Dynamic QR (track scans)
   - Branded QR codes
   - NFC sharing

5. **Referral Tiers**
   - VIP referrers
   - Ambassador program
   - Custom reward structures

---

## 📝 Integration Points

### **Profil Ayarları'na Entegrasyon:**

```tsx
// src/components/settings-dialog.tsx veya profile-page.tsx

import { ReferralSettingsPanel } from '@/components/referral-settings-panel';

// Settings menüsüne ekle
<TabsContent value="referrals">
  <ReferralSettingsPanel userId={user.id} />
</TabsContent>
```

### **Başarım Görüntüleme (Mini Menu):**

```tsx
// Profil sidebar'ına ekle
<div className="achievements-preview">
  <h4>🏆 Başarımlar</h4>
  <AchievementProgress userId={user.id} />
</div>
```

---

## 🎯 Key Metrics to Track

- **Total Referrals**: Toplam davet sayısı
- **Verified Referrals**: Doğrulanmış davetler
- **Conversion Rate**: Signup → Verification → First Login
- **Active Devices**: Kullanıcı başına aktif cihaz sayısı
- **Reward Claim Rate**: Ödül talep oranı
- **Achievement Unlock Rate**: Başarım açılma oranı

---

## ✅ Completed Features

- [x] Database schema (6 tables, RLS, triggers)
- [x] Double-hash referral code system
- [x] QR generation & scanning
- [x] Auth dialog referral input
- [x] Post-auth verification popup
- [x] Referral settings panel
- [x] Real-time sync (multi-device)
- [x] Reward system
- [x] Achievement tracking
- [x] Auto-friend/follow
- [x] Email verification flow
- [x] Notification system

---

## 📚 Developer Notes

### **Testing Referral Flow:**
```typescript
// 1. Create test user with referral
const testUser = await signUp('test@example.com', 'password', 'testuser');

// 2. Get referral code
const stats = await getReferralStats(testUser.id);
console.log('Referral Code:', stats.referralCode.code);

// 3. Apply to new user
const newUser = await signUp('referee@example.com', 'password', 'referee');
await applyReferralCode(stats.referralCode.code, newUser.id);

// 4. Verify referee
await verifyReferee(referralId);

// 5. Check rewards
const rewards = await supabase
  .from('referral_rewards')
  .select('*')
  .eq('user_id', testUser.id);
```

### **Debugging Real-Time:**
```typescript
// Enable detailed logs
supabase.channel('debug')
  .on('*', '*', (payload) => {
    console.log('Realtime event:', payload);
  })
  .subscribe();
```

---

**🎉 Sistem tamamen hazır! Supabase migration'ı çalıştırıp test edebilirsiniz.**

---

## 📞 Support & Questions

Sorularınız için Discord/GitHub Issues üzerinden ulaşabilirsiniz.

**Happy Coding! 🚀**
