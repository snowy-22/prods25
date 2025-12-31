'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  className?: string;
}

export function ZoomControls({
  zoom,
  onZoomChange,
  minZoom = 50,
  maxZoom = 300,
  step = 10,
  className,
}: ZoomControlsProps) {
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + step, maxZoom);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - step, minZoom);
    onZoomChange(newZoom);
  };

  const handleReset = () => {
    onZoomChange(100);
  };

  const handleSliderChange = (value: number[]) => {
    onZoomChange(value[0]);
  };

  return (
    <div className={cn('flex items-center gap-3 p-3 bg-muted rounded-lg border', className)}>
      {/* Zoom Out Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleZoomOut}
        disabled={zoom <= minZoom}
        className="h-8 w-8 p-0"
        title="Uzaklaş (Ctrl + -)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      {/* Slider */}
      <div className="flex items-center gap-2 flex-1">
        <Slider
          value={[zoom]}
          onValueChange={handleSliderChange}
          min={minZoom}
          max={maxZoom}
          step={step}
          className="flex-1"
        />
      </div>

      {/* Zoom Percentage */}
      <div className="min-w-12 text-center">
        <span className="text-sm font-medium">{zoom}%</span>
      </div>

      {/* Zoom In Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleZoomIn}
        disabled={zoom >= maxZoom}
        className="h-8 w-8 p-0"
        title="Yakınlaş (Ctrl + +)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      {/* Reset Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleReset}
        className="h-8 w-8 p-0"
        title="Orijinal boyuta dön"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
