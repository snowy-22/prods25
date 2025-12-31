"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function GradientClockWidget({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  if (!time) return null;

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDeg = (seconds / 60) * 360;
  const minuteDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
  const hourDeg = (hours / 12) * 360 + (minutes / 60) * 30;

  const Hand = ({ rotation, color, zIndex, length, width }: { rotation: number, color: string, zIndex: number, length: string, width: string }) => (
    <div
      className="absolute bottom-1/2 left-1/2 origin-bottom"
      style={{
        transform: `rotate(${rotation}deg)`,
        height: length,
        zIndex,
      }}
    >
      <div 
        className={cn('w-full h-full relative')}
      >
        <div 
          className="absolute bottom-0 left-0 w-full h-full"
          style={{
            background: `linear-gradient(to top, ${color}, transparent)`,
            clipPath: 'polygon(0 100%, 100% 100%, 50% 0)',
            width: width,
            left: `calc(50% - ${parseInt(width)/2}px)`
          }}
        />
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-2/3 opacity-50"
          style={{
            background: `linear-gradient(to top, ${color}, transparent)`,
            filter: 'blur(10px)',
            transform: 'scaleY(1.5) translateX(-50%)',
            left: '50%'
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#1C1C1E] overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle, #3a3a3c, #1c1c1e 70%)' }}
      />
      <div 
        className={cn(
            "rounded-full relative",
            size === 'small' ? "w-[80%] h-[80%]" : "w-[90%] h-[90%]"
        )}
        style={{
          background: 'conic-gradient(from 180deg, #e0e0e0, #888888, #e0e0e0)',
        }}
      >
        <div className="absolute inset-0 rounded-full" style={{background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.1) 100%)'}} />
        <Hand 
            rotation={hourDeg} 
            color="hsl(210 40% 70%)" 
            zIndex={10} 
            length="25%" 
            width={size === 'small' ? "4px" : size === 'large' ? "12px" : "8px"} 
        />
        <Hand 
            rotation={minuteDeg} 
            color="hsl(280 35% 75%)" 
            zIndex={20} 
            length="35%" 
            width={size === 'small' ? "3px" : size === 'large' ? "10px" : "6px"} 
        />
        <Hand 
            rotation={secondDeg} 
            color="hsl(0 50% 70%)" 
            zIndex={30} 
            length="40%" 
            width={size === 'small' ? "1px" : size === 'large' ? "4px" : "2px"} 
        />

        <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full z-40 border-2 border-gray-700",
            size === 'small' ? "w-2 h-2" : size === 'large' ? "w-6 h-6" : "w-4 h-4"
        )}/>
      </div>
    </div>
  );
}
