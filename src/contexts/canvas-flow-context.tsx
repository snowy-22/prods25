'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { useNavigation, UseNavigationReturn } from '@/hooks/use-navigation';
import { useDragDrop, UseDragDropReturn, UseDragDropOptions } from '@/hooks/use-drag-drop';
import { DragSourceType, DropTargetType, DragContext, DropToken, DropZoneState } from '@/lib/cross-drag-system';

/**
 * Birleşik Navigasyon ve Sürükle-Bırak Context'i
 * 
 * Tüm alt bileşenlere navigasyon ve drag-drop yetenekleri sağlar.
 * Props drilling'i ortadan kaldırır.
 * 
 * @example
 * // Provider
 * <CanvasFlowProvider>
 *   <App />
 * </CanvasFlowProvider>
 * 
 * // Consumer
 * const { navigation, createDragSource, createDropTarget } = useCanvasFlow();
 * navigation.openInNewTab(item);
 */

// Navigation Context
interface NavigationContextValue extends UseNavigationReturn {}

const NavigationContext = createContext<NavigationContextValue | null>(null);

// DragDrop Factory Context
interface DragDropContextValue {
  /** Global drag state */
  draggedItem: ContentItem | null;
  isDragging: boolean;
  
  /** Drag source factory */
  createDragSource: (options: {
    sourceType: DragSourceType;
    item: ContentItem;
    sourceData?: any;
    onDragStart?: (item: ContentItem) => void;
    onDragEnd?: (item: ContentItem, dropped: boolean) => void;
  }) => {
    dragHandlers: {
      draggable: boolean;
      onDragStart: (e: React.DragEvent) => void;
      onDragEnd: (e: React.DragEvent) => void;
    };
    isDragging: boolean;
  };
  
  /** Drop target factory */
  createDropTarget: (options: {
    targetType: DropTargetType;
    targetData?: any;
    onDrop?: (item: ContentItem, context: DragContext) => void | Promise<void>;
    onDragOver?: (context: DragContext) => void;
    onDragLeave?: () => void;
  }) => {
    dropHandlers: {
      onDragOver: (e: React.DragEvent) => void;
      onDragEnter: (e: React.DragEvent) => void;
      onDragLeave: (e: React.DragEvent) => void;
      onDrop: (e: React.DragEvent) => void;
    };
    isOver: boolean;
    dropState: DropZoneState;
    dropToken: DropToken | null;
    canDrop: boolean;
  };
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

// Combined Context
interface CanvasFlowContextValue {
  navigation: NavigationContextValue;
  dragDrop: DragDropContextValue;
}

const CanvasFlowContext = createContext<CanvasFlowContextValue | null>(null);

// Provider Props
interface CanvasFlowProviderProps {
  children: ReactNode;
}

// Navigation Provider
export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigation = useNavigation();
  
  return (
    <NavigationContext.Provider value={navigation}>
      {children}
    </NavigationContext.Provider>
  );
}

// DragDrop Provider
export function DragDropProvider({ children }: { children: ReactNode }) {
  // Base drag state
  const baseDrag = useDragDrop({});
  
  const contextValue = useMemo((): DragDropContextValue => ({
    draggedItem: baseDrag.draggedItem,
    isDragging: baseDrag.isDragging,
    
    createDragSource: (options) => {
      // Note: This returns a configuration object, not a hook
      // Components should use useDragDrop directly for full functionality
      return {
        dragHandlers: {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            e.stopPropagation();
            e.dataTransfer.setData('application/json', JSON.stringify({
              id: options.item.id,
              type: options.item.type,
              title: options.item.title,
              sourceType: options.sourceType,
            }));
            e.dataTransfer.effectAllowed = 'all';
            baseDrag.startDrag(options.item);
            options.onDragStart?.(options.item);
          },
          onDragEnd: (e: React.DragEvent) => {
            const wasDropped = e.dataTransfer.dropEffect !== 'none';
            baseDrag.endDrag();
            options.onDragEnd?.(options.item, wasDropped);
          },
        },
        isDragging: baseDrag.isDragging && baseDrag.draggedItem?.id === options.item.id,
      };
    },
    
    createDropTarget: (options) => {
      // Note: This returns a configuration object
      // For full functionality, use useDragDrop hook directly
      return {
        dropHandlers: {
          onDragOver: (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
          },
          onDragEnter: (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
          },
          onDragLeave: (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            options.onDragLeave?.();
          },
          onDrop: async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (baseDrag.draggedItem) {
              const context: DragContext = {
                sourceType: 'library-item',
                targetType: options.targetType,
                item: baseDrag.draggedItem,
                targetData: options.targetData,
              };
              await options.onDrop?.(baseDrag.draggedItem, context);
            }
          },
        },
        isOver: false,
        dropState: 'idle' as DropZoneState,
        dropToken: null,
        canDrop: !!baseDrag.draggedItem,
      };
    },
  }), [baseDrag]);
  
  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
}

// Combined Provider
export function CanvasFlowProvider({ children }: CanvasFlowProviderProps) {
  return (
    <NavigationProvider>
      <DragDropProvider>
        <CanvasFlowContextInner>
          {children}
        </CanvasFlowContextInner>
      </DragDropProvider>
    </NavigationProvider>
  );
}

// Inner component to access both contexts
function CanvasFlowContextInner({ children }: { children: ReactNode }) {
  const navigation = useContext(NavigationContext);
  const dragDrop = useContext(DragDropContext);
  
  const value = useMemo((): CanvasFlowContextValue | null => {
    if (!navigation || !dragDrop) return null;
    return { navigation, dragDrop };
  }, [navigation, dragDrop]);
  
  return (
    <CanvasFlowContext.Provider value={value}>
      {children}
    </CanvasFlowContext.Provider>
  );
}

// Consumer Hooks
export function useCanvasFlowNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useCanvasFlowNavigation must be used within NavigationProvider');
  }
  return context;
}

export function useCanvasFlowDragDrop(): DragDropContextValue {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useCanvasFlowDragDrop must be used within DragDropProvider');
  }
  return context;
}

export function useCanvasFlow(): CanvasFlowContextValue {
  const context = useContext(CanvasFlowContext);
  if (!context) {
    throw new Error('useCanvasFlow must be used within CanvasFlowProvider');
  }
  return context;
}

// Convenience export
export {
  NavigationContext,
  DragDropContext,
  CanvasFlowContext,
};
