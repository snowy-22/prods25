# Philips Hue Personal API Integration Guide

## Kişisel API Özetü

Bu entegrasyon, Philips Hue Bridge'ınızı CanvasFlow'a tam kontrol altında tutmanızı sağlar. **Tüm veritabanı ve API bilgileri kişisel/şifreli olarak saklanır.**

## Sistem Mimarisi

### Veritabanı Katmanı (Supabase)
- **Tablo: `hue_bridges`** - Kişisel bridge yapılandırması
  - `bridge_id`: Fiziksel bridge kimliği
  - `ip_address`: Bridge'in lokal ağda IP adresi
  - `port`: 443 (varsayılan)
  - `username`: API token (şifreli)
  - `user_id`: Sahip kullanıcı (RLS ile korunmuş)

- **Tablo: `hue_lights`** - Bağlı akıllı ışıklar
  - Her ışık user_id ve bridge_id ile ilişkili
  - Durum (on/off, brightness, hue, saturation) depolanır
  - RLS: Sadece sahibi görebilir ve kontrol edebilir

- **Tablo: `hue_scenes`** - Kaydedilmiş sahne konfigürasyonları
  - RLS korumalı, kişisel veritabanında

- **Tablo: `hue_syncs`** - Canvas item'ları ışıklara senkronize etme
  - Canvas'ta bir item değiştiğinde ışık yanıt verir
  - Özel kurallar desteklenir

### Row-Level Security (RLS)
✅ **Tüm tablolar RLS tarafından korunmuş**
- Kullanıcılar sadece kendi verilerini görebilir
- API auth kontrolü yapılır

### Šifrelenmiş Depolama
- API tokens/credentials şifreli saklanır
- Supabase'in native encryption kullanılır

## Bilgisayarınızdaki Bridge Bilgileri

```
Bridge ID: ecb5fafffe2b8ae1
IP Adresi: 192.168.1.2
Port: 443
```

## Setup Adımları

### 1. Supabase Migration Dosyasını Uygula
```bash
# Migration otomatik olarak supabase/migrations/ klasöründe
# supabase push komutu ile uygulanacak
supabase db push
```

### 2. Environment Variables
`.env.local` dosyasında zaten ayarlandı:
```env
NEXT_PUBLIC_ENABLE_HUE_INTEGRATION=true
HUE_BRIDGE_IP=192.168.1.2
HUE_BRIDGE_PORT=443
HUE_BRIDGE_ID=ecb5fafffe2b8ae1
```

### 3. Frontend Setup

**Hue entegrasyonunu kullanmak:**
```typescript
import { useHueIntegration } from '@/hooks/use-hue-integration';

function MyComponent() {
  const {
    bridges,
    lights,
    isLoading,
    error,
    discoverBridge,
    linkBridge,
    fetchLights,
    setLightState,
  } = useHueIntegration();

  // Bridge'i bul
  const handleDiscover = async () => {
    const result = await discoverBridge('192.168.1.2', 443);
    if (result) {
      console.log('Bridge bulundu:', result);
    }
  };

  // Bridge'i hesaba bağla (İlk kurulum)
  const handleLink = async () => {
    const bridge = await linkBridge(
      'ecb5fafffe2b8ae1',
      '192.168.1.2',
      443
    );
    if (bridge) {
      console.log('Bridge bağlandı!');
    }
  };

  // Işıkları getir
  const handleFetchLights = async (bridgeId: string) => {
    const lights = await fetchLights(bridgeId);
    console.log('Işıklar:', lights);
  };

  // Işık kontrolü
  const handleToggleLight = async (bridgeId: string, lightId: string) => {
    await setLightState(bridgeId, lightId, { on: true, brightness: 254 });
  };

  return (
    <div>
      <button onClick={handleDiscover}>Bridge'i Bul</button>
      <button onClick={handleLink}>Bridge'i Bağla</button>
      {bridges.map(bridge => (
        <div key={bridge.id}>
          {bridge.name}
          <button onClick={() => handleFetchLights(bridge.id)}>
            Işıkları Getir
          </button>
        </div>
      ))}
    </div>
  );
}
```

