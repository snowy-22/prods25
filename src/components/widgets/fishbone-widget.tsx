
'use client';

import React from 'react';

export default function FishboneWidget({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 bg-background overflow-auto">
      <div className="relative w-full max-w-2xl h-64 flex items-center">
        {/* Main Spine */}
        <div className="absolute w-full h-1 bg-primary rounded-full" />
        
        {/* Head */}
        <div className="absolute right-0 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs text-center p-1">
          PROBLEM TANIMI
        </div>

        {/* Bones - Top */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-primary/50 -rotate-45 origin-bottom" />
        <div className="absolute top-0 left-2/4 w-px h-32 bg-primary/50 -rotate-45 origin-bottom" />
        <div className="absolute top-0 left-3/4 w-px h-32 bg-primary/50 -rotate-45 origin-bottom" />

        {/* Bones - Bottom */}
        <div className="absolute bottom-0 left-1/4 w-px h-32 bg-primary/50 rotate-45 origin-top" />
        <div className="absolute bottom-0 left-2/4 w-px h-32 bg-primary/50 rotate-45 origin-top" />
        <div className="absolute bottom-0 left-3/4 w-px h-32 bg-primary/50 rotate-45 origin-top" />

        {/* Labels */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 -translate-y-full pb-2 font-semibold text-xs">İnsan</div>
        <div className="absolute top-0 left-2/4 -translate-x-1/2 -translate-y-full pb-2 font-semibold text-xs">Makine</div>
        <div className="absolute top-0 left-3/4 -translate-x-1/2 -translate-y-full pb-2 font-semibold text-xs">Metot</div>
        
        <div className="absolute bottom-0 left-1/4 -translate-x-1/2 translate-y-full pt-2 font-semibold text-xs">Malzeme</div>
        <div className="absolute bottom-0 left-2/4 -translate-x-1/2 translate-y-full pt-2 font-semibold text-xs">Ölçüm</div>
        <div className="absolute bottom-0 left-3/4 -translate-x-1/2 translate-y-full pt-2 font-semibold text-xs">Çevre</div>
      </div>
    </div>
  );
}
