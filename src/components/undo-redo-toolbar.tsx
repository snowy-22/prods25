/**
 * Undo/Redo Toolbar Component
 * 
 * Canvas üzerinde undo/redo işlemleri için floating toolbar
 * - Undo/Redo butonları
 * - Stack boyutu gösterimi
 * - Klavye kısayolu ipuçları
 * - Operation history panel toggle
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Undo2, 
  Redo2, 
  History, 
  Clock, 
  X,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UndoRedoState, UndoRedoActions } from '@/hooks/use-undo-redo';
import type { Operation, UndoRedoResult } from '@/lib/operation-service';
import OperationHistoryPanel from './operation-history-panel';

interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  undoStackSize: number;
  redoStackSize: number;
  lastOperation: Operation | null;
  isLoading: boolean;
  performUndo: () => Promise<UndoRedoResult>;
  performRedo: () => Promise<UndoRedoResult>;
  refreshHistory: () => Promise<void>;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center';
  showHistory?: boolean;
  compact?: boolean;
}

export function UndoRedoToolbar({
  canUndo,
  canRedo,
  undoStackSize,
  redoStackSize,
  lastOperation,
  isLoading,
  performUndo,
  performRedo,
  refreshHistory,
  className,
  position = 'top-left',
  showHistory = true,
  compact = false
}: UndoRedoToolbarProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2'
  };

  const handleUndo = async () => {
    const result = await performUndo();
    if (result.success) {
      console.log('Undo successful:', result);
    } else {
      console.error('Undo failed:', result.error);
    }
  };

  const handleRedo = async () => {
    const result = await performRedo();
    if (result.success) {
      console.log('Redo successful:', result);
    } else {
      console.error('Redo failed:', result.error);
    }
  };

  if (compact && !isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'fixed z-50',
          positionClasses[position],
          className
        )}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-8 w-8 p-0 rounded-full shadow-lg"
        >
          <History className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'fixed z-50 flex items-center gap-1 p-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg',
          positionClasses[position],
          className
        )}
      >
        <TooltipProvider delayDuration={300}>
          {/* Undo Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo || isLoading}
                className={cn(
                  'h-9 px-3 gap-2',
                  canUndo && 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Undo2 className="h-4 w-4" />
                )}
                {!compact && undoStackSize > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-xs">
                    {undoStackSize}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="flex items-center gap-2">
                Geri Al
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+Z</kbd>
              </p>
              {lastOperation && (
                <p className="text-xs text-muted-foreground mt-1">
                  Son: {lastOperation.operation_type} - {lastOperation.target_title || lastOperation.target_id}
                </p>
              )}
            </TooltipContent>
          </Tooltip>

          {/* Redo Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo || isLoading}
                className={cn(
                  'h-9 px-3 gap-2',
                  canRedo && 'hover:bg-green-100 dark:hover:bg-green-900/30'
                )}
              >
                <Redo2 className="h-4 w-4" />
                {!compact && redoStackSize > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-xs">
                    {redoStackSize}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="flex items-center gap-2">
                İleri Al
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+Y</kbd>
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          {showHistory && (
            <>
              <div className="w-px h-6 bg-border mx-1" />

              {/* History Panel Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isHistoryOpen ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="h-9 px-3"
                  >
                    <Clock className="h-4 w-4" />
                    {!compact && <span className="ml-2">Geçmiş</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>İşlem Geçmişi Paneli</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Refresh Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshHistory}
                disabled={isLoading}
                className="h-9 w-9"
              >
                <History className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Geçmişi Yenile</p>
            </TooltipContent>
          </Tooltip>

          {/* Collapse Button (compact mode) */}
          {compact && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </TooltipProvider>
      </motion.div>

      {/* Operation History Panel */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
              'fixed z-40 top-16 left-4 w-80 max-h-[70vh] bg-background border rounded-lg shadow-xl overflow-hidden'
            )}
          >
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                İşlem Geçmişi
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsHistoryOpen(false)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
              <OperationHistoryPanel 
                compact={true}
                onOperationSelect={(op) => {
                  console.log('Selected operation:', op);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default UndoRedoToolbar;
