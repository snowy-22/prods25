/**
 * Undo/Redo Hook
 * Canvas ve benzeri editorlerde undo/redo işlemlerini yönetir
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import {
  recordOperation,
  undoLastOperation,
  redoLastOperation,
  canUndo,
  canRedo,
  getUndoStack,
  getRedoStack,
  subscribeToOperations,
  getSessionId,
  loadOperationHistory,
  Operation,
  UndoRedoResult,
  OperationType
} from '@/lib/operation-service';
import { ContentItem } from '@/lib/initial-content';

export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoStackSize: number;
  redoStackSize: number;
  lastOperation: Operation | null;
  isLoading: boolean;
}

export interface UndoRedoActions {
  recordItemCreate: (item: ContentItem) => Promise<void>;
  recordItemUpdate: (itemId: string, previousState: Partial<ContentItem>, nextState: Partial<ContentItem>) => Promise<void>;
  recordItemDelete: (item: ContentItem) => Promise<void>;
  recordItemMove: (item: ContentItem, previousPosition: { x?: number; y?: number }, nextPosition: { x?: number; y?: number }) => Promise<void>;
  recordItemResize: (item: ContentItem, previousSize: { width?: number; height?: number }, nextSize: { width?: number; height?: number }) => Promise<void>;
  recordStyleChange: (item: ContentItem, previousStyles: any, nextStyles: any) => Promise<void>;
  performUndo: () => Promise<UndoRedoResult>;
  performRedo: () => Promise<UndoRedoResult>;
  refreshHistory: () => Promise<void>;
}

export function useUndoRedo(
  canvasId: string = 'default',
  onApplyState?: (targetTable: string, targetId: string, state: any, operationType: OperationType) => void
): UndoRedoState & UndoRedoActions {
  const user = useAppStore(state => state.user);
  const [state, setState] = useState<UndoRedoState>({
    canUndo: false,
    canRedo: false,
    undoStackSize: 0,
    redoStackSize: 0,
    lastOperation: null,
    isLoading: false
  });
  
  const sessionId = useRef(getSessionId());

  // Update state from stacks
  const updateState = useCallback(() => {
    const undoStack = getUndoStack();
    const redoStack = getRedoStack();
    setState(prev => ({
      ...prev,
      canUndo: canUndo(),
      canRedo: canRedo(),
      undoStackSize: undoStack.length,
      redoStackSize: redoStack.length,
      lastOperation: undoStack[undoStack.length - 1] || null
    }));
  }, []);

  // Initialize and subscribe to changes
  useEffect(() => {
    if (!user?.id) return;

    const loadHistory = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        await loadOperationHistory(user.id, { sessionId: sessionId.current });
        updateState();
      } catch (error) {
        console.error('Failed to load operation history:', error);
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadHistory();

    // Subscribe to real-time changes
    const unsubscribe = subscribeToOperations(user.id, (operation) => {
      console.log('Operation change received:', operation);
      updateState();
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, updateState]);

  // Record operations
  const recordItemCreate = useCallback(async (item: ContentItem) => {
    if (!user?.id) return;
    
    await recordOperation(
      user.id,
      'create',
      'canvas_items',
      item.id,
      null,
      item,
      {
        targetTitle: item.title,
        canvasId,
        folderId: item.parentId || undefined
      }
    );
    updateState();
  }, [user?.id, canvasId, updateState]);

  const recordItemUpdate = useCallback(async (
    itemId: string,
    previousState: Partial<ContentItem>,
    nextState: Partial<ContentItem>
  ) => {
    if (!user?.id) return;
    
    await recordOperation(
      user.id,
      'update',
      'canvas_items',
      itemId,
      previousState,
      nextState,
      {
        targetTitle: (nextState as ContentItem).title || (previousState as ContentItem).title,
        canvasId
      }
    );
    updateState();
  }, [user?.id, canvasId, updateState]);

  const recordItemDelete = useCallback(async (item: ContentItem) => {
    if (!user?.id) return;
    
    await recordOperation(
      user.id,
      'delete',
      'canvas_items',
      item.id,
      item,
      null,
      {
        targetTitle: item.title,
        canvasId,
        folderId: item.parentId || undefined
      }
    );
    updateState();
  }, [user?.id, canvasId, updateState]);

  const recordItemMove = useCallback(async (
    item: ContentItem,
    previousPosition: { x?: number; y?: number },
    nextPosition: { x?: number; y?: number }
  ) => {
    if (!user?.id) return;
    
    await recordOperation(
      user.id,
      'move',
      'canvas_items',
      item.id,
      { x: previousPosition.x, y: previousPosition.y },
      { x: nextPosition.x, y: nextPosition.y },
      {
        targetTitle: item.title,
        canvasId,
        folderId: item.parentId || undefined
      }
    );
    updateState();
  }, [user?.id, canvasId, updateState]);

  const recordItemResize = useCallback(async (
    item: ContentItem,
    previousSize: { width?: number; height?: number },
    nextSize: { width?: number; height?: number }
  ) => {
    if (!user?.id) return;
    
    await recordOperation(
      user.id,
      'resize',
      'canvas_items',
      item.id,
      { width: previousSize.width, height: previousSize.height },
      { width: nextSize.width, height: nextSize.height },
      {
        targetTitle: item.title,
        canvasId,
        folderId: item.parentId || undefined
      }
    );
    updateState();
  }, [user?.id, canvasId, updateState]);

  const recordStyleChange = useCallback(async (
    item: ContentItem,
    previousStyles: any,
    nextStyles: any
  ) => {
    if (!user?.id) return;
    
    await recordOperation(
      user.id,
      'style_change',
      'canvas_items',
      item.id,
      { styles: previousStyles },
      { styles: nextStyles },
      {
        targetTitle: item.title,
        canvasId,
        folderId: item.parentId || undefined
      }
    );
    updateState();
  }, [user?.id, canvasId, updateState]);

  // Undo/Redo
  const performUndo = useCallback(async (): Promise<UndoRedoResult> => {
    if (!user?.id || !canUndo()) {
      return { success: false, error: 'Cannot undo' };
    }
    
    const result = await undoLastOperation(user.id);
    
    if (result.success && result.restore_state && onApplyState) {
      onApplyState(
        result.target_table!,
        result.target_id!,
        result.restore_state,
        result.operation_type!
      );
    }
    
    updateState();
    return result;
  }, [user?.id, onApplyState, updateState]);

  const performRedo = useCallback(async (): Promise<UndoRedoResult> => {
    if (!user?.id || !canRedo()) {
      return { success: false, error: 'Cannot redo' };
    }
    
    const result = await redoLastOperation(user.id);
    
    if (result.success && result.restore_state && onApplyState) {
      onApplyState(
        result.target_table!,
        result.target_id!,
        result.restore_state,
        result.operation_type!
      );
    }
    
    updateState();
    return result;
  }, [user?.id, onApplyState, updateState]);

  const refreshHistory = useCallback(async () => {
    if (!user?.id) return;
    await loadOperationHistory(user.id, { sessionId: sessionId.current });
    updateState();
  }, [user?.id, updateState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      }
      // Ctrl+Shift+Z or Ctrl+Y for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        performRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);

  return {
    ...state,
    recordItemCreate,
    recordItemUpdate,
    recordItemDelete,
    recordItemMove,
    recordItemResize,
    recordStyleChange,
    performUndo,
    performRedo,
    refreshHistory
  };
}
