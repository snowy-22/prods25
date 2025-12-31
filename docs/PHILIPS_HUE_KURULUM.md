# Philips Hue Entegrasyonu - Kurulum ve Kullanım

## 📋 İçindekiler
1. [Gereksinimler](#gereksinimler)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Bridge IP Adresini Bulma](#bridge-ip-adresini-bulma)
4. [API Key Oluşturma](#api-key-oluşturma)
5. [Yapılandırma](#yapılandırma)
6. [Widget Kullanımı](#widget-kullanımı)
7. [Sorun Giderme](#sorun-giderme)

---

## 🎯 Gereksinimler

✅ **Donanım:**
- Philips Hue Bridge (v2 veya üstü önerilir)
- En az 1 Philips Hue ışık veya aksesuarı
- Bridge ve bilgisayarınızın aynı yerel ağa (WiFi/LAN) bağlı olması

✅ **Yazılım:**
- Node.js 18+ (kurulu)
- CanvasFlow uygulaması (bu proje)
- `axios` kütüphanesi (yüklendi ✓)

---

## 🚀 Hızlı Başlangıç

### 1. Bridge IP Adresini Bulma

**Yöntem A: Otomatik Keşif (En Kolay)**
```bash
# Tarayıcınızda şu adresi açın:
https://discovery.meethue.com/
```
Çıktı:
```json
[
  {
    "id": "001788fffe...",
    "internalipaddress": "192.168.1.100"  # ← Bu IP'yi kopyalayın
  }
]
```

**Yöntem B: Router Arayüzü**
1. Router admin paneline giriş yapın (genellikle `192.168.1.1` veya `192.168.0.1`)
2. "Bağlı Cihazlar" veya "DHCP Client List" bölümüne gidin
3. "Philips-hue" adlı cihazı bulun
4. IP adresini not alın

**Yöntem C: Hue Uygulaması**
1. Philips Hue uygulamasını açın (iOS/Android)
2. Ayarlar → Hue Bridge → i (bilgi) simgesine tıklayın
3. IP adresini görüntüleyin

---

### 2. API Key Oluşturma

**Adım 1: Bridge'deki butona basın**
- Philips Hue Bridge'in üzerindeki **fiziksel tuşa** basın (30 saniye içinde devam edin)

**Adım 2: POST isteği gönderin**
```bash
# PowerShell'de çalıştırın:
curl -X POST "http://192.168.1.100/api" `
  -H "Content-Type: application/json" `
  -d '{\"devicetype\":\"canvasflow#user\"}'
```

**Başarılı Yanıt:**
```json
[
  {
    "success": {
      "username": "abcd1234efgh5678ijklmnopqrstuvwx"  # ← API Key
    }
  }
]
```

**Hata Yanıtları:**
- `{"error": {"type": 101}}` → Bridge tuşuna basmadınız, tekrar deneyin
- `{"error": {"type": 7}}` → Geçersiz JSON formatı

**API Key'i kopyalayın ve güvenli bir yerde saklayın!**

---

## ⚙️ Yapılandırma

### `.env.local` Dosyasını Düzenleyin

```env
# Philips Hue Bridge Yapılandırması
NEXT_PUBLIC_HUE_BRIDGE_IP=192.168.1.100  # ← Kendi IP'nizi yazın
HUE_API_KEY=abcd1234efgh5678ijklmnopqrstuvwx  # ← Kendi API Key'inizi yazın
```

**Önemli Notlar:**
- `NEXT_PUBLIC_HUE_BRIDGE_IP` → Client-side kullanım için (React bileşenleri)
- `HUE_API_KEY` → Server-side kullanım için (API route güvenliği)
- **Asla API Key'i GitHub'a push etmeyin!** (`.env.local` zaten `.gitignore`'da)

---

## 🎨 Widget Kullanımı

### Canvas'a Widget Ekleme

1. **CanvasFlow uygulamasını başlatın:**
   ```bash
   npm run dev
   ```

2. **Widget'ı ekleyin:**
   - Canvas sayfasına gidin
   - Sağ üst köşedeki "+" butonuna tıklayın
   - "Widgets" → "Philips Hue" seçin

3. **Kontroller:**
   - **Bağlantı Durumu:** Üst kısımda yeşil WiFi simgesi = bağlı
   - **Işık Listesi:** Tüm Hue ışıklarınızı görüntüler
   - **Açma/Kapama:** Her ışığın yanındaki buton
   - **Parlaklık:** Slider (0-100%)
   - **Renk Seçimi:** 7 hazır renk (Kırmızı, Turuncu, Sarı, Yeşil, Mavi, Mor, Pembe)
   - **Yenileme:** Sağ üst köşedeki yenileme butonu

### Widget Özellikleri

```typescript
// Widget otomatik olarak her 30 saniyede bir güncellenir
// Manuel yenileme: Refresh butonuna tıklayın

// Işıkları programatik olarak kontrol etmek için:
import { usePhilipsHue } from '@/hooks/use-philips-hue';

const { toggleLight, setBrightness, setColor } = usePhilipsHue();

// Işığı aç/kapa
await toggleLight('1', true);

// Parlaklığı ayarla (0-254)
await setBrightness('1', 200);

// Renk ayarla (hue: 0-65535, saturation: 0-254)
await setColor('1', 25500, 254); // Yeşil
```

---

## 🔧 Sorun Giderme

### Problem 1: "Bağlantı Kurulamıyor"

**Çözüm Adımları:**
1. Bridge ve bilgisayarınız aynı ağda mı?
   ```bash
   ping 192.168.1.100  # Bridge IP'niz
   ```
2. IP adresi doğru mu? `https://discovery.meethue.com/` ile tekrar kontrol edin
3. Bridge açık ve aktif mi? Mavi LED yanıyor mu?
4. API Key doğru mu? Yeniden oluşturmayı deneyin

### Problem 2: "401 Unauthorized"

**Sebep:** API Key geçersiz veya eksik

**Çözüm:**
1. API Key'i yeniden oluşturun (yukarıdaki adımları izleyin)
2. `.env.local` dosyasında `HUE_API_KEY` güncel mi?
3. Dev server'ı yeniden başlatın:
   ```bash
   npm run dev
   ```

### Problem 3: Widget Yüklenmiyor

**Çözüm:**
1. Konsolu kontrol edin (F12):
   ```javascript
   // Hata varsa göreceksiniz
   ```
2. API endpoint çalışıyor mu:
   ```bash
   curl http://localhost:3000/api/hue
   ```
3. TypeScript hataları var mı:
   ```bash
   npm run typecheck
   ```

### Problem 4: Işıklar Görünüyor Ama Kontrol Edilemiyor

**Çözüm:**
1. Bridge'in firmware güncel mi? Hue uygulamasından kontrol edin
2. Işıklar erişilebilir durumda mı? (bridge menzilinde)
3. API rate limit aşılmış olabilir (saniyede maks. 10 istek)

---

## 📚 Teknik Detaylar

### Dosya Yapısı

```
src/
├── lib/hue/
│   └── client.ts              # Philips Hue API client
├── hooks/
│   └── use-philips-hue.ts    # React hook (state management)
├── app/api/hue/
│   └── route.ts              # Next.js API endpoint
└── components/widgets/
    └── hue-widget.tsx        # UI bileşeni
```

### API Endpoints

**GET `/api/hue`** - Tüm ışıkları, grupları ve sahneleri getir
```typescript
Response: {
  connected: boolean,
  lights: HueLight[],
  groups: HueGroup[],
  scenes: HueScene[]
}
```

**POST `/api/hue`** - Işık kontrolü
```typescript
Request: {
  lightId: string,
  action: 'toggle' | 'brightness' | 'color',
  on?: boolean,      // toggle için
  brightness?: number,  // 0-254
  hue?: number,      // 0-65535
  saturation?: number   // 0-254
}
Response: {
  success: boolean
}
```

### Renk Değerleri

| Renk    | Hue   | Saturation |
|---------|-------|------------|
| Kırmızı | 0     | 254        |
| Turuncu | 5461  | 254        |
| Sarı    | 12750 | 254        |
| Yeşil   | 25500 | 254        |
| Mavi    | 46920 | 254        |
| Mor     | 47103 | 254        |
| Pembe   | 56100 | 254        |
| Beyaz   | 0     | 0          |

---

## 🎓 İleri Düzey Özellikler

### 1. Grup Kontrolü
```typescript
import { PhilipsHueClient } from '@/lib/hue/client';

const hue = new PhilipsHueClient({
  bridgeIP: process.env.NEXT_PUBLIC_HUE_BRIDGE_IP!,
  apiKey: process.env.HUE_API_KEY!
});

// Tüm oturma odası ışıklarını kontrol et
await hue.setGroupState('1', { on: true, bri: 200 });
```

### 2. Sahne Aktivasyonu
```typescript
// Önceden ayarlanmış sahneyi etkinleştir
await hue.recallScene('scene-123');
```

### 3. Renk Geçişleri (Smooth Transitions)
```typescript
// 5 saniyede kırmızıdan yeşile geçiş
await hue.setLightState('1', {
  on: true,
  hue: 25500,  // Yeşil
  sat: 254,
  transitiontime: 50  // 5 saniye (x100ms)
});
```

### 4. Efektler
```typescript
// Yanıp sönme efekti
await hue.setLightState('1', {
  on: true,
  alert: 'lselect'  // 15 saniye yanıp söner
});

// Renk döngüsü
await hue.setLightState('1', {
  on: true,
  effect: 'colorloop'  // Tüm renklerde döner
});
```

---

## 🔒 Güvenlik Notları

1. **API Key Gizliliği:**
   - API Key'i asla client-side kodda hardcode etmeyin
   - `.env.local` kullanın ve `.gitignore`'a ekleyin
   - Production'da environment variables kullanın (Vercel/Netlify)

2. **HTTPS Kullanımı:**
   - Production'da HTTPS zorunlu (Hue API v2 gereksinimi)
   - Yerel geliştirmede HTTP yeterli

3. **Rate Limiting:**
   - Philips API: Saniyede maks. 10 istek
   - Widget: 30 saniye polling interval (ayarlanabilir)

---

## 📖 Kaynaklar

- [Philips Hue API Documentation](https://developers.meethue.com/)
- [Hue Developer Portal](https://developers.meethue.com/develop/get-started-2/)
- [Color Theory Guide](https://developers.meethue.com/develop/application-design-guidance/color-conversion/)

---

## ✅ Kurulum Checklist

- [ ] Bridge IP adresini bul
- [ ] API Key oluştur (bridge butonuna bas)
- [ ] `.env.local` dosyasını düzenle
- [ ] `npm install axios` çalıştır
- [ ] `npm run dev` ile test et
- [ ] Widget'ı canvas'a ekle
- [ ] Bağlantı durumunu kontrol et
- [ ] Işıkları test et (aç/kapa)
- [ ] Parlaklık ve renk kontrollerini dene
- [ ] Production build test et: `npm run build`

**Kurulum tamamlandı! 🎉**

Sorularınız için: [GitHub Issues](https://github.com/your-repo/issues)
