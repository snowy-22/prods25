// src/components/widgets/media-hub-widget.tsx

'use client';

import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Repeat, Shuffle, Chrome, Mic, Monitor, Music } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FaSpotify, FaDiscord } from 'react-icons/fa';

const currentTrack = {
    title: 'Monolink - Return to Oz',
    artist: 'ARTBAT Remix',
    albumArt: 'https://i1.sndcdn.com/artworks-000557457490-1smh7f-t500x500.jpg',
};

type VolumeChannel = {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    level: number; // 0-100
    isMuted: boolean;
};

const initialChannels: VolumeChannel[] = [
    { id: 'system', name: 'Sistem', icon: Monitor, level: 75, isMuted: false },
    { id: 'chrome', name: 'Chrome', icon: Chrome, level: 90, isMuted: false },
    { id: 'spotify', name: 'Spotify', icon: FaSpotify, level: 60, isMuted: false },
    { id: 'discord', name: 'Discord', icon: FaDiscord, level: 45, isMuted: false },
    { id: 'mic', name: 'Mikrofon', icon: Mic, level: 80, isMuted: false },
];

interface MediaHubWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function MediaHubWidget({ size = 'medium' }: MediaHubWidgetProps) {
  const [channels, setChannels] = useState<VolumeChannel[]>(initialChannels);
    const isSmall = size === 'small';
    const isLarge = size === 'large';
  
  const handleVolumeChange = (id: string, newLevel: number[]) => {
      setChannels(channels.map(ch => ch.id === id ? { ...ch, level: newLevel[0] } : ch));
  };

  const toggleMute = (id: string) => {
      setChannels(channels.map(ch => ch.id === id ? { ...ch, isMuted: !ch.isMuted } : ch));
  }
  
  const getSliderColor = (level: number) => {
      const hue = (1 - level / 100) * 120; // 0 (kırmızı) - 120 (yeşil) arası
      return `hsl(${hue}, 80%, 50%)`;
  }

