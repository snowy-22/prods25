
import React, { useEffect } from 'react';
import Image from 'next/image';
import { ContentItem } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { Folder, List } from 'lucide-react';
import { getIconByName } from '@/lib/icons';

type SizePreset = 'small' | 'medium' | 'large' | 's' | 'm' | 'l' | 'xl';

interface MiniGridPreviewProps {
  item: ContentItem;
  maxItems?: number;
  onLoad?: () => void;
  size?: SizePreset;
  showTitle?: boolean;
  blurFallback?: boolean;
  boldTitle?: boolean;
}

const sizeConfig: Record<SizePreset, { cols: number; rows: number }> = {
  small: { cols: 3, rows: 3 },
  medium: { cols: 3, rows: 3 },
  large: { cols: 4, rows: 3 },
  s: { cols: 2, rows: 2 },
  m: { cols: 3, rows: 3 },
  l: { cols: 4, rows: 3 },
  xl: { cols: 4, rows: 4 },
};

const MiniGridPreview: React.FC<MiniGridPreviewProps> = ({ 
  item, 
  maxItems = 9, 
  onLoad, 
  size = 'medium',
  showTitle = true,
  blurFallback = false,
  boldTitle = false
}) => {
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);
  
  const children = item.children || [];
  const { cols, rows } = sizeConfig[size] || sizeConfig.medium;
  const gridSlots = cols * rows;
  const itemsToShow = children.slice(0, Math.min(maxItems, gridSlots));

  const hasCover = !!item.coverImage;
  const hasLogo = !!item.logo;
  const showGrid = (item.type === 'folder' || item.type === 'list' || item.type === 'space' || item.type === 'inventory') && itemsToShow.length > 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted group">
      {blurFallback && !hasCover && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/30 blur-2xl opacity-70" />
      )}
      {/* Cover Image */}
      {hasCover && (
        <div className="absolute inset-0 z-0">
          <Image
            src={item.coverImage!}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        </div>
      )}

      {/* Mini Grid Sketch */}
      {showGrid && (
        <div
          className={cn(
            'absolute inset-0 z-10 grid w-full h-full gap-1 p-1 transition-opacity duration-300 overflow-hidden',
            hasCover ? 'opacity-40 group-hover:opacity-60' : 'opacity-100',
            {
              'grid-cols-2': cols === 2,
              'grid-cols-3': cols === 3,
              'grid-cols-4': cols === 4,
            },
            {
              'grid-rows-2': rows === 2,
              'grid-rows-3': rows === 3,
              'grid-rows-4': rows === 4,
            }
          )}
        >
          {itemsToShow.map((childItem, idx) => {
            const hasChildThumbnail = !!(childItem as any).thumbnail_url || !!(childItem as any).coverImage;
            const ChildIcon = childItem.icon ? getIconByName(childItem.icon) : null;
            
            return (
              <div
                key={childItem.id || idx}
                className="rounded-sm bg-accent/40 border border-accent/50 overflow-hidden hover:bg-accent/60 hover:border-accent transition-colors"
              >
                {hasChildThumbnail ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={(childItem as any).thumbnail_url || (childItem as any).coverImage || ''}
                      alt={childItem.title || 'Item'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : ChildIcon ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <ChildIcon className="w-3 h-3 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <span className="text-[8px] text-muted-foreground">{childItem.type}</span>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Fill empty slots */}
          {itemsToShow.length < gridSlots &&
            Array.from({ length: gridSlots - itemsToShow.length }).map((_, filler) => (
              <div key={`filler-${item.id}-${filler}`} className="rounded-sm bg-background/40 border border-accent/20 overflow-hidden" />
            ))}
        </div>
      )}

      {/* Logo Overlay */}
      {hasLogo && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="relative w-1/2 h-1/2 drop-shadow-2xl">
            <Image
              src={item.logo!}
              alt={`${item.title} logo`}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Fallback if nothing else */}
      {!hasCover && !showGrid && !hasLogo && (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          {item.type === 'folder' ? <Folder className="w-6 h-6 text-muted-foreground" /> : <List className="w-6 h-6 text-muted-foreground" />}
        </div>
      )}
      
      {/* Title Overlay (Optional, but good for context) */}
          {showTitle && !hasLogo && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent z-30">
              <p className={cn("text-[10px] text-white truncate", boldTitle ? "font-extrabold" : "font-semibold")}>{item.title}</p>
              {item.author_name && <p className="text-[8px] text-white/70 truncate">{item.author_name}</p>}
          </div>
      )}
    </div>
  );
};

export default MiniGridPreview;
