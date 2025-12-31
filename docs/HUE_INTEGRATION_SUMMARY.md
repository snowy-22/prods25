# Philips Hue Integration - Özet

CanvasFlow'a Philips Hue smart lights entegrasyonu başarıyla eklendi!

## 📦 Eklenen Dosyalar

### 1. **Core Client**
- `src/lib/hue/client.ts` - Philips Hue API client (TypeScript)
  - Işıkları getir/kontrol et
  - Parlaklık ve renk ayarlama
  - Grup ve sahne yönetimi
  - 500ms timeout ile reliable connection

### 2. **React Hook**
- `src/hooks/use-philips-hue.ts` - React hook
  - `usePhilipsHue()` - State management
  - Otomatik polling (30 saniye)
  - Optimistic updates

### 3. **API Endpoint**
- `src/app/api/hue/route.ts` - Next.js API route
  - GET `/api/hue` - Tüm ışıkları getir
  - POST `/api/hue` - Kontrol işlemleri
  - Error handling ve timeout

### 4. **UI Widget**
- `src/components/widgets/hue-widget.tsx` - React component
  - Beautiful UI with shadcn/ui
  - Real-time light status
  - Brightness slider
  - 7-color picker
  - Connection status

### 5. **Dokümantasyon**
- `docs/PHILIPS_HUE_SETUP.md` - Detaylı kurulum rehberi
- `docs/HUE_SETUP_GUIDE.md` - API referansı ve örnekler

---

## 🚀 Hızlı Kurulum

### 1. Ortam Değişkenleri
```bash
# .env.local'a ekle:
NEXT_PUBLIC_HUE_BRIDGE_IP=192.168.1.100
HUE_API_KEY=your-api-key-here
```

### 2. Bridge IP Bul
```bash
# Router web arayüzünden veya:
ping hue-bridge.local
```

### 3. API Key Oluştur
```bash
# Bridge düğmesine 10 saniye bas, sonra:
curl -X POST http://192.168.1.100/api \
  -H "Content-Type: application/json" \
  -d '{"devicetype":"canvasflow-app"}'
```

### 4. Bağımlılıkları Yükle
```bash
npm install
```

### 5. Test Et
```bash
npm run dev
# PhilipsHueWidget'i CanvasFlow'a ekle veya
# Widget test panelini aç
```

---

## 📱 Kullanım Örnekleri

### Hook ile Kullanım
```tsx
import { usePhilipsHue } from '@/hooks/use-philips-hue';

function MyComponent() {
  const hue = usePhilipsHue();

  return (
    <>
      {/* Işık Listesi */}
      {hue.lights.map(light => (
        <div key={light.id}>
          <span>{light.name}</span>
          <button onClick={() => hue.toggleLight(light.id, !light.state.on)}>
            {light.state.on ? 'Aç' : 'Kapalı'}
          </button>
        </div>
      ))}

      {/* Parlaklık Kontrolü */}
      <input
        type="range"
        min="0"
        max="254"
        onChange={(e) => hue.setBrightness('1', parseInt(e.target.value))}
      />

      {/* Renk Seçimi */}
      <button onClick={() => hue.setColor('1', 25500)}>
        Yeşil Yap
      </button>

      {/* Durum */}
      {hue.loading && <p>Yükleniyor...</p>}
      {hue.error && <p className="text-red-500">{hue.error}</p>}
    </>
  );
}
```

### API ile Doğrudan Kullanım
```typescript
// Işıkları getir
const response = await fetch('/api/hue');
const data = await response.json();
console.log(data.lights);

// Işığı kontrol et
await fetch('/api/hue', {
  method: 'POST',
  body: JSON.stringify({
    lightId: '1',
    action: 'toggle',
    on: true
  })
});
```

---

## 🎨 Renk Referansı

| Renk | Hue Değeri |
|------|-----------|
| 🔴 Kırmızı | 0 |
| 🟠 Turuncu | 5000 |
| 🟡 Sarı | 12750 |
| 🟢 Yeşil | 25500 |
| 🔵 Mavi | 46920 |
| 🟣 Mor | 54600 |
| 🩷 Pembe | 56100 |

---

## 🔧 Desteklenen İşlemler

### Işık Kontrolü
- ✅ `toggleLight(lightId, on)` - Aç/Kapat
- ✅ `setBrightness(lightId, 0-254)` - Parlaklık
- ✅ `setColor(lightId, hue, saturation)` - Renk
- ✅ `getLight(lightId)` - Bilgi getir
- ✅ `getLights()` - Tüm ışıklar

### Grup İşlemleri
- ✅ `getGroups()` - Grup listesi
- ✅ `setGroupState(groupId, state)` - Grup kontrol

### Sahne (Scene)
- ✅ `getScenes()` - Sahne listesi
- ✅ `activateScene(groupId, sceneId)` - Sahne uygula

### Diğer
- ✅ `alertLight(lightId)` - Işığı kayıt altına al
- ✅ `setLightName(lightId, name)` - Ad değiştir
- ✅ `checkConnection()` - Bağlantı kontrolü

---

## 🐛 Sorun Giderme

### Bridge Bağlanılamıyor
```bash
# 1. Bridge açık mı?
ping 192.168.1.100

# 2. IP doğru mu?
# Router web arayüzünü kontrol et

# 3. Firewall?
# Lokal ağda engel var mı kontrol et
```

### API Key Hatası
```bash
# 1. Key doğru mu?
echo $HUE_API_KEY

# 2. Yeni key oluştur:
# Bridge düğmesine 10 saniye bas
curl -X POST http://192.168.1.100/api \
  -d '{"devicetype":"canvasflow-app"}'
```

### Işık Kontrol Çalışmıyor
1. Işığın bridge'e bağlı olduğunu doğrula
2. `http://192.168.1.100`'daki resmi Hue app'te test et
3. Log'ları kontrol et: `npm run dev`

---

## 📚 Kaynaklar

- [Philips Hue Developer Portal](https://developers.meethue.com/)
- [Local API Docs](https://developers.meethue.com/develop/hue-api/)
- [API Explorer](https://developers.meethue.com/develop/hue-api/api-explorer/)

---

## 🎯 Sonraki Adımlar (İsteğe Bağlı)

1. **Widget'i Canvas'a Ekle**
   - `PhilipsHueWidget` component'ini widget templates'e ekle
   - Widget panel'de toggle'ı aç

2. **Automation Kurula**
   - Zeit-based event triggers
   - Room-based light scenes
   - Voice control entegrasyon

3. **Advanced Features**
   - Group management
   - Scene scheduling
   - Color picker UI
   - Multi-bridge support

---

## ✨ Başarı!

Philips Hue entegrasyonu tamamlandı! 🎉

- ✅ Tüm ışıkları kontrol et
- ✅ Renkler değiştir
- ✅ Parlaklığı ayarla
- ✅ Sahneler uygula
- ✅ Gruplar yönet
