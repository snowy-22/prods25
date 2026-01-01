'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ContentItem } from '@/lib/initial-content';
import { Map, X } from 'lucide-react';
import { scaleValue } from '@/lib/scale';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getIconByName } from '@/lib/icons';

const baseSize = { w: 180, h: 280 }; // Taller for scrollable content

interface MiniMapOverlayProps {
  items: ContentItem[];
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  size?: 's' | 'm' | 'l' | 'xl';
  onSizeChange?: (size: 's' | 'm' | 'l' | 'xl') => void;
  maxItems?: number;
  blurFallback?: boolean;
  boldTitle?: boolean;
  onItemClick?: (item: ContentItem) => void;
  selectedItemIds?: string[];
  viewportRect?: { top: number; height: number }; // Visible viewport indicator
}

export function MiniMapOverlay({
  items,
  isOpen,
  onToggle,
  size = 'm',
  onSizeChange,
  maxItems = 20,
  blurFallback = true,
  boldTitle = false,
  onItemClick,
  selectedItemIds = [],
  viewportRect,
}: MiniMapOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scale animations
  const scale = useMotionValue(1);
  const hoverScale = isHovered ? 1.05 : 1;
  const scrollScale = 1 + (scrollProgress * 0.03); // Slightly grow on scroll
  
  useEffect(() => {
    scale.set(hoverScale * scrollScale);
  }, [hoverScale, scrollScale, scale]);

  const dim = {
    w: scaleValue(baseSize.w, size),
    h: scaleValue(baseSize.h, size),
  };

  // Grid configuration based on size
  const gridConfig = useMemo(() => {
    const configs = {
      s: { cols: 2, rows: 3, gap: 1 },
      m: { cols: 3, rows: 4, gap: 2 },
      l: { cols: 4, rows: 5, gap: 2 },
      xl: { cols: 4, rows: 6, gap: 3 },
    };
    return configs[size];
  }, [size]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const progress = target.scrollTop / (target.scrollHeight - target.clientHeight || 1);
    setScrollProgress(progress);
  }, []);

  const handleItemClick = useCallback((item: ContentItem, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onItemClick?.(item);
  }, [onItemClick]);

  if (!isOpen) return null;

  const itemsToShow = items.slice(0, maxItems);

  return (
    <motion.div
      ref={containerRef}
      className="fixed bottom-24 right-4 z-[100] touch-none select-none"
      style={{ 
        width: dim.w + 24, 
        maxWidth: 'calc(100vw - 24px)',
        scale,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative rounded-xl border bg-card/95 backdrop-blur-xl shadow-2xl ring-1 ring-border/50">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40 rounded-t-xl">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Map className="h-4 w-4" /> Mini Map
          </div>
          <div className="flex items-center gap-1">
            {(['s','m','l','xl'] as const).map((key) => (
              <Button
                key={key}
                variant={key === size ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => onSizeChange?.(key)}
              >
                {key.toUpperCase()}
              </Button>
            ))}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Grid */}
        <div 
          className="relative rounded-b-xl overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
          style={{ width: dim.w, height: dim.h }}
          onScroll={handleScroll}
        >
          <div
            className="p-2 grid"
            style={{
              gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
              gap: `${gridConfig.gap * 2}px`,
            }}
          >
            {itemsToShow.map((item, idx) => (
              <MiniMapCell
                key={item.id}
                item={item}
                isSelected={selectedItemIds.includes(item.id)}
                onClick={handleItemClick}
                size={size}
                blurFallback={blurFallback}
                boldTitle={boldTitle}
              />
            ))}
          </div>
        </div>

        {/* Viewport Indicator */}
        {viewportRect && (
          <div
            className="absolute left-0 right-0 border-2 border-primary/60 bg-primary/10 pointer-events-none rounded"
            style={{
              top: `${40 + (viewportRect.top * (dim.h - 40))}px`,
              height: `${viewportRect.height * (dim.h - 40)}px`,
              transition: 'top 0.1s, height 0.1s',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

interface MiniMapCellProps {
  item: ContentItem;
  isSelected: boolean;
  onClick: (item: ContentItem, event: React.MouseEvent | React.TouchEvent) => void;
  size: 's' | 'm' | 'l' | 'xl';
  blurFallback?: boolean;
  boldTitle?: boolean;
}

function MiniMapCell({ item, isSelected, onClick, size, blurFallback, boldTitle }: MiniMapCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon ? getIconByName(item.icon) : null;

  const cellSize = useMemo(() => {
    const sizes = { s: 40, m: 50, l: 60, xl: 70 };
    return sizes[size];
  }, [size]);

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
