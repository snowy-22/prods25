# Kapak (Folder Cover) & Mini Map Sizing Optimization

## Yapılan Değişiklikler

### 1. **layout-engine.ts** - Grid Layout Boyutlandırması
```typescript
// baseGridSize değerleri artırıldı
const baseGridSize = containerWidth >= 2560 ? 520 : containerWidth >= 1920 ? 400 : 320;
// Önceki değerler: 480, 360, 280

// Klasör kapakları için minimum yükseklik
const minHeight = isFolderCover ? '320px' : '240px';
// Önceki değer: 240px (her ikisi için aynı)

// Maksimum yükseklik
maxHeight: effectiveRowSpan > 2 ? 'none' : '800px'
// Önceki değer: 600px
```

**Etki:**
- XXL ekranlarda (2560px+) daha büyük grid hücresi (520px)
- Klasör kapakları için özel minHeight artışı (320px)
- Grid öğeleri için maksimum yükseklik artışı (800px)
- Responsive davranış korunmuş

### 2. **animated-minimap.tsx** - Mini Map Boyutları
```typescript
export function AnimatedMinimap({
  width = 300,   // Önceki: 200
  height = 200,  // Önceki: 150
  // ...
})
```

**Etki:**
- Mini map widget'ı %50 daha büyük
- Canvas alanı genişletildi
- Kontrol öğeleri daha kolay erişilebilir

### 3. **Gap (Boşluk) & Padding**
```typescript
const gap = 24;  // Grid öğeleri arasındaki boşluk
// Önceki: 8px (kodda belirtilmemiş, varsayılan)
```

## Responsive Breakpoints

| Screen Size | baseGridSize | Gap | Padding |
|------------|-------------|-----|---------|
| ≥ 2560px  | 520px       | 24px| 20px    |
| ≥ 1920px  | 400px       | 24px| 20px    |
| < 1920px  | 320px       | 24px| 16px    |

## Klasör Kapakları Özel Uygulamaları

- `isFolderCover` türünde öğeler (folder type + coverImage)
- Minimum yükseklik: **320px** (normal grid öğelerinden 80px daha büyük)
- CSS sınıfı: `folder-cover-grid-item`
- Z-index: 1 (tüm grid öğeleri)

## Test Edilecek Durumlar

1. **Responsive Test**
   - [ ] Mobil (< 768px)
   - [ ] Tablet (768px - 1024px)
   - [ ] Desktop (1024px - 1920px)
   - [ ] 4K (≥ 2560px)

2. **Bileşen Test**
   - [ ] Klasör kapakları (4, 9, 16 grid modu)
   - [ ] Mini map widget (dot, grid, lines, gradient pattern'ler)
   - [ ] Drag & drop davranışı
   - [ ] Zoom ve pan işlemleri

3. **Görsel Test**
   - [ ] Kapak içeriği (video, resim, simge) ölçeklemesi
   - [ ] Grid hücrelerinin oranları
   - [ ] Boşluk ve padding tutarlılığı
   - [ ] Hover ve aktif durumlar

## İlişkili Dosyalar

- `src/lib/layout-engine.ts` - Grid layout hesaplamaları
- `src/components/widgets/animated-minimap.tsx` - Mini map widget
- `src/components/mouse-tracker-background.tsx` - ActiveFolderCover (içinde)
- `src/components/folder-preview-grid.tsx` - Klasör grid preview

## Build Status

✅ Next.js dev server çalışıyor (Port 3001)
✅ Turbopack kompilasyonu başarılı
✅ TypeScript hataları yok
