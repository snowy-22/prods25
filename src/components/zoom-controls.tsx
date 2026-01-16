'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showSlider?: boolean;
  showPercentage?: boolean;
  onFitToScreen?: () => void;
  onActualSize?: () => void;
}

export function ZoomControls({
  zoom,
  onZoomChange,
  minZoom = 50,
  maxZoom = 300,
  step = 10,
  className,
  variant = 'default',
  showSlider = true,
  showPercentage = true,
  onFitToScreen,
  onActualSize,
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

  // Preset zoom levels
  const presets = [50, 75, 100, 125, 150, 200];
  const closestPreset = presets.reduce((prev, curr) =>
    Math.abs(curr - zoom) < Math.abs(prev - zoom) ? curr : prev
  );

  if (variant === 'minimal') {
    return (
      <TooltipProvider delayDuration={200}>
        <div className={cn('flex items-center gap-1', className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleZoomOut}
                disabled={zoom <= minZoom}
                className="h-7 w-7"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Uzaklaş</TooltipContent>
          </Tooltip>
          <span className="text-[11px] font-semibold w-10 text-center tabular-nums">{zoom}%</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleZoomIn}
                disabled={zoom >= maxZoom}
                className="h-7 w-7"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Yakınlaş</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider delayDuration={200}>
        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 bg-card/90 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm',
          className
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleZoomOut}
                disabled={zoom <= minZoom}
                className="h-6 w-6"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Uzaklaş (Ctrl -)</TooltipContent>
          </Tooltip>
          
          {showSlider && (
            <Slider
              value={[zoom]}
              onValueChange={handleSliderChange}
              min={minZoom}
              max={maxZoom}
              step={step}
              className="w-20"
            />
          )}
          
          {showPercentage && (
            <span className="text-[11px] font-semibold text-muted-foreground w-10 text-center tabular-nums">{zoom}%</span>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleZoomIn}
                disabled={zoom >= maxZoom}
                className="h-6 w-6"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Yakınlaş (Ctrl +)</TooltipContent>
          </Tooltip>
          
          <div className="w-px h-4 bg-border/50 mx-0.5" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleReset}
                className="h-6 w-6"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] py-0.5 px-1.5">Sıfırla (100%)</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  // Default variant
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(
        'flex items-center gap-3 p-2.5 bg-card/95 backdrop-blur-md rounded-xl border border-border/50 shadow-lg',
        className
      )}>
        {/* Zoom Out Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomOut}
              disabled={zoom <= minZoom}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Uzaklaş (Ctrl -)</TooltipContent>
        </Tooltip>

        {/* Slider */}
        {showSlider && (
          <div className="flex items-center gap-2 flex-1 min-w-[100px]">
            <Slider
              value={[zoom]}
              onValueChange={handleSliderChange}
              min={minZoom}
              max={maxZoom}
              step={step}
              className="flex-1"
            />
          </div>
        )}

        {/* Zoom Percentage */}
        {showPercentage && (
          <div className="min-w-14 text-center bg-muted/50 px-2 py-0.5 rounded-md">
            <span className="text-sm font-semibold tabular-nums">{zoom}%</span>
          </div>
        )}

        {/* Zoom In Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomIn}
              disabled={zoom >= maxZoom}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Yakınlaş (Ctrl +)</TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-6 bg-border/50" />

        {/* Reset Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Sıfırla (100%)</TooltipContent>
        </Tooltip>

        {/* Fit/Actual Size Buttons */}
        {(onFitToScreen || onActualSize) && (
          <>
            <div className="w-px h-6 bg-border/50" />
            {onFitToScreen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onFitToScreen}
                    className="h-8 w-8 p-0 hover:bg-accent"
                  >
                    <Minimize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Ekrana Sığdır</TooltipContent>
              </Tooltip>
            )}
            {onActualSize && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onActualSize}
                    className="h-8 w-8 p-0 hover:bg-accent"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Gerçek Boyut</TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
