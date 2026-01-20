'use client';

import { useEffect, useRef } from 'react';
import { useAdSense } from './adsense-provider';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// AdSense slot türleri
export type AdSlotSize = 
  | 'auto'           // Responsive
  | 'rectangle'      // 300x250
  | 'leaderboard'    // 728x90
  | 'skyscraper'     // 160x600
  | 'banner'         // 468x60
  | 'large-rectangle'// 336x280
  | 'mobile-banner'  // 320x50
  | 'in-article'     // In-article native
  | 'in-feed';       // In-feed native

interface AdSlotProps {
  size?: AdSlotSize;
  className?: string;
  slotId?: string;
  style?: React.CSSProperties;
  // Free tier: hangi hücre pozisyonunda gösterilecek
  cellPosition?: number;
  // Show only for free users
  freeOnly?: boolean;
}

// Size configurations
const SIZE_CONFIG: Record<AdSlotSize, { width: string; height: string; format?: string }> = {
  'auto': { width: '100%', height: 'auto', format: 'auto' },
  'rectangle': { width: '300px', height: '250px' },
  'leaderboard': { width: '728px', height: '90px' },
  'skyscraper': { width: '160px', height: '600px' },
  'banner': { width: '468px', height: '60px' },
  'large-rectangle': { width: '336px', height: '280px' },
  'mobile-banner': { width: '320px', height: '50px' },
  'in-article': { width: '100%', height: 'auto', format: 'fluid' },
  'in-feed': { width: '100%', height: 'auto', format: 'fluid' },
};

export function AdSlot({ 
  size = 'auto', 
  className, 
  slotId,
  style,
  cellPosition,
  freeOnly = true 
}: AdSlotProps) {
  const { clientId, isEnabled } = useAdSense();
  const userSubscriptionTier = useAppStore((state) => state.userSubscriptionTier);
  const adRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  // Free tier kullanıcıları için reklam göster
  const shouldShowAd = isEnabled && (!freeOnly || userSubscriptionTier === 'free' || userSubscriptionTier === 'guest');

  useEffect(() => {
    if (!shouldShowAd || isLoaded.current) return;

    try {
      // AdSense reklamını yükle
      if (typeof window !== 'undefined' && (window as any).adsbygoogle && adRef.current) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        isLoaded.current = true;
      }
    } catch (error) {
      console.error('AdSense loading error:', error);
    }
  }, [shouldShowAd]);

  // Reklam gösterilmeyecekse boş dön
  if (!shouldShowAd) {
    return null;
  }

  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div 
      ref={adRef}
      className={cn(
        'ad-slot relative overflow-hidden bg-muted/30 rounded-lg',
        'flex items-center justify-center',
        'border border-dashed border-muted-foreground/20',
        className
      )}
      style={{
        minWidth: sizeConfig.width !== '100%' ? sizeConfig.width : undefined,
        minHeight: sizeConfig.height !== 'auto' ? sizeConfig.height : '100px',
        ...style,
      }}
      data-cell-position={cellPosition}
      data-ad-size={size}
    >
      {/* Placeholder for verification mode */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 text-xs">
        <svg 
          className="w-8 h-8 mb-2 opacity-40" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" 
          />
        </svg>
        <span>Reklam Alanı</span>
        <span className="text-[10px] mt-1">({size})</span>
      </div>

      {/* Actual AdSense unit - will overlay placeholder when loaded */}
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: sizeConfig.width,
          height: sizeConfig.height !== 'auto' ? sizeConfig.height : undefined,
          position: 'relative',
          zIndex: 1,
        }}
        data-ad-client={clientId}
        data-ad-slot={slotId || ''}
        data-ad-format={sizeConfig.format || 'auto'}
        data-full-width-responsive={size === 'auto' ? 'true' : 'false'}
      />
    </div>
  );
}

// Canvas içi reklam komponenti - Grid/Canvas modunda kullanılacak
export function CanvasAdSlot({ 
  index,
  className,
}: { 
  index: number;
  className?: string;
}) {
  // Her 5-6 item'dan sonra bir reklam göster
  const showAt = [3, 8, 14, 21]; // 4, 9, 15, 22. pozisyonlarda reklam
  
  if (!showAt.includes(index)) {
    return null;
  }

  return (
    <AdSlot 
      size="rectangle"
      cellPosition={index}
      className={cn('col-span-1 row-span-1', className)}
      freeOnly={true}
    />
  );
}

// In-Article reklam - içerik aralarına
export function InArticleAd({ className }: { className?: string }) {
  return (
    <div className={cn('my-6', className)}>
      <AdSlot size="in-article" freeOnly={true} />
    </div>
  );
}

// Banner reklam - header/footer için
export function BannerAd({ 
  position = 'top',
  className 
}: { 
  position?: 'top' | 'bottom';
  className?: string;
}) {
  return (
    <div className={cn(
      'w-full flex justify-center py-2',
      position === 'top' && 'border-b border-muted',
      position === 'bottom' && 'border-t border-muted',
      className
    )}>
      <AdSlot size="leaderboard" freeOnly={true} />
    </div>
  );
}

// Sidebar reklam
export function SidebarAd({ className }: { className?: string }) {
  return (
    <div className={cn('sticky top-4', className)}>
      <AdSlot size="rectangle" freeOnly={true} />
    </div>
  );
}
