# Advanced Link & Player Management System - Türkçe Kılavuz

## 📢 Duyuru

CanvasFlow artık **gelişmiş link ve oynatıcı yönetim sistemi** ile donatılmıştır! Bu sistem linkleri oynatıcılardan ayırarak, özel stil seçenekleri sunarak, paylaşım kartları oluşturarak ve toplu oynatıcı kontrollerine sahiptir.

---

## 🎯 Özellik Özeti

### 1️⃣ Stil Ön Ayarları (Style Presets)

**Link ekleme sırasında otomatik açılır**

- **6 Hazır Şablon:**
  1. **Minimal** - Sınır yok, sadık tasarım
  2. **Kart** - Beyaz background, hafif gölge
  3. **Modern** - Mavi tema, parlak tasarım
  4. **Cam Efekti** - Glassmorphism style
  5. **Neon** - Parlak renkler ve gölgeler
  6. **Koyu** - Dark mode, profesyonel

- **Özelleştirmeler:**
  - Köşe yuvarlaması (0-50 pixel)
  - Gölge seviyeleri (yok/hafif/orta/ağır)
  - Canlı önizleme
  - Renk seçenekleri

**Kullanım:**
```
Canvas'ta URL yapıştır → Style Dialog aç → Stil seç → Uygula
```

---

### 2️⃣ Paylaşım Kartları (Share Cards)

**Canvas'taki öğelerinden paylaşım kartları oluştur**

- **5 Farklı Şablon:**
  1. **Minimal** - Başlık ve resim
  2. **Detaylı** - Açıklama ve metadata ile
  3. **Sosyal Medya** - Instagram gibi kare format
  4. **Portfolio** - Profesyonel görünüm
  5. **Özel** - Tam özelleştirme

- **İşlemler:**
  - ✅ Öğe seçimi (multi-select)
  - ✅ Şablon değiştirme
  - ✅ HTML indir
  - ✅ JSON indir
  - ✅ HTML panoya kopyala

**Erişim:**
```
Canvas Share Toolbar → "Paylaş" → "Paylaşım Kartları"
```

---

### 3️⃣ Canvas Paylaşım & Dışa Aktarım

**Link, QR, Sosyal Medya ve Dosya Dışa Aktarımı**

- **Paylaşım Seçenekleri:**
  - 🔗 Bağlantı (custom mesaj ile)
  - 📱 Twitter
  - 📱 Facebook
  - 📱 LinkedIn
  - ✉️ E-posta
  - 📲 QR Kod

- **Dışa Aktarım:**
  - 📄 HTML (responsive, inline CSS)
  - 📊 JSON (veri tabanı için)

**Erişim:**
```
Toolbar → "Paylaş" → İstediğin seçeneği seç
```

---

### 4️⃣ Toplu Oynatıcı Kontrolleri

**Tüm YouTube ve Video oynatıcıları bir butonla kontrol et**

**Kontrol Düğmeleri:**
- ▶️ **Tümünü Oynat** - Tüm videoları başlat
- ⏸️ **Tümünü Duraklat** - Tüm videoları duraklat
- ⏭️ **Sonraki** - Sonraki videoyu oynat
- ⏮️ **Önceki** - Önceki videoyu oynat
- 🔊 **Ses Kontrolü** - Ses seviyesi (0-100%)
- 🔇 **Sessize Al** - Tüm videoları sessiz yap

**Ses Hızlı Ayarları:**
- Sessiz (0%)
- Düşük (25%)
- Orta (50%)
- Yüksek (75%)
- Maksimum (100%)

**Durum Göstergesi:**
- Aktif oynatıcı sayısı
- Mevcut ses seviyesi
- Yeşil puls (canlanmış gösterge)

**Erişim:**
```
Üst Menü Çubuğu → Oynatıcı Kontrolleri
```

---

### 5️⃣ YouTube Render Optimizasyonu

**YouTube videoları %40 daha büyük render alanında başlar**

- **Özellikler:**
  - ✅ Mute'lu başlama (video sessiz açılır)
  - ✅ Sekme geçişinde arka planda mute (güvenlik için)
  - ✅ Arka planda çalışmaya devam etme
  - ✅ %40 ekstra render alanı (560x315 → 784x441)

