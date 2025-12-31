# Philips Hue Kurulum Rehberi

## Hızlı Başlangıç

### Adım 1: Bridge'i Bul

```bash
# Router web arayüzü üzerinden Hue Bridge'in IP adresini bul
# veya aşağıdaki komutu kullanabilirsin:

# macOS/Linux:
ping hue-bridge.local

# Windows PowerShell:
Test-NetConnection -ComputerName hue-bridge.local
```

### Adım 2: API Key Oluştur

1. Bridge'in fiziksel düğmesine 10 saniye bas
2. Şu komutu çalıştır:

```bash
curl -X POST http://192.168.1.100/api \
  -H "Content-Type: application/json" \
  -d '{"devicetype":"canvasflow-app"}'
```

3. Yanıttan `username` değerini kopyala:
```json
[{"success":{"username":"o-Eq9Pf6KvZ_BYYNFZhYkZx8JK9NzFJnJPZfCPzfD_c"}}]
```

### Adım 3: .env.local Yapılandır

```bash
# .env.local'ı açıp şunu ekle:
NEXT_PUBLIC_HUE_BRIDGE_IP=192.168.1.100
HUE_API_KEY=o-Eq9Pf6KvZ_BYYNFZhYkZx8JK9NzFJnJPZfCPzfD_c
```

### Adım 4: Dependencies Yükle

```bash
npm install
```

### Adım 5: Teste Başla

```bash
npm run dev
# http://localhost:3000/canvas'a git
# Widget test paneli açılacak
```

---

## Özellikler

### Işık Kontrolü
- ✅ Işıkları aç/kapat
- ✅ Parlaklık ayarı (0-254)
- ✅ Renk seçimi (7 renk)
- ✅ Saturation kontrolü

### Grup Yönetimi
- ✅ Grupları görüntüle
- ✅ Grup işlemleri (bekleme)

### Sahne (Scene) Desteği
- ✅ Sahneleri listele
- ✅ Sahne aktivasyonu (bekleme)

---

## API Endpointleri

### GET /api/hue
Tüm ışık, grup ve sahne verilerini getir.

**Yanıt:**
```json
{
  "connected": true,
  "lights": [
    {
      "id": "1",
      "name": "Yatak Odası",
      "state": {"on": true, "bri": 254, "hue": 25500},
      "type": "Extended color light"
    }
  ],
  "groups": [...],
  "scenes": [...]
}
```

### POST /api/hue
Işık kontrol işlemleri.

**Toggle:**
```json
{
  "lightId": "1",
  "action": "toggle",
  "on": true
}
```

**Parlaklık:**
```json
{
  "lightId": "1",
  "action": "brightness",
  "brightness": 200
}
```

**Renk:**
```json
{
  "lightId": "1",
  "action": "color",
  "hue": 25500,
  "saturation": 200
}
```

---

## React Hook: usePhilipsHue

### Kullanım

```tsx
import { usePhilipsHue } from '@/hooks/use-philips-hue';

function MyComponent() {
  const hue = usePhilipsHue();

  return (
    <>
      <p>Bağlı: {hue.connected ? 'Evet' : 'Hayır'}</p>
      <p>Işık Sayısı: {hue.lights.length}</p>
      
      <button onClick={() => hue.toggleLight('1', true)}>
        Işık 1'i Aç
      </button>

      <input
        type="range"
        min="0"
        max="254"
        onChange={(e) => hue.setBrightness('1', parseInt(e.target.value))}
      />

      <button onClick={() => hue.setColor('1', 25500)}>
        Yeşil Yap
      </button>
    </>
  );
}
```

### API Referansı

```typescript
interface UsePhilipsHueReturn {
  // Durum
  connected: boolean;
  lights: HueLight[];
  groups: HueGroup[];
  loading: boolean;
  error: string | null;

  // Işlemler
  refresh: () => Promise<void>;
  toggleLight: (lightId: string, on: boolean) => Promise<void>;
  setBrightness: (lightId: string, brightness: 0-254) => Promise<void>;
  setColor: (lightId: string, hue: 0-65535, saturation?: 0-254) => Promise<void>;
}
```

---

## Renk Değerleri

| Renk | Hue | Kod |
|------|-----|-----|
| Kırmızı | 0 | #FF0000 |
| Turuncu | 5000 | #FF7F00 |
| Sarı | 12750 | #FFFF00 |
| Yeşil | 25500 | #00FF00 |
| Mavi | 46920 | #0000FF |
| Mor | 54600 | #8B00FF |
| Pembe | 56100 | #FF1493 |

---

## Sorun Giderme

### "Bridge bağlanılamıyor"

**Kontrol Etme:**
1. Bridge'in açık olduğundan emin ol
2. IP adresini kontrol et: `ping 192.168.1.100`
3. API Key'i kontrol et
4. Firewall kurallarını kontrol et

### "Link button not pressed" Hatası

1. Bridge'in üzerine 10 saniye bas
2. LED yanıp sönmeye başlayınca bırak
3. Hemen API çağrısını yap

### Işık Kontrolü Çalışmıyor

1. Işığın bridge'e bağlı olduğundan emin ol
2. `http://192.168.1.100`'da Hue uygulamasında kontrol et
3. API Key'in doğru olduğunu doğrula

---

## Kaynaklar

- [Philips Hue Developer Portal](https://developers.meethue.com/)
- [Local API Documentation](https://developers.meethue.com/develop/hue-api/lights-api/)
- [Hue API Explorer](https://developers.meethue.com/develop/hue-api/api-explorer/)
- [Bridge Setup Guide](https://support.philips.hue.com/en-US/article/KLZ_Article_en_US_How_to_connect_Hue_Bridge)
