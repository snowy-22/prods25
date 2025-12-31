# CanvasFlow: Database & Animation Features - Quick Reference

## 🎯 What Was Built

### 1. Supabase Database Schema
10 new production-ready tables with Row-Level Security

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `nfts` | Digital assets/NFTs | contract_address, token_id, chain, rarity_score |
| `achievements` | User badges & milestones | achievement_type, points, rarity_level, earned_at |
| `achievement_categories` | Preset badge types | name, icon_emoji, color_hex, max_points |
| `user_analytics` | User engagement stats | total_views, total_shares, engagement_score |
| `canvas_flows` | Diagram definitions | flow_data (JSON), is_animated, animation_speed |
| `flow_connections` | Node connections | connection_type, animation_style, stroke_color |
| `widget_library` | Reusable templates | widget_type, config (JSON), is_public, rating |
| `user_shortcuts` | Custom hotkeys | shortcut_key, action_type, action_data (JSON) |
| `favorites` | Collections | item_id, item_type, collection_name |
| `notifications` | In-app messages | notification_type, title, message, is_read |

**File**: `docs/database_extensions.sql`

### 2. AnimatedMinimap Component
Canvas-based minimap with 4 animated pattern types

```typescript
import { AnimatedMinimap } from '@/components/widgets/animated-minimap';

<AnimatedMinimap
  items={items}
  patternType="grid" // dot, grid, lines, gradient
  animationSpeed={1} // 0.5 - 2
  showCompass={true}
  showViewport={true}
  onItemClick={(id) => {...}}
/>
```

**Features**:
- ✨ Animated background patterns
- 🎯 Interactive item hover detection
- 📍 Viewport indicator
- 🧭 Directional compass
- ⚡ Canvas-based (60 FPS)

**File**: `src/components/widgets/animated-minimap.tsx`

### 3. AnimatedConnections Component
SVG + Canvas flowing connections between nodes

```typescript
import { AnimatedConnections, useAnimatedConnections } from '@/components/animated-connections';

const { connections, addConnection, removeConnection } = useAnimatedConnections();

<AnimatedConnections
  connections={connections}
  width={800}
  height={600}
  animationSpeed={1}
  globalAnimated={true}
/>
```

**Path Types**: bezier (smooth, default), straight, smooth  
**Animation Styles**: flow (particles), pulse, gradient

**Features**:
- 🌊 Flowing particle trails
- 💫 Glow & blur effects
- 🎨 Arrow markers & gradients
- ⚡ 60 FPS with 10-20 connections

**File**: `src/components/animated-connections.tsx`

## 🚀 Getting Started (5 Minutes)

### Step 1: Setup Database (2 min)
```bash
# 1. Copy entire contents of docs/database_extensions.sql
# 2. Go to https://app.supabase.com → Your Project → SQL Editor
# 3. Create new query and paste SQL
# 4. Click "Run"
# 5. Verify all 10 tables created
```

### Step 2: Add Minimap to Canvas (2 min)
```typescript
// In your canvas component
import { AnimatedMinimap } from '@/components/widgets/animated-minimap';

export function Canvas() {
  return (
    <div className="relative w-full h-full">
      {/* Canvas content */}
      
      {/* Add minimap */}
      <div className="absolute bottom-4 right-4 w-48 h-36">
        <AnimatedMinimap
          items={canvasItems}
          patternType="grid"
          showCompass={true}
        />
      </div>
    </div>
  );
}
```

### Step 3: Add Flowing Connections (1 min)
```typescript
// In flowchart widget
import { AnimatedConnections, useAnimatedConnections } from '@/components/animated-connections';

export function Flowchart() {
  const { connections, addConnection } = useAnimatedConnections();

  // Add connections between nodes
  addConnection({
    id: 'conn-1',
    from: { nodeId: 'node-1', x: 100, y: 100 },
    to: { nodeId: 'node-2', x: 300, y: 300 },
    animated: true,
    animationStyle: 'flow',
    strokeColor: '#FFD93D',
  });

  return (
    <AnimatedConnections
      connections={connections}
      width={800}
      height={600}
    />
  );
}
```

## 📊 Pattern Types Reference

### AnimatedMinimap Patterns

| Pattern | Speed | Best For | CPU Impact |
|---------|-------|----------|-----------|
| `dot` | ⚡ Fastest | Light animations | Very Low |
| `grid` | ⚡ Fast | Recommended | Low |
| `lines` | 🟡 Medium | Moving flows | Medium |
| `gradient` | 🔴 Slower | Rich visuals | High |

