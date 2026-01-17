# Grid Pagination System Guide 📊

## ✅ Server Status
- **Dev Server**: Running on http://localhost:3000
- **Framework**: Next.js 16.1.1 with Turbopack
- **React**: 18+
- **Status**: Ready for testing

---

## 🎯 Grid Pagination Overview

Grid pagination divides items into multiple pages based on grid configuration:

| Mode | Layout | Items/Page | Example |
|------|--------|-----------|---------|
| **Vertical** | 1 column | columns × 1 = 1 item | Page 1: [Item 0], Page 2: [Item 1]... |
| **Square** | N×N grid | columns × columns | Page 1: [Items 0-8] (3×3), Page 2: [Items 9-17]... |

---

## 📚 Core Data Structure

### **GridModeState** (Zustand Store)
```typescript
{
  enabled: boolean;           // Grid mode on/off toggle
  type: 'vertical' | 'square'; // Grid layout type
  columns: number;            // Number of columns (1-4)
  currentPage: number;        // Active page (1-indexed)
  totalPages: number;         // Total pages calculated
  itemsPerPage: number;       // Items per page (cols × rows)
  totalItems: number;         // Total item count
}
```

**Default State** (store.ts, line 884):
```typescript
gridModeState: {
  enabled: false,
  type: 'vertical',
  columns: 3,
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 3,
  totalItems: 0
}
```

---

## 🔧 Key Functions

### 1. **calculateGridPagination()** (layout-engine.ts:318-340)

**Purpose**: Calculate pagination info for current page

**Signature**:
```typescript
function calculateGridPagination(
  totalItems: number,
  columns: number,
  isSquareMode: boolean,
  currentPage: number
): GridPaginationInfo
```

**Logic Flow**:
```
rows = isSquareMode ? columns : 1
itemsPerPage = columns × rows
totalPages = ceil(totalItems / itemsPerPage)
startIndex = (currentPage - 1) × itemsPerPage
endIndex = min(startIndex + itemsPerPage, totalItems)
itemsOnCurrentPage = endIndex - startIndex
```

**Returns**:
```typescript
{
  currentPage: number;        // Current page (validated 1-indexed)
  totalPages: number;         // Total pages
  itemsOnCurrentPage: number; // Items on this specific page
  totalItems: number;         // Total item count
  columns: number;            // Columns in grid
  rows: number;               // Rows per page
  itemsPerPage: number;       // Items per page
  startIndex: number;         // Start index for array slice
  endIndex: number;           // End index for array slice
}
```

---

### 2. **getPaginatedGridItems()** (layout-engine.ts:343-350)

**Purpose**: Get only items visible on current page

**Signature**:
```typescript
function getPaginatedGridItems(
  items: ContentItem[],
  columns: number,
  isSquareMode: boolean,
  currentPage: number
): ContentItem[]
```

**Implementation**:
```typescript
const pagination = calculateGridPagination(items.length, columns, isSquareMode, currentPage);
return items.slice(pagination.startIndex, pagination.endIndex);
```

**Used in**: canvas.tsx line 330 - renders only current page items

---

## 🎮 State Management Actions

### Store Setters (store.ts, lines 1503-1506)

```typescript
// Toggle grid mode on/off
setGridModeEnabled: (enabled: boolean) => void

// Switch grid type (vertical/square), reset page to 1
setGridModeType: (type: 'vertical' | 'square') => void

// Change columns (1-4), reset page to 1  
setGridColumns: (columns: number) => void

// Navigate to specific page
setGridCurrentPage: (page: number) => void
```

---

## 📱 UI Implementation

### GridModeControls Component (canvas/page.tsx:1852-1862)

**Props**:
```typescript
{
  gridState: GridModeState;
  onToggleGridMode: (enabled: boolean) => void;
  onChangeGridType: (type: 'vertical' | 'square') => void;
  onChangeColumns: (columns: number) => void;
  onPreviousPage: () => void;           // ← Page navigation
  onNextPage: () => void;               // ← Page navigation
  totalItems: number;
}
```

**Connected Handlers**:
```tsx
onPreviousPage={() => 
  state.setGridCurrentPage(Math.max(1, state.gridModeState.currentPage - 1))
}

onNextPage={() => 
  state.setGridCurrentPage(state.gridModeState.currentPage + 1)
}
```

---

## 📊 Pagination Examples

### Example 1: Vertical Mode (1 Column)
```
Total Items: 10
Columns: 1
Rows: 1 (always)
Items Per Page: 1
Total Pages: 10

┌─────────────────┐
│ Page 1: [Item 0] │
│ Page 2: [Item 1] │
│ ...              │
│ Page 10: [Item 9]│
└─────────────────┘
```

