// src/components/widgets/world-clock-widget.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';

const timezones: Record<string, string> = {
  'Europe/London': 'Londra',
  'Europe/Berlin': 'Berlin',
  'Europe/Moscow': 'Moskova',
  'America/New_York': 'New York',
  'America/Los_Angeles': 'Los Angeles',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Dubai': 'Dubai',
  'Australia/Sydney': 'Sydney',
};

const Clock = ({ timezone, city, size = 'medium' }: { timezone: string; city: string; size?: 'small' | 'medium' | 'large' }) => {
  const [time, setTime] = useState('');
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  useEffect(() => {
    const updateClock = () => {
      const date = new Date();
      const timeString = date.toLocaleTimeString('tr-TR', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      });
      setTime(timeString);
    };
    updateClock();
    const timerId = setInterval(updateClock, 1000 * 30);
    return () => clearInterval(timerId);
  }, [timezone]);

  return (
    <div className={cn(
      "flex items-center justify-between rounded-md bg-muted",
      isSmall && "p-1",
      !isSmall && !isLarge && "p-2",
      isLarge && "p-4"
    )}>
      <p className={cn(
        "font-semibold",
        isSmall && "text-xs",
        !isSmall && !isLarge && "text-sm",
        isLarge && "text-base"
      )}>{city}</p>
      <p className={cn(
        "font-mono",
        isSmall && "text-sm",
        !isSmall && !isLarge && "text-xl",
        isLarge && "text-2xl"
      )}>{time}</p>
    </div>
  );
};

export default function WorldClockWidget({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const [selectedTimezones, setSelectedTimezones] = useState(['Europe/London', 'America/New_York', 'Asia/Tokyo']);
  const isSmall = size === 'small';
  const isLarge = size === 'large';
  
  const addTimezone = (tz: string) => {
    if (!selectedTimezones.includes(tz)) {
        setSelectedTimezones([...selectedTimezones, tz]);
    }
  }

  const removeTimezone = (tz: string) => {
    setSelectedTimezones(selectedTimezones.filter(t => t !== tz));
  }

  return (
    <div className="flex h-full w-full flex-col bg-card">
      <div className={cn("border-b flex items-center justify-between", isSmall && "p-1", !isSmall && !isLarge && "p-2", isLarge && "p-3")}>
         <h3 className={cn(
           "font-semibold flex items-center gap-2",
           isSmall && "text-xs",
           !isSmall && !isLarge && "text-sm",
           isLarge && "text-base"
         )}>
           <Globe className={cn(isSmall && "h-3 w-3", !isSmall && !isLarge && "h-4 w-4", isLarge && "h-5 w-5")}/>
           Dünya Saatleri
         </h3>
         <Popover>
            <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className={cn(isSmall && "h-6 w-6", !isSmall && !isLarge && "h-8 w-8", isLarge && "h-10 w-10")}>
                  <Plus className={cn(isSmall && "h-3 w-3", !isSmall && !isLarge && "h-4 w-4", isLarge && "h-5 w-5")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                <ScrollArea className="h-48">
                    {Object.entries(timezones).map(([tz, city]) => (
                        <Button key={tz} variant="ghost" className="w-full justify-start text-sm" onClick={() => addTimezone(tz)}>{city}</Button>
                    ))}
                </ScrollArea>
            </PopoverContent>
         </Popover>
      </div>
      <ScrollArea className="flex-1">
        <div className={cn(
          "space-y-2",
          isSmall && "p-1",
          !isSmall && !isLarge && "p-2",
          isLarge && "p-3"
        )}>
            {selectedTimezones.map(tz => (
                <div key={tz} className="group flex items-center">
                    <Clock timezone={tz} city={timezones[tz]} size={size} />
                    <Button size="icon" variant="ghost" className={cn(
                      "ml-1 opacity-0 group-hover:opacity-100",
                      isSmall && "h-5 w-5",
                      !isSmall && !isLarge && "h-7 w-7",
                      isLarge && "h-9 w-9"
                    )} onClick={() => removeTimezone(tz)}>
                         <Trash2 className={cn(
                           "text-destructive",
                           isSmall && "h-3 w-3",
                           !isSmall && !isLarge && "h-4 w-4",
                           isLarge && "h-5 w-5"
                         )} />
                    </Button>
                </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