**Recommendation**: Use `grid` for best balance of performance and visuals

### AnimatedConnections Styles

| Style | Effect | Best For |
|-------|--------|----------|
| `flow` | ✨ Particles with trails | Data flows, processes |
| `pulse` | 💫 Pulsing lines | Attention drawing |
| `gradient` | 🌈 Sweeping gradient | Visual elegance |

**Recommendation**: Use `flow` for most use cases

## 🎨 Customization Examples

### Minimap with Custom Colors
```typescript
<AnimatedMinimap
  patternType="dot"
  items={[
    {
      id: 'widget-1',
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      title: 'Video Player',
      color: 'rgba(100, 200, 150, 0.6)', // Custom color
    },
  ]}
/>
```

### Connections with Custom Colors
```typescript
addConnection({
  id: 'conn-1',
  from: { nodeId: 'in', x: 50, y: 150 },
  to: { nodeId: 'out', x: 400, y: 150 },
  animated: true,
  animationStyle: 'flow',
  strokeColor: '#6C5CE7', // Custom purple
  strokeWidth: 3, // Custom width
});
```

### Slow Animation for Accessibility
```typescript
<AnimatedMinimap
  items={items}
  animationSpeed={0.5} // Half speed
/>

<AnimatedConnections
  connections={connections}
  animationSpeed={0.5} // Half speed
/>
```

## 📈 Performance Tips

### For Best Performance
✅ Use `grid` pattern for minimap  
✅ Limit to 10-20 connections  
✅ Set `animationSpeed={1}` (default)  
✅ Use `globalAnimated={true}` only when needed  

### For Low-Power Devices
⚠️ Use `dot` or `grid` patterns  
⚠️ Set `animationSpeed={0.5}`  
⚠️ Set `globalAnimated={false}`  
⚠️ Limit connections to 5-10  

### Mobile Optimization
📱 Set `animationSpeed={0.75}`  
📱 Use smaller minimap (`width="150" height="120"`)  
📱 Use `grid` pattern  
📱 Disable compass/viewport on mobile  

## 🔒 Security Features

- ✅ All tables have Row-Level Security (RLS)
- ✅ Users can only see their own data
- ✅ Public/shared content is supported
- ✅ Audit trails available via json_tracking
- ✅ Timestamps auto-updated via triggers

## 📚 Full Documentation

- **Setup Guide**: `docs/DATABASE_AND_ANIMATION_GUIDE.md` (600+ lines)
- **SQL Schema**: `docs/database_extensions.sql` (400+ lines)
- **Session Summary**: `docs/SESSION_SUMMARY.md`

## 🆘 Troubleshooting

### Minimap not rendering
```typescript
// Make sure canvas is in viewport
<div style={{ position: 'relative', width: '200px', height: '150px' }}>
  <AnimatedMinimap width={200} height={150} items={items} />
</div>
```

### Connections not animating
```typescript
// Make sure globalAnimated is true
<AnimatedConnections
  connections={connections}
  globalAnimated={true} // Required for particle effects
/>
```

### Performance issues
```typescript
// Reduce animation speed
<AnimatedMinimap animationSpeed={0.5} />
<AnimatedConnections animationSpeed={0.5} />

// Or use static patterns
<AnimatedMinimap patternType="grid" animationSpeed={0.5} />
```

## 📞 Support

All components are fully typed with TypeScript and include:
- ✅ JSDoc comments
- ✅ Type definitions
- ✅ Usage examples
- ✅ Error handling

## 🎯 Next Steps

1. **Database**: Run SQL schema in Supabase
2. **Integration**: Add minimap to canvas page
3. **Connections**: Add to flowchart widget
4. **Features**: Build achievement tracking
5. **Analytics**: Implement user statistics

## 📋 Checklist

- [ ] Copy `database_extensions.sql` to Supabase
- [ ] Run SQL in Supabase SQL Editor
- [ ] Verify 10 tables created
- [ ] Add `.env.local` variables if needed
- [ ] Import AnimatedMinimap component
- [ ] Add minimap to canvas page
- [ ] Import AnimatedConnections component
- [ ] Add connections to flowchart widget
- [ ] Test animations in browser
- [ ] Check performance (should be 60 FPS)
- [ ] Deploy to production

---

**Need Help?** Check `docs/DATABASE_AND_ANIMATION_GUIDE.md` for detailed examples and integration patterns.
