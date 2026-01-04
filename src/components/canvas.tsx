
"use client";

import React, { CSSProperties, memo, useRef, useState, useEffect, useCallback, useMemo, Suspense, DragEvent } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import type { ContentItem, PatternSettings, Alignment, GridSizingMode, ItemType, ItemLayout } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { AppLogo } from './icons/app-logo';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Skeleton } from './ui/skeleton';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from './ui/context-menu';
import { Plus, Clipboard, Settings, Folder, Trash2 } from 'lucide-react';

import { calculateLayout, LayoutMode, calculateGridPagination, getPaginatedGridItems } from '@/lib/layout-engine';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppStore } from '@/lib/store';
import GridModeControls from './grid-mode-controls';

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
  onSetLayoutMode?: (mode: LayoutMode) => void;
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
  onSetLayoutMode,
  isPreviewMode = false,
  isSuspended = false,
}: CanvasProps) {

  // Grid Mode State from Store
  const gridModeState = useAppStore(state => state.gridModeState);
  const setGridModeEnabled = useAppStore(state => state.setGridModeEnabled);
  const setGridModeType = useAppStore(state => state.setGridModeType);
  const setGridColumns = useAppStore(state => state.setGridColumns);
  const setGridCurrentPage = useAppStore(state => state.setGridCurrentPage);

  // Info Panels State (Mini Map, Descriptions, Comments, Analytics)
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(false);
  const [isDescriptionsVisible, setIsDescriptionsVisible] = useState(false);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false);

  // Video Controls - Detect video items in canvas
  const hasVideoItems = useMemo(() => {
    return items.some(item => 
      item.type === 'video' || 
      item.type === 'player' ||
      (item.url && /\.(mp4|webm|ogg|mov)$/i.test(item.url)) ||
      (item.url && /youtube\.com|youtu\.be|vimeo\.com/i.test(item.url))
    );
  }, [items]);

  // Video Control Callbacks - Toplu kontrol (bulk control for all videos)
  const handlePlayAll = useCallback(() => {
    const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
    videos.forEach((element) => {
      if (element instanceof HTMLVideoElement) {
        element.play().catch(() => {/* Auto-play restrictions */});
      } else if (element instanceof HTMLIFrameElement) {
        // YouTube/Vimeo API integration
        element.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }
    });
  }, []);

  const handlePauseAll = useCallback(() => {
    const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
    videos.forEach((element) => {
      if (element instanceof HTMLVideoElement) {
        element.pause();
      } else if (element instanceof HTMLIFrameElement) {
        element.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
    });
  }, []);

  const handleMuteAll = useCallback(() => {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.muted = true;
    });
  }, []);

  const handleUnmuteAll = useCallback(() => {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.muted = false;
    });
  }, []);

  const handleSkipForward = useCallback(() => {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.currentTime = Math.min(video.currentTime + 10, video.duration);
    });
  }, []);

  const handleSkipBack = useCallback(() => {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.currentTime = Math.max(video.currentTime - 10, 0);
    });
  }, []);

  const handleChangeSpeed = useCallback((speed: number) => {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.playbackRate = speed;
    });
  }, []);

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

  const responsiveGridSize = useMemo(() => getResponsiveGridSize(), [gridSize, responsive.isMobile, responsive.isTablet]);
  const normalizedLayoutMode: LayoutMode = layoutMode === 'canvas' ? 'canvas' : 'grid';

  // Grid Mode Pagination Logic
  const paginatedItems = useMemo(() => {
    // Canvas modda veya grid mode kapalıysa tüm öğeleri göster
    if (!gridModeState.enabled || normalizedLayoutMode === 'canvas') {
      return items;
    }
    
    // Sonsuz modda (vertical) tüm öğeleri göster, scroll ile gezinilir
    if (gridModeState.type === 'vertical') {
      return items;
    }
    
    // Sayfa modunda (square) sadece mevcut sayfadaki öğeleri göster
    const isSquareMode = gridModeState.type === 'square';
    return getPaginatedGridItems(items, gridModeState.columns, isSquareMode, gridModeState.currentPage);
  }, [items, gridModeState.enabled, gridModeState.type, gridModeState.columns, gridModeState.currentPage, normalizedLayoutMode]);

  // Update grid mode total items and pages when items change
  useEffect(() => {
    if (gridModeState.enabled && items.length > 0) {
      const isSquareMode = gridModeState.type === 'square';
      const pagination = calculateGridPagination(
        items.length,
        gridModeState.columns,
        isSquareMode,
        gridModeState.currentPage
      );
      
      // If current page > total pages, reset to page 1
      if (gridModeState.currentPage > pagination.totalPages) {
        setGridCurrentPage(1);
      }
      
      // Sayfa moduna geçişte 1. sayfadan başla (sonsuz moddan geliyorsa)
      if (isSquareMode && gridModeState.currentPage === 0) {
        setGridCurrentPage(1);
      }
    }
  }, [items.length, gridModeState.enabled, gridModeState.type, gridModeState.columns, gridModeState.currentPage, setGridCurrentPage]);

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
  const scaledWrapperStyle = useMemo(() => canvasScale !== 1 ? {
    zoom: canvasScale,
    // Only use transform scale if absolutely necessary, otherwise use zoom
  } : undefined, [canvasScale]);

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
          data-item-id={item.id}
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
  
  // All hooks must be defined before any conditional returns
  const canvasStyle: CSSProperties = useMemo(() => ({
    ...background,
  }), [background]);
  
  const patternStyle: CSSProperties = useMemo(() => ({
    '--pattern-color': patternSettings.color,
    '--pattern-line-width': `${patternSettings.lineWidth}px`,
    '--pattern-size': `${patternSettings.dotSize}mm`,
  } as CSSProperties), [patternSettings]);

  const webglBackgroundClass = useMemo(() => cn(
      'absolute inset-0 w-full h-full',
      background?.backgroundSize === 'contain' ? 'object-contain' : 'object-cover'
  ), [background?.backgroundSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isPreviewMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, [isPreviewMode]);

  const handleDrop = useCallback((e: React.DragEvent) => {
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
  }, [isPreviewMode, onAddItem, activeViewId]);

  const selectedItems = useMemo(() => items.filter((item) => selectedItemIds.includes(item.id)), [items, selectedItemIds]);
  const deletableSelectedItems = useMemo(() => selectedItems.filter((item) => item.isDeletable !== false), [selectedItems]);

  const handleDeleteSelected = useCallback(() => {
    if (isPreviewMode || deletableSelectedItems.length === 0) return;
    deletableSelectedItems.forEach((item) => deleteItem(item.id));
    onFocusCleared();
  }, [isPreviewMode, deletableSelectedItems, deleteItem, onFocusCleared]);

  // Conditional loading check after all hooks
  if (isLoading || internalIsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <AppLogo className="h-16 w-16 text-primary" />
      </div>
    );
  }

  return (
    <div 
      className={cn('w-full h-full relative overflow-hidden flex flex-col')} 
      data-testid="main-canvas" 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Grid Mode Controls - Positioned at top */}
      {normalizedLayoutMode === 'grid' && (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <GridModeControls
            gridState={gridModeState}
            onToggleGridMode={(enabled) => setGridModeEnabled(enabled)}
            onChangeGridType={(type) => setGridModeType(type)}
            onChangeColumns={(columns) => setGridColumns(columns)}
            onPreviousPage={() => {
              if (gridModeState.currentPage > 1) {
                setGridCurrentPage(gridModeState.currentPage - 1);
              }
            }}
            onNextPage={() => {
              const isSquareMode = gridModeState.type === 'square';
              const pagination = calculateGridPagination(
                items.length,
                gridModeState.columns,
                isSquareMode,
                gridModeState.currentPage
              );
              if (gridModeState.currentPage < pagination.totalPages) {
                setGridCurrentPage(gridModeState.currentPage + 1);
              }
            }}
            totalItems={items.length}
            hasVideoItems={hasVideoItems}
            onPlayAll={handlePlayAll}
            onPauseAll={handlePauseAll}
            onMuteAll={handleMuteAll}
            onUnmuteAll={handleUnmuteAll}
            onSkipForward={handleSkipForward}
            onSkipBack={handleSkipBack}
            onChangeSpeed={handleChangeSpeed}
            onToggleMiniMap={() => setIsMiniMapVisible(!isMiniMapVisible)}
            isMiniMapVisible={isMiniMapVisible}
            onToggleDescriptions={() => setIsDescriptionsVisible(!isDescriptionsVisible)}
            isDescriptionsVisible={isDescriptionsVisible}
            onToggleComments={() => setIsCommentsVisible(!isCommentsVisible)}
            isCommentsVisible={isCommentsVisible}
            onToggleAnalytics={() => setIsAnalyticsVisible(!isAnalyticsVisible)}
            isAnalyticsVisible={isAnalyticsVisible}
          />
        </div>
      )}

      {/* Canvas Content Container */}
      <div className="flex-1 relative overflow-hidden">
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
          <div className={cn(
            "w-full h-full",
            // Sayfa modunda scroll kapalı, sonsuz modda scroll açık
            gridModeState.enabled && gridModeState.type === 'square' ? 'overflow-hidden' : 'overflow-auto overflow-x-hidden'
          )} ref={containerRef}>
            <div className={cn(canvasScale !== 1 && 'origin-top-left')} style={scaledWrapperStyle}>
              <Droppable droppableId="canvas-droppable" direction="horizontal" isDropDisabled={isPreviewMode || normalizedLayoutMode !== 'grid'} type="canvas-item">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      'transition-all duration-500 relative w-full min-h-full select-none',
                      normalizedLayoutMode === 'grid' ? 'grid' : 'block',
                      snapshot.isDraggingOver && normalizedLayoutMode !== 'canvas' && "bg-primary/5 ring-2 ring-primary/20 ring-inset rounded-lg"
                    )}
                    style={{ 
                      padding: `${padding}px`, 
                      gap: `${gap}px`, 
                      gridTemplateColumns: 
                        (normalizedLayoutMode === 'grid' && gridModeState.type === 'vertical') ? '1fr' :
                        normalizedLayoutMode === 'grid' ? `repeat(auto-fill, minmax(${responsiveGridSize}px, 1fr))` : undefined,
                      gridAutoRows: 
                        (normalizedLayoutMode === 'grid' && gridModeState.type === 'vertical') ? 'auto' :
                        normalizedLayoutMode === 'grid' ? `${responsiveGridSize}px` : undefined,
                      height: normalizedLayoutMode === 'canvas' ? '100%' : undefined
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {paginatedItems.map((item, index) => {
                        const layoutCalc = calculateLayout(
                          normalizedLayoutMode,
                          index,
                          paginatedItems.length,
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
                            isDragDisabled={isPreviewMode || item.isDeletable === false || normalizedLayoutMode === 'canvas'}
                          >
                            {(provided, snapshot) => (
                              <motion.div
                                layout={normalizedLayoutMode !== 'canvas'}
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
                                data-item-id={item.id}
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
      {/* Canvas Content Container end */}
      </div>
    {/* Main canvas wrapper end */}
    </div>
  );
});

export default Canvas;