**Davranış:**
```
1. Video eklenir → otomatik mute
2. Kullanıcı videoyu oynatır → sesi açılır (geri almak gerekirse)
3. Başka sekmeye geçer → otomatik mute
4. Geri dönerse → sesiz durum hatırlanır
```

---

### 6️⃣ Smart Player Rendering

**Ön izleme yeni render yaratmaz, mevcut olanı büyütür**

- **Özellikler:**
  - ✅ YouTube iframe (mute'lu)
  - ✅ HTML5 Video/Audio (mute'lu)
  - ✅ Website embeds
  - ✅ Resim gösterimi
  - ✅ Smooth zoom animasyonu
  - ✅ Büyüt/Küçült kontrolü

**Ön İzleme Modu:**
- Yeni iframe oluşturmaz
- Mevcut player'ı %40 daha küçük gösterir (1/1.4)
- Hover üzerine "Büyüt" butonu gösterir
- Smooth animation (300ms)

**Tam Ekran Modu:**
- Player maksimum boyutta gösterilir
- Siyah background ile focus
- Kapatma butonu ile çıkış

---

## 🔄 İş Akışı Örnekleri

### Örnek 1: Link Ekleme & Stilize Etme

```
1. Araç çubuğundan "+" tıkla
2. URL yapıştır: https://example.com
3. "Link olarak ekle" seç
4. Style Dialog aç
5. "Modern" şablonunu seç
6. İsteğe göre köşe yuvarlamasını ayarla (16px)
7. Gölge efektini seç (Orta)
8. "Stil Uyguıyla Ekle" tıkla
9. Link canvas'a stilize olarak eklenir
```

### Örnek 2: Canvas Paylaşım Kartları

```
1. Paylaş Toolbar açılır
2. "Paylaşım Kartları" seç
3. "Şablon Seç" tabında "Portfolio" tıkla
4. "Öğeleri Seç" tabında istediğin videoları seç
5. "Dışa Aktar" tabında "HTML İndir" tıkla
6. Paylaşım sayfası HTML olarak indirilir
7. Web sunucusuna yükle ve paylaş
```

### Örnek 3: Oynatıcı Kontrol

```
1. Canvas'ta 3 YouTube videosu var
2. Üst menüde "Toplu Kontroller" bölümü görünür
3. "Tümünü Oynat" tıkla → 3 video birden başlar
4. Ses slider'ına dokunup %50'ye al
5. "Sessize Al" tıkla → tüm videolar mute
6. Başka sekmeye geç → otomatik mute yapılır
7. Geri dön → ses durum hatırlanır
```

---

## 🎛️ Teknik Detaylar

### Dışa Aktarım Formatları

**HTML Export:**
- ✅ Responsive CSS (mobile-friendly)
- ✅ Inline styling (ayrı CSS dosyasına gerek yok)
- ✅ Metadata korunur
- ✅ Tüm öğe türlerini destekler
- ✅ Güzel formatlama

**JSON Export:**
- ✅ Tüm öğe verilerini içerir
- ✅ İstatistikler eklenir
- ✅ Veri tabanına import edilebilir
- ✅ Version bilgisi
- ✅ Timestamp

### Keyboard Shortcuts (Gelecek)

Bu özellikler yakında eklenecek:
- `Ctrl+Space` → Tümünü Oynat/Duraklat
- `Ctrl+M` → Tümünü Sessize Al/Aç
- `Ctrl+<` → Önceki
- `Ctrl+>` → Sonraki

---

## 📚 Bileşen Referansı

### StylePresetDialog
```typescript
import { StylePresetDialog, STYLE_PRESETS } from '@/components/style-preset-dialog';

<StylePresetDialog
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  onSelect={handleStyleSelect}
  defaultPreset={STYLE_PRESETS[1]}
/>
```

### ShareCardsDialog
```typescript
import { ShareCardsDialog } from '@/components/share-cards-dialog';

<ShareCardsDialog
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  items={canvasItems}
/>
```

### CanvasShareToolbar
```typescript
import { CanvasShareToolbar } from '@/components/canvas-share-toolbar';

<CanvasShareToolbar
  canvasTitle="My Canvas"
  canvasUrl="https://..."
  onExportHTML={() => {...}}
  onExportJSON={() => {...}}
/>
```

### TopMenuBarControls
```typescript
import { TopMenuBarControls } from '@/components/top-menu-bar-controls';

<TopMenuBarControls
  activePlayersCount={3}
  currentVolume={50}
  isMuted={false}
  onPlayAll={() => {...}}
  onPauseAll={() => {...}}
  onVolumeChange={(vol) => {...}}
/>
```

### useYoutubeRenderOptimizer
```typescript
import { useYoutubeRenderOptimizer } from '@/hooks/use-youtube-render-optimizer';

const optimizer = useYoutubeRenderOptimizer();

// Kullanım
const size = optimizer.getOptimizedSize();
optimizer.registerPlayer('video-1', player);
optimizer.controlAllPlayers('play');
optimizer.setVolumeForAll(50);
```

### SmartPlayerRender
```typescript
import { SmartPlayerRender } from '@/components/smart-player-render';

<SmartPlayerRender
  item={videoItem}
  isPreview={false}
  onExpand={() => {...}}
/>
```

---

## 🎓 En İyi Uygulamalar

### Link Ekleme
✅ **İyi:**
- Link ekle → Stil seç → Özelleştir
- Farklı bölümler için farklı stiller kullan
- Uyum sağlamayan renkler seçme

❌ **Kötü:**
- Çok fazla stil kullanarak karmaşa yaratma
- Kontrastı düşük renk kombinasyonları
- Çok kalın bordurlar (readability için)

### Paylaşım Kartları
✅ **İyi:**
- İlgili öğeleri gruplama
- Uygun şablon seçimi
- HTML'i web sunucuya yükleme

❌ **Kötü:**
- Sayfada sınırsız öğe kullanma
- Karışık renk kombinasyonları
- Metadata'sız paylaşım

### Oynatıcı Kontrolleri
✅ **İyi:**
- Videoları mute'lu başlatma
- Ses seviyesini 50% başlatma
- Toplu kontrol kullanma

❌ **Kötü:**
- Otomatik oynatma açık bırakma
- Ses başlatma (rahatsız edebilir)
- Tüm videoları tam volume'de tutma

---

## 🐛 Sorun Giderme

### Stil Dialog Açılmıyor
```
Çözüm: canvas.tsx'de isStylePresetOpen state'i var mı kontrol et
setIsStylePresetOpen(true) çağrıldı mı?
```

### Oynatıcı Kontrolü Çalışmıyor
```
Çözüm: YouTube API yüklenmiş mi?
useYoutubeRenderOptimizer hook register edilen playerlar var mı?
```

### Dışa Aktarım Boş HTML Veriyor
```
Çözüm: allRawItems state'i dolu mu?
exportCanvasAsHTML() fonksiyonuna items geçildi mi?
```

### QR Kod Görünmüyor
```
Çözüm: İnternet bağlantısı var mı? (api.qrserver.com'a erişim)
URL encode'lanmış mı?
```

---

## 🚀 Performans İpuçları

- 💡 Çok fazla YouTube videosu aynı anda eklememe
- 💡 Dışa aktarım öncesi gereksiz öğeleri silme
- 💡 Paylaşım kartları için orta düzey öğe sayısı (5-50)
- 💡 Preview modunda öğeler küçük gösterilir (bellek tasarrufu)
- 💡 Background tab'da otomatik mute (pil tasarrufu)

---

## 📞 Destek & Geri Bildirim

**Sorun mu var?**
- Konsolu aç: `F12` → Console
- Hata mesajlarını not et
- Adımları tekrarla

**Özellik isteği?**
- GitHub Issues'ta açıklama yap
- Örnekler ve use case'leri ekle

---

## ✅ Kontrol Listesi

Özellikler tam olarak çalışıyor mu?

- [ ] Stil dialog link eklerken açılıyor
- [ ] Paylaşım kartları başarıyla oluşturuluyor
- [ ] HTML/JSON başarıyla indiriliyor
- [ ] Toplu oynatıcı kontrolleri çalışıyor
- [ ] YouTube videoları mute'lu başlıyor
- [ ] Sekme geçişinde oynatıcı mute oluyor
- [ ] Preview modunda yeni render yaratılmıyor
- [ ] QR kod başarıyla oluşturuluyor

---

**Sürüm:** 1.0.0  
**Güncelleme:** 2026-01-02  
**Durum:** ✅ Üretim Hazır (Production Ready)
