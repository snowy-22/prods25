/**
 * Action Executors
 * 
 * Timeline'daki aksiyonları gerçekten çalıştıran fonksiyonlar.
 * Her aksiyon tipi için bir executor fonksiyonu tanımlanır.
 */

import {
  Action,
  ScrollAction,
  NavigateAction,
  StyleChangeAction,
  ItemChangeAction,
  ZoomAction,
  LayoutChangeAction,
  ItemAddAction,
  ItemRemoveAction,
  ItemMoveAction,
  AnimationAction,
  WaitAction,
  CameraMoveAction,
} from '@/lib/recording-studio-types';
import { ContentItem } from '@/lib/initial-content';

export type ActionExecutor = (
  action: Action,
  progress: number, // 0-1 easing uygulanmış
  context: ExecutionContext
) => void | Promise<void>;

export interface ExecutionContext {
  // Canvas/UI state
  canvasElement?: HTMLElement;
  activeItems?: ContentItem[];
  
  // Zoom control
  setZoom?: (zoom: number) => void;
  currentZoom?: number;
  
  // Layout control
  setLayoutMode?: (mode: 'grid' | 'canvas') => void;
  currentLayoutMode?: 'grid' | 'canvas';
  
  // Navigation
  navigate?: (path: string) => void;
  currentPath?: string;
  
  // Item manipulation
  updateItem?: (itemId: string, updates: Partial<ContentItem>) => void;
  addItem?: (item: ContentItem) => void;
  removeItem?: (itemId: string) => void;
  
  // Custom handlers
  customExecutors?: Map<string, ActionExecutor>;
}

/**
 * Scroll Action Executor
 * Sayfayı/canvas'ı kaydırır
 */
export const executeScrollAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'scroll') return;
  const scrollAction = action as ScrollAction;
  
  const target = scrollAction.targetPosition;
  const startX = window.scrollX;
  const startY = window.scrollY;
  
  const targetX = target.x;
  const targetY = target.y;
  
  // Calculate current position based on progress
  const currentX = startX + (targetX - startX) * progress;
  const currentY = startY + (targetY - startY) * progress;
  
  if (scrollAction.smooth) {
    window.scrollTo({
      left: currentX,
      top: currentY,
      behavior: 'auto', // We handle smoothness via progress/easing
    });
  } else {
    window.scrollTo(currentX, currentY);
  }
};

/**
 * Navigate Action Executor
 * Sayfalar arası gezinme
 */
export const executeNavigateAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'navigate') return;
  const navAction = action as NavigateAction;
  
  // Navigation happens instantly at the start (progress === 0) or end (progress === 1)
  // depending on when you want the navigation to occur
  if (progress >= 1 && context.navigate) {
    context.navigate(navAction.targetUrl);
  }
};

/**
 * Style Change Action Executor
 * Öğe stillerini değiştirir
 */
export const executeStyleChangeAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'style-change') return;
  const styleAction = action as StyleChangeAction;
  
  const element = document.querySelector(`[data-item-id="${styleAction.targetItemId}"]`) as HTMLElement;
  if (!element) return;
  
  // Apply styles with interpolation
  Object.entries(styleAction.styles).forEach(([property, targetValue]) => {
    // Simple implementation - for numeric values, interpolate
    if (typeof targetValue === 'number') {
      const currentValue = parseFloat(getComputedStyle(element).getPropertyValue(property)) || 0;
      const newValue = currentValue + (targetValue - currentValue) * progress;
      element.style.setProperty(property, `${newValue}${styleAction.unit || 'px'}`);
    } else {
      // For non-numeric, apply at end
      if (progress >= 1) {
        element.style.setProperty(property, String(targetValue));
      }
    }
  });
};

/**
 * Item Change Action Executor
 * ContentItem özelliklerini değiştirir
 */
export const executeItemChangeAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'item-change') return;
  const itemAction = action as ItemChangeAction;
  
  // Apply changes at the end of the action
  if (progress >= 1 && context.updateItem) {
    context.updateItem(itemAction.targetItemId, itemAction.changes);
  }
};

/**
 * Zoom Action Executor
 * Canvas zoom seviyesini değiştirir
 */
export const executeZoomAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'zoom') return;
  const zoomAction = action as ZoomAction;
  
  if (!context.setZoom) return;
  
  const currentZoom = zoomAction.fromZoom;
  const targetZoom = zoomAction.toZoom;
  const newZoom = currentZoom + (targetZoom - currentZoom) * progress;
  
  context.setZoom(newZoom);
};

/**
 * Layout Change Action Executor
 * Grid/Canvas layout değiştirir
 */
export const executeLayoutChangeAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'layout-change') return;
  const layoutAction = action as LayoutChangeAction;
  
  // Layout change happens instantly at the end
  if (progress >= 1 && context.setLayoutMode) {
    context.setLayoutMode(layoutAction.targetLayout);
  }
};

/**
 * Item Add Action Executor
 * Yeni item ekler
 */
export const executeItemAddAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'item-add') return;
  const addAction = action as ItemAddAction;
  
  // Add item at the end
  if (progress >= 1 && context.addItem) {
    // Create item with fade-in animation
    const newItem: ContentItem = {
      ...addAction.item,
      styles: {
        ...addAction.item.styles,
        opacity: progress, // Fade in effect
      },
    };
    context.addItem(newItem);
  }
};

/**
 * Item Remove Action Executor
 * Item'ı siler
 */
