# Database & Animation Feature Implementation Guide

## 1. Supabase Database Setup

### Step 1: Create New Tables

Copy the SQL from `docs/database_extensions.sql` and run it in Supabase SQL editor:

1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Create a new query
5. Paste the entire contents of `docs/database_extensions.sql`
6. Click "Run"

**Tables Created:**
- `nfts` - Digital assets/NFT storage (500 KB per user recommended)
- `achievements` - User achievements/badges with scoring
- `achievement_categories` - Pre-configured achievement types
- `user_analytics` - User statistics and engagement metrics
- `canvas_flows` - Canvas diagram definitions with animation settings
- `flow_connections` - Animated connections between flow nodes
- `widget_library` - Reusable widget templates
- `user_shortcuts` - Custom keyboard shortcuts
- `favorites` - Collections and bookmarks
- `notifications` - In-app notifications

**Security Features:**
- Row-Level Security (RLS) policies enabled for all tables
- User isolation (users can't see others' private data)
- Public/shared content support for social features
- Audit-ready structure

### Step 2: Configure Environment Variables

Add to `.env.local`:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# NFT Support (optional)
NFT_API_KEY=your_nft_provider_key

# Analytics
ANALYTICS_ENABLED=true

# Stripe (already configured)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Step 3: Create TypeScript Types

Update `src/lib/types.ts` to include new types:

```typescript
export interface NFTItem {
  id: string;
  userId: string;
  title: string;
  imageUrl: string;
  contractAddress?: string;
  tokenId?: string;
  chain: 'ethereum' | 'polygon' | 'solana' | 'base';
  rarityScore: number;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  title: string;
  points: number;
  rarityLevel: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
  isDisplayed: boolean;
}

export interface CanvasFlow {
  id: string;
  userId: string;
  title: string;
  flowData: {
    nodes: FlowNode[];
    edges: FlowEdge[];
    viewport: ViewportState;
  };
  isAnimated: boolean;
  animationSpeed: number;
  showMinimap: boolean;
  minimapPosition: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  backgroundPattern: 'dot' | 'grid' | 'lines' | 'gradient';
  visibility: 'private' | 'shared' | 'public';
  sharedWith: string[];
  createdAt: string;
}

export interface FlowConnection {
  id: string;
  flowId: string;
  sourceNodeId: string;
  targetNodeId: string;
  connectionType: 'bezier' | 'straight' | 'smooth';
  animated: boolean;
  animationStyle: 'flow' | 'pulse' | 'gradient';
  strokeColor: string;
  strokeWidth: number;
}
```

## 2. Animated Components Usage

### AnimatedMinimap

A canvas-based minimap with animated background patterns and item visualization.

```typescript
import { AnimatedMinimap } from '@/components/widgets/animated-minimap';

<AnimatedMinimap
  items={[
    {
      id: 'widget-1',
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      title: 'Video Player',
      color: 'rgba(100, 200, 150, 0.6)',
    },
  ]}
  patternType="dot"
  animationSpeed={1}
  showCompass={true}
  showViewport={true}
  onItemClick={(id) => console.log('Clicked:', id)}
/>
```

**Props:**
- `items`: Array of minimap items
- `patternType`: 'dot' | 'grid' | 'lines' | 'gradient'
- `animationSpeed`: 0.5 to 2 (default: 1)
- `showCompass`: Show directional compass
- `showViewport`: Show current viewport bounds
- `onItemClick`: Callback when item clicked
- `viewportBounds`: Current viewport rectangle

**Features:**
- 4 animated pattern types
- Hover effects on items
- Viewport indicator
- Compass navigation
- Full interactivity

### AnimatedConnections

SVG + Canvas-based flowing connections between nodes.

```typescript
import { AnimatedConnections, useAnimatedConnections } from '@/components/animated-connections';

const { connections, addConnection, removeConnection, updateConnection } = useAnimatedConnections();

// Add connection
addConnection({
  id: 'conn-1',
  from: { nodeId: 'node-1', x: 100, y: 100 },
  to: { nodeId: 'node-2', x: 400, y: 300 },
  type: 'bezier',
  animated: true,
  animationStyle: 'flow',
  strokeColor: '#FFD93D',
  strokeWidth: 2,
});

<AnimatedConnections
  connections={connections}
  width={800}
  height={600}
  animationSpeed={1}
  globalAnimated={true}
/>
```

**Connection Types:**
- `bezier`: Smooth cubic bezier curve (default)
- `straight`: Direct line
- `smooth`: Quadratic smooth curve

**Animation Styles:**
- `flow`: Flowing particles along line (✨ recommended)
- `pulse`: Pulsing line effect
- `gradient`: Gradient sweep animation

**Features:**
- 3 path types
- 3 animation styles
- Arrow markers
- Glow effects
- Trail effects
- Mouse tracking ready

## 3. Integration Examples

### Canvas with Minimap + Animated Connections

```typescript
import { AnimatedMinimap } from '@/components/widgets/animated-minimap';
import { AnimatedConnections, useAnimatedConnections } from '@/components/animated-connections';

export function EnhancedCanvas() {
  const { connections, addConnection } = useAnimatedConnections();
  const [items, setItems] = useState([]);

  return (
    <div className="relative w-full h-screen bg-slate-950">
      {/* Main canvas area */}
      <div className="flex-1 overflow-auto">
        <svg width="2000" height="1500" className="bg-slate-900">
          {/* Canvas content */}
        </svg>

        {/* Animated connections overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedConnections
            connections={connections}
            width={2000}
            height={1500}
            animationSpeed={1}
          />
        </div>
      </div>

      {/* Minimap in corner */}
      <div className="absolute bottom-4 right-4 w-48 h-36">
        <AnimatedMinimap
          items={items}
          patternType="grid"
          showCompass={true}
          showViewport={true}
        />
      </div>
    </div>
  );
}
```

