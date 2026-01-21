'use client';

import { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { useAppStore } from '@/lib/store';
import {
  CrossDragManager,
  DragSourceType,
  DropTargetType,
  DragContext,
  DropToken,
  DropZoneState,
  initializeDefaultRules,
} from '@/lib/cross-drag-system';

/**
 * Evrensel Sürükle-Bırak Hook'u
 * 
 * Cross-Drag-System ile entegre çalışır.
 * Tüm kaynak ve hedef türlerini destekler.
 * Visual feedback sağlar.
 * 
 * @example
 * // Kaynak olarak kullanım
 * const { dragHandlers, isDragging } = useDragDrop({
 *   sourceType: 'library-item',
 *   item: myItem,
 * });
 * <div {...dragHandlers}>Sürüklenebilir</div>
 * 
 * // Hedef olarak kullanım
 * const { dropHandlers, dropState, dropToken } = useDragDrop({
 *   targetType: 'canvas',
 *   onDrop: (item, context) => console.log('Bırakıldı:', item),
 * });
 * <div {...dropHandlers}>Bırakma alanı</div>
 */

// Singleton manager instance
let dragManager: CrossDragManager | null = null;

function getDragManager(): CrossDragManager {
  if (!dragManager) {
    dragManager = CrossDragManager.getInstance();
    initializeDefaultRules(dragManager);
  }
  return dragManager;
}

export interface UseDragDropOptions {
  /** Kaynak türü (sürükleme için) */
  sourceType?: DragSourceType;
  /** Hedef türü (bırakma için) */
  targetType?: DropTargetType;
  /** Sürüklenecek öğe */
  item?: ContentItem;
  /** Ek kaynak verisi */
  sourceData?: any;
  /** Ek hedef verisi */
  targetData?: any;
  /** Bırakma callback'i */
  onDrop?: (item: ContentItem, context: DragContext) => void | Promise<void>;
  /** Sürükleme başladığında */
  onDragStart?: (item: ContentItem) => void;
  /** Sürükleme bittiğinde */
  onDragEnd?: (item: ContentItem, dropped: boolean) => void;
  /** Öğe üzerine gelince */
  onDragOver?: (context: DragContext) => void;
  /** Öğe ayrılınca */
  onDragLeave?: () => void;
  /** Sürükleme devre dışı */
  disabled?: boolean;
}

export interface DragHandlers {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export interface DropHandlers {
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export interface UseDragDropReturn {
  // State
  isDragging: boolean;
  isOver: boolean;
  dropState: DropZoneState;
  dropToken: DropToken | null;
  canDrop: boolean;
  draggedItem: ContentItem | null;
  
  // Handlers
  dragHandlers: DragHandlers;
  dropHandlers: DropHandlers;
  
  // Actions
  startDrag: (item: ContentItem) => void;
  endDrag: () => void;
  
  // Utils
  getDragContext: () => DragContext | null;
}

// Global drag state (shared across all instances)
let globalDraggedItem: ContentItem | null = null;
let globalSourceType: DragSourceType | null = null;
let globalSourceData: any = null;
const dragListeners = new Set<() => void>();

function notifyDragListeners() {
  dragListeners.forEach(listener => listener());
}

export function useDragDrop(options: UseDragDropOptions = {}): UseDragDropReturn {
  const {
    sourceType,
    targetType,
    item,
    sourceData,
    targetData,
    onDrop,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    disabled = false,
  } = options;

  const store = useAppStore();
  const manager = useMemo(() => getDragManager(), []);
  
  // Local state
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [dropState, setDropState] = useState<DropZoneState>('idle');
  const [, forceUpdate] = useState({});
  
  const dragCountRef = useRef(0);
  
  // Subscribe to global drag state changes
  useEffect(() => {
    const listener = () => forceUpdate({});
    dragListeners.add(listener);
    return () => {
      dragListeners.delete(listener);
    };
  }, []);

  // Current drag context
  const getDragContext = useCallback((): DragContext | null => {
    if (!globalDraggedItem || !globalSourceType) return null;
    if (!targetType) return null;
    
    return {
      sourceType: globalSourceType,
      targetType,
      item: globalDraggedItem,
      sourceData: globalSourceData,
      targetData,
    };
  }, [targetType, targetData]);

  // Can drop check
  const canDrop = useMemo(() => {
    const context = getDragContext();
    if (!context) return false;
    return manager.canDrop(context);
  }, [manager, getDragContext]);

  // Drop token for visual feedback
  const dropToken = useMemo((): DropToken | null => {
    const context = getDragContext();
    if (!context || !isOver) return null;
    return manager.getDropToken(context);
  }, [manager, getDragContext, isOver]);

  // Drag handlers (for drag sources)
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (disabled || !item || !sourceType) return;
    
    e.stopPropagation();
    
    // Set global drag state
    globalDraggedItem = item;
    globalSourceType = sourceType;
    globalSourceData = sourceData;
    
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      type: item.type,
      title: item.title,
      sourceType,
    }));
    e.dataTransfer.effectAllowed = 'all';
    
    // Create custom drag image
    const dragEl = e.currentTarget as HTMLElement;
    if (dragEl) {
      const rect = dragEl.getBoundingClientRect();
      const clone = dragEl.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-1000px';
      clone.style.opacity = '0.8';
      clone.style.transform = 'scale(0.9)';
      clone.style.pointerEvents = 'none';
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
      setTimeout(() => clone.remove(), 0);
    }
    
    setIsDragging(true);
    store.setDraggedItem(item);
    manager.setActiveDrag({
      sourceType,
      targetType: 'canvas', // Default target
      item,
      sourceData,
    });
    
    onDragStart?.(item);
    notifyDragListeners();
  }, [disabled, item, sourceType, sourceData, store, manager, onDragStart]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const wasDropped = e.dataTransfer.dropEffect !== 'none';
    
    // Clear global drag state
    const draggedItem = globalDraggedItem;
    globalDraggedItem = null;
    globalSourceType = null;
    globalSourceData = null;
    
    setIsDragging(false);
    store.setDraggedItem(null);
    manager.setActiveDrag(null);
    
    if (draggedItem) {
      onDragEnd?.(draggedItem, wasDropped);
    }
    
    notifyDragListeners();
  }, [store, manager, onDragEnd]);

  // Drop handlers (for drop targets)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (disabled || !targetType) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const context = getDragContext();
    if (!context) return;
    
    // Set drop effect based on can drop
    const canDropHere = manager.canDrop(context);
    e.dataTransfer.dropEffect = canDropHere ? 'move' : 'none';
    
    setDropState(canDropHere ? 'accept' : 'reject');
    onDragOver?.(context);
  }, [disabled, targetType, getDragContext, manager, onDragOver]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (disabled || !targetType) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    dragCountRef.current++;
    
    if (dragCountRef.current === 1) {
      setIsOver(true);
      setDropState('hover');
    }
  }, [disabled, targetType]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (disabled || !targetType) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    dragCountRef.current--;
    
    if (dragCountRef.current === 0) {
      setIsOver(false);
      setDropState('idle');
      onDragLeave?.();
    }
  }, [disabled, targetType, onDragLeave]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    if (disabled || !targetType) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    dragCountRef.current = 0;
    setIsOver(false);
    setDropState('loading');
    
    const context = getDragContext();
    if (!context) {
      setDropState('idle');
      return;
    }
    
    // Check if drop is allowed
    if (!manager.canDrop(context)) {
      setDropState('reject');
      setTimeout(() => setDropState('idle'), 500);
      return;
    }
    
    try {
      // Execute drop action
      await manager.executeDrop(context);
      
      // Call custom onDrop handler
      if (onDrop && globalDraggedItem) {
        await onDrop(globalDraggedItem, context);
      }
      
      setDropState('accept');
    } catch (error) {
      console.error('Drop error:', error);
      setDropState('reject');
    }
    
    setTimeout(() => setDropState('idle'), 300);
  }, [disabled, targetType, getDragContext, manager, onDrop]);

  // Manual drag control
  const startDrag = useCallback((dragItem: ContentItem) => {
    if (!sourceType) return;
    
    globalDraggedItem = dragItem;
    globalSourceType = sourceType;
    globalSourceData = sourceData;
    
    setIsDragging(true);
    store.setDraggedItem(dragItem);
    manager.setActiveDrag({
      sourceType,
      targetType: 'canvas',
      item: dragItem,
      sourceData,
    });
    
    onDragStart?.(dragItem);
    notifyDragListeners();
  }, [sourceType, sourceData, store, manager, onDragStart]);

  const endDrag = useCallback(() => {
    const draggedItem = globalDraggedItem;
    
    globalDraggedItem = null;
    globalSourceType = null;
    globalSourceData = null;
    
    setIsDragging(false);
    store.setDraggedItem(null);
    manager.setActiveDrag(null);
    
    if (draggedItem) {
      onDragEnd?.(draggedItem, false);
    }
    
    notifyDragListeners();
  }, [store, manager, onDragEnd]);

  // Assembled handlers
  const dragHandlers: DragHandlers = useMemo(() => ({
    draggable: !disabled && !!sourceType && !!item,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  }), [disabled, sourceType, item, handleDragStart, handleDragEnd]);

  const dropHandlers: DropHandlers = useMemo(() => ({
    onDragOver: handleDragOver,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }), [handleDragOver, handleDragEnter, handleDragLeave, handleDrop]);

  return {
    isDragging,
    isOver,
    dropState,
    dropToken,
    canDrop,
    draggedItem: globalDraggedItem,
    dragHandlers,
    dropHandlers,
    startDrag,
    endDrag,
    getDragContext,
  };
}

