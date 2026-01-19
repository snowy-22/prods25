'use client';

/**
 * Mouse Tracker Background - Fare Takip Arka Planı
 * 
 * Task 6: Mouse tracker arka planını tüm klasör kapakları ve widget'lara uygula
 * - Etkileşimli gradient arka plan
 * - Fare pozisyonuna göre ışık efekti
 * - Hover ve aktif durumlar
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MouseTrackerBackgroundProps {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'blue' | 'purple' | 'green' | 'amber' | 'rose' | 'cyan' | 'white';
  glowSize?: number;
  borderGlow?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

const colorMap = {
  blue: { from: '59, 130, 246', glow: 'rgba(59, 130, 246, 0.5)' },
  purple: { from: '147, 51, 234', glow: 'rgba(147, 51, 234, 0.5)' },
  green: { from: '34, 197, 94', glow: 'rgba(34, 197, 94, 0.5)' },
  amber: { from: '245, 158, 11', glow: 'rgba(245, 158, 11, 0.5)' },
  rose: { from: '244, 63, 94', glow: 'rgba(244, 63, 94, 0.5)' },
  cyan: { from: '6, 182, 212', glow: 'rgba(6, 182, 212, 0.5)' },
  white: { from: '255, 255, 255', glow: 'rgba(255, 255, 255, 0.3)' },
};

const intensityMap = {
  low: 0.1,
  medium: 0.25,
  high: 0.4,
};

export const MouseTrackerBackground: React.FC<MouseTrackerBackgroundProps> = ({
  children,
  className,
  enabled = true,
  intensity = 'medium',
  color = 'blue',
  glowSize = 200,
  borderGlow = true,
  onClick,
  onDoubleClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [enabled]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const colorConfig = colorMap[color];
  const intensityValue = intensityMap[intensity];
  const currentIntensity = isPressed ? intensityValue * 1.5 : isHovered ? intensityValue : intensityValue * 0.5;

  const gradientStyle: React.CSSProperties = enabled && isHovered ? {
    background: `
      radial-gradient(
        ${glowSize * (isPressed ? 1.2 : 1)}px circle at ${mousePosition.x}px ${mousePosition.y}px,
        rgba(${colorConfig.from}, ${currentIntensity}),
        transparent 50%
      )
    `,
  } : {};

  const borderGlowStyle: React.CSSProperties = enabled && borderGlow && isHovered ? {
    boxShadow: `
      0 0 ${isPressed ? 20 : 10}px ${colorConfig.glow},
      inset 0 0 ${isPressed ? 30 : 15}px rgba(${colorConfig.from}, 0.05)
    `,
  } : {};

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        isHovered && enabled && "ring-1 ring-primary/20",
        className
      )}
      style={borderGlowStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Glow overlay */}
      {enabled && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            ...gradientStyle,
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
};

/**
 * Aktif Klasör Kapağı - 4x Grid Preview
 * 
 * Task 11: Animasyonlu logo yerine aktif içerik grid'i
 */
interface ActiveFolderCoverProps {
  items: Array<{
    id: string;
    type: string;
    title?: string;
    thumbnail?: string;
    url?: string;
    icon?: string;
  }>;
  gridSize?: 4 | 9 | 16;
  className?: string;
  onItemClick?: (itemId: string) => void;
  onDoubleClick?: () => void;
  autoPlay?: boolean;
  muted?: boolean;
}

export const ActiveFolderCover: React.FC<ActiveFolderCoverProps> = ({
  items,
  gridSize = 4,
  className,
  onItemClick,
  onDoubleClick,
  autoPlay = true,
  muted = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Grid boyutuna göre gösterilecek öğe sayısı
  const displayCount = Math.min(items.length, gridSize);
  const displayItems = items.slice(0, displayCount);
  
  // Grid düzeni hesaplama
  const getGridCols = () => {
    switch (gridSize) {
      case 4: return 'grid-cols-2';
      case 9: return 'grid-cols-3';
      case 16: return 'grid-cols-4';
      default: return 'grid-cols-2';
    }
  };

  const getGridRows = () => {
    switch (gridSize) {
      case 4: return 'grid-rows-2';
      case 9: return 'grid-rows-3';
      case 16: return 'grid-rows-4';
      default: return 'grid-rows-2';
    }
  };

  const renderCoverItem = (item: typeof items[0], index: number) => {
    const isHovered = hoveredIndex === index;
    
    // Video thumbnail veya iframe için
    if (item.type === 'video' || item.type === 'player' || item.type === 'iframe') {
      const videoUrl = item.url;
      const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
      const youtubeId = isYouTube ? extractYouTubeId(videoUrl || '') : null;
      
      return (
        <div
          key={item.id}
          className={cn(
            "relative overflow-hidden bg-muted transition-all duration-200 cursor-pointer",
            isHovered && "scale-105 z-10 shadow-lg"
          )}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => onItemClick?.(item.id)}
        >
          {youtubeId && autoPlay && isHovered ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${youtubeId}`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              {item.thumbnail ? (
                <img 
                  src={item.thumbnail} 
                  alt={item.title || ''} 
                  className="w-full h-full object-cover"
                />
              ) : youtubeId ? (
                <img 
                  src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                  alt={item.title || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-3xl opacity-50">▶</div>
              )}
            </div>
          )}
          
          {/* Title overlay */}
          {isHovered && item.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-white text-xs truncate">{item.title}</p>
            </div>
          )}
        </div>
      );
    }
    
    // Görsel için
    if (item.type === 'image') {
      return (
        <div
          key={item.id}
          className={cn(
            "relative overflow-hidden bg-muted transition-all duration-200 cursor-pointer",
            isHovered && "scale-105 z-10 shadow-lg"
          )}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => onItemClick?.(item.id)}
        >
          <img 
            src={item.url || item.thumbnail || ''} 
            alt={item.title || ''} 
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    
    // Varsayılan - ikon göster
    return (
      <div
        key={item.id}
        className={cn(
          "relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900",
          "flex items-center justify-center transition-all duration-200 cursor-pointer",
          isHovered && "scale-105 z-10 shadow-lg bg-primary/10"
        )}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => onItemClick?.(item.id)}
      >
        <span className="text-2xl opacity-60">
          {item.icon || getDefaultIcon(item.type)}
        </span>
      </div>
    );
  };

  // Boş slotlar için placeholder
  const emptySlots = gridSize - displayItems.length;

  return (
    <MouseTrackerBackground
      className={cn(
        "rounded-lg border overflow-hidden",
        className
      )}
      onDoubleClick={onDoubleClick}
    >
      <div className={cn(
        "grid gap-0.5 w-full h-full",
        getGridCols(),
        getGridRows()
      )}>
        {displayItems.map((item, index) => renderCoverItem(item, index))}
        
        {/* Boş slotlar */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div 
            key={`empty-${index}`}
            className="bg-muted/30 flex items-center justify-center"
          >
            <div className="w-8 h-8 rounded-full bg-muted/50" />
          </div>
        ))}
      </div>
    </MouseTrackerBackground>
  );
};

// Yardımcı fonksiyonlar
function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getDefaultIcon(type: string): string {
  const icons: Record<string, string> = {
    folder: '📁',
    video: '🎬',
    audio: '🎵',
    image: '🖼️',
    document: '📄',
    widget: '🧩',
    iframe: '🌐',
  };
  return icons[type] || '📦';
}

export default MouseTrackerBackground;
