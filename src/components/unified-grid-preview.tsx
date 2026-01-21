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
  minimapWidth?: number;
  minimapHeight?: number;
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
  showTitle = false,
  blurFallback = false,
  boldTitle = false,
  showLogo = false,
  canvasWidth = 320,
  canvasHeight = 240,
  gridCols = 3,
  gridRows = 3,
  viewportRect,
  slidePosition,
  onItemClick,
  selectedItemIds = [],
  onToggleControlPin,
  minimapWidth = 128,
  minimapHeight = 96,
}) => {
  // Calculate scale for minimap/canvas
  const mapWidth = minimapWidth;
  const mapHeight = minimapHeight;
  const scaleX = mapWidth / (canvasWidth || 1);
  const scaleY = mapHeight / (canvasHeight || 1);
  const canvasScale = Math.min(scaleX, scaleY);

  // Limit items to show
  const itemsToShow = items.slice(0, maxItems);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-neutral-100 border border-neutral-200 rounded-md shadow-sm",
        size === "small" && "w-32 h-32",
        size === "medium" && "w-48 h-36",
        size === "large" && "w-64 h-48",
        size === "xl" && "w-80 h-80"
      )}
      style={{ width: minimapWidth, height: minimapHeight }}
    >
      {/* Cover Image Background */}
      {items[0]?.coverImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={items[0].coverImage}
            alt={items[0].title || 'Cover'}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
      {layoutMode === 'canvas' && (
        <div className="absolute inset-0 z-10 w-full h-full">
          {itemsToShow.map((item, index) => {
            const itemX = (item.x || 0) * canvasScale;
            const itemY = (item.y || 0) * canvasScale;
            const itemW = Math.max(6, (item.width || 100) * canvasScale);
            const itemH = Math.max(6, (item.height || 100) * canvasScale);
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <motion.div
                key={item.id || `preview-canvas-item-${index}`}
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
          {/* Viewport indicator rectangle */}
          {viewportRect && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-md pointer-events-none z-50"
              style={{
                left: 0,
                width: '100%',
                top: `${(viewportRect.top || 0) * mapHeight}px`,
                height: `${(viewportRect.height || 0) * mapHeight}px`,
                boxSizing: 'border-box',
              }}
            />
          )}
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
      {/* Grid Mode - Show Mini Grid Sketch */}
      {layoutMode === 'grid' && itemsToShow.length > 0 && (
        <div className="absolute inset-0 z-10 w-full h-full grid gap-1 p-1" style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        }}>
          {itemsToShow.map((item, index) => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <div
                key={item.id || `preview-grid-item-${index}`}
                className={cn(
                  "relative rounded-sm cursor-pointer transition-all duration-200 shadow-sm overflow-hidden",
                  isSelected 
                    ? 'bg-primary/60 ring-1 ring-primary/30' 
                    : 'bg-accent/40 hover:bg-accent/60'
                )}
                style={{
                  borderColor: item.frameColor || undefined,
                  borderWidth: item.frameWidth ? `${item.frameWidth}px` : undefined,
                  borderStyle: item.frameStyle || (isSelected ? 'solid' : 'solid'),
                  boxShadow: item.frameEffect === 'neon' ? `0 0 5px ${item.frameColor || '#00ffff'}, 0 0 10px ${(item.frameColor || '#00ffff')}80` : undefined,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onItemClick?.(item);
                }}
                title={item.title}
              >
                {item.thumbnail_url ? (
                  <Image
                    src={item.thumbnail_url}
                    alt={item.title || ''}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : item.coverImage ? (
                  <Image
                    src={item.coverImage}
                    alt={item.title || ''}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
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
