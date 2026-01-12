import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ContentItem, PlayerControlGroup } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { Folder, List, Pin } from 'lucide-react';
import { getIconByName } from '@/lib/icons';

export interface UnifiedGridPreviewProps {
  items: ContentItem[];
  playerControlGroups?: PlayerControlGroup[];
  layoutMode?: 'grid' | 'canvas';
  maxItems?: number;
  size?: 'small' | 'medium' | 'large' | 'xl';
  showTitle?: boolean;
  blurFallback?: boolean;
  boldTitle?: boolean;
  showLogo?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  gridCols?: number;
  gridRows?: number;
  viewportRect?: { top: number; height: number };
  slidePosition?: { x: number; y: number };
  onItemClick?: (item: ContentItem) => void;
  selectedItemIds?: string[];
  onToggleControlPin?: (groupId: string, pinned: boolean) => void;
}

const sizeConfig = {
  small: { cols: 3, rows: 3 },
  medium: { cols: 3, rows: 3 },
  large: { cols: 4, rows: 3 },
  xl: { cols: 4, rows: 4 },
};

export const UnifiedGridPreview: React.FC<UnifiedGridPreviewProps> = ({
  items = [],
  playerControlGroups = [],
  layoutMode = 'grid',
  maxItems = 9,
  size = 'medium',
  showTitle = true,
  blurFallback = false,
  boldTitle = false,
  showLogo = false,
  canvasWidth = 1920,
  canvasHeight = 1080,
  gridCols,
  gridRows,
  viewportRect,
  slidePosition = { x: 0, y: 0 },
  onItemClick,
  selectedItemIds = [],
  onToggleControlPin,
}) => {
  // For grid mode
  const { cols, rows } = sizeConfig[size] || sizeConfig.medium;
  const _gridCols = gridCols || cols;
  const _gridRows = gridRows || rows;
  const gridSlots = _gridCols * _gridRows;
  const itemsToShow = items.slice(0, Math.min(maxItems, layoutMode === 'grid' ? gridSlots : maxItems));

  // For canvas mode
  const [mapWidth, setMapWidth] = useState(240);
  const aspect = canvasWidth / canvasHeight;
  const mapHeight = mapWidth / aspect;
  const canvasScale = mapWidth / canvasWidth;

  // Infinite canvas: allow panning/zooming in future
  // For now, just static preview

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-muted group', layoutMode === 'canvas' && 'rounded-lg')}
      style={layoutMode === 'canvas' ? { width: mapWidth, height: mapHeight, aspectRatio: aspect } : {}}>
      {/* Blur fallback */}
      {blurFallback && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/30 blur-2xl opacity-70" />
      )}
      {/* Grid mode: grid preview */}
      {layoutMode === 'grid' && (
        <div
          className={cn(
            'absolute inset-0 z-10 grid w-full h-full transition-opacity duration-300',
            'opacity-100',
            {
              'grid-cols-2': _gridCols === 2,
              'grid-cols-3': _gridCols === 3,
              'grid-cols-4': _gridCols === 4,
              'grid-rows-2': _gridRows === 2,
              'grid-rows-3': _gridRows === 3,
              'grid-rows-4': _gridRows === 4,
            }
          )}
        >
          {itemsToShow.map((item, index) => {
            const ChildIcon = item.icon ? getIconByName(item.icon) : null;
            const thumb = item.thumbnail_url || (item.coverImage as string | undefined);
            return (
              <div key={item.id || index} className="relative w-full h-full overflow-hidden border border-white/10">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={item.title || 'thumbnail'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 12vw, 6vw"
                  />
                ) : ChildIcon ? (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-muted-foreground/80">
                    <ChildIcon className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/20 text-[10px] font-semibold text-muted-foreground">
                    {(item.title || '?').slice(0, 2)}
                  </div>
                )}
              </div>
            );
          })}
          {itemsToShow.length < gridSlots &&
            Array.from({ length: gridSlots - itemsToShow.length }).map((_, filler) => (
              <div key={`filler-${filler}`} className="relative w-full h-full overflow-hidden border border-white/5 bg-background/40" />
            ))}
        </div>
      )}
      {/* Canvas mode: absolute-positioned items */}
      {layoutMode === 'canvas' && (
        <div className="absolute inset-0 z-10 w-full h-full">
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
          {/* Pinned Player Control Groups */}
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
                </motion.div>
              );
            })}
        </div>
      )}
      {/* Title Overlay */}
      {showTitle && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent z-30">
          <p className={cn("text-[10px] text-white truncate", boldTitle ? "font-extrabold" : "font-semibold")}>{items[0]?.title}</p>
          {items[0]?.author_name && <p className="text-[8px] text-white/70 truncate">{items[0].author_name}</p>}
        </div>
      )}
    </div>
  );
};

export default UnifiedGridPreview;
