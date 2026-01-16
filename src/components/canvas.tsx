"use client";

import React, { CSSProperties, memo, useRef, useState, useEffect, useCallback, useMemo, Suspense, DragEvent } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import type { ContentItem, PatternSettings, Alignment, GridSizingMode, ItemType, ItemLayout } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { AppLogo } from './icons/app-logo';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Skeleton } from './ui/skeleton';
import { canvasLogger } from '@/lib/logger';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from './ui/context-menu';
import { Plus, Clipboard, Settings, Folder, Trash2 } from 'lucide-react';

import { calculateLayout, LayoutMode, calculateGridPagination, getPaginatedGridItems, snapToGrid } from '@/lib/layout-engine';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppStore } from '@/lib/store';

const PlayerFrame = dynamic(() => import('./player-frame'), {
  loading: () => <Skeleton className="w-full h-full" />
});

const EcommerceCanvas = dynamic(() => import('./ecommerce-canvas').then(mod => ({ default: mod.EcommerceCanvas })), {
  loading: () => <Skeleton className="w-full h-full" />
});

const EcommerceLandingTemplate = dynamic(() => import('./templates/ecommerce-landing-template').then(mod => ({ default: mod.EcommerceLandingTemplate })), {
  loading: () => <Skeleton className="w-full h-full" />
});

import { WidgetRenderer } from './widget-renderer';

const noop = () => {};

