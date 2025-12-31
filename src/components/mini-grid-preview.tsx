
import React, { useEffect } from 'react';
import Image from 'next/image';
import { ContentItem } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { Folder, List } from 'lucide-react';
import { getIconByName } from '@/lib/icons';

interface MiniGridPreviewProps {
  item: ContentItem;
  maxItems?: number;
  onLoad?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const MiniGridPreview: React.FC<MiniGridPreviewProps> = ({ item, maxItems = 9, onLoad, size = 'medium' }) => {
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);
  
  const children = item.children || [];
  const itemsToShow = children.slice(0, maxItems);

  const hasCover = !!item.coverImage;
  const hasLogo = !!item.logo;
  const showGrid = (item.type === 'folder' || item.type === 'list' || item.type === 'space' || item.type === 'inventory') && itemsToShow.length > 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted group">
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
            'absolute inset-0 z-10 grid w-full h-full transition-opacity duration-300',
            hasCover ? 'opacity-40 group-hover:opacity-60' : 'opacity-100',
            'grid-cols-3 grid-rows-3'
          )}
        >
          {itemsToShow.map((child, index) => {
            const ChildIcon = child.icon ? getIconByName(child.icon) : null;
            const thumb = child.thumbnail_url || (child.coverImage as string | undefined);
            return (
              <div key={child.id || index} className="relative w-full h-full overflow-hidden border border-white/10">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={child.title || 'thumbnail'}
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
                    {(child.title || '?').slice(0, 2)}
                  </div>
                )}
              </div>
            );
          })}
          {itemsToShow.length < 9 &&
            Array.from({ length: 9 - itemsToShow.length }).map((_, filler) => (
              <div key={`filler-${item.id}-${filler}`} className="relative w-full h-full overflow-hidden border border-white/5 bg-background/40" />
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
      {!hasLogo && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent z-30">
              <p className="text-[10px] font-bold text-white truncate">{item.title}</p>
              {item.author_name && <p className="text-[8px] text-white/70 truncate">{item.author_name}</p>}
          </div>
      )}
    </div>
  );
};

export default MiniGridPreview;
