'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ContentItem, PlayerControlGroup } from '@/lib/initial-content';
import { Map, X, GripVertical, Pin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

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
  // Viewport rectangle from canvas scroll container (fractions of height)
  viewportRect?: { top: number; height: number };
  onItemClick?: (item: ContentItem) => void;
  selectedItemIds?: string[];
  maxItems?: number;
  onToggleControlPin?: (groupId: string, pinned: boolean) => void;
}

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
  maxItems = 20,
  onToggleControlPin,
}: MiniMapOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { windowWidth, isXXL, isWide, isTablet, isMobile } = useResponsiveLayout();
  
  // Viewport-responsive minimap sizing
  const getMinimapBaseWidth = useCallback(() => {
    if (isXXL) return 400; // XXL: Large minimap for ultra-wide displays
    if (isWide) return 300; // Wide: Medium-large minimap
    if (isTablet) return 200; // Tablet: Smaller minimap
    if (isMobile) return 160; // Mobile: Compact minimap
    return 240; // Desktop: Default size
  }, [isXXL, isWide, isTablet, isMobile]);
  
  const [mapWidth, setMapWidth] = useState(getMinimapBaseWidth());
  
  // Update minimap width when viewport changes
  useEffect(() => {
    setMapWidth(getMinimapBaseWidth());
  }, [getMinimapBaseWidth]);
  
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

  if (!isOpen) return null;

  const itemsToShow = items.slice(0, maxItems);
  const cellWidth = mapWidth / gridCols;
  const cellHeight = (mapHeight / gridRows);

  return (
    <motion.div
      ref={containerRef}
      className="fixed bottom-24 right-4 z-[200] touch-none select-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isHovered ? 1 : 0.25, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "relative rounded-lg border transition-all duration-300 overflow-hidden",
        isHovered 
          ? "bg-card/95 backdrop-blur-md shadow-2xl ring-1 ring-primary/50" 
          : "bg-card/25 backdrop-blur-[1.5px] shadow-sm ring-1 ring-border/20"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-3 py-2 border-b transition-all duration-300",
          isHovered
            ? "bg-muted/40 rounded-t-lg"
            : "bg-transparent border-transparent"
        )}>
          <div className={cn(
            "flex items-center gap-2 text-xs font-semibold transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <Map className="h-4 w-4" /> Mini Map
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-6 w-6 transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-50 hover:opacity-100"
            )}
            onClick={() => onToggle(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas Preview */}
        <div 
          className={cn(
            "relative transition-all duration-300 cursor-pointer",
            isHovered 
              ? "bg-muted/15" 
              : "bg-muted/5"
          )}
          style={{ 
            width: mapWidth, 
            height: mapHeight,
            aspectRatio: canvasAspect
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
                strokeWidth="1"
                className="text-muted-foreground/20"
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
                strokeWidth="1"
                className="text-muted-foreground/20"
              />
            ))}
          </svg>

          {/* Viewport Position Indicator */}
          {(viewportRect || slidePosition) && (
            <motion.div
              className="absolute border-2 border-primary bg-primary/10 rounded pointer-events-none shadow-lg"
              style={{
                left: `${viewportRect ? 0 : (slidePosition.x * canvasScale)}px`,
                top: `${viewportRect ? (viewportRect.top * canvasHeight * canvasScale) : (slidePosition.y * canvasScale)}px`,
                width: `${viewportRect ? mapWidth : Math.min(mapWidth / 2, 60)}px`,
                height: `${viewportRect ? (viewportRect.height * canvasHeight * canvasScale) : Math.min(mapHeight / 2, 60)}px`,
              }}
              animate={{ 
                borderColor: ['hsl(var(--primary))', 'hsl(var(--primary) / 0.6)', 'hsl(var(--primary))'],
                boxShadow: [
                  '0 0 8px hsl(var(--primary) / 0.3)',
                  '0 0 16px hsl(var(--primary) / 0.5)',
                  '0 0 8px hsl(var(--primary) / 0.3)'
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Items as positioned dots/thumbnails */}
          {itemsToShow.map((item) => {
            const itemX = (item.x || 0) * canvasScale;
            const itemY = (item.y || 0) * canvasScale;
            const itemW = Math.max(6, (item.width || 100) * canvasScale);
            const itemH = Math.max(6, (item.height || 100) * canvasScale);
            const isSelected = selectedItemIds.includes(item.id);

            return (
              <motion.div
                key={item.id}
                className={cn(
                  "absolute rounded-sm cursor-pointer transition-all duration-200 shadow-sm",
                  isSelected 
                    ? 'bg-primary/60 border-2 border-primary ring-2 ring-primary/30 shadow-primary/50' 
                    : 'bg-accent/30 border border-accent/60 hover:bg-accent/50 hover:border-accent hover:shadow-md'
                )}
                style={{
                  left: `${itemX}px`,
                  top: `${itemY}px`,
                  width: `${itemW}px`,
                  height: `${itemH}px`,
                  minWidth: '6px',
                  minHeight: '6px',
                }}
                onClick={(e) => {
                                    e.stopPropagation();
                  e.preventDefault();
                  onItemClick?.(item);
                }}
                whileHover={{ scale: 1.15, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                title={item.title}
              />
            );
          })}

          {/* Pinned Player Control Groups as mini overlays */}
          {playerControlGroups
            .filter(g => g.isPinnedToMiniMap)
            .map((group) => {
              const controlX = ((group.position?.x || 0) * canvasScale);
              const controlY = ((group.position?.y || 0) * canvasScale);
              
              return (
                <motion.div
                  key={`control-${group.id}`}
                  className="absolute bg-emerald-500/30 border border-emerald-500/60 rounded hover:bg-emerald-500/40 transition-colors cursor-pointer group"
                  style={{
                    left: `${controlX}px`,
                    top: `${controlY}px`,
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  whileHover={{ scale: 1.15 }}
                  title={`${group.name} (Player Controls)`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleControlPin?.(group.id, false);
                  }}
                >
                  <Pin className="h-3 w-3 text-emerald-600 group-hover:opacity-100" />
                  <motion.div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-900/90 text-emerald-50 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50"
                    whileHover={{ opacity: 1 }}
                  >
                    {group.name}
                  </motion.div>
                </motion.div>
              );
            })}
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute -right-1.5 bottom-0 w-3 h-5 cursor-col-resize flex items-center justify-center hover:bg-primary/20 transition-colors rounded-r",
            "group"
          )}
          title="Drag to resize"
        >
          <GripVertical className="h-2.5 w-2.5 text-muted-foreground/50 group-hover:text-primary/50" />
        </div>
      </div>
    </motion.div>
  );
}

export default MiniMapOverlay;
