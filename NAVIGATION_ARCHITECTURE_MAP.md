# 🗺️ CanvasFlow Navigasyon Mimarisi Haritası

**Tarih**: 21 Ocak 2026  
**Amaç**: Tüm navigasyon akışlarını belgelemek ve iyileştirme planı oluşturmak

---

## 📊 Mevcut Durum Analizi

### 🔴 Tespit Edilen Problem

**React Key Prop Hatası:**
```
Each child in a list should have a unique "key" prop.
Check the render method of `UnifiedGridPreview`.
```

**Kaynak:** `src/components/global-search.tsx` satır 369-402
**Etkilenen Bileşen:** `src/components/unified-grid-preview.tsx`

**Sorun Detayı:**
```typescript
// global-search.tsx - suggestionSets tanımı
const suggestionSets = [
    {
        title: "Sanat & Tasarım İlhamı",
        items: [
            { type: 'website', url: 'https://www.behance.net' },  // ❌ id yok
            { type: 'website', url: 'https://dribbble.com' },     // ❌ id yok
        ]
    },
];

// unified-grid-preview.tsx - Render
{itemsToShow.map((item) => (
    <motion.div key={item.id}  // ❌ item.id = undefined → React hatası
    />
))}
```

---

## 🏗️ Navigasyon Mimarisi Bileşenleri

### 1. **Tab Sistemi** (Çekirdek)

**Dosya:** `src/lib/store.ts`

```
Tab Interface
├── id: string (sekme benzersiz ID)
├── activeViewId: string (içerik görünümü)
├── history: string[] (geri/ileri geçmiş)
├── historyIndex: number
├── navigationHistory: string[] (breadcrumb)
├── navigationIndex: number
├── undoRedoStack: Array<{activeViewId, timestamp}>
└── undoRedoIndex: number
```

**Aksiyon Fonksiyonları:**
- `openInNewTab(item, allItems, isTemporary?)` → Yeni sekme aç
- `setActiveTab(tabId)` → Sekme değiştir
- `updateTab(tabId, updates)` → Sekme güncelle
- `closeTab(tabId)` → Sekme kapat
- `pushNavigationHistory(tabId, viewId)` → Geçmişe ekle
- `popNavigationHistory(tabId)` → Geri git
- `undo(tabId)` / `redo(tabId)` → Geri/İleri al

---

### 2. **Görünüm Sistemi** (View System)

**Dosya:** `src/app/canvas/page.tsx`

```
View Hierarchy
├── activeTab → Current Tab
│   └── activeViewId → Current View ID
├── activeView → ContentItem (computed)
│   ├── id: string
│   ├── children: ContentItem[]
│   ├── sortOption: 'manual' | 'name' | 'createdAt'
│   └── sortDirection: 'asc' | 'desc'
└── activeViewChildren → Filtered & Sorted Items
```

**Aksiyon Fonksiyonları:**
- `setActiveViewCallback(item)` → Görünümü değiştir (satır 1344)
- Bu fonksiyon aslında `openInNewTab` çağırır

---

### 3. **Sidebar Navigasyonu**

**Dosya:** `src/components/secondary-sidebar.tsx`

```
Secondary Sidebar
├── Library Panel
│   ├── Folder Tree
│   │   └── onOpenInNewTab(item, allItems) → Klasör açma
│   └── Item Click
│       └── onOpenInNewTab(item, allItems) → Öğe açma
├── Social Panel
├── Messages Panel
├── Widgets Panel
└── Other Panels...
```

**Navigation Props:**
```typescript
interface SecondarySidebarProps {
    onOpenInNewTab?: (item: ContentItem, allItems: ContentItem[]) => void;
    // ...
}
```

---

### 4. **Global Search Navigasyonu**

**Dosya:** `src/components/global-search.tsx`

```
Global Search
├── setActiveView(item) → Görünüm değiştir
├── Search Results
│   ├── Content Items → setActiveView
│   ├── Widgets → onAddWidget
│   └── Menu Actions → toggleAiChatPanel
└── Suggestion Sets
    └── UnifiedGridPreview → items'a id eklenmemiş ❌
```

---

### 5. **Canvas/Player Navigasyonu**

**Dosya:** `src/components/canvas.tsx`, `src/components/player-frame.tsx`

```
Canvas Navigation
├── Item Click
│   ├── onItemClick(item) → Seçim
│   └── onOpenInNewTab(item) → Yeni sekmede aç
├── Double Click
│   └── Container Types → İçeri gir
└── Context Menu
    └── "Yeni Sekmede Aç" → onOpenInNewTab
```

---

## 🔄 Navigasyon Akış Diyagramları

### Akış 1: Sidebar'dan Navigasyon

```
User clicks folder in sidebar
         ↓
SecondarySidebar.onOpenInNewTab(item, allItems)
         ↓
MainContentInternal.setActiveViewCallback(item)
         ↓
store.openInNewTab(item, sidebarItems)
         ↓
Creates new Tab with:
  - id: item.id
  - activeViewId: item.id
  - history: [item.id]
         ↓
store.setActiveTab(item.id)
         ↓
UI Updates with new view
```