    return (
        <div
            className={cn(
                'flex h-full w-full flex-col bg-card text-foreground',
                isSmall && 'p-2',
                !isSmall && !isLarge && 'p-3',
                isLarge && 'p-4'
            )}
        >
                {/* Volume Mixer */}
                <div
                    className={cn(
                        'flex flex-1 items-end justify-around border-b',
                        isSmall && 'gap-2 p-2',
                        !isSmall && !isLarge && 'gap-3 p-3',
                        isLarge && 'gap-4 p-4'
                    )}
                >
                        {channels.map(channel => (
                                <div
                                    key={channel.id}
                                    className={cn(
                                        'flex w-14 flex-col items-center',
                                        isSmall && 'gap-1 w-12',
                                        !isSmall && !isLarge && 'gap-2 w-14',
                                        isLarge && 'gap-3 w-20'
                                    )}
                                >
                                        <div className="flex flex-1 flex-col-reverse items-center">
                                                 <Slider 
                                                        value={[channel.isMuted ? 0 : channel.level]}
                                                        onValueChange={(val) => handleVolumeChange(channel.id, val)}
                                                        max={100} 
                                                        step={1} 
                                                        orientation="vertical"
                                                        className={cn(
                                                            'h-full',
                                                            isSmall && 'w-2',
                                                            !isSmall && !isLarge && 'w-3',
                                                            isLarge && 'w-4'
                                                        )}
                                                        thumbClassName={cn(
                                                            'transition-transform',
                                                            isSmall && 'h-3 w-3',
                                                            !isSmall && !isLarge && 'h-4 w-4',
                                                            isLarge && 'h-5 w-5'
                                                        )}
                                                        rangeClassName={cn(
                                                                'transition-colors duration-300',
                                                                channel.level > 80 && 'bg-red-500',
                                                                channel.level <= 80 && channel.level > 50 && 'bg-yellow-500',
                                                                channel.level <= 50 && 'bg-green-500'
                                                        )}
                                                />
                                        </div>
                                        <span
                                            className={cn(
                                                'font-bold',
                                                isSmall && 'mt-1 text-[10px]',
                                                !isSmall && !isLarge && 'mt-2 text-xs',
                                                isLarge && 'mt-3 text-sm'
                                            )}
                                        >
                                            {channel.isMuted ? '---' : `${channel.level}%`}
                                        </span>
                                         <Button 
                                                variant={channel.isMuted ? 'destructive' : 'outline'} 
                                                size="icon" 
                                                className={cn(
                                                    'rounded-full',
                                                    isSmall && 'h-7 w-7',
                                                    !isSmall && !isLarge && 'h-8 w-8',
                                                    isLarge && 'h-10 w-10'
                                                )}
                                                onClick={() => toggleMute(channel.id)}
                                        >
                                                <channel.icon className={cn(
                                                    isSmall && 'h-3 w-3',
                                                    !isSmall && !isLarge && 'h-4 w-4',
                                                    isLarge && 'h-5 w-5'
                                                )} />
                                        </Button>
                                        <span
                                            className={cn(
                                                'truncate text-center text-muted-foreground',
                                                isSmall && 'w-full text-[9px]',
                                                !isSmall && !isLarge && 'w-full text-[10px]',
                                                isLarge && 'w-full text-xs'
                                            )}
                                        >
                                            {channel.name}
                                        </span>
                                </div>
                        ))}
                </div>

                {/* Playback Control */}
                <div
                    className={cn(
                        'flex items-center',
                        isSmall && 'gap-2 p-2',
                        !isSmall && !isLarge && 'gap-3 p-3',
                        isLarge && 'gap-4 p-4'
                    )}
                >
                        <div
                            className={cn(
                                'relative flex-shrink-0 overflow-hidden rounded-md shadow-lg',
                                isSmall && 'h-10 w-10',
                                !isSmall && !isLarge && 'h-14 w-14',
                                isLarge && 'h-20 w-20'
                            )}
                        >
                                <Image src={currentTrack.albumArt} alt="Album Art" layout="fill" objectFit="cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                                <h3 className={cn(
                                    'font-bold truncate',
                                    isSmall && 'text-sm',
                                    !isSmall && !isLarge && 'text-base',
                                    isLarge && 'text-lg'
                                )}>{currentTrack.title}</h3>
                                <p className={cn(
                                    'truncate text-muted-foreground',
                                    isSmall && 'text-[10px]',
                                    !isSmall && !isLarge && 'text-sm',
                                    isLarge && 'text-base'
                                )}>{currentTrack.artist}</p>
                        </div>
                        <div className={cn(
                            'flex items-center',
                            isSmall && 'gap-1',
                            !isSmall && !isLarge && 'gap-2',
                            isLarge && 'gap-3'
                        )}>
                                 <Button variant="ghost" size="icon" className={cn(
                                    isSmall && 'h-7 w-7',
                                    !isSmall && !isLarge && 'h-8 w-8',
                                    isLarge && 'h-10 w-10'
                                 )}><SkipBack className={cn(
                                    isSmall && 'h-3 w-3',
                                    !isSmall && !isLarge && 'h-5 w-5',
                                    isLarge && 'h-6 w-6'
                                 )} /></Button>
                                <Button variant="secondary" size="icon" className={cn(
                                    'mx-1',
                                    isSmall && 'h-8 w-8',
                                    !isSmall && !isLarge && 'h-10 w-10',
                                    isLarge && 'h-12 w-12'
                                )}><Pause className={cn(
                                    isSmall && 'h-4 w-4',
                                    !isSmall && !isLarge && 'h-6 w-6',
                                    isLarge && 'h-7 w-7'
                                )} /></Button>
                                <Button variant="ghost" size="icon" className={cn(
                                    isSmall && 'h-7 w-7',
                                    !isSmall && !isLarge && 'h-8 w-8',
                                    isLarge && 'h-10 w-10'
                                )}><SkipForward className={cn(
                                    isSmall && 'h-3 w-3',
                                    !isSmall && !isLarge && 'h-5 w-5',
                                    isLarge && 'h-6 w-6'
                                )} /></Button>
                        </div>
                </div>
        </div>
    );
}
