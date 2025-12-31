# CanvasFlow AI Coding Guide

## Architecture Overview

**CanvasFlow** is a dynamic digital canvas application for organizing web content (videos, images, websites) and widgets (clocks, notes, todos) in grid or freeform canvas layouts. Built with Next.js 16 + React 19, using Zustand for state and Genkit AI for assistant features.

### Core Concepts
- **Everything is a `ContentItem`**: Folders, videos, widgets, and files share the same base type ([../src/lib/initial-content.ts](../src/lib/initial-content.ts#L140-L300))
- **Dual Layout Modes**: `grid` (responsive constrained) and `canvas` (infinite 2D freeform positioning)
- **Local-First**: Data persists to localStorage via Zustand middleware, no backend required for basic usage
- **JSON-Tracked**: All modules/flows are versioned and tracked for analytics/automation ([../src/lib/json-tracking.ts](../src/lib/json-tracking.ts))

## State Management (Zustand)

**Central store**: [../src/lib/store.ts](../src/lib/store.ts)

```typescript
// Component usage pattern
import { useAppStore } from '@/lib/store';

const Component = () => {
  // Subscribe to specific slices only
  const { layoutMode, setLayoutMode } = useAppStore();
  const tabs = useAppStore(s => s.tabs);
  
  // Actions modify state and auto-persist to localStorage
  setLayoutMode('canvas');
};
```

**Key state slices**:
- `tabs[]` - Multi-tab system with navigation history, undo/redo stacks
- `activeTabId` - Current active tab
- `selectedItemIds[]` - Multi-selection support
- `layoutMode` - 'grid' | 'canvas'
- `chatPanels[]` - Floating AI chat windows

**Never** directly mutate store state. Always use provided actions like `updateTab()`, `setSelectedItem()`.

## Layout System

[src/lib/layout-engine.ts](src/lib/layout-engine.ts) - Handles both grid and canvas positioning

### Grid Mode
- Uses CSS Grid with `gridColumn: span X` and `gridRow: span Y`
- Items have `gridSpanCol` (1-4) and `gridSpanRow` (1-4)
- Responsive, constrained height (160px-600px)

### Canvas Mode
- Absolute positioning with `x`, `y`, `width`, `height` properties
- Collision detection via AABB ([checkCollision()](src/lib/layout-engine.ts#L84))
- Auto-positioning with `findNonOverlappingPosition()` 
- Alignment helpers show visual guides (see [canvas-helpers.tsx](src/components/canvas-helpers.tsx))

**Pattern**: When adding items in canvas mode, always check for collisions and use intelligent positioning.

## Component Architecture

### Canvas Rendering ([src/components/canvas.tsx](src/components/canvas.tsx))
- Main renderer for content items
- Dynamically imports `PlayerFrame` for performance
- Handles drag-and-drop, context menus, and item interactions
- Respects `isSuspended` prop for background tab optimization

### Player Frame ([src/components/player-frame.tsx](src/components/player-frame.tsx))
- Wraps all content types (videos, iframes, widgets)
- Applies frames, borders, animations based on settings
- Manages play/pause state for media items
- **Key**: Use `react-rnd` for draggable/resizable in canvas mode

### Widgets ([src/components/widgets/](src/components/widgets/))
- Self-contained components: `clock-widget.tsx`, `notes-widget.tsx`, etc.
- Rendered via [WidgetRenderer](src/components/widget-renderer.tsx) with `type` discrimination
- All widgets receive `item: ContentItem` and `onUpdate` callback

### Sidebars
- **Primary** ([primary-sidebar.tsx](src/components/primary-sidebar.tsx)): Main navigation (Library, Social, Messages)
- **Secondary** ([secondary-sidebar.tsx](src/components/secondary-sidebar.tsx)): Context-sensitive panel (folder tree, user lists)

## AI Integration (Genkit)

[src/ai/flows/assistant-flow.ts](src/ai/flows/assistant-flow.ts) - Main conversational AI

**Tool Pattern**:
```typescript
const myTool = ai.defineTool({
  name: 'toolName',
  description: 'What it does for the AI',
  inputSchema: z.object({ param: z.string() }),
  outputSchema: z.object({ result: z.string() }),
}, async ({ param }) => {
  // Implementation
  return { result: 'output' };
});

// Use in flow with tools: [myTool, otherTool]
```

**Built-in tools**: `highlightElement` (UI guidance), `youtubeSearch`, `pageScraper`, `analyzeItem`

**Flows**: 
- `assistant-flow.ts` - Chat assistant with tool loop
- `analyze-item-flow.ts` - Content analysis
- `content-adaptive-styling.ts` - AI-suggested frame styles

All flows must use `'use server'` directive and return typed outputs per schema.

## Security Layer

[src/lib/security/](src/lib/security/) - Enterprise-grade security

1. **RBAC** ([rbac.ts](src/lib/security/rbac.ts)): 4 roles (user, moderator, admin, super_admin) with granular permissions
2. **Audit Logging** ([audit-logger.ts](src/lib/security/audit-logger.ts)): Tracks all critical actions
3. **Encryption** ([encryption.ts](src/lib/security/encryption.ts)): AES-256-GCM for sensitive data
4. **Rate Limiting** ([rate-limiter.ts](src/lib/security/rate-limiter.ts)): Per-endpoint throttling
5. **GDPR** ([gdpr.ts](src/lib/security/gdpr.ts)): Data export, deletion (30-day grace), consent management

**API Route Pattern** ([middleware.ts](src/lib/security/middleware.ts)):
```typescript
export async function POST(req: Request) {
  // Apply security middleware
  const middlewareResult = await applySecurityMiddleware(req);
  if (!middlewareResult.ok) return middlewareResult.response;
  
  // Check permissions
  if (!hasPermission(user, 'content:create')) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Your logic
}
```

## Development Workflow

### Commands
```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run typecheck    # TypeScript validation (no emit)
npm run lint         # ESLint
```

### Environment Setup
Required vars in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
ENCRYPTION_KEY=<32-byte-hex>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### TypeScript Patterns
- Path alias: `@/*` → `./src/*`
- Strict mode enabled
- Define types in [src/lib/types.ts](src/lib/types.ts) or [initial-content.ts](src/lib/initial-content.ts)
- **Never** use `any` - use `unknown` and narrow with type guards

### Styling
- **Tailwind CSS 4** with `@tailwindcss/postcss`
- Use `cn()` utility from [utils.ts](src/lib/utils.ts) for conditional classes
- UI components from `shadcn/ui` in [src/components/ui/](src/components/ui/)
- Animations via `framer-motion` (see [ChatMessage](src/components/chat/chat-message.tsx) for examples)

## Common Patterns

### Adding a New Widget Type
1. Add type to `ItemType` union in [initial-content.ts](src/lib/initial-content.ts#L9)
2. Create widget component in [src/components/widgets/](src/components/widgets/)
3. Register in [WidgetRenderer](src/components/widget-renderer.tsx) switch statement
4. Add to widget templates in store if needed

### Creating a New API Route
1. Place in [src/app/api/](src/app/api/) following Next.js App Router convention
2. Import and apply `applySecurityMiddleware` from [middleware.ts](src/lib/security/middleware.ts)
3. Use RBAC `hasPermission()` for authorization
4. Return proper HTTP status codes

### Implementing New AI Tool
1. Define in [src/ai/flows/](src/ai/flows/) with Zod schemas
2. Use `ai.defineTool()` pattern
3. Register in target flow's `tools` array
4. Document in tool's description field for AI context

## Key Files Reference

| File | Purpose |
|------|---------|
| [src/lib/store.ts](src/lib/store.ts) | Central Zustand store with persistence |
| [src/lib/initial-content.ts](src/lib/initial-content.ts) | ContentItem type definitions |
| [src/lib/layout-engine.ts](src/lib/layout-engine.ts) | Grid/canvas layout calculations |
| [src/components/canvas.tsx](src/components/canvas.tsx) | Main content renderer |
| [src/ai/flows/assistant-flow.ts](src/ai/flows/assistant-flow.ts) | AI chat assistant |
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Full project architecture (Turkish) |
| [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) | Setup & security guide (Turkish) |

## Project-Specific Conventions

- **Turkish Documentation**: Core docs are in Turkish; code/comments in English
- **No Firebase**: Previously used Firebase, now fully local-first with Supabase for auth only
- **Tab System**: Multi-tab with history stacks - prefer `openInNewTab()` over in-place navigation
- **Dynamic Imports**: Heavy components use `next/dynamic` with loading states
- **Test IDs**: Use `data-testid` attributes for AI assistant highlighting
- **Collision-Free**: Always use layout engine helpers when positioning in canvas mode
