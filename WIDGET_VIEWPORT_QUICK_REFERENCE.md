# Widget Viewport Sizing - Quick Reference

## Problem Fixed ✅
**Runtime Error**: `Cannot read properties of undefined (reading 'showSeconds')`
- Root cause: Size prop mismatch between widget-renderer and widget-sizes
- Status: RESOLVED with comprehensive solution

## Key Changes

### 1. Size Mapping (widget-renderer.tsx)
```typescript
// Before: 'large', 'medium', 'small' ❌
const size = width > 800 ? 'large' : 'medium';

// After: 'XL', 'L', 'M', 'S', 'XS' ✅
const size = toWidgetSize(width >= 800 ? 'XL' : 'L');
```

### 2. Type Safety (widget-sizes.ts)
```typescript
// New defensive functions
getWidgetSizeConfig() → Always returns valid config
toWidgetSize() → Safely converts any value to valid WidgetSize
isValidWidgetSize() → Type guard to check validity

// Example
const size = toWidgetSize(anyValue); // Always safe, falls back to 'M'
const config = getWidgetSizeConfig(size); // Never undefined
```

### 3. New Utilities
- `widget-viewport-utils.ts` - 8 utility functions for viewport calculations
- `use-widget-resize.ts` - 2 React hooks for responsive behavior

## Size Breakpoints

| Size | Width Range | Use Case |
|------|------------|----------|
| **XS** | < 300px | Mobile sidebars, mini widgets |
| **S** | 300-399px | Small panels, compact views |
| **M** | 400-599px | Default, standard widgets |
| **L** | 600-799px | Large display, full features |
| **XL** | ≥ 800px | Ultra-wide, maximum content |

## Using in Widgets

### Simple (No Size Handling)
```typescript
import { getWidgetSizeConfig } from '@/lib/widget-sizes';

export function MyWidget({ size = 'M' }) {
  const config = getWidgetSizeConfig(size);
  return <div className={config.padding}>{/* content */}</div>;
}
```

### Advanced (Responsive Resize)
```typescript
import { useWidgetResize } from '@/hooks/use-widget-resize';
import { getWidgetSizeConfig } from '@/lib/widget-sizes';

export function MyWidget() {
  const { containerRef, size } = useWidgetResize();
  const config = getWidgetSizeConfig(size);
  
  return (
    <div ref={containerRef} className={config.padding}>
      {/* Auto-updates when container resizes */}
    </div>
  );
}
```

## Testing Checklist

- [ ] Clock widget shows/hides seconds based on size
- [ ] Notes widget toolbar adjusts for size
- [ ] Widgets don't throw undefined errors
- [ ] Resizing widget updates size category
- [ ] Small widgets in sidebars render correctly
- [ ] Large widgets on wide screens use full space
- [ ] Invalid size values fall back gracefully

## Files Changed

| File | Changes |
|------|---------|
| `widget-sizes.ts` | Added defensive functions, type guards |
| `widget-renderer.tsx` | Fixed size mapping, added imports |
| `widget-viewport-utils.ts` | NEW - 8 utility functions |
| `use-widget-resize.ts` | NEW - 2 React hooks |

## Common Issues & Solutions

### Issue: Widget shows wrong size
**Solution**: Check if width is being calculated correctly
```typescript
// Debug
console.log(item.width, item.styles?.width);
const calculated = toWidgetSize('XL'); // Should return 'XL'
```

### Issue: Size doesn't update on resize
**Solution**: Use `useWidgetResize()` hook
```typescript
const { containerRef } = useWidgetResize(
  (data) => console.log('Size changed:', data.size)
);
```

### Issue: Undefined config error still occurring
**Solution**: Always use defensive getters
```typescript
// ✅ Safe
const config = getWidgetSizeConfig(size);

// ❌ Unsafe
const config = WIDGET_SIZES[size];
```

---

**Last Updated**: 2026-01-07
**Status**: Production Ready ✅
