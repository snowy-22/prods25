# CanvasFlow Evrensel Sürükle-Bırak ve Navigasyon Sistemi

Bu belge, CanvasFlow uygulamasındaki merkezi navigasyon ve evrensel sürükle-bırak sistemini açıklar.

## 🎯 Genel Bakış

Sistem üç ana bileşenden oluşur:

1. **useNavigation Hook** - Merkezi navigasyon mantığı
2. **useDragDrop Hook** - Evrensel sürükle-bırak yönetimi
3. **CrossDragManager** - Kural tabanlı drop doğrulama ve yürütme

## 📦 Dosya Yapısı

```
src/
├── hooks/
│   ├── use-navigation.ts      # Navigasyon hook'u
│   └── use-drag-drop.ts       # Sürükle-bırak hook'u
├── contexts/
│   └── canvas-flow-context.tsx # Birleşik Context Provider
└── lib/
    └── cross-drag-system.ts   # Kural motoru ve yöneticisi
```

## 🧭 Navigasyon Sistemi

### useNavigation Hook

Merkezi navigasyon hook'u, tüm bileşenlerde tutarlı navigasyon sağlar.

```tsx
import { useNavigation } from '@/hooks/use-navigation';

function MyComponent() {
  const { 
    state,           // Mevcut navigasyon durumu
    navigateTo,      // Bir öğeye git
    openInNewTab,    // Yeni sekmede aç
    goBack,          // Geri git
    goForward,       // İleri git
    undo,            // Geri al
    redo,            // Yinele
    closeTab,        // Sekme kapat
    createNewTab,    // Yeni sekme oluştur
    switchTab,       // Sekme değiştir
    navigateToBreadcrumb, // Ekmek kırıntısına git
  } = useNavigation();

  return (
    <button onClick={() => openInNewTab(item)}>
      Yeni Sekmede Aç
    </button>
  );
}
```

### Navigasyon State

```typescript
interface NavigationState {
  activeTab: Tab | null;
  activeTabId: string;
  allTabs: Tab[];
  currentViewId: string;
  breadcrumbs: ContentItem[];
  canGoBack: boolean;
  canGoForward: boolean;
  canUndo: boolean;
  canRedo: boolean;
  historyIndex: number;
  historyLength: number;
}
```

### Navigasyon Seçenekleri

```typescript
interface NavigationOptions {
  /** Yeni sekme oluştur (varsayılan: false) */
  newTab?: boolean;
  /** Geçici sekme olarak aç (varsayılan: false) */
  temporary?: boolean;
  /** Mevcut geçmiş yerine değiştir (varsayılan: false) */
  replace?: boolean;
}
```

## 🖱️ Sürükle-Bırak Sistemi

### useDragDrop Hook

Evrensel sürükle-bırak hook'u, CrossDragManager ile entegre çalışır.

```tsx
import { useDragDrop } from '@/hooks/use-drag-drop';

function DraggableItem({ item }: { item: ContentItem }) {
  const {
    isDragging,
    draggedItem,
    dragHandlers,
    startDrag,
    endDrag,
  } = useDragDrop({
    sourceType: 'library-item',
    item,
    onDragStart: (item) => console.log('Sürükleme başladı:', item),
    onDragEnd: (item, dropped) => console.log('Sürükleme bitti, bırakıldı:', dropped),
  });

  return (
    <div {...dragHandlers}>
      {item.title}
    </div>
  );
}
```

### Drop Zone Oluşturma

```tsx
function DropZone() {
  const {
    isOver,
    dropState,
    dropToken,
    canDrop,
    dropHandlers,
  } = useDragDrop({
    targetType: 'canvas',
    onDrop: async (item, context) => {
      console.log('Öğe bırakıldı:', item);
      // İşlemi gerçekleştir
    },
    onDragOver: (context) => {
      // Hover durumunda
    },
  });

  return (
    <div 
      {...dropHandlers}
      className={cn(
        'drop-zone',
        isOver && 'drop-zone--hover',
        dropState === 'accept' && 'drop-zone--accept',
        dropState === 'reject' && 'drop-zone--reject',
      )}
    >
      {dropToken && (
        <div 
          className="drop-feedback"
          style={{ color: dropToken.color }}
        >
          {dropToken.icon} {dropToken.message}
        </div>
      )}
    </div>
  );
}
```