### Akış 2: Global Search Navigasyon

```
User searches and clicks result
         ↓
GlobalSearch component
         ↓
setActiveView(item.itemData)  // line 519
         ↓
setActiveViewCallback(item)  // from props
         ↓
store.openInNewTab(item, sidebarItems)
         ↓
New tab created or existing tab activated
```

### Akış 3: Canvas Item Tıklama

```
User double-clicks container item
         ↓
Canvas.onItemClick or handleDoubleClick
         ↓
onOpenInNewTab(item)
         ↓
store.openInNewTab(item, allItems)
         ↓
Navigation to new view
```

---

## 🔍 Potansiyel Problemler

### Problem 1: Key Prop Eksikliği (CURRENT)
- **Konum:** `global-search.tsx` suggestionSets
- **Etki:** React render warning
- **Çözüm:** Items'a id ekle

### Problem 2: Tutarsız Navigasyon API'si
- **Sorun:** Bazı yerlerde `openInNewTab`, bazı yerlerde `setActiveView`
- **Etki:** Kod karmaşıklığı, bakım zorluğu
- **Çözüm:** Tek bir navigasyon hook'u oluştur

### Problem 3: Derin İç İçe Callback'ler
- **Sorun:** Props drilling (props 4-5 seviye derinlikte geçiyor)
- **Etki:** Performans, debug zorluğu
- **Çözüm:** Context veya custom hook kullan

### Problem 4: Tab History Yönetimi
- **Sorun:** `history`, `navigationHistory`, `undoRedoStack` ayrı ayrı yönetiliyor
- **Etki:** Karmaşıklık, potansiyel senkronizasyon sorunları
- **Çözüm:** Tek bir history manager oluştur

---

## 📁 Dosya-Bileşen Haritası

| Dosya | Navigasyon Rolü | Bağımlılıklar |
|-------|-----------------|---------------|
| `store.ts` | Tab/View state yönetimi | - |
| `canvas/page.tsx` | Ana sayfa koordinatörü | store, secondary-sidebar, canvas, global-search |
| `secondary-sidebar.tsx` | Library/panel navigasyonu | store, unified-grid-preview |
| `global-search.tsx` | Arama + hızlı navigasyon | unified-grid-preview, multi-source-search |
| `canvas.tsx` | Item tıklama/sürükleme | player-frame, unified-grid-preview |
| `player-frame.tsx` | Medya oynatıcı navigasyon | store |
| `unified-grid-preview.tsx` | Mini önizleme + tıklama | - |

---

## 🛠️ İyileştirme Planı

### Faz 1: Acil Düzeltme (Key Prop)

**Öncelik:** 🔴 Kritik
**Tahmini Süre:** 15 dakika

1. `global-search.tsx` içindeki `suggestionSets` items'a id ekle
2. `unified-grid-preview.tsx`'de fallback key ekle

### Faz 2: Navigasyon Hook'u Oluşturma

**Öncelik:** 🟡 Orta
**Tahmini Süre:** 1-2 saat

```typescript
// src/hooks/use-navigation.ts
export function useNavigation() {
  const store = useAppStore();
  
  const navigateTo = useCallback((item: ContentItem) => {
    store.openInNewTab(item, store.allItems);
  }, [store]);
  
  const goBack = useCallback(() => {
    // unified back navigation
  }, []);
  
  const goForward = useCallback(() => {
    // unified forward navigation
  }, []);
  
  return { navigateTo, goBack, goForward };
}
```

### Faz 3: History Manager Birleştirme

**Öncelik:** 🟢 Düşük
**Tahmini Süre:** 2-3 saat

- `history`, `navigationHistory`, `undoRedoStack` birleştir
- Tek bir NavigationHistory sınıfı oluştur
- Browser-like back/forward davranışı

### Faz 4: Props Drilling Azaltma

**Öncelik:** 🟢 Düşük
**Tahmini Süre:** 3-4 saat

- NavigationContext oluştur
- `onOpenInNewTab`, `setActiveView` prop'larını kaldır
- Context üzerinden erişim sağla

---

## 📈 Metrikler

### Mevcut Durum

| Metrik | Değer |
|--------|-------|
| Navigasyon fonksiyonu sayısı | 8+ |
| Props drilling derinliği | 4-5 seviye |
| Duplice kod satırı | ~50 |
| React warning sayısı | 1 (key prop) |

### Hedef

| Metrik | Değer |
|--------|-------|
| Navigasyon fonksiyonu sayısı | 3 (navigateTo, goBack, goForward) |
| Props drilling derinliği | 0 (context) |
| Duplice kod satırı | 0 |
| React warning sayısı | 0 |

---

## 🎯 Sonraki Adımlar

1. ✅ Problemi analiz et ve belgele (bu dosya)
2. ⏳ **Faz 1:** Key prop hatası düzelt
3. ⏳ **Faz 2:** useNavigation hook oluştur (isteğe bağlı)
4. ⏳ **Faz 3:** History birleştir (isteğe bağlı)
5. ⏳ **Faz 4:** Context refactoring (isteğe bağlı)

---

**Son Güncelleme:** 21 Ocak 2026
