'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Undo2,
  Redo2,
  History,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Move,
  Maximize2,
  Palette,
  Folder,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  operationService,
  Operation,
  OperationType
} from '@/lib/operation-service';
import { useAppStore } from '@/lib/store';

// Operation type icons
const operationIcons: Record<OperationType, React.ReactNode> = {
  'item_create': <Plus className="w-4 h-4 text-green-500" />,
  'item_update': <Pencil className="w-4 h-4 text-blue-500" />,
  'item_delete': <Trash2 className="w-4 h-4 text-red-500" />,
  'item_move': <Move className="w-4 h-4 text-orange-500" />,
  'item_resize': <Maximize2 className="w-4 h-4 text-purple-500" />,
  'item_style': <Palette className="w-4 h-4 text-pink-500" />,
  'folder_create': <Folder className="w-4 h-4 text-green-500" />,
  'folder_update': <Folder className="w-4 h-4 text-blue-500" />,
  'folder_delete': <Folder className="w-4 h-4 text-red-500" />,
  'batch_operation': <History className="w-4 h-4 text-cyan-500" />,
  'undo': <Undo2 className="w-4 h-4 text-gray-500" />,
  'redo': <Redo2 className="w-4 h-4 text-gray-500" />
};

// Status icons
const statusIcons = {
  pending: <Clock className="w-3 h-3 text-yellow-500" />,
  completed: <CheckCircle2 className="w-3 h-3 text-green-500" />,
  undone: <RotateCcw className="w-3 h-3 text-orange-500" />,
  redone: <Redo2 className="w-3 h-3 text-blue-500" />,
  failed: <XCircle className="w-3 h-3 text-red-500" />
};

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Az önce';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
  return date.toLocaleDateString('tr-TR');
}

// Operation Item Component
interface OperationItemProps {
  operation: Operation;
  onUndo?: () => void;
  canUndo?: boolean;
}

function OperationItem({ operation, onUndo, canUndo }: OperationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        'border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors',
        operation.status === 'undone' && 'opacity-60 line-through decoration-1'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {operationIcons[operation.operation_type]}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {operation.entity_name || operation.entity_id}
            </span>
            {statusIcons[operation.status]}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatRelativeTime(new Date(operation.created_at))}</span>
            {operation.operation_type && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {operation.operation_type.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          {canUndo && operation.status === 'completed' && onUndo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onUndo}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Geri Al</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Entity ID:</span>
                  <span className="ml-1 font-mono">{operation.entity_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Entity Type:</span>
                  <span className="ml-1">{operation.entity_type}</span>
                </div>
              </div>
              
              {operation.previous_state && (
                <div>
                  <span className="text-muted-foreground">Önceki Durum:</span>
                  <pre className="mt-1 p-2 bg-muted rounded text-[10px] overflow-auto max-h-24">
                    {JSON.stringify(operation.previous_state, null, 2)}
                  </pre>
                </div>
              )}
              
              {operation.new_state && (
                <div>
                  <span className="text-muted-foreground">Yeni Durum:</span>
                  <pre className="mt-1 p-2 bg-muted rounded text-[10px] overflow-auto max-h-24">
                    {JSON.stringify(operation.new_state, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main Component
interface OperationHistoryPanelProps {
  className?: string;
  compact?: boolean;
  onOperationSelect?: (operation: Operation) => void;
}

export function OperationHistoryPanel({ className, compact = false, onOperationSelect }: OperationHistoryPanelProps) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAppStore(state => state.user);
  
  // Load operations
  const loadOperations = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const ops = await operationService.loadHistory({ limit: 50 });
      setOperations(ops);
      
      // Update undo/redo availability
      const { canUndo: u, canRedo: r } = await operationService.getUndoRedoAvailability();
      setCanUndo(u);
      setCanRedo(r);
    } catch (error) {
      console.error('Failed to load operations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Initial load and subscribe
  useEffect(() => {
    loadOperations();
    
    if (user) {
      const unsubscribe = operationService.subscribe((payload) => {
        loadOperations();
      });
      
      return () => unsubscribe();
    }
  }, [user, loadOperations]);
  
  // Undo handler
  const handleUndo = async () => {
    const result = await operationService.undo();
    if (result) {
      loadOperations();
    }
  };
  
  // Redo handler
  const handleRedo = async () => {
    const result = await operationService.redo();
    if (result) {
      loadOperations();
    }
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo]);
  
  if (compact) {
    // Compact toolbar version
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!canUndo}
                onClick={handleUndo}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Geri Al (Ctrl+Z)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!canRedo}
                onClick={handleRedo}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Yinele (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5" />
          <h3 className="font-semibold">İşlem Geçmişi</h3>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canUndo}
                  onClick={handleUndo}
                  className="gap-1"
                >
                  <Undo2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Geri Al</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ctrl+Z</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canRedo}
                  onClick={handleRedo}
                  className="gap-1"
                >
                  <Redo2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Yinele</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ctrl+Y</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Operations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : operations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Henüz işlem yok</p>
              <p className="text-xs mt-1">Yaptığınız değişiklikler burada görünecek</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {operations.map((op, index) => (
                <OperationItem
                  key={op.id}
                  operation={op}
                  canUndo={index === 0}
                  onUndo={index === 0 ? handleUndo : undefined}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer Stats */}
      {operations.length > 0 && (
        <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{operations.length} işlem</span>
            <span>
              {operations.filter(o => o.status === 'undone').length} geri alındı
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperationHistoryPanel;