### Example 2: Square 3×3 Grid
```
Total Items: 25
Columns: 3
Rows: 3
Items Per Page: 9
Total Pages: 3

┌─────────────────────┐
│ Page 1 (3×3 grid):  │
│ [0] [1] [2]         │
│ [3] [4] [5]         │
│ [6] [7] [8]         │
├─────────────────────┤
│ Page 2 (3×3 grid):  │
│ [9] [10][11]        │
│ [12][13][14]        │
│ [15][16][17]        │
├─────────────────────┤
│ Page 3 (partial):   │
│ [18][19][20]        │
│ [21][22][23]        │
│ [24]                │
└─────────────────────┘
```

### Example 3: Square 4×4 Grid
```
Total Items: 33
Columns: 4
Rows: 4
Items Per Page: 16
Total Pages: 3

Page 1: 16 items (0-15)
Page 2: 16 items (16-31)
Page 3: 1 item (32)
```

---

## 🔄 Canvas Integration (canvas.tsx)

### Rendered Items Per Page (Line 330)
```typescript
const displayItems = useMemo(() => {
  // Grid mode enabled → slice items for current page only
  if (gridModeState.enabled && items.length > 0) {
    return getPaginatedGridItems(
      items, 
      gridModeState.columns, 
      isSquareMode, 
      gridModeState.currentPage
    );
  }
  // Canvas/free mode → show all items
  return items;
}, [items, gridModeState.enabled, gridModeState.type, gridModeState.columns, gridModeState.currentPage]);
```

### Auto-Reset Page on Change (Lines 335-350)
```typescript
useEffect(() => {
  if (gridModeState.enabled && items.length > 0) {
    const pagination = calculateGridPagination(...);
    
    // If current page > total pages, reset to page 1
    if (gridModeState.currentPage > pagination.totalPages) {
      setGridCurrentPage(1);
    }
  }
}, [items.length, gridModeState.enabled, gridModeState.type, gridModeState.columns]);
```

---

## 🎯 Task 8: Grid Pagination Drag-Drop Implementation

### What Needs to Be Added

**Current State**: ✅ Grid pagination fully implemented and working

**Missing Feature**: ❌ Drag-drop across pages

**Implementation Goals**:

1. **Edge Detection During Drag**
   - Monitor drag position while dragging items
   - Detect if dragging near bottom/top edge of page
   - Auto-transition to next/previous page on edge hover

2. **Cross-Page Item Reordering**
   - When dropping on new page, calculate correct final index
   - Account for items already on new page
   - Update item order across page boundary

3. **Drag Handlers Enhancement**
   - Enhance `onDragOver` handlers in Canvas component
   - Add `edgeScrollThreshold` (e.g., 50px from edge)
   - Trigger `setGridCurrentPage()` on edge detection
   - Show visual indicator for page transition

4. **Visual Feedback**
   - Display "→ Next page" arrow indicator when dragging to bottom edge
   - Display "← Previous page" arrow indicator when dragging to top edge
   - Show drop zone on new page with animation
   - Page transition animation (fade or slide)

---

## 📁 Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| **layout-engine.ts** | 318-350 | Grid pagination core functions |
| **store.ts** | 342, 884, 1503-1506 | GridModeState definition & actions |
| **canvas.tsx** | 145, 330-360 | Grid pagination integration |
| **canvas/page.tsx** | 1852-1862 | GridModeControls UI component |

---

## ✨ Implementation Checklist for Task 8

- [ ] Add edge detection to drag handlers
- [ ] Implement auto-page-transition on edge drag
- [ ] Calculate correct drop index across pages
- [ ] Add visual feedback (arrows, indicators)
- [ ] Test vertical mode pagination drag
- [ ] Test square mode pagination drag
- [ ] Test multi-page reordering
- [ ] Test edge cases (first/last page, single item)
- [ ] Performance optimization for large datasets

---

## 🚀 Quick Test Guide

To test grid pagination currently working:

1. **Access Canvas**: http://localhost:3000/canvas
2. **Enable Grid Mode**: Click grid mode toggle
3. **Switch Grid Type**: Try 'Vertical' or 'Square'
4. **Change Columns**: Adjust 1-4 columns
5. **Navigate Pages**: Use Previous/Next buttons
6. **Observe**: Items update per page correctly

**Testing Tasks 1-7 (Completed)**:
- ✅ Sidebar drag-drop with visual feedback
- ✅ Canvas drop zones
- ✅ Grid component drop zones
- ✅ Visual drop indicators
- ✅ Library internal reordering
- ✅ Right panel drop targets (AI Chat, Spaces, Devices)

**Next: Task 8 - Implement cross-page drag-drop** 🎯

---

## 📝 Notes

- Grid pagination is **not persisted** yet (saves to localStorage via Zustand)
- **Page always resets to 1** when switching grid type or columns
- **Auto-validation**: If currentPage > totalPages, auto-reset to 1
- **Vertical mode**: Always 1 item per page
- **Square mode**: columns × columns items per page
