// src/components/widgets/player-controls-widget.tsx

'use client';

import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { cn } from '@/lib/utils';

interface PlayerControlsWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function PlayerControlsWidget({ size = 'medium' }: PlayerControlsWidgetProps) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';
  return (
    <div className={cn(
      "flex h-full w-full flex-col items-center justify-center bg-muted text-center",
      isSmall && "p-2 gap-2",
      !isSmall && !isLarge && "p-4 gap-6",
      isLarge && "p-6 gap-8"
    )}>
      <div className={cn(
        "flex w-full items-center justify-center",
        isSmall && "gap-1",
        !isSmall && !isLarge && "gap-2",
        isLarge && "gap-4"
      )}>
        <Button variant="ghost" size="icon" className={cn(isSmall && "h-6 w-6", isLarge && "h-10 w-10")}>
          <Shuffle className={cn(isSmall && "h-4 w-4", !isSmall && !isLarge && "h-5 w-5", isLarge && "h-6 w-6")} />
        </Button>
        <Button variant="ghost" size="icon" className={cn(isSmall && "h-6 w-6", isLarge && "h-10 w-10")}>
          <SkipBack className={cn(isSmall && "h-4 w-4", !isSmall && !isLarge && "h-5 w-5", isLarge && "h-6 w-6")} />
        </Button>
        <Button variant="secondary" className={cn(
          "rounded-full",
          isSmall && "h-10 w-10",
          !isSmall && !isLarge && "h-16 w-16",
          isLarge && "h-20 w-20"
        )}>
          <Play className={cn(isSmall && "h-5 w-5", !isSmall && !isLarge && "h-8 w-8", isLarge && "h-10 w-10")} />
        </Button>
        <Button variant="ghost" size="icon" className={cn(isSmall && "h-6 w-6", isLarge && "h-10 w-10")}>
          <SkipForward className={cn(isSmall && "h-4 w-4", !isSmall && !isLarge && "h-5 w-5", isLarge && "h-6 w-6")} />
        </Button>
        <Button variant="ghost" size="icon" className={cn(isSmall && "h-6 w-6", isLarge && "h-10 w-10")}>
          <Repeat className={cn(isSmall && "h-4 w-4", !isSmall && !isLarge && "h-5 w-5", isLarge && "h-6 w-6")} />
        </Button>
      </div>

       <div className={cn(
         "flex w-full items-center",
         isSmall && "gap-2",
         !isSmall && !isLarge && "gap-4",
         isLarge && "gap-6"
       )}>
            <VolumeX className={cn(
              "text-muted-foreground",
              isSmall && "h-4 w-4",
              !isSmall && !isLarge && "h-5 w-5",
              isLarge && "h-6 w-6"
            )} />
            <Slider defaultValue={[50]} max={100} step={1} />
            <Volume2 className={cn(
              "text-muted-foreground",
              isSmall && "h-4 w-4",
              !isSmall && !isLarge && "h-5 w-5",
              isLarge && "h-6 w-6"
            )} />
      </div>
    </div>
  );
}
