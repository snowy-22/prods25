// src/components/widgets/alarm-clock-widget.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Bell, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Alarm = {
  id: number;
  time: string;
  isActive: boolean;
};

const playAlertSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, 300); // Beep for 300ms
};

interface AlarmClockWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function AlarmClockWidget({ size = 'medium' }: AlarmClockWidgetProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      alarms.forEach(alarm => {
        if (alarm.isActive && alarm.time === currentTime) {
          toast({
            title: "Alarm!",
            description: `Alarm zamanı geldi: ${alarm.time}`,
          });
          playAlertSound();
          // Optional: Deactivate alarm after it rings
          // setAlarms(alarms.map(a => a.id === alarm.id ? { ...a, isActive: false } : a));
        }
      });
    }, 1000 * 30); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [alarms, toast]);

  const addAlarm = () => {
    if (newAlarmTime) {
      const newAlarm: Alarm = {
        id: Date.now(),
        time: newAlarmTime,
        isActive: true,
      };
      setAlarms([...alarms, newAlarm].sort((a, b) => a.time.localeCompare(b.time)));
    }
  };

  const toggleAlarm = (id: number) => {
    setAlarms(alarms.map(alarm => alarm.id === id ? { ...alarm, isActive: !alarm.isActive } : alarm));
  };

  const deleteAlarm = (id: number) => {
    setAlarms(alarms.filter(alarm => alarm.id !== id));
  };

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-card",
      isSmall && "p-1",
      !isSmall && !isLarge && "p-2",
      isLarge && "p-4"
    )}>
      <h3 className={cn(
        "font-semibold text-center flex items-center justify-center gap-2",
        isSmall && "text-xs p-1",
        !isSmall && !isLarge && "text-sm p-2",
        isLarge && "text-base p-3"
      )}>
        <Bell className={cn(isSmall && "h-3 w-3", !isSmall && !isLarge && "h-4 w-4", isLarge && "h-5 w-5")}/>
        Alarmlar
      </h3>
      <div className={cn(
        "border-b",
        isSmall && "p-1",
        !isSmall && !isLarge && "p-2",
        isLarge && "p-3"
      )}>
        <div className={cn(
          "flex items-center",
          isSmall && "gap-1",
          !isSmall && !isLarge && "gap-2",
          isLarge && "gap-3"
        )}>
            <Input 
              type="time" 
              value={newAlarmTime} 
              onChange={e => setNewAlarmTime(e.target.value)}
              className={cn(isSmall && "h-7 text-xs")} 
            />
            <Button 
              onClick={addAlarm}
              className={cn(isSmall && "h-7 text-xs px-2", isLarge && "h-12 text-lg")}
            >
              Ekle
            </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className={cn(
          "space-y-2",
          isSmall && "p-1",
          !isSmall && !isLarge && "p-2",
          isLarge && "p-3"
        )}>
          {alarms.map(alarm => (
            <div key={alarm.id} className={cn(
              "flex items-center justify-between rounded-md bg-muted group",
              isSmall && "p-1",
              !isSmall && !isLarge && "p-2",
              isLarge && "p-3"
            )}>
              <div className={cn(
                "flex items-center",
                isSmall && "gap-2",
                !isSmall && !isLarge && "gap-4",
                isLarge && "gap-6"
              )}>
                  <input 
                    type="checkbox" 
                    checked={alarm.isActive} 
                    onChange={() => toggleAlarm(alarm.id)} 
                    className={cn(
                      "accent-primary",
                      isSmall && "h-3 w-3",
                      !isSmall && !isLarge && "h-5 w-5",
                      isLarge && "h-6 w-6"
                    )}
                  />
                  <span className={cn(
                    "font-mono",
                    alarm.isActive ? 'text-foreground' : 'text-muted-foreground line-through',
                    isSmall && "text-sm",
                    !isSmall && !isLarge && "text-xl",
                    isLarge && "text-3xl"
                  )}>{alarm.time}</span>
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className={cn(
                  "opacity-0 group-hover:opacity-100",
                  isSmall && "h-5 w-5",
                  !isSmall && !isLarge && "h-7 w-7",
                  isLarge && "h-10 w-10"
                )} 
                onClick={() => deleteAlarm(alarm.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