## API Endpoints

### POST /api/hue
Tüm işlemler POST üzerinden gerçekleşir.

**Auth:** `Authorization: Bearer {token}` gerekli

**Actions:**

#### discover
Bridge'i otomatik olarak bul
```json
{
  "action": "discover",
  "ipAddress": "192.168.1.2",
  "port": 443
}
```

#### link
Bridge'i hesaba bağla (ilk kurulum)
```json
{
  "action": "link",
  "bridgeId": "ecb5fafffe2b8ae1",
  "ipAddress": "192.168.1.2",
  "port": 443
}
```

#### get-lights
Bağlı ışıkları getir ve veritabanına kaydet
```json
{
  "action": "get-lights",
  "bridgeId": "ecb5fafffe2b8ae1",
  "username": "[API token]",
  "ipAddress": "192.168.1.2",
  "port": 443
}
```

#### set-light-state
Işık durumunu değiştir
```json
{
  "action": "set-light-state",
  "lightId": "1",
  "state": {
    "on": true,
    "brightness": 200,
    "hue": 10000,
    "saturation": 254
  },
  "username": "[API token]",
  "ipAddress": "192.168.1.2",
  "port": 443
}
```

#### get-bridges
Kullanıcının tüm bridge'lerini getir
```json
{
  "action": "get-bridges"
}
```

#### delete-bridge
Bridge'i hesaptan sil
```json
{
  "action": "delete-bridge",
  "bridgeId": "[bridge id]"
}
```

### GET /api/hue
Kullanıcının bridge'lerini ve ışıklarını getir (cache)

**Auth:** `Authorization: Bearer {token}` gerekli

**Parameters:**
- `bridgeId` (optional): Belirli bridge'e ait ışıkları getir

## Veri Akışı

```
┌─────────────────────────────────────────┐
│       Canvas Application (Client)       │
│    - useHueIntegration() Hook          │
│    - Zustand Store (hueBridges, etc)   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      API Routes (/api/hue)              │
│  - Auth kontrolü (user_id)              │
│  - Hue API call'ları                    │
│  - Database sync                        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│   Supabase (Encrypted Personal DB)      │
│  - RLS Protected Tables                 │
│  - user_id by row ownership             │
│  - Credentials şifreli                  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│    Philips Hue Bridge (Local Network)   │
│    192.168.1.2:443                      │
│    ID: ecb5fafffe2b8ae1                 │
└─────────────────────────────────────────┘
```

## Güvenlik

✅ **RLS (Row-Level Security)**
- Her kullanıcı sadece kendi verilerini görebilir
- Veritabanı seviyesinde zorunlu

✅ **API Token Şifrelemesi**
- Username/API tokens şifreli depolanır

✅ **HTTPS-Only**
- Bridge iletişimi 443 port'u üzerinden (HTTPS)

✅ **Auth Header**
- Tüm istekler `Authorization: Bearer {token}` gerektirir
- Supabase token'ı doğrulanır

## Troubleshooting

### Bridge Bulunamıyor
- Bridge'in açık olduğundan emin ol
- IP adresi doğru kontrol et
- Aynı ağda olduğunu doğrula

### API Token Hatası
- Bridge sayfasında developer hesabı oluştur
- Token'ı yenile ve yeniden bağla

### HTTPS Uyarısı
- Local ağda self-signed sertifikaları kabul et
- Node.js'de NODE_TLS_REJECT_UNAUTHORIZED=0 gerekebilir

## Sonraki Adımlar

1. ✅ Supabase migration'ı uygula
2. ✅ Bridge'i keş et ve bağla
3. ✅ Işıkları kontrol panelinde görüntüle
4. Canvas items'ları ışıklara senkronize et (opsiyonel)
5. Sahne oluştur ve kaydet
