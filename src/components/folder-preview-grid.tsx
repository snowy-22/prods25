"use client";

import * as React from "react";
import { ContentItem } from "@/lib/initial-content";
import { cn } from "@/lib/utils";
import { Folder, Play, Image as ImageIcon, FileVideo, Music, Globe, File, MoreHorizontal } from "lucide-react";

export type PreviewGridSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
export type PreviewGridLayout = 
  | '1x1' | '2x1' | '1x2' | '2x2' 
  | '3x1' | '1x3' | '3x2' | '2x3' | '3x3'
  | '4x1' | '1x4' | '4x2' | '2x4' | '4x3' | '3x4' | '4x4';

export interface FolderPreviewProps {
  folder: ContentItem;
  items: ContentItem[];
  gridSize?: PreviewGridSize;
  layout?: PreviewGridLayout;
  showLivePreview?: boolean;
  autoPlayMuted?: boolean;
  isClickable?: boolean;
  onDoubleClick?: () => void;
  onItemClick?: (item: ContentItem) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

// Get optimal grid dimensions based on item count
function getOptimalGridLayout(itemCount: number, preferredMax: number = 9): { cols: number; rows: number } {
  const effectiveCount = Math.min(itemCount, preferredMax);
  
  if (effectiveCount <= 1) return { cols: 1, rows: 1 };
  if (effectiveCount <= 2) return { cols: 2, rows: 1 };
  if (effectiveCount <= 4) return { cols: 2, rows: 2 };
  if (effectiveCount <= 6) return { cols: 3, rows: 2 };
  if (effectiveCount <= 9) return { cols: 3, rows: 3 };
  if (effectiveCount <= 12) return { cols: 4, rows: 3 };
  return { cols: 4, rows: 4 };
}

// Parse layout string to cols/rows
function parseLayout(layout: PreviewGridLayout): { cols: number; rows: number } {
  const [cols, rows] = layout.split('x').map(Number);
  return { cols, rows };
}

// Get item preview content
function getItemPreview(item: ContentItem, autoPlayMuted: boolean = true): React.ReactNode {
  const type = item.type;
  
  // Video/YouTube/Vimeo etc.
  if (type === 'player' || type === 'video') {
    const url = item.url || (item.content as string);
    
    // YouTube embed
    if (url?.includes('youtube.com') || url?.includes('youtu.be')) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`}
            className="w-full h-full object-cover pointer-events-none"
            allow="autoplay"
            loading="lazy"
          />
        );
      }
    }
    
    // Vimeo embed
    if (url?.includes('vimeo.com')) {
      const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (vimeoId) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&background=1`}
            className="w-full h-full object-cover pointer-events-none"
            allow="autoplay"
            loading="lazy"
          />
        );
      }
    }
    
    // Direct video file
    if (url?.match(/\.(mp4|webm|mov)(\?|$)/i)) {
      return (
        <video
          src={url}
          className="w-full h-full object-cover"
          autoPlay={autoPlayMuted}
          muted
          loop
          playsInline
        />
      );
    }
    
    // Fallback icon
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
        <FileVideo className="h-8 w-8 text-primary/60" />
      </div>
    );
  }
  
  // Image
  if (type === 'image' || item.coverImage || item.itemImageUrl) {
    const src = item.coverImage || item.itemImageUrl || item.url || (item.content as string);
    return (
      <img
        src={src}
        alt={item.title || ''}
        className="w-full h-full object-cover"
        loading="lazy"
      />);
  }
  
  // Audio
  if (type === 'audio') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-purple-500/5">
        <Music className="h-8 w-8 text-purple-500/60" />
      </div>
    );
  }
  
  // Website
  if (type === 'website') {
    const url = item.url || (item.content as string);
    if (url) {
      return (
        <iframe
          src={url}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-blue-500/5">
        <Globe className="h-8 w-8 text-blue-500/60" />
      </div>
    );
  }
  
  // Folder
  if (type === 'folder') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-500/5">
        <Folder className="h-8 w-8 text-amber-500/60" />
      </div>
    );
  }
  
  // Default file icon
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-500/20 to-gray-500/5">
      <File className="h-8 w-8 text-gray-500/60" />
    </div>
  );
}

// Extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/v\/([^?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

export function FolderPreviewGrid({
  folder,
  items,
  gridSize = 4,
  layout,
  showLivePreview = true,
  autoPlayMuted = true,
  isClickable = false,
  onDoubleClick,
  onItemClick,
  className,
  size = 'medium'
}: FolderPreviewProps) {
  const { cols, rows } = layout 
    ? parseLayout(layout) 
    : getOptimalGridLayout(items.length, gridSize);
  
  const maxItems = cols * rows;
  const displayItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;
  
  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border/50 bg-background/50",
        sizeClasses[size],
        isClickable && "cursor-pointer hover:border-primary/50 transition-colors",
        className
      )}
      onDoubleClick={onDoubleClick}
    >
      {displayItems.length === 0 ? (
        // Empty folder
        <div className="w-full h-full flex items-center justify-center">
          <Folder className="h-10 w-10 text-muted-foreground/40" />
        </div>
      ) : (
        // Grid layout
        <div
          className="w-full h-full grid gap-px bg-border/30"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`
          }}
        >
          {displayItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "relative overflow-hidden bg-background",
                isClickable && "hover:opacity-80 transition-opacity"
              )}
              onClick={() => isClickable && onItemClick?.(item)}
            >
              {showLivePreview ? (
                getItemPreview(item, autoPlayMuted)
              ) : (
                // Static thumbnail
                <div className="w-full h-full flex items-center justify-center bg-muted/50">
                  {item.coverImage ? (
                    <img src={item.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <File className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Show remaining count indicator */}
          {remainingCount > 0 && displayItems.length >= maxItems && (
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <MoreHorizontal className="h-3 w-3" />
              +{remainingCount}
            </div>
          )}
        </div>
      )}
      
      {/* Folder title overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
        <span className="text-[10px] text-white font-medium truncate block">
          {folder.title || 'Klasör'}
        </span>
      </div>
    </div>
  );
}

// Preview Grid Size Selector Component
export function PreviewGridSizeSelector({
  value,
  onChange,
  maxSize = 16,
  className
}: {
  value: PreviewGridSize;
  onChange: (size: PreviewGridSize) => void;
  maxSize?: PreviewGridSize;
  className?: string;
}) {
  const sizes: PreviewGridSize[] = [1, 2, 4, 6, 9, 12, 16].filter(s => s <= maxSize) as PreviewGridSize[];
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {sizes.map(size => (
        <button
          key={size}
          onClick={() => onChange(size)}
          className={cn(
            "w-6 h-6 rounded text-[10px] font-medium transition-colors",
            value === size 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          {size}
        </button>
      ))}
    </div>
  );
}

// Preview Layout Selector Component
export function PreviewLayoutSelector({
  value,
  onChange,
  className
}: {
  value: PreviewGridLayout;
  onChange: (layout: PreviewGridLayout) => void;
  className?: string;
}) {
  const layouts: PreviewGridLayout[] = ['1x1', '2x1', '1x2', '2x2', '3x2', '2x3', '3x3', '4x3', '3x4', '4x4'];
  
  return (
    <div className={cn("grid grid-cols-5 gap-1", className)}>
      {layouts.map(layout => {
        const { cols, rows } = parseLayout(layout);
        return (
          <button
            key={layout}
            onClick={() => onChange(layout)}
            className={cn(
              "w-8 h-8 rounded border transition-colors flex items-center justify-center",
              value === layout 
                ? "border-primary bg-primary/10" 
                : "border-border hover:border-muted-foreground"
            )}
            title={layout}
          >
            <div
              className="grid gap-0.5"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                width: `${cols * 4}px`,
                height: `${rows * 4}px`
              }}
            >
              {Array.from({ length: cols * rows }).map((_, i) => (
                <div key={i} className="bg-muted-foreground/40 rounded-[1px]" />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default FolderPreviewGrid;
