# Philips Hue API & Lokal Bridge Kurulumu

## 1. Bridge Bulma

### Adım 1: Local Network'de Bridge IP'sini Bul

#### Yöntem A: Automatic Discovery (Önerilen)
```bash
# Node.js ile bridge'i otomatik bul
npm install node-hue-api

# veya
npm install axios
```

#### Yöntem B: Manual - Hue Bridge Web Arayüzü
1. Router'a giriş yap
2. Bağlı cihazları ara
3. "Philips Hue" veya "Hue Bridge" cihazını bul
4. IP adresini not et (örn: `192.168.1.100`)

### Adım 2: Bridge IP'sini Test Et
```bash
# Bridge'e ping at
ping 192.168.1.100

# Bridge web arayüzüne erişim
# Tarayıcıda: http://192.168.1.100
```

---

## 2. API Key (Username) Alma

### Adım 1: Bridge'de Kullanıcı Oluştur

#### cURL ile:
```bash
curl -X POST http://192.168.1.100/api \
  -H "Content-Type: application/json" \
  -d '{"devicetype":"canvasflow-app#doruk-pc"}'

# Yanıt:
# [{"error":{"type":101,"address":"/","description":"link button not pressed"}}]
```

#### Adım 2: Bridge'deki Fiziksel Düğmeyi Basın
- Hue Bridge'in üzerine 10 saniye basılı tut
- LED bıraktığında API çağrısını tekrar yap

```bash
curl -X POST http://192.168.1.100/api \
  -H "Content-Type: application/json" \
  -d '{"devicetype":"canvasflow-app#doruk-pc"}'

# Başarılı yanıt:
# [{"success":{"username":"o-Eq9Pf6KvZ_BYYNFZhYkZx8JK9NzFJnJPZfCPzfD_c"}}]
```

**Username'i kopyala ve sakla!**

---

## 3. Node.js Client Kurulumu

### package.json'a Ekle
```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

```bash
npm install
```

---

## 4. Ortam Değişkenleri Ayarla

### `.env.local`'a Ekle
```env
# Philips Hue Configuration
NEXT_PUBLIC_HUE_BRIDGE_IP=192.168.1.100
HUE_API_KEY=o-Eq9Pf6KvZ_BYYNFZhYkZx8JK9NzFJnJPZfCPzfD_c
```

---

## 5. API Endpointleri

### Tüm Işıkları Getir
```
GET /api/lights
Authorization: Bearer {API_KEY}
```

**Yanıt:**
```json
{
  "1": {
    "state": {"on": true, "bri": 254, "hue": 10000, "sat": 100},
    "name": "Yatak Odası Işığı",
    "type": "Extended color light"
  },
  "2": {
    "state": {"on": false},
    "name": "Mutfak Işığı",
    "type": "Color light"
  }
}
```

### Işığı Açıp Kapat
```
PUT /api/{username}/lights/{light_id}/state
Content-Type: application/json

{"on": true}
```

### Renk & Parlaklık Değiştir
```
PUT /api/{username}/lights/{light_id}/state
Content-Type: application/json

{
  "on": true,
  "bri": 200,      // 0-254
  "hue": 25500,    // 0-65535 (renk)
  "sat": 200       // 0-254 (doygunluk)
}
```

### Sahne (Scene) Uygula
```
PUT /api/{username}/groups/{group_id}/action
Content-Type: application/json

{"scene": "energize"}
```

---

## 6. Test Komutları

```bash
# Username: o-Eq9Pf6KvZ_BYYNFZhYkZx8JK9NzFJnJPZfCPzfD_c
# Bridge IP: 192.168.1.100

# Tüm ışıkları listele
curl http://192.168.1.100/api/o-Eq9Pf6KvZ_BYYNFZhYkZx8JK9NzFJnJPZfCPzfD_c/lights

# 1 numaralı ışığı aç
curl -X PUT http://192.168.1.100/api/o-Eq9Pf6KvZ_BYYNFZhYkZx8JK9NzFJnJPZfCPzfD_c/lights/1/state \
  -H "Content-Type: application/json" \
  -d '{"on": true}'

# 1 numaralı ışığı kapat
curl -X PUT http://192.168.1.100/api/o-Eq9Pf6KvZ_BYYNFZhYkZx8JK9NzFJnJPZfCPzfD_c/lights/1/state \
  -H "Content-Type: application/json" \
  -d '{"on": false}'

# Parlaklığı değiştir (200/254)
curl -X PUT http://192.168.1.100/api/o-Eq9Pf6KvZ_BYYNFZhYkZx8JK9NzFJnJPZfCPzfD_c/lights/1/state \
  -H "Content-Type: application/json" \
  -d '{"on": true, "bri": 200}'
```

---

## 7. Renk Kodu Tablosu

| Renk | Hue Değeri |
|------|-----------|
| Kırmızı | 0 |
| Turuncu | 5000 |
| Sarı | 12750 |
| Yeşil | 25500 |
| Mavi | 46920 |
| Mor | 54600 |
| Pembe | 56100 |

---

## 8. Hata Çözümü

### "link button not pressed" Hatası
- Bridge'in üzerine 10 saniye bas
- LED yanıp sönmeye başlayınca bas

### Bridge'e Bağlanamıyor
- Bridge ve bilgisayar aynı WiFi'de mi?
- IP adresini kontrol et
- Firewall kurallarını kontrol et

### API Key Hatası
- Doğru username'i kullandığından emin ol
- Bridge'e bağlantıyı test et

---

## 9. Kaynaklar

- [Philips Hue API Docs](https://developers.meethue.com/)
- [Local Bridge Documentation](https://developers.meethue.com/develop/hue-api/lights-api/)
- [API Explorer](https://developers.meethue.com/develop/hue-api/api-explorer/)