### Analysis Panel with Flow

```typescript
export function AnalysisPanel() {
  const { connections, addConnection } = useAnimatedConnections();

  useEffect(() => {
    // Create connections between analysis nodes
    const analysisFlow = [
      { id: 'input', x: 50, y: 150 },
      { id: 'process', x: 250, y: 150 },
      { id: 'output', x: 450, y: 150 },
    ];

    for (let i = 0; i < analysisFlow.length - 1; i++) {
      addConnection({
        id: `flow-${i}`,
        from: { nodeId: analysisFlow[i].id, x: analysisFlow[i].x, y: analysisFlow[i].y },
        to: { nodeId: analysisFlow[i + 1].id, x: analysisFlow[i + 1].x, y: analysisFlow[i + 1].y },
        animated: true,
        animationStyle: 'flow',
        strokeColor: '#45B7D1',
      });
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      <AnimatedConnections
        connections={connections}
        width={500}
        height={300}
        animationSpeed={1.2}
      />
    </div>
  );
}
```

## 4. TypeScript Integration

### Supabase Client Types

Update `src/lib/supabase/database.types.ts`:

```typescript
import { Database } from '@/lib/supabase/types';

export type NFT = Database['public']['Tables']['nfts']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type CanvasFlow = Database['public']['Tables']['canvas_flows']['Row'];
export type FlowConnection = Database['public']['Tables']['flow_connections']['Row'];

// API functions
export async function fetchUserNFTs(userId: string) {
  const { data } = await supabase
    .from('nfts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_visible', true);
  return data;
}

export async function fetchUserAchievements(userId: string) {
  const { data } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .eq('is_displayed', true)
    .order('earned_at', { ascending: false });
  return data;
}

export async function saveCanvasFlow(flow: CanvasFlow) {
  const { data, error } = await supabase
    .from('canvas_flows')
    .upsert(flow)
    .select();
  if (error) throw error;
  return data[0];
}
```

## 5. Performance Considerations

### Canvas & Animation Optimization

1. **Minimap Pattern Types** (Performance Order):
   - ✅ `dot`: Fastest (simple circles)
   - ✅ `grid`: Fast (lines only)
   - ⚠️ `lines`: Medium (moving lines)
   - ⚠️ `gradient`: Slower (gradient calculation)

2. **Connection Animation Limits**:
   - ✅ Recommend max 10-20 visible connections
   - ✅ Use `globalAnimated={false}` for static diagrams
   - ⚠️ Disable particle trails on low-end devices

3. **Memory Usage**:
   - Minimap: ~2-3 MB per instance
   - Connections: ~1 MB per 50 connections
   - Consider lazy-loading for large diagrams

### Recommended Settings by Use Case

```typescript
// Light animations (fast devices)
<AnimatedMinimap patternType="dot" animationSpeed={1.2} />

// Standard animations (all devices)
<AnimatedMinimap patternType="grid" animationSpeed={1} />

// Heavy animations (powerful devices)
<AnimatedConnections globalAnimated={true} animationSpeed={1.5} />

// Mobile/Low-power
<AnimatedMinimap patternType="grid" animationSpeed={0.5} />
<AnimatedConnections globalAnimated={false} />
```

## 6. Testing

### Test Supabase Connection

```typescript
// src/lib/__tests__/supabase.test.ts
import { supabase } from '@/lib/supabase/client';

describe('Supabase Connection', () => {
  it('should fetch user achievements', async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### Test Components

```typescript
import { render, screen } from '@testing-library/react';
import { AnimatedMinimap } from '@/components/widgets/animated-minimap';

describe('AnimatedMinimap', () => {
  it('renders with items', () => {
    const items = [
      { id: '1', x: 0, y: 0, width: 100, height: 100, title: 'Item 1' },
    ];

    render(<AnimatedMinimap items={items} width={200} height={150} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
```

## 7. Deployment Checklist

- [ ] Create all Supabase tables (database_extensions.sql)
- [ ] Enable RLS policies on all tables
- [ ] Create database backups
- [ ] Set up automated backup schedule
- [ ] Test Stripe configuration (optional services)
- [ ] Deploy animated components to production
- [ ] Monitor performance with Web Vitals
- [ ] Set up error tracking (Sentry optional)
- [ ] Test OAuth flows (Google/GitHub)
- [ ] Verify all API endpoints work
- [ ] Test canvas minimap functionality
- [ ] Test connection animations
- [ ] Verify responsive design
- [ ] Performance test on mobile devices
- [ ] Security audit of RLS policies

## 8. Next Steps

1. **Immediate**:
   - Run database_extensions.sql in Supabase
   - Update environment variables
   - Test table access with authenticated user

2. **Short-term**:
   - Create API routes for NFT management
   - Implement achievement tracking logic
   - Add canvas flow save/load functionality

3. **Medium-term**:
   - Build UI for NFT gallery
   - Create achievement display component
   - Implement flowchart editor with animations

4. **Long-term**:
   - Social features (sharing, followers)
   - Advanced analytics dashboard
   - Export/import flows as JSON

---

## Support & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Canvas API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [SVG Path Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)
