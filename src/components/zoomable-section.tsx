'use client';

import React, { useState } from 'react';
import { ZoomControls } from '@/components/zoom-controls';
import { cn } from '@/lib/utils';

interface ZoomableSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  className?: string;
  containerClassName?: string;
}

export function ZoomableSection({
  children,
  title,
  description,
  minZoom = 50,
  maxZoom = 300,
  step = 10,
  className,
  containerClassName,
}: ZoomableSectionProps) {
  const [zoom, setZoom] = useState(100);

  return (
    <div className={cn('w-full h-full flex flex-col', className)}>
      {/* Header */}
      {(title || description) && (
        <div className="p-4 border-b">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Zoom Controls */}
      <div className="flex justify-between items-center p-3 bg-muted/50 border-b gap-4">
        <ZoomControls
          zoom={zoom}
          onZoomChange={setZoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          step={step}
        />
      </div>

      {/* Zoomable Content Container */}
      <div
        className={cn(
          'flex-1 overflow-auto bg-background relative',
          containerClassName
        )}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            transition: 'transform 200ms ease-in-out',
          }}
          className="w-full h-full"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