// Utility hook for drop zone styling
export function useDropZoneStyles(dropState: DropZoneState, dropToken: DropToken | null) {
  return useMemo(() => {
    const baseStyles: React.CSSProperties = {
      transition: 'all 0.2s ease',
    };
    
    switch (dropState) {
      case 'hover':
        return {
          ...baseStyles,
          outline: '2px dashed #94a3b8',
          outlineOffset: '-2px',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
        };
      case 'accept':
        return {
          ...baseStyles,
          outline: `2px solid ${dropToken?.color || '#10b981'}`,
          outlineOffset: '-2px',
          backgroundColor: `${dropToken?.color || '#10b981'}15`,
          boxShadow: `0 0 12px ${dropToken?.color || '#10b981'}40`,
        };
      case 'reject':
        return {
          ...baseStyles,
          outline: `2px solid ${dropToken?.color || '#ef4444'}`,
          outlineOffset: '-2px',
          backgroundColor: `${dropToken?.color || '#ef4444'}15`,
        };
      case 'loading':
        return {
          ...baseStyles,
          outline: '2px dashed #3b82f6',
          outlineOffset: '-2px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          animation: 'pulse 1s infinite',
        };
      default:
        return baseStyles;
    }
  }, [dropState, dropToken]);
}

export default useDragDrop;