### DropToken Yapısı

```typescript
interface DropToken {
  state: 'idle' | 'hover' | 'accept' | 'reject' | 'loading';
  message: string;
  icon?: string;
  color: string;
  animation?: 'pulse' | 'shake' | 'bounce' | 'fade' | 'none';
  className?: string;
}
```

## 🎛️ CrossDragManager

### Kural Kaydetme

```typescript
import { getCrossDragManager } from '@/lib/cross-drag-system';

const manager = getCrossDragManager();

manager.registerRule({
  id: 'my-custom-rule',
  sourceTypes: ['library-item'],
  targetTypes: ['canvas', 'folder'],
  priority: 10, // Yüksek öncelikli kurallar önce kontrol edilir
  condition: (context) => {
    // Ek koşul kontrolü
    return context.item.type === 'video';
  },
  action: async (context) => {
    // Drop işlemini gerçekleştir
    console.log('Custom action:', context);
  },
  visualFeedback: {
    acceptColor: '#10b981',
    rejectColor: '#ef4444',
    acceptIcon: '✅',
    rejectIcon: '❌',
    acceptMessage: 'Videoyu buraya bırak',
    rejectMessage: 'Sadece video dosyaları kabul edilir',
  },
});
```

### Varsayılan Kurallar

| ID | Kaynak Tipler | Hedef Tipler | Açıklama |
|----|---------------|--------------|----------|
| `library-to-canvas` | library-item | canvas, minimap, new-tab, grid-cell | Kütüphaneden tuvale ekle |
| `canvas-to-targets` | canvas-item | minimap, tab, folder, trash, new-tab, grid-cell | Canvas öğelerini taşı |
| `filesystem-to-canvas` | filesystem-item | canvas, sidebar, folder | Dosya yükleme |
| `browser-to-canvas` | browser-item, external-content | canvas, new-tab | Web içeriği oluştur |
| `widget-to-canvas` | widget-item | canvas, widget-zone, grid-cell | Widget ekle |
| `tab-reorder` | tab-item | tab-bar, new-folder | Sekme sıralama |
| `search-to-targets` | search-result, ai-suggestion | canvas, new-tab, folder, grid-cell | Arama sonuçlarını ekle |
| `presentation-items` | presentation-item, scene-item | presentation-scene, canvas | Sunum yönetimi |
| `marketplace-items` | marketplace-item | canvas, folder, new-tab | Marketplace ürünleri |
| `sidebar-to-targets` | sidebar-item | minimap, canvas, new-tab | Sidebar öğelerini aç |
| `any-to-trash` | canvas-item, library-item, widget-item, tab-item | trash | Çöp kutusuna at |
| `items-to-folder` | canvas-item, library-item, widget-item, search-result | folder, new-folder | Klasöre taşı |

### Kaynak Tipleri (DragSourceType)

```typescript
type DragSourceType =
  | 'library-item'      // Kütüphane öğesi
  | 'canvas-item'       // Tuval öğesi
  | 'minimap-item'      // Mini harita öğesi
  | 'tab-item'          // Sekme
  | 'sidebar-item'      // Sidebar öğesi
  | 'message-item'      // Mesaj
  | 'social-item'       // Sosyal içerik
  | 'browser-item'      // Tarayıcı içeriği
  | 'filesystem-item'   // Dosya sistemi öğesi
  | 'widget-item'       // Widget
  | 'search-result'     // Arama sonucu
  | 'ai-suggestion'     // AI önerisi
  | 'marketplace-item'  // Marketplace ürünü
  | 'presentation-item' // Sunum öğesi
  | 'scene-item'        // Sahne öğesi
  | 'external-content'; // Harici içerik
```

### Hedef Tipleri (DropTargetType)

```typescript
type DropTargetType =
  | 'canvas'            // Ana tuval
  | 'minimap'           // Mini harita
  | 'tab'               // Sekme
  | 'sidebar'           // Sidebar
  | 'message-thread'    // Mesaj dizisi
  | 'social-group'      // Sosyal grup
  | 'folder'            // Klasör
  | 'trash'             // Çöp kutusu
  | 'new-tab'           // Yeni sekme
  | 'new-folder'        // Yeni klasör
  | 'browser-window'    // Tarayıcı penceresi
  | 'external-app'      // Harici uygulama
  | 'presentation-scene'// Sunum sahnesi
  | 'widget-zone'       // Widget bölgesi
  | 'player-frame'      // Player çerçevesi
  | 'grid-cell'         // Grid hücresi
  | 'tab-bar'           // Sekme çubuğu
  | 'secondary-sidebar' // İkincil sidebar
  | 'primary-sidebar';  // Birincil sidebar
```

