'use client';
import { AppLogo } from './icons/app-logo';
import { Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface AiGuideProps {
  position: { x: number; y: number } | null;
}

export default function AiGuide({ position }: AiGuideProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);

  useEffect(() => {
    // Smoothly update position
    if (position) {
      setCurrentPosition(position);
    }
  }, [position]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 300);
    }, Math.random() * 5000 + 3000); // Blink every 3-8 seconds

    return () => clearInterval(blinkInterval);
  }, []);
  
  if (!position) {
    return null;
  }

  const isLeft = position.x > window.innerWidth / 2;

  return (
    <div
      className="fixed top-0 left-0 z-50 transition-all duration-700 ease-in-out"
      style={{
        transform: `translate(${currentPosition?.x || 0}px, ${currentPosition?.y || 0}px)`,
      }}
    >
      <div className={cn("flex items-center", isLeft ? 'flex-row-reverse' : 'flex-row')}>
         <div className={cn(
            'relative h-16 w-16 transition-transform duration-300 hover:scale-110',
            isBlinking && 'blinking'
          )}>
            <AppLogo className="h-full w-full drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]" />
        </div>
        <div className="flex items-center">
            <div className={cn("w-10 h-0.5 bg-primary/50", isLeft && "order-2")} />
            <Wand2 className={cn("h-8 w-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]", isLeft && "-scale-x-100")} />
        </div>
      </div>
    </div>
  );
}