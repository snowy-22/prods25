'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ContentItem, PlayerControlGroup } from '@/lib/initial-content';
import { 
  Map, X, Maximize2, Minimize2, 
  Grid3X3, Layers, ZoomIn, ZoomOut, RotateCcw,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Target, Move, FolderOpen, Video, Image as ImageIcon, Globe, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { CrossDragManager, DragContext, DropToken } from '@/lib/cross-drag-system';
import { getIconByName } from '@/lib/icons';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MiniMapOverlayProps {
  items: ContentItem[];
  playerControlGroups?: PlayerControlGroup[];
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  gridCols?: number;
  gridRows?: number;
  slidePosition?: { x: number; y: number };
  viewportRect?: { top: number; height: number };
  onItemClick?: (item: ContentItem) => void;
  selectedItemIds?: string[];
  maxItems?: number;
  onToggleControlPin?: (groupId: string, pinned: boolean) => void;
  onItemDrop?: (item: ContentItem, targetType: string, targetData?: any) => void;
  onNavigateToPosition?: (x: number, y: number) => void;
  onMoveItem?: (itemId: string, x: number, y: number) => void;
}

// Get item type icon
const getItemTypeIcon = (item: ContentItem): React.ReactNode => {
  const iconSize = "w-full h-full";
  switch (item.type) {
    case 'folder': return <FolderOpen className={cn(iconSize, "text-amber-400")} />;
    case 'video': case 'player': return <Video className={cn(iconSize, "text-red-400")} />;
    case 'image': return <ImageIcon className={cn(iconSize, "text-blue-400")} />;
    case 'website': return <Globe className={cn(iconSize, "text-green-400")} />;
    default:
      if (item.icon) {
        const IconComponent = getIconByName(item.icon);
        if (IconComponent) return <IconComponent className={iconSize} />;
      }
      return <FileText className={cn(iconSize, "text-muted-foreground")} />;
  }
};

// Mini thumbnail component
const MiniThumbnail = ({ item, size = 'sm' }: { item: ContentItem; size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClasses = { xs: 'w-2.5 h-2.5', sm: 'w-3.5 h-3.5', md: 'w-5 h-5' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemData = item as Record<string, any>;
  const thumbnailUrl = itemData.thumbnail || itemData.imageUrl || itemData.coverUrl || itemData.image;

  if (thumbnailUrl) {
    return (
      <div className={cn("rounded-sm overflow-hidden flex-shrink-0", sizeClasses[size])}>
        <Image 
          src={thumbnailUrl} 
          alt={item.title || ''} 
          width={20} 
          height={20}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center flex-shrink-0", sizeClasses[size])}>
      {getItemTypeIcon(item)}
    </div>
  );
};

export function MiniMapOverlay({
  items,
  playerControlGroups = [],
  isOpen,
  onToggle,
  canvasWidth = 1920,
  canvasHeight = 1080,
  gridCols = 3,
  gridRows = 3,
  slidePosition = { x: 0, y: 0 },
  viewportRect,
  onItemClick,
  selectedItemIds = [],
  maxItems = 50,
  onToggleControlPin,
  onItemDrop,
  onNavigateToPosition,
  onMoveItem,
}: MiniMapOverlayProps) {
  // Don't render when closed - clean exit
  if (!isOpen) return null;

  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'grid'>('preview');
  const [zoom, setZoom] = useState(100);
  const [dropToken, setDropToken] = useState<DropToken | null>(null);
  
  const { isMobile, isTablet } = useResponsiveLayout();
  // Note: Removed refs from motion.div to prevent Framer Motion/Radix UI compatibility issues
  // that cause "Expected static flag was missing" and "Maximum update depth exceeded" errors
  const dragManager = CrossDragManager.getInstance();

  // Responsive dimensions
  const baseWidth = isExpanded 
    ? (isMobile ? 260 : isTablet ? 300 : 340) 
    : (isMobile ? 140 : isTablet ? 170 : 200);
  const baseHeight = isExpanded 
    ? (isMobile ? 180 : isTablet ? 210 : 240) 
    : (isMobile ? 90 : isTablet ? 110 : 130);
  
  // Calculate scale
  const mapWidth = baseWidth * (zoom / 100);
  const mapHeight = baseHeight * (zoom / 100);
  const scaleX = mapWidth / canvasWidth;
  const scaleY = mapHeight / canvasHeight;
  const scale = Math.min(scaleX, scaleY);

  // Limit visible items
  const visibleItems = useMemo(() => items.slice(0, maxItems), [items, maxItems]);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const activeDrag = dragManager.getActiveDrag();
    if (activeDrag) {
      setDropToken(dragManager.getDropToken({ ...activeDrag, targetType: 'minimap' }));
    }
  }, [dragManager]);

  const handleDragLeave = useCallback(() => setDropToken(null), []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDropToken(null);

    const activeDrag = dragManager.getActiveDrag();
    if (!activeDrag || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const relX = Math.max(0, (e.clientX - rect.left) / scale);
    const relY = Math.max(0, (e.clientY - rect.top) / scale);
    
    const context: DragContext = {
      ...activeDrag,
      targetType: 'minimap',
      targetData: { canvasWidth, canvasHeight, dropPosition: { x: relX, y: relY }, viewportRect }
    };

    if (dragManager.canDrop(context)) {
      await dragManager.executeDrop(context);
      onItemDrop?.(activeDrag.item, 'minimap', context.targetData);
    }
  }, [dragManager, canvasWidth, canvasHeight, viewportRect, onItemDrop, scale]);

  // Click to navigate
  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (!mapRef.current || !onNavigateToPosition) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / scale;
    const relY = (e.clientY - rect.top) / scale;
    onNavigateToPosition(Math.max(0, relX), Math.max(0, relY));
  }, [scale, onNavigateToPosition]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);

  // Navigation
  const handleNavigate = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!onNavigateToPosition || !viewportRect) return;
    const step = 150;
    const centerX = canvasWidth / 2;
    const centerY = (viewportRect.top + viewportRect.height / 2) * canvasHeight;
    
    const moves = {
      up: [centerX, Math.max(0, centerY - step)],
      down: [centerX, Math.min(canvasHeight, centerY + step)],
      left: [Math.max(0, centerX - step), centerY],
      right: [Math.min(canvasWidth, centerX + step), centerY]
    };
    onNavigateToPosition(moves[direction][0], moves[direction][1]);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        className="fixed bottom-20 right-3 z-[1100] select-none"
        style={{ pointerEvents: 'auto' }}
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={cn(
          "rounded-xl border overflow-hidden transition-all duration-300",
          isHovered 
            ? "bg-card/95 backdrop-blur-xl shadow-2xl ring-2 ring-primary/20 border-primary/30" 
            : "bg-card/85 backdrop-blur-lg shadow-lg ring-1 ring-border/40 border-border/50",
          dropToken?.state === 'accept' && "ring-2 ring-emerald-500/40 border-emerald-500/30"
        )}>
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between px-2 py-1 border-b transition-all",
            isHovered ? "bg-muted/40 border-border/50" : "bg-transparent border-transparent"
          )}>
            <div className="flex items-center gap-1.5">
              <Map className="h-3 w-3 text-primary" />
              <span className={cn(
                "text-[10px] font-semibold tracking-tight transition-opacity",
                isHovered ? "opacity-100" : "opacity-70"
              )}>
                Mini Harita
              </span>
              <span className="text-[9px] text-muted-foreground font-medium">
                {visibleItems.length}
              </span>
            </div>
            
            <div className="flex items-center gap-0.5">
              {/* View Mode */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    className="flex items-center gap-0.5 bg-muted/60 rounded-md p-0.5 mr-1"
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-4.5 w-4.5"
                          onClick={() => setViewMode('preview')}
                        >
                          <Layers className="h-2.5 w-2.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Önizleme</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-4.5 w-4.5"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid3X3 className="h-2.5 w-2.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Izgara</TooltipContent>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Expand */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-5 w-5 transition-opacity", isHovered ? "opacity-100" : "opacity-60")}
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? <Minimize2 className="h-2.5 w-2.5" /> : <Maximize2 className="h-2.5 w-2.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">
                  {isExpanded ? 'Küçült' : 'Genişlet'}
                </TooltipContent>
              </Tooltip>
              
              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-5 w-5 transition-opacity hover:bg-destructive/10 hover:text-destructive", isHovered ? "opacity-100" : "opacity-60")}
                onClick={() => onToggle(false)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>

          {/* Map Area */}
          <motion.div 
            className="relative overflow-hidden cursor-crosshair"
            style={{ 
              width: baseWidth, 
              height: baseHeight,
              background: 'linear-gradient(145deg, hsl(var(--muted)/0.4) 0%, hsl(var(--muted)/0.15) 100%)'
            }}
            animate={{ width: baseWidth, height: baseHeight }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={handleMapClick}
          >
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: `${baseWidth / gridCols}px ${baseHeight / gridRows}px`
              }}
            />

            {/* Preview Mode */}
            {viewMode === 'preview' && (
              <div className="absolute inset-0" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
                {visibleItems.map((item) => {
                  const itemX = (item.x || 0) * scale;
                  const itemY = (item.y || 0) * scale;
                  const itemW = Math.max(6, (item.width || 100) * scale);
                  const itemH = Math.max(6, (item.height || 80) * scale);
                  const isSelected = selectedItemIds.includes(item.id);

                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <motion.div
                          className={cn(
                            "absolute rounded-sm cursor-pointer flex items-center justify-center overflow-hidden transition-colors",
                            isSelected 
                              ? "bg-primary/60 border border-primary shadow-md shadow-primary/20 z-20" 
                              : "bg-accent/40 border border-accent/50 hover:bg-accent/60 hover:border-primary/40 z-10"
                          )}
                          style={{ left: itemX, top: itemY, width: itemW, height: itemH }}
                          onClick={(e) => { e.stopPropagation(); onItemClick?.(item); }}
                          whileHover={{ scale: 1.15, zIndex: 30 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {itemW > 10 && itemH > 10 && <MiniThumbnail item={item} size={itemW > 18 ? 'sm' : 'xs'} />}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5 max-w-[120px]">
                        <p className="font-medium truncate">{item.title || 'İsimsiz'}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Viewport Rectangle */}
                {viewportRect && (
                  <motion.div
                    className="absolute border-2 border-blue-500/80 bg-blue-500/15 rounded-sm pointer-events-none z-40"
                    style={{
                      left: 0,
                      width: '100%',
                      top: (viewportRect.top || 0) * baseHeight,
                      height: Math.max(8, (viewportRect.height || 0.15) * baseHeight),
                    }}
                    animate={{ 
                      boxShadow: ['0 0 0 0 rgba(59,130,246,0.3)', '0 0 0 3px rgba(59,130,246,0)', '0 0 0 0 rgba(59,130,246,0.3)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
            )}

            {/* Grid Mode */}
            {viewMode === 'grid' && (
              <div className="absolute inset-0 p-1.5 overflow-y-auto scrollbar-thin">
                <div className={cn(
                  "grid gap-1",
                  isExpanded ? "grid-cols-5" : "grid-cols-4"
                )}>
                  {visibleItems.slice(0, isExpanded ? 25 : 16).map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <motion.div
                            className={cn(
                              "aspect-square rounded-sm flex items-center justify-center cursor-pointer transition-colors",
                              isSelected 
                                ? "bg-primary/50 border border-primary" 
                                : "bg-muted/40 border border-border/40 hover:bg-muted/70 hover:border-primary/30"
                            )}
                            onClick={() => onItemClick?.(item)}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                          >
                            <MiniThumbnail item={item} size="md" />
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">
                          {item.title || 'İsimsiz'}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Drop Overlay */}
            <AnimatePresence>
              {dropToken && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-sm z-50 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-card/95 rounded-lg shadow-lg border text-xs font-medium"
                    style={{ color: dropToken.color }}
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.85 }}
                  >
                    <span>{dropToken.icon}</span>
                    <span>{dropToken.message}</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Bottom Controls */}
          <AnimatePresence>
            {(isHovered || isExpanded) && (
              <motion.div
                className="flex items-center justify-between px-1.5 py-1 border-t bg-muted/25 gap-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {/* Zoom */}
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleZoomOut} disabled={zoom <= 50}>
                        <ZoomOut className="h-2.5 w-2.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Uzaklaş</TooltipContent>
                  </Tooltip>
                  <span className="text-[9px] text-muted-foreground w-7 text-center font-medium">{zoom}%</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleZoomIn} disabled={zoom >= 200}>
                        <ZoomIn className="h-2.5 w-2.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Yakınlaş</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleZoomReset}>
                        <RotateCcw className="h-2.5 w-2.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Sıfırla</TooltipContent>
                  </Tooltip>
                </div>

                {/* Navigation D-Pad */}
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleNavigate('left')}>
                    <ChevronLeft className="h-2.5 w-2.5" />
                  </Button>
                  <div className="flex flex-col -mx-0.5">
                    <Button variant="ghost" size="icon" className="h-3.5 w-4" onClick={() => handleNavigate('up')}>
                      <ChevronUp className="h-2 w-2" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-3.5 w-4" onClick={() => handleNavigate('down')}>
                      <ChevronDown className="h-2 w-2" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleNavigate('right')}>
                    <ChevronRight className="h-2.5 w-2.5" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5"
                        onClick={() => onNavigateToPosition?.(canvasWidth / 2, canvasHeight / 2)}
                      >
                        <Target className="h-2.5 w-2.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Merkeze Git</TooltipContent>
                  </Tooltip>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}

export default MiniMapOverlay;
