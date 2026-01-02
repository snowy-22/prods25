'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ContentItem } from '@/lib/initial-content';
import { Map, X, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { getIconByName } from '@/lib/icons';

interface MiniMapOverlayProps {
  items: ContentItem[];
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  gridCols?: number;
  gridRows?: number;
  slidePosition?: { x: number; y: number };
  onItemClick?: (item: ContentItem) => void;
  selectedItemIds?: string[];
  maxItems?: number;
  blurFallback?: boolean;
  boldTitle?: boolean;
}

export function MiniMapOverlay({
  items,
  isOpen,
  onToggle,
  canvasWidth = 1920,
  canvasHeight = 1080,
  gridCols = 3,
  gridRows = 3,
  slidePosition = { x: 0, y: 0 },
  onItemClick,
  selectedItemIds = [],
  maxItems = 20,
  blurFallback = true,
  boldTitle = false,
}: MiniMapOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mapWidth, setMapWidth] = useState(240); // Responsive mini map width
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  
  // Calculate aspect ratio from canvas
  const canvasAspect = canvasWidth / canvasHeight;
  const mapHeight = mapWidth / canvasAspect;

  // Calculate scale factor for mini map
  const canvasScale = mapWidth / canvasWidth;

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = mapWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(120, Math.min(400, startWidth + diff));
      setMapWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [mapWidth]);

  const handleItemClick = useCallback((item: ContentItem, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onItemClick?.(item);
  }, [onItemClick]);

  if (!isOpen) return null;

  const itemsToShow = items.slice(0, maxItems);
  const cellWidth = mapWidth / gridCols;
  const cellHeight = (mapHeight / gridRows);

  return (
    <motion.div
      ref={containerRef}
      className="fixed bottom-24 right-4 z-[100] touch-none select-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "relative rounded-xl border bg-card/98 backdrop-blur-xl shadow-2xl ring-1 ring-border/50 overflow-hidden",
        isHovered && "ring-primary/50"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40 rounded-t-xl">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Map className="h-4 w-4" /> Mini Map
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas Preview */}
        <div 
          className="relative bg-muted/20 border-b border-muted/40"
          style={{ 
            width: mapWidth, 
            height: mapHeight,
            aspectRatio: canvasAspect,
          }}
        >
          {/* Grid Layout Overlay */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: mapWidth, height: mapHeight }}
          >
            {/* Vertical grid lines */}
            {Array.from({ length: gridCols - 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={((i + 1) * cellWidth).toString()}
                y1="0"
                x2={((i + 1) * cellWidth).toString()}
                y2={mapHeight.toString()}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground/30"
              />
            ))}
            {/* Horizontal grid lines */}
            {Array.from({ length: gridRows - 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={((i + 1) * cellHeight).toString()}
                x2={mapWidth.toString()}
                y2={((i + 1) * cellHeight).toString()}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground/30"
              />
            ))}
          </svg>

          {/* Slide Position Indicator */}
          {slidePosition && (
            <motion.div
              className="absolute border-2 border-primary/60 bg-primary/5 rounded pointer-events-none"
              style={{
                left: `${(slidePosition.x * canvasScale)}px`,
                top: `${(slidePosition.y * canvasScale)}px`,
                width: `${Math.min(mapWidth / 2, 60)}px`,
                height: `${Math.min(mapHeight / 2, 60)}px`,
                boxShadow: '0 0 8px rgba(var(--primary), 0.3)',
              }}
              animate={{ 
                boxShadow: ['0 0 8px rgba(var(--primary), 0.3)', '0 0 12px rgba(var(--primary), 0.5)', '0 0 8px rgba(var(--primary), 0.3)'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Items as positioned dots/thumbnails */}
          {itemsToShow.map((item) => {
            const itemX = (item.x || 0) * canvasScale;
            const itemY = (item.y || 0) * canvasScale;
            const itemW = Math.max(4, (item.width || 100) * canvasScale);
            const itemH = Math.max(4, (item.height || 100) * canvasScale);

            return (
              <motion.div
                key={item.id}
                className={cn(
                  "absolute rounded border cursor-pointer transition-colors",
                  selectedItemIds.includes(item.id) ? 'bg-primary/40 border-primary' : 'bg-accent/20 border-accent/40 hover:bg-accent/30'
                )}
                style={{
                  left: `${itemX}px`,
                  top: `${itemY}px`,
                  width: `${itemW}px`,
                  height: `${itemH}px`,
                  minWidth: '4px',
                  minHeight: '4px',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  onItemClick?.(item);
                }}
                whileHover={{ scale: 1.2 }}
                title={item.title}
              />
            );
          })}
        </div>

        {/* Items List (scrollable) */}
        <div 
          className="border-t border-muted/40 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
          style={{ width: mapWidth }}
        >
          <div className="p-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(gridCols, 3)}, 1fr)` }}>
            {itemsToShow.map((item) => (
              <MiniMapCell
                key={item.id}
                item={item}
                isSelected={selectedItemIds.includes(item.id)}
                onClick={handleItemClick}
                blurFallback={blurFallback}
                boldTitle={boldTitle}
              />
            ))}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute -right-1.5 bottom-0 w-3 h-6 cursor-col-resize flex items-center justify-center hover:bg-primary/20 transition-colors rounded-r",
            "group"
          )}
          title="Drag to resize"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary/50" />
        </div>
      </div>
    </motion.div>
  );
}

interface MiniMapCellProps {
  item: ContentItem;
  isSelected: boolean;
  onClick: (item: ContentItem, event: React.MouseEvent | React.TouchEvent) => void;
  blurFallback?: boolean;
  boldTitle?: boolean;
}

function MiniMapCell({ item, isSelected, onClick, blurFallback, boldTitle }: MiniMapCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon ? getIconByName(item.icon) : null;
  const cellSize = 50; // Consistent responsive cell size

  const hasThumbnail = !!(item.thumbnail_url || item.coverImage || item.logo);

  return (
    <motion.div
      className={cn(
        'relative rounded border cursor-pointer overflow-hidden group transition-all',
        isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        isHovered && 'border-primary shadow-lg z-10'
      )}
      style={{ aspectRatio: '1 / 1', minHeight: cellSize, minWidth: cellSize }}
      onClick={(e) => onClick(item, e)}
      onTouchEnd={(e) => onClick(item, e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.08, zIndex: 20 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* Background */}
      {hasThumbnail ? (
        <Image
          src={item.thumbnail_url || item.coverImage || item.logo || ''}
          alt={item.title || ''}
          fill
          className="object-cover"
          unoptimized
        />
      ) : blurFallback ? (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/30 blur-sm opacity-70" />
      ) : (
        <div className="absolute inset-0 bg-muted/30" />
      )}

      {/* Icon overlay */}
      {Icon && !hasThumbnail && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
          <Icon className="h-5 w-5" />
        </div>
      )}

      {/* Title overlay on hover */}
      <div className={cn(
        'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1 text-[8px] text-white truncate transition-opacity',
        isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        boldTitle && 'font-bold'
      )}>
        {item.title}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full border border-white shadow-sm" />
      )}
    </motion.div>
  );
}

export default MiniMapOverlay;