## 🌐 Context Kullanımı

### CanvasFlowProvider

Tüm alt bileşenlere navigasyon ve sürükle-bırak yetenekleri sağlar.

```tsx
// app/layout.tsx
import { CanvasFlowProvider } from '@/contexts/canvas-flow-context';

export default function Layout({ children }) {
  return (
    <CanvasFlowProvider>
      {children}
    </CanvasFlowProvider>
  );
}
```

### useCanvasFlow Hook

Birleşik erişim için:

```tsx
import { useCanvasFlow } from '@/contexts/canvas-flow-context';

function MyComponent() {
  const { navigation, dragDrop } = useCanvasFlow();
  
  // Navigasyon
  navigation.openInNewTab(item);
  
  // Sürükle-bırak
  const dragSource = dragDrop.createDragSource({
    sourceType: 'library-item',
    item,
  });
  
  return (
    <div {...dragSource.dragHandlers}>
      {item.title}
    </div>
  );
}
```

### Ayrı Hook'lar

```tsx
import { 
  useCanvasFlowNavigation, 
  useCanvasFlowDragDrop 
} from '@/contexts/canvas-flow-context';

// Sadece navigasyon
const navigation = useCanvasFlowNavigation();

// Sadece sürükle-bırak
const dragDrop = useCanvasFlowDragDrop();
```

## 🎨 Görsel Geri Bildirim

### CSS Sınıfları

```css
/* Drop zone stilleri */
.drop-zone {
  transition: all 0.2s ease;
}

.drop-zone--hover {
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
}

.drop-zone--accept {
  background: rgba(16, 185, 129, 0.1);
  border: 2px solid #10b981;
}

.drop-zone--reject {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
}

/* Animasyonlar */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

## 🔧 Yardımcı Fonksiyonlar

```typescript
import { 
  createDragPayload,
  parseDragPayload,
  getDropEffect,
} from '@/lib/cross-drag-system';

// Sürükleme verisi oluştur
const payload = createDragPayload(item, 'library-item', { extra: 'data' });

// Sürükleme verisini ayrıştır
const data = parseDragPayload(event.dataTransfer.getData('application/json'));

// Drop efekti belirle (ctrl/shift tuşlarına göre)
const effect = getDropEffect(context);
// 'copy' | 'move' | 'link' | 'none'
```

## 📋 Migrasyon Kılavuzu

### Eski Yöntem

```tsx
// ESKİ - Props drilling
function Canvas({ 
  onOpenInNewTab,
  setActiveView,
  onDragStart,
  onDragEnd,
}) {
  // ...
}
```

### Yeni Yöntem

```tsx
// YENİ - Hook ve Context
import { useNavigation } from '@/hooks/use-navigation';
import { useDragDrop } from '@/hooks/use-drag-drop';

function Canvas() {
  const { openInNewTab, navigateTo } = useNavigation();
  const { dragHandlers, dropHandlers } = useDragDrop({
    targetType: 'canvas',
  });
  
  // Props geçirmeye gerek yok!
}
```

## ✅ Tamamlanan İyileştirmeler

1. ✅ **useNavigation Hook** - Merkezi navigasyon mantığı
2. ✅ **useDragDrop Hook** - Evrensel sürükle-bırak
3. ✅ **CanvasFlowContext** - Birleşik Context Provider
4. ✅ **CrossDragManager** - Gelişmiş kural motoru
5. ✅ **Layout Entegrasyonu** - Provider'lar layout.tsx'e eklendi
6. ✅ **Tip Güvenliği** - Tam TypeScript desteği
7. ✅ **Görsel Geri Bildirim** - DropToken ve animasyonlar
8. ✅ **Olaylar ve Abonelik** - subscribe/notify pattern

## 🚀 Sonraki Adımlar

1. Bileşenleri yeni hook'ları kullanacak şekilde refactor et
2. Birim testleri ekle
3. E2E testleri ile doğrula
4. Performans optimizasyonu (useMemo, useCallback)

---

*Son güncelleme: 2024*
