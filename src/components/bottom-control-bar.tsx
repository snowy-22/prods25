'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, ChevronDown, ChevronUp, Map, LayoutGrid } from 'lucide-react';
import { 
  SizePreset, 
  pixelToSizePreset, 
  sizePresetToPixel,
  getNextSizePreset,
  getPreviousSizePreset
} from '@/lib/sizing';
import { cn } from '@/lib/utils';

interface BottomBarProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showMiniMapToggle?: boolean;
  isMiniMapOpen?: boolean;
  onToggleMiniMap?: (open: boolean) => void;
}

export function BottomControlBar({ 
  isCollapsed, 
  onToggleCollapse,
  gridSize,
  onGridSizeChange,
  showMiniMapToggle = false,
  isMiniMapOpen = false,
  onToggleMiniMap,
}: BottomBarProps) {
  const currentPreset = pixelToSizePreset(gridSize);
  const sizes: SizePreset[] = ['S', 'M', 'L', 'XL', 'XXL'];

  const minGridSize = sizePresetToPixel('S');
  const maxGridSize = sizePresetToPixel('XXL');
  const logMin = Math.log(minGridSize);
  const logMax = Math.log(maxGridSize);

  const toSliderValue = (value: number) => {
    const clamped = Math.min(Math.max(value, minGridSize), maxGridSize);
    return ((Math.log(clamped) - logMin) / (logMax - logMin)) * 100;
  };

  const fromSliderValue = (value: number) => {
    const clamped = Math.min(Math.max(value, 0), 100);
    const scaled = Math.exp(logMin + (clamped / 100) * (logMax - logMin));
    return Math.round(scaled);
  };

  const presetMarkers = sizes.map(preset => ({
    preset,
    position: toSliderValue(sizePresetToPixel(preset))
  }));

  const handlePresetChange = (preset: SizePreset) => {
    onGridSizeChange(sizePresetToPixel(preset));
  };

  const handleZoomOut = () => {
    const prevPreset = getPreviousSizePreset(currentPreset);
    handlePresetChange(prevPreset);
  };

  const handleZoomIn = () => {
    const nextPreset = getNextSizePreset(currentPreset);
    handlePresetChange(nextPreset);
  };

  return (
    <div className="flex items-center justify-between gap-2 px-2 md:px-3 py-2 border-t bg-muted/50 backdrop-blur-sm min-h-12">
      {/* Left Section: Zoom Out + Slider Section */}
      <div className="flex items-center gap-3 flex-1 max-w-none">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={handleZoomOut}
          disabled={currentPreset === 'S'}
          title="Küçült"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>

        <div className="flex items-center gap-2 flex-1">
          <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <div className="relative flex-1 min-w-[280px] h-12">
            {/* Map scale ruler appearance */}
            <div className="absolute inset-0 flex items-center">
              {/* Scale bar track */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-muted via-primary/20 to-muted rounded-full" />
              
              {/* Preset markers with tick marks */}
              {presetMarkers.map((marker, idx) => (
                <div
                  key={marker.preset}
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-center -translate-x-1/2 pointer-events-none"
                  style={{ left: `${marker.position}%` }}
                >
                  {/* Tick mark */}
                  <div 
                    className={cn(
                      "w-0.5 rounded-full transition-all",
                      currentPreset === marker.preset 
                        ? "h-8 bg-primary shadow-lg" 
                        : "h-4 bg-muted-foreground/40"
                    )}
                  />
                  
                  {/* Label - clickable */}
                  <button
                    type="button"
                    onClick={() => handlePresetChange(marker.preset)}
                    className={cn(
                      "absolute -bottom-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all pointer-events-auto whitespace-nowrap",
                      currentPreset === marker.preset
                        ? "bg-primary text-primary-foreground shadow-md scale-110 z-10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:scale-105"
                    )}
                  >
                    {marker.preset}
                  </button>
                </div>
              ))}
            </div>

            {/* Slider overlay */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              <Slider
                value={[toSliderValue(gridSize)]}
                min={0}
                max={100}
                step={0.5}
                onValueChange={(val) => onGridSizeChange(fromSliderValue(val[0]))}
                className="w-full"
              />
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground min-w-[55px] flex-shrink-0 text-right">
            {gridSize}px
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={handleZoomIn}
          disabled={currentPreset === 'XXL'}
          title="Büyüt"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Right Section: Collapse + MiniMap */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {showMiniMapToggle && (
          <Button
            variant={isMiniMapOpen ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleMiniMap?.(!isMiniMapOpen)}
            title="Mini Map"
          >
            <Map className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={() => onToggleCollapse(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
