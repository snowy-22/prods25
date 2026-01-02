/**
 * Dynamic Imports for Code Splitting
 * 
 * Heavy components are loaded only when needed to reduce initial bundle size.
 * Using next/dynamic with ssr: false for client-only components.
 */

import dynamic from 'next/dynamic';

// Share & Export Components (loaded only when user opens share dialog)
export const DynamicShareCardsDialog = dynamic(
  () => import('@/components/share-cards-dialog').then(mod => ({ default: mod.ShareCardsDialog })),
  {
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false,
  }
);

export const DynamicStylePresetDialog = dynamic(
  () => import('@/components/style-preset-dialog').then(mod => ({ default: mod.StylePresetDialog })),
  {
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false,
  }
);

export const DynamicCanvasShareToolbar = dynamic(
  () => import('@/components/canvas-share-toolbar').then(mod => ({ default: mod.CanvasShareToolbar })),
  {
    loading: () => <div className="animate-pulse bg-muted h-12 rounded-lg" />,
    ssr: false,
  }
);

// Player Components (loaded only when canvas has media items)
export const DynamicSmartPlayerRender = dynamic(
  () => import('@/components/smart-player-render').then(mod => ({ default: mod.SmartPlayerRender })),
  {
    loading: () => <div className="animate-pulse bg-muted aspect-video rounded-lg" />,
    ssr: false,
  }
);

export const DynamicTopMenuBarControls = dynamic(
  () => import('@/components/top-menu-bar-controls').then(mod => ({ default: mod.TopMenuBarControls })),
  {
    loading: () => <div className="animate-pulse bg-muted h-16 rounded-lg" />,
    ssr: false,
  }
);

// 3D & Heavy Visualization Components
export const DynamicFloorPlanCamera = dynamic(
  () => import('@/components/floor-plan-camera').then(mod => ({ default: mod.FloorPlanCamera })),
  {
    loading: () => <div className="animate-pulse bg-muted aspect-square rounded-lg" />,
    ssr: false,
  }
);

export const DynamicAISketchModule = dynamic(
  () => import('@/components/ai-sketch-module').then(mod => ({ default: mod.AISketchModule })),
  {
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false,
  }
);

// Chart & Analytics Components (heavy recharts library)
export const DynamicAnalysisPanel = dynamic(
  () => import('@/components/analysis-panel').then(mod => ({ default: mod.AnalysisPanel })),
  {
    loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" />,
    ssr: false,
  }
);

// API Keys Dialog (loaded only when user opens settings)
export const DynamicAPIKeysDialog = dynamic(
  () => import('@/components/api-keys-dialog').then(mod => ({ default: mod.APIKeysDialog })),
  {
    loading: () => <div className="animate-pulse bg-muted h-64 rounded-lg" />,
    ssr: false,
  }
);

/**
 * Usage Example:
 * 
 * ```tsx
 * import { DynamicShareCardsDialog } from '@/lib/dynamic-imports';
 * 
 * function MyComponent() {
 *   const [showDialog, setShowDialog] = useState(false);
 *   
 *   return (
 *     <>
 *       <button onClick={() => setShowDialog(true)}>Share</button>
 *       {showDialog && <DynamicShareCardsDialog />}
 *     </>
 *   );
 * }
 * ```
 */
