
"use client";

import React, { CSSProperties, memo, useRef, useState, useEffect, useCallback, Suspense, DragEvent } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import type { ContentItem, PatternSettings, Alignment, GridSizingMode, ItemType, ItemLayout } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { AppLogo } from './icons/app-logo';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Skeleton } from './ui/skeleton';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from './ui/context-menu';
import { Plus, Clipboard, Settings, Folder, Trash2 } from 'lucide-react';

import { calculateLayout, LayoutMode } from '@/lib/layout-engine';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

const PlayerFrame = dynamic(() => import('./player-frame'), {
  loading: () => <Skeleton className="w-full h-full" />
});

import { WidgetRenderer } from './widget-renderer';

const noop = () => {};

const WebGLBackground = dynamic(() => import('./webgl-background'), { ssr: false });

type CanvasProps = {
  items: ContentItem[];
  allItems: ContentItem[];
  activeView?: ContentItem | null;
  onSetView?: (item: ContentItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
  deleteItem: (itemId: string) => void;
  copyItem: (itemId: string) => void;
  setHoveredItemId: (id: string | null) => void;
  hoveredItemId?: string | null;
  selectedItemIds: string[];
  onItemClick: (item: ContentItem, event: React.MouseEvent | React.TouchEvent) => void;
  isLoading: boolean;
  onLoadComplete: () => void;
  onShare: (item: ContentItem) => void;
  onShowInfo: (item: ContentItem) => void;
  onNewItemInPlayer: (playerId: string, url?: string) => void;
  onPreviewItem: (item: ContentItem) => void;
  activeViewId: string | null;
  username: string;
  isBeingDraggedOver: boolean;
  focusedItemId: string | null;
  onFocusCleared: () => void;
  onAddItem: (itemData: Partial<ContentItem> & { type: ItemType }, parentId: string | null, index?: number) => void;
  onPaste?: () => void;
  onShowFolderProperties?: () => void;
  widgetTemplates: Record<string, Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>[]>;
  onSaveItem: (item: ContentItem) => void;
  onOpenInNewTab?: (item: ContentItem) => void;
  gridSize: number;
  layoutMode?: LayoutMode;
  isPreviewMode?: boolean;
  isSuspended?: boolean;
};

const Canvas = memo(function Canvas({ 
  items, 
  allItems,
  activeView,
  onSetView,
  onUpdateItem,
  deleteItem,
  copyItem,
  setHoveredItemId,
  hoveredItemId,
  selectedItemIds,
  onItemClick,
  isLoading,
  onLoadComplete,
  onShare,
  onShowInfo,
  onNewItemInPlayer,
  onPreviewItem,
  onOpenInNewTab,
  activeViewId,
  username,
  isBeingDraggedOver,
  focusedItemId,
  onFocusCleared,
  onAddItem,
  onPaste,
  onShowFolderProperties,
  widgetTemplates,
  onSaveItem,
  gridSize,
  layoutMode = 'grid',
  isPreviewMode = false,
  isSuspended = false,
}: CanvasProps) {

  const {
    baseFrameStyles = {},
    borderRadius = 8,
    padding = 32,
    gap = 24,
    scale = 100,
    activeAnimation,
    background = {},
    pattern = null,
    patternSettings = { color: 'hsl(var(--border) / 0.4)', lineWidth: 1, dotSize: 0.5 },
    isPlayerHeaderVisible = true,
    isPlayerSettingsVisible = true,
    frameEffect = 'none',
    frameColor,
    frameWidth,
    frameStyle,
    layoutMode: savedLayoutMode = 'grid',
  } = activeView || {};

  // DEBUG
  useEffect(() => {
    if (items.length === 0 && activeViewId === 'root' && process.env.NODE_ENV === 'development') {
      console.debug('[CANVAS] Root view render with NO items:', {
        itemsCount: items.length,
        activeViewId,
        activeView: { id: activeView?.id, title: activeView?.title, childrenCount: activeView?.children?.length },
        allItemsCount: allItems.length,
        allItemsWithRoot: allItems.filter(i => i.parentId === 'root').map(i => ({ id: i.id, title: i.title }))
      });
    }
  }, [items, activeViewId, activeView, allItems]);

  const [internalIsLoading, setInternalIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [carouselCenterIndex, setCarouselCenterIndex] = useState(0);
  const responsive = useResponsiveLayout();

  // Calculate responsive grid size based on breakpoint
  const getResponsiveGridSize = () => {
    if (responsive.isMobile) {
      return Math.max(gridSize * 0.75, 80); // 75% on mobile, min 80px
    } else if (responsive.isTablet) {
      return Math.max(gridSize * 0.9, 120); // 90% on tablet, min 120px
    }
    return gridSize; // Full size on desktop
  };

  const responsiveGridSize = getResponsiveGridSize();
  const normalizedLayoutMode: LayoutMode = layoutMode === 'canvas' ? 'canvas' : 'grid';

  // Canvas moduna özel kısayollar
  useEffect(() => {
    if (normalizedLayoutMode !== 'canvas') return;
    
    // Canvas modu için keyboard shortcuts (gelecekte eklenebilir)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Flow chart ve navigation shortcuts buraya gelecek
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [normalizedLayoutMode, items.length]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
            setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
      setInternalIsLoading(false);
      onLoadComplete();
  }, [items, onLoadComplete]);

  const canvasScale = (scale || 100) / 100;
  // Use proper scaling approach - avoid transform scale for better rendering
  const scaledWrapperStyle = canvasScale !== 1 ? {
    zoom: canvasScale,
    // Only use transform scale if absolutely necessary, otherwise use zoom
  } : undefined;

  const renderItem = useCallback((item: ContentItem) => {
    const isSelected = selectedItemIds.includes(item.id);
    
    const frameOptions: any = {
      ...baseFrameStyles,
      borderRadius: `${borderRadius}px`,
      frameEffect,
      frameColor,
      frameWidth,
    };

    return (
        <PlayerFrame 
          item={item} 
          globalStyles={frameOptions}
          onUpdateItem={onUpdateItem}
          onDeleteItem={deleteItem}
          onCopyItem={copyItem}
          isSelected={isSelected}
          onSetView={onSetView}
          isPlayerHeaderVisible={isPlayerHeaderVisible}
          isPlayerSettingsVisible={isPlayerSettingsVisible}
          onLoad={noop}
          onShare={onShare}
          onShowInfo={onShowInfo}
          onNewItemInPlayer={onNewItemInPlayer}
          onPreviewItem={onPreviewItem}
          onOpenInNewTab={onOpenInNewTab}
          isInteractive={!isPreviewMode}
          onItemClick={onItemClick}
          username={username}
          onSaveItem={onSaveItem}
          activeAnimation={activeAnimation}
          layoutMode={normalizedLayoutMode as any}
        >
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <WidgetRenderer 
                  item={item}
                  allItems={allItems}
                  widgetTemplates={widgetTemplates}
                  onLoad={noop} 
                  onUpdateItem={onUpdateItem}
                  onNewItemInPlayer={onNewItemInPlayer}
                  onSetView={onSetView}
                  onAddItem={onAddItem}
                  activeViewId={activeViewId}
                  username={username}
                  isPreview={isPreviewMode}
                  isSuspended={isSuspended}
              />
            </Suspense>
        </PlayerFrame>
    );
  }, [selectedItemIds, baseFrameStyles, borderRadius, frameEffect, frameColor, frameWidth, frameStyle, allItems, widgetTemplates, onUpdateItem, onNewItemInPlayer, onSetView, onAddItem, activeViewId, username, deleteItem, copyItem, isPlayerHeaderVisible, isPlayerSettingsVisible, onShare, onShowInfo, onPreviewItem, onItemClick, onSaveItem, activeAnimation, isPreviewMode, isSuspended, activeView?.pointerFrameEnabled, activeView?.audioTrackerEnabled, activeView?.virtualizerMode, activeView?.visualizerMode, scale]);
  
  if (isLoading || internalIsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <AppLogo className="h-16 w-16 text-primary" />
      </div>
    );
  }

  const canvasStyle: CSSProperties = {
    ...background,
  };
  
  const patternStyle: CSSProperties = {
    '--pattern-color': patternSettings.color,
    '--pattern-line-width': `${patternSettings.lineWidth}px`,
    '--pattern-size': `${patternSettings.dotSize}mm`,
  } as CSSProperties;

  const webglBackgroundClass = cn(
      'absolute inset-0 w-full h-full',
      background?.backgroundSize === 'contain' ? 'object-contain' : 'object-cover'
  );

  const handleDragOver = (e: React.DragEvent) => {
    if (isPreviewMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isPreviewMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const itemData = JSON.parse(data);
        onAddItem(itemData, activeViewId);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Drop error:', err);
        }
      }
    }
  };

  const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
  const deletableSelectedItems = selectedItems.filter((item) => item.isDeletable !== false);

  const handleDeleteSelected = () => {
    if (isPreviewMode || deletableSelectedItems.length === 0) return;
    deletableSelectedItems.forEach((item) => deleteItem(item.id));
    onFocusCleared();
  };

  return (
    <div 
      className={cn('w-full h-full relative overflow-hidden')} 
      data-testid="main-canvas" 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Fixed Background Layer */}
      <div 
        className={cn(isPreviewMode ? 'absolute' : 'fixed', 'inset-0 z-0 pointer-events-none')} 
        style={{
          ...canvasStyle,
          position: isPreviewMode ? 'absolute' : 'fixed',
          zIndex: 0,
        }}
      >
          {background?.webgl && <WebGLBackground type={background.webgl} className={webglBackgroundClass} />}
          {pattern && <div className={cn('absolute inset-0', `pattern-${pattern}`)} style={patternStyle} />}
          {pattern === 'folderName' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <h1 className="text-[20vw] font-black text-foreground/5">{activeView?.title}</h1>
              </div>
          )}
      </div>

      {/* Scrollable Content Layer */}
      <ContextMenu>
        <ContextMenuTrigger className="relative z-10 w-full h-full block">
          <div className="w-full h-full overflow-auto overflow-x-hidden" ref={containerRef}>
            <div className={cn(canvasScale !== 1 && 'origin-top-left')} style={scaledWrapperStyle}>
              <Droppable droppableId="canvas-droppable" direction="horizontal" isDropDisabled={isPreviewMode || normalizedLayoutMode !== 'grid'} type="canvas-item">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      'transition-all duration-500 relative w-full min-h-full select-none',
                      normalizedLayoutMode === 'grid' ? 'grid' : 'block',
                      snapshot.isDraggingOver && normalizedLayoutMode === 'grid' && "bg-primary/5 ring-2 ring-primary/20 ring-inset rounded-lg"
                    )}
                    style={{ 
                      padding: `${padding}px`, 
                      gap: `${gap}px`, 
                      gridTemplateColumns: normalizedLayoutMode === 'grid' ? `repeat(auto-fill, minmax(${responsiveGridSize}px, 1fr))` : undefined,
                      gridAutoRows: normalizedLayoutMode === 'grid' ? `${responsiveGridSize}px` : undefined,
                      height: normalizedLayoutMode !== 'grid' ? '100%' : undefined
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {items.map((item, index) => {
                        const layoutCalc = calculateLayout(
                          normalizedLayoutMode,
                          index,
                          items.length,
                          containerSize.width,
                          containerSize.height,
                          item,
                          { carouselCenterIndex }
                        );

                        return (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                            isDragDisabled={isPreviewMode || item.isDeletable === false || normalizedLayoutMode !== 'grid'}
                          >
                            {(provided, snapshot) => (
                              <motion.div
                                layout={normalizedLayoutMode === 'grid'}
                                initial={false}
                                animate={{ 
                                  opacity: 1, 
                                  scale: snapshot.isDragging ? 1.05 : 1,
                                  zIndex: snapshot.isDragging ? 100 : (layoutCalc.styles.zIndex as number || 1),
                                  ...(snapshot.isDragging ? {} : layoutCalc.styles as any)
                                }}
                                transition={{ 
                                  type: "tween",
                                  duration: normalizedLayoutMode === 'grid' ? 0.2 : 0,
                                  ease: "easeOut"
                                }}
                                ref={provided.innerRef}
                                {...(normalizedLayoutMode === 'grid' ? provided.draggableProps as any : {})}
                                {...(isPreviewMode || normalizedLayoutMode === 'canvas' ? {} : (provided.dragHandleProps as any))}
                                className={cn(
                                  "relative group",
                                  snapshot.isDragging && "z-50",
                                  (snapshot.isDragging && !snapshot.draggingOver) && "ring-4 ring-destructive rounded-lg",
                                  layoutCalc.className,
                                  normalizedLayoutMode === 'canvas' && "cursor-move"
                                )}
                                style={{
                                  ...provided.draggableProps.style,
                                  ...(normalizedLayoutMode === 'canvas' ? { 
                                    position: 'absolute',
                                    left: layoutCalc.styles.left,
                                    top: layoutCalc.styles.top,
                                    width: layoutCalc.styles.width,
                                    height: layoutCalc.styles.height,
                                    zIndex: layoutCalc.styles.zIndex
                                  } : {}),
                                  ...(snapshot.isDragging && normalizedLayoutMode === 'grid' ? {} : layoutCalc.styles)
                                }}
                              >
                                {renderItem(item)}
                              </motion.div>
                            )}
                          </Draggable>
                        );
                      })}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem
            onClick={handleDeleteSelected}
            disabled={deletableSelectedItems.length === 0 || isPreviewMode}
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Seçili Öğeleri Sil</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onAddItem({ type: 'player', title: 'Yeni Oynatıcı', content: '' }, activeViewId)}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Yeni Oynatıcı</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onAddItem({ type: 'folder', title: 'Yeni Klasör' }, activeViewId)}>
                <Folder className="mr-2 h-4 w-4" />
                <span>Yeni Klasör</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onPaste}>
                <Clipboard className="mr-2 h-4 w-4" />
                <span>Yapıştır</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onShowFolderProperties}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Klasör Özellikleri</span>
            </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
});

export default Canvas;
