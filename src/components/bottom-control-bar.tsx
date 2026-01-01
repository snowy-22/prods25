'use client';

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
  const sizes: SizePreset[] = ['S', 'M', 'L', 'XL'];

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
    <div className="flex items-center justify-between gap-2 px-2 md:px-3 py-1 border-t bg-muted/50 backdrop-blur-sm min-h-8">
      {/* Left Section: Collapse/Expand */}
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

      {/* Middle Section: Size Preset Buttons + Slider */}
      <div className="flex items-center gap-1.5 flex-1 max-w-2xl">
        {/* Zoom Out Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleZoomOut}
          disabled={currentPreset === 'S'}
          title="Küçült"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        
        {/* Size Preset Buttons */}
        <div className="flex items-center gap-1 border rounded-md p-0.5 bg-background/50">
          {sizes.map(size => (
            <Button
              key={size}
              variant={currentPreset === size ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "h-6 w-8 text-xs font-semibold",
                currentPreset === size && "shadow-sm"
              )}
              onClick={() => handlePresetChange(size)}
            >
              {size}
            </Button>
          ))}
        </div>

        {/* Fine-tune Slider */}
        <div className="flex items-center gap-2 flex-1">
          <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
          <Slider
            value={[gridSize]}
            min={100}
            max={800}
            step={10}
            onValueChange={(val) => onGridSizeChange(val[0])}
            className="flex-1"
          />
          <span className="text-xs font-mono text-muted-foreground min-w-[50px]">
            {gridSize}px
          </span>
        </div>
        
        {/* Zoom In Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleZoomIn}
          disabled={currentPreset === 'XL'}
          title="Büyüt"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Right Section: MiniMap */}
      <div className="flex items-center gap-1">
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
      </div>
    </div>
  );
}
