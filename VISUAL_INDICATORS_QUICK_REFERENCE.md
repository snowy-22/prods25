# Visual Drop Indicators - Quick Reference Guide

## 🎯 What Was Implemented

Visual feedback when dragging library items over the canvas with snap-to-grid positioning.

## 📍 Visual Elements

### 1. Canvas Glow Effect
**When**: User drags item over canvas
**Visual**: Ring border + shadow glow
**Color**: Primary color (usually blue)
**Location**: Canvas container border
**Classes**: 
- `ring-2 ring-primary/50` - Ring border
- `shadow-xl shadow-primary/30` - Glow shadow
- `bg-primary/5` - Subtle background tint

### 2. Vertical Guide Line
**When**: Canvas drag active
**Visual**: Vertical dashed line
**Position**: Snap-to-grid X coordinate
**Color**: Primary with 50% opacity
**Animation**: Pulse 2s infinite
**Size**: 2px wide, full viewport height

### 3. Horizontal Guide Line
**When**: Canvas drag active
**Visual**: Horizontal dashed line
**Position**: Snap-to-grid Y coordinate
**Color**: Primary with 50% opacity
**Animation**: Pulse 2s infinite
**Size**: 2px tall, full viewport width

### 4. Ghost Preview Box
**When**: Canvas drag active
**Visual**: Semi-transparent rectangle at drop position
**Dimensions**: 300px × 200px (standard item size)
**Color**: Primary with 10% opacity background
**Border**: 2px dashed primary/50%
**Effect**: Glow shadow with 20px blur
**Animation**: Pulse 1.5s infinite

## 🎨 Color Reference

All elements use primary color variables:
- `--color-primary` - Base color
- `opacity-50` (50%) - Guide lines, borders
- `opacity-30` (30%) - Glow shadow
- `opacity-20` (20%) - Background tints
- `opacity-10` (10%) - Ghost box background

## ⚙️ How It Works

1. **User drags library item**
   - Canvas detects JSON drag data
   - `isDropZoneActive` = true
   - Canvas glow activates

2. **Mouse moves over canvas**
   - Position tracked relative to container
   - Position snapped to 20px grid
   - Guide lines render at snap position
   - Ghost box renders at snap position
   - All elements pulse smoothly

3. **User releases (drops)**
   - Item created at snapped position
   - All visual elements reset
   - `isDropZoneActive` = false
   - `dropIndicatorPosition` = null
   - `dropGridLines` = { vertical: null, horizontal: null }

## 🔧 Code Locations

**State Definition**: `src/components/canvas.tsx` lines 125-128
```typescript
const [dropIndicatorPosition, setDropIndicatorPosition] = useState<{ x: number; y: number } | null>(null);
const [dropGridLines, setDropGridLines] = useState<{ vertical: number | null; horizontal: number | null }>({ vertical: null, horizontal: null });
```

**Position Calculation**: `src/components/canvas.tsx` lines 499-525
```typescript
const handleDragOver = useCallback((e: React.DragEvent) => {
  // ... calculates snap-to-grid position
  setDropIndicatorPosition({ x: snappedX, y: snappedY });
  setDropGridLines({ vertical: snappedX, horizontal: snappedY });
}, [...]);
```

**Visual Rendering**: `src/components/canvas.tsx` lines 726-766
```typescript
{isDropZoneActive && layoutMode === 'canvas' && dropGridLines.vertical !== null && (
  <>
    {/* Guide lines and ghost box render here */}
  </>
)}
```

**Container Glow**: `src/components/canvas.tsx` line 666
```typescript
isDropZoneActive && 'ring-2 ring-primary ring-opacity-50 bg-primary/5 shadow-xl shadow-primary/30'
```

## 🧪 Testing Checklist

- [ ] Open canvas view
- [ ] Open secondary sidebar library
- [ ] Drag library item over canvas
- [ ] Verify:
  - [ ] Canvas glows with ring effect
  - [ ] Vertical guide line appears
  - [ ] Horizontal guide line appears
  - [ ] Ghost preview box shows at position
  - [ ] All elements pulse smoothly
  - [ ] Guide lines align to 20px grid
  - [ ] Ghost box size is 300×200px

- [ ] Move mouse around canvas
- [ ] Verify:
  - [ ] Guide lines follow cursor (snapped)
  - [ ] Ghost box follows cursor (snapped)
  - [ ] Position updates smoothly
  - [ ] No lag or performance issues

- [ ] Move to grid mode
- [ ] Verify:
  - [ ] No guide lines appear (canvas-only feature)
  - [ ] Grid droppable still highlights
  - [ ] Drop still works correctly

- [ ] Drop item on canvas
- [ ] Verify:
  - [ ] Item appears at drop position
  - [ ] Visual indicators disappear
  - [ ] No visual artifacts remain
  - [ ] Item position is snapped to grid

## 💡 Tips for Users

1. **Snap-to-Grid**: Items automatically align to 20px grid for clean layouts
2. **Guide Lines**: Show exact alignment point - drop without guessing
3. **Ghost Preview**: See item size before dropping - avoid surprises
4. **Glow Effect**: Clear indication canvas is ready to accept items
5. **Smooth Animations**: Pulsing effect shows active drop zone

## 🐛 Troubleshooting

**Guide lines not appearing?**
- Verify canvas mode is active (not grid mode)
- Check dragging over canvas (not sidebar or other panels)
- Ensure library item JSON data is being transferred

**Ghost box in wrong position?**
- Position is snapped to 20px grid - offset is intentional
- Check browser zoom level (affects coordinate calculation)
- Scroll position affects calculation - should auto-correct

**No glow effect on canvas?**
- Verify `isDropZoneActive` state is true during drag
- Check primary color CSS variable is defined
- Ensure no CSS conflicts with shadow effects

## 📱 Responsive Behavior

**Desktop (>1200px)**:
- Overlay sidebar toggle available
- Full visual feedback
- All guide lines visible

**Tablet (768px-1200px)**:
- Sidebar auto-hides
- Full visual feedback
- All guide lines visible

**Mobile (<768px)**:
- Sidebar pinned to side
- Full visual feedback
- All guide lines visible
- Drag may be challenging - consider touch support

## 🎬 Animation Details

**Pulse Animation** (CSS keyframes):
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Guide Line Pulse**: 2 seconds
- Slower pulse for stability lines
- Repeats infinitely

**Ghost Box Pulse**: 1.5 seconds
- Faster pulse for emphasis on destination
- Repeats infinitely

**Container Transition**: 200ms
- Smooth glow effect appearance
- Non-intrusive duration

## 🎯 Next Phases

Phase 6: Library internal reordering (drag between items in same folder)
Phase 7: Right panel drops (drag into widgets, notes, social)
Phase 8: Grid pagination support (multi-page grid drops)

---

**Reference File**: `/src/components/canvas.tsx`
**Related Files**: `/src/lib/store.ts`, `/src/components/secondary-sidebar.tsx`
**Status**: ✅ Production Ready