export const executeItemRemoveAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'item-remove') return;
  const removeAction = action as ItemRemoveAction;
  
  if (!context.removeItem) return;
  
  // Fade out during action
  const element = document.querySelector(`[data-item-id="${removeAction.targetItemId}"]`) as HTMLElement;
  if (element) {
    element.style.opacity = String(1 - progress);
  }
  
  // Remove at the end
  if (progress >= 1) {
    context.removeItem(removeAction.targetItemId);
  }
};

/**
 * Item Move Action Executor
 * Item'ı yeni pozisyona taşır
 */
export const executeItemMoveAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'item-move') return;
  const moveAction = action as ItemMoveAction;
  
  if (!context.updateItem) return;
  
  const startPos = moveAction.fromPosition;
  const targetPos = moveAction.toPosition;
  
  // Interpolate position
  const currentX = startPos.x + (targetPos.x - startPos.x) * progress;
  const currentY = startPos.y + (targetPos.y - startPos.y) * progress;
  
  context.updateItem(moveAction.targetItemId, {
    x: currentX,
    y: currentY,
  });
};

/**
 * Animation Action Executor
 * Genel animasyon efektleri (fade, scale, rotate, vb.)
 */
export const executeAnimationAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'animation') return;
  const animAction = action as AnimationAction;
  
  const element = document.querySelector(`[data-item-id="${animAction.targetItemId}"]`) as HTMLElement;
  if (!element) return;
  
  switch (animAction.animationType) {
    case 'fade-in':
      element.style.opacity = String(progress);
      break;
      
    case 'fade-out':
      element.style.opacity = String(1 - progress);
      break;
      
    case 'scale-up': {
      const scale = 1 + progress;
      element.style.transform = `scale(${scale})`;
      break;
    }
      
    case 'scale-down': {
      const scale = 1 - progress * 0.5;
      element.style.transform = `scale(${scale})`;
      break;
    }
      
    case 'rotate': {
      const rotation = 360 * progress;
      element.style.transform = `rotate(${rotation}deg)`;
      break;
    }
      
    case 'slide-left': {
      const offset = -100 * progress;
      element.style.transform = `translateX(${offset}%)`;
      break;
    }
      
    case 'slide-right': {
      const offset = 100 * progress;
      element.style.transform = `translateX(${offset}%)`;
      break;
    }
      
    case 'slide-up': {
      const offset = -100 * progress;
      element.style.transform = `translateY(${offset}%)`;
      break;
    }
      
    case 'slide-down': {
      const offset = 100 * progress;
      element.style.transform = `translateY(${offset}%)`;
      break;
    }
      
    default:
      // Custom animation via properties
      if (animAction.properties) {
        Object.entries(animAction.properties).forEach(([prop, value]) => {
          if (typeof value === 'number') {
            const interpolated = value * progress;
            element.style.setProperty(prop, String(interpolated));
          }
        });
      }
  }
};

/**
 * Wait Action Executor
 * Hiçbir şey yapmaz, sadece bekler
 */
export const executeWaitAction: ActionExecutor = (action, progress, context) => {
  // Do nothing - just wait for duration
};

/**
 * Camera Move Action Executor
 * Canvas kamera pozisyonunu değiştirir (pan & zoom)
 */
export const executeCameraMoveAction: ActionExecutor = (action, progress, context) => {
  if (action.type !== 'camera-move') return;
  const cameraAction = action as CameraMoveAction;
  
  const startPos = cameraAction.fromPosition;
  const targetPos = cameraAction.toPosition;
  
  // Interpolate camera position
  const currentX = startPos.x + (targetPos.x - startPos.x) * progress;
  const currentY = startPos.y + (targetPos.y - startPos.y) * progress;
  
  // Apply to canvas container
  if (context.canvasElement) {
    context.canvasElement.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }
  
  // Also handle zoom if specified
  if (cameraAction.zoom !== undefined && context.setZoom) {
    const startZoom = context.currentZoom || 1;
    const targetZoom = cameraAction.zoom;
    const currentZoom = startZoom + (targetZoom - startZoom) * progress;
    context.setZoom(currentZoom);
  }
};

/**
 * Main Executor Registry
 * Tüm executor'ları bir map'te tutar
 */
export const ACTION_EXECUTORS = new Map<string, ActionExecutor>([
  ['scroll', executeScrollAction],
  ['navigate', executeNavigateAction],
  ['style-change', executeStyleChangeAction],
  ['item-change', executeItemChangeAction],
  ['zoom', executeZoomAction],
  ['layout-change', executeLayoutChangeAction],
  ['item-add', executeItemAddAction],
  ['item-remove', executeItemRemoveAction],
  ['item-move', executeItemMoveAction],
  ['animation', executeAnimationAction],
  ['wait', executeWaitAction],
  ['camera-move', executeCameraMoveAction],
]);

/**
 * Register custom executor
 */
export function registerActionExecutor(actionType: string, executor: ActionExecutor) {
  ACTION_EXECUTORS.set(actionType, executor);
}

/**
 * Execute action with context
 */
export function executeAction(
  action: Action,
  progress: number,
  context: ExecutionContext = {}
): void {
  // Check custom executors first
  if (context.customExecutors?.has(action.type)) {
    const customExecutor = context.customExecutors.get(action.type)!;
    customExecutor(action, progress, context);
    return;
  }
  
  // Use default executor
  const executor = ACTION_EXECUTORS.get(action.type);
  if (executor) {
    executor(action, progress, context);
  } else {
    console.warn(`No executor found for action type: ${action.type}`);
  }
}