const WebGLBackground = dynamic(() => import('./webgl-background'), { ssr: false });
const MiniMapOverlay = dynamic(() => import('./mini-map-overlay'), { ssr: false });

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
  
  // Drag & drop visual state
  const [dragFeedback, setDragFeedback] = useState<{
    isDragging: boolean;
    draggedItemId: string | null;
    dropTarget: string | null;
    dropPosition: 'before' | 'after' | 'inside' | null;
  }>({
    isDragging: false,
    draggedItemId: null,
    dropTarget: null,
    dropPosition: null,
  });
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

  // DEBUG - Monitor items prop changes
  useEffect(() => {
    canvasLogger.debug('Items prop changed', {
      itemsCount: items.length,
      activeViewId,
      activeViewTitle: activeView?.title,
      items: items.map(i => ({ id: i.id, title: i.title, type: i.type }))
    });
  }, [items, activeViewId, activeView]);

  useEffect(() => {
    if (items.length === 0 && activeViewId === 'root') {
      canvasLogger.warn('Root view has NO items', {
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
  // Mini-map viewport rectangle (fractional top/height)
  const [viewportRect, setViewportRect] = useState<{ top: number; height: number } | undefined>(undefined);
    // Handle scroll to update mini-map viewportRect
    const handleScroll = useCallback(() => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const scrollTop = el.scrollTop;
      const visibleHeight = el.clientHeight;
      const totalHeight = el.scrollHeight;
      if (totalHeight <= visibleHeight) {
        setViewportRect(undefined);
        return;
      }
      const top = scrollTop / totalHeight;
      const height = visibleHeight / totalHeight;
      setViewportRect({ top, height });
    }, []);

    // Attach scroll handler
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      el.addEventListener('scroll', handleScroll);
      // Initial update
      handleScroll();
      return () => {
        el.removeEventListener('scroll', handleScroll);
      };
    }, [handleScroll]);
  const responsive = useResponsiveLayout();

  // Calculate responsive grid size based on breakpoint
  const getResponsiveGridSize = () => {
    if (responsive.isMobile) {
      return Math.max(gridSize * 0.75, 80); // 75% on mobile, min 80px
    } else if (responsive.isTablet) {
      return Math.max(gridSize * 0.9, 120); // 90% on tablet, min 120px
    } else if (containerSize.width >= 2560) {
      return Math.max(gridSize * 1.7, 480); // XXL: 170%, min 480px for ultra-wide displays
    } else if (containerSize.width >= 1920) {
      return Math.max(gridSize * 1.3, 360); // XL: 130%, min 360px for large displays
    }
    return gridSize; // Full size on desktop
  };

  const responsiveGridSize = useMemo(() => getResponsiveGridSize(), [gridSize, responsive.isMobile, responsive.isTablet]);
  const normalizedLayoutMode: LayoutMode = layoutMode === 'canvas' ? 'canvas' : 'grid';

  // Grid Mode Pagination Logic - Performance Optimized
  const paginatedItems = useMemo(() => {
    // Canvas modda veya grid mode kapalıysa tüm öğeleri göster
    if (!gridModeState.enabled || normalizedLayoutMode === 'canvas') {
      return items;
    }
    
    // Sonsuz modda (vertical) data/güç tasarrufu için sadece 4x sütun sayısı kadar öğe göster
    // Bu sayede gereksiz player'lar render edilmez, scroll ile daha fazlası lazy load edilir
    if (gridModeState.type === 'vertical') {
      const maxVisibleItems = gridModeState.columns * 4; // 4 satır eşdeğeri
      return items.slice(0, maxVisibleItems);
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
              {item.type === 'ecommerce-landing' && (
                <EcommerceLandingTemplate />
              )}
              {(item.type === 'product-grid' || item.type === 'product-list') && (
                <EcommerceCanvas 
                  item={item}
                  contentType="products"
                  viewMode={item.type === 'product-grid' ? 'grid' : 'list'}
                />
              )}
              {item.type === 'shopping-cart' && (
                <EcommerceCanvas 
                  item={item}
                  contentType="cart"
                />
              )}
              {item.type === 'marketplace-grid' && (
                <EcommerceCanvas 
                  item={item}
                  contentType="marketplace"
                  viewMode="grid"
                />
              )}
              {item.type === 'order-history' && (
                <EcommerceCanvas 
                  item={item}
                  contentType="orders"
                />
              )}
              {item.type !== 'ecommerce-landing' &&
               item.type !== 'product-grid' && 
               item.type !== 'product-list' && 
               item.type !== 'shopping-cart' && 
               item.type !== 'marketplace-grid' && 
               item.type !== 'order-history' && (
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
              )}
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
        setDragFeedback({
          isDragging: false,
          draggedItemId: null,
          dropTarget: null,
          dropPosition: null,
        });
      }
    } catch (err) {
      canvasLogger.error('Drop error', err);
    }
  }, [isPreviewMode, onAddItem, activeViewId]);

  // Track drag events from hello-pangea/dnd for visual feedback
  const handleDragStart = useCallback((dragUpdate: any) => {
    const draggedId = dragUpdate.draggableId;
    setDragFeedback(prev => ({
      ...prev,
      isDragging: true,
      draggedItemId: draggedId,
    }));
    canvasLogger.debug('Drag start', { draggedId });
  }, []);

  const handleDragOverUpdate = useCallback((dragUpdate: any) => {
    setDragFeedback(prev => ({
      ...prev,
      dropTarget: dragUpdate.destination?.droppableId || null,
      dropPosition: dragUpdate.destination ? 'inside' : null,
    }));
  }, []);

  const handleDragEnd = useCallback((dragUpdate: any) => {
    setDragFeedback({
      isDragging: false,
      draggedItemId: null,
      dropTarget: null,
      dropPosition: null,
    });
    canvasLogger.debug('Drag end', { destination: dragUpdate.destination });
  }, []);

  // Canvas mode drag end handler: converts viewport drag end to canvas coordinates and persists
  const handleCanvasDragEnd = useCallback((item: ContentItem, info: PanInfo) => {
    if (isPreviewMode || normalizedLayoutMode !== 'canvas') return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    const nextX = (info.point.x - rect.left + scrollLeft - padding) / canvasScale;
    const nextY = (info.point.y - rect.top + scrollTop - padding) / canvasScale;
    const snapped = snapToGrid({ x: nextX, y: nextY }, gridSize);

    onUpdateItem(item.id, { x: snapped.x, y: snapped.y });
  }, [canvasScale, gridSize, isPreviewMode, normalizedLayoutMode, onUpdateItem, padding]);

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
      className={cn('w-full h-full relative flex flex-col')} 
      data-testid="main-canvas" 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Grid Mode Controls - Moved to settings dropdown in primary-sidebar */}

      {/* Canvas Content Container */}
      <div className="flex-1 relative">
              {/* MiniMapOverlay (floating, only if enabled) */}
              {isMiniMapVisible && (
                <MiniMapOverlay
                  items={items}
                  isOpen={isMiniMapVisible}
                  onToggle={setIsMiniMapVisible}
                  canvasWidth={containerSize.width || 1920}
                  canvasHeight={containerSize.height || 1080}
                  viewportRect={viewportRect}
                  selectedItemIds={selectedItemIds}
                />
              )}
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
          <div
            className={cn(
              "w-full h-full overflow-auto overflow-x-hidden"
            )}
            ref={containerRef}
            onScroll={handleScroll}
            style={{ maxHeight: '100%', height: '100%' }}
          >
            <div className={cn(canvasScale !== 1 && 'origin-top-left')} style={{...scaledWrapperStyle, minHeight: 0}}>
              <Droppable droppableId="canvas-droppable" direction="horizontal" isDropDisabled={isPreviewMode || normalizedLayoutMode !== 'grid'} type="canvas-item">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      'transition-all duration-500 relative w-full select-none',
                      normalizedLayoutMode === 'grid' ? 'grid' : 'block',
                      snapshot.isDraggingOver && normalizedLayoutMode !== 'canvas' && "bg-primary/5 ring-2 ring-primary/20 ring-inset rounded-lg"
                    )}
                    style={{ 
                      padding: `${padding}px`, 
                      gap: `${gap}px`, 
                      gridTemplateColumns: 
                        // Vertical mode: single column
                        (normalizedLayoutMode === 'grid' && gridModeState.enabled && gridModeState.type === 'vertical') 
                          ? '1fr' 
                        // Square mode with enabled grid: use exact column count from gridModeState
                          : (normalizedLayoutMode === 'grid' && gridModeState.enabled)
                            ? `repeat(${gridModeState.columns}, 1fr)`
                        // Fallback: auto-fit responsive grid
                            : normalizedLayoutMode === 'grid' 
                              ? `repeat(auto-fit, minmax(${responsiveGridSize}px, 1fr))` 
                              : undefined,
                      gridAutoRows: 
                        (normalizedLayoutMode === 'grid' && gridModeState.type === 'vertical') ? 'auto' :
                        normalizedLayoutMode === 'grid' ? 'auto' : undefined,
                      minHeight: 0,
                      height: normalizedLayoutMode === 'canvas' ? '100%' : 'auto',
                      maxHeight: '100%'
                    }}
                  >
                    {paginatedItems.length === 0 && (
                      <div className="col-span-full flex items-center justify-center py-16 text-muted-foreground">
                        <div className="text-center space-y-2">
                          <AppLogo className="w-16 h-16 mx-auto opacity-30" />
                          <p className="text-sm">Bu görünümde henüz içerik yok</p>
                          {!isPreviewMode && (
                            <p className="text-xs text-muted-foreground/60">
                              Sağ tıklayarak veya sürükle-bırak ile içerik ekleyebilirsiniz
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <AnimatePresence mode="popLayout">
                      {paginatedItems.map((item, index) => {
                        // Determine effective layout mode for calculateLayout
                        // When grid mode is enabled, use specific grid type (vertical/square)
                        const effectiveLayoutMode: LayoutMode = 
                          gridModeState.enabled && normalizedLayoutMode === 'grid'
                            ? gridModeState.type === 'vertical' ? 'grid-vertical' : 'grid-square'
                            : normalizedLayoutMode;
                        
                        const layoutCalc = calculateLayout(
                          effectiveLayoutMode,
                          index,
                          paginatedItems.length,
                          containerSize.width,
                          containerSize.height,
                          item,
                          { carouselCenterIndex }
                        );

                        const isDraggedItem = dragFeedback.draggedItemId === item.id;
                        const isDropTarget = dragFeedback.dropTarget === 'canvas-droppable' && isDraggedItem === false;
                        
                        return (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                            isDragDisabled={isPreviewMode || item.isDeletable === false || normalizedLayoutMode === 'canvas'}
                          >
                            {(provided, snapshot) => {
                              // Update feedback on drag state change
                              if (snapshot.isDragging && !dragFeedback.isDragging) {
                                handleDragStart({ draggableId: item.id });
                              }
                              
                              return (
                                <motion.div
                                  layout={normalizedLayoutMode !== 'canvas'}
                                  initial={false}
                                  animate={{ 
                                    opacity: snapshot.isDragging ? 0.7 : 1, 
                                    scale: snapshot.isDragging ? 1.08 : (isDropTarget ? 1.02 : 1),
                                    zIndex: snapshot.isDragging ? 100 : (layoutCalc.styles.zIndex as number || 1),
                                    ...(snapshot.isDragging ? {} : layoutCalc.styles as any)
                                  }}
                                  transition={{ 
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                    duration: normalizedLayoutMode === 'grid' ? 0.2 : 0,
                                  }}
                                  ref={provided.innerRef}
                                  {...(normalizedLayoutMode === 'grid' ? provided.draggableProps as any : {})}
                                  {...(isPreviewMode || normalizedLayoutMode === 'canvas' ? {} : (provided.dragHandleProps as any))}
                                  className={cn(
                                    "relative group transition-all",
                                    snapshot.isDragging && "z-50",
                                    snapshot.isDragging && !snapshot.draggingOver && "ring-2 ring-orange-500 shadow-lg shadow-orange-500/50",
                                    snapshot.isDragging && snapshot.draggingOver && "ring-2 ring-green-500 shadow-lg shadow-green-500/50",
                                    isDraggedItem && "opacity-80",
                                    isDropTarget && "ring-2 ring-primary/40 bg-primary/5 rounded-lg",
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
                                  title={isDraggedItem ? 'Sürükleniyör...' : isDropTarget ? 'Bırakmak için tıkla' : ''}
                                  drag={normalizedLayoutMode === 'canvas' && !isPreviewMode}
                                  dragMomentum={false}
                                  dragElastic={0}
                                  onDragEnd={(event, info) => handleCanvasDragEnd(item, info)}
                                >
                                  {renderItem(item)}
                                  {snapshot.isDragging && (
                                    <div className="absolute inset-0 bg-black/10 rounded-lg pointer-events-none" />
                                  )}
                                </motion.div>
                              );
                            }}
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
            <ContextMenuItem onClick={() => onAddItem({ type: 'player', title: 'URL Ekle', content: '', url: 'ADD_SOURCE_PLACEHOLDER' }, activeViewId)}>
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
