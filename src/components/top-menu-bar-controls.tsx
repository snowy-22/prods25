/**
 * Top Menu Bar Controls
 * Toplu oynatıcı kontrolleri
 */

'use client';

import React, { useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
} from 'lucide-react';

interface PlayerControl {
  id: string;
  type: 'play' | 'pause' | 'mute' | 'unmute' | 'volume' | 'skip' | 'repeat';
  targetId?: string; // Specific player
}

interface TopMenuBarControlsProps {
  onPlayAll?: () => void;
  onPauseAll?: () => void;
  onMuteAll?: () => void;
  onUnmuteAll?: () => void;
  onVolumeChange?: (volume: number) => void;
  onSkipNext?: () => void;
  onSkipPrev?: () => void;
  activePlayersCount?: number;
  currentVolume?: number;
  isMuted?: boolean;
}

export function TopMenuBarControls({
  onPlayAll,
  onPauseAll,
  onMuteAll,
  onUnmuteAll,
  onVolumeChange,
  onSkipNext,
  onSkipPrev,
  activePlayersCount = 0,
  currentVolume = 50,
  isMuted = false,
}: TopMenuBarControlsProps) {
  const { toast } = useToast();
  const [localVolume, setLocalVolume] = React.useState(currentVolume);

  const handlePlayAll = useCallback(() => {
    onPlayAll?.();
    toast({
      title: `${activePlayersCount} oynatıcı oynatılıyor`,
      description: 'Tüm video ve ses dosyaları başlatıldı',
    });
  }, [onPlayAll, activePlayersCount, toast]);

  const handlePauseAll = useCallback(() => {
    onPauseAll?.();
    toast({
      title: 'Tüm oynatıcılar duraklatıldı',
    });
  }, [onPauseAll, toast]);

  const handleMuteAll = useCallback(() => {
    onMuteAll?.();
    toast({
      title: 'Tüm oynatıcılar sessiz',
      duration: 1000,
    });
  }, [onMuteAll, toast]);

  const handleUnmuteAll = useCallback(() => {
    onUnmuteAll?.();
    toast({
      title: 'Tüm oynatıcılar sesi açık',
      duration: 1000,
    });
  }, [onUnmuteAll, toast]);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setLocalVolume(newVolume);
    onVolumeChange?.(newVolume);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
      {/* Play/Pause Controls */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePlayAll}
          disabled={activePlayersCount === 0}
          className="flex items-center gap-2"
          title="Tüm oynatıcıları oynat (Ctrl+Space)"
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePauseAll}
          disabled={activePlayersCount === 0}
          className="flex items-center gap-2"
          title="Tüm oynatıcıları duraklat (Ctrl+Shift+Space)"
        >
          <Pause className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* Skip Controls */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onSkipPrev}
          disabled={activePlayersCount === 0}
          className="flex items-center gap-2"
          title="Önceki (Ctrl+,)"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onSkipNext}
          disabled={activePlayersCount === 0}
          className="flex items-center gap-2"
          title="Sonraki (Ctrl+.)"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* Mute Controls & Volume */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={activePlayersCount === 0}
            className="flex items-center gap-2"
            title="Ses kontrolleri"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span className="text-xs w-8">{localVolume}%</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* Volume Slider */}
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ses Seviyesi</span>
              <span className="text-sm text-gray-500">{localVolume}%</span>
            </div>
            <Slider
              value={[localVolume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <DropdownMenuSeparator />

          {/* Mute/Unmute */}
          {isMuted ? (
            <DropdownMenuItem onClick={handleUnmuteAll}>
              <Volume2 className="h-4 w-4 mr-2" />
              <span>Sesi Aç</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleMuteAll}>
              <VolumeX className="h-4 w-4 mr-2" />
              <span>Sesi Kapat</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Quick presets */}
          <div className="px-4 py-1.5">
            <p className="text-xs font-semibold text-gray-500 mb-2">Hızlı Ayarlar</p>
          </div>

          <DropdownMenuItem onClick={() => handleVolumeChange([0])}>
            <span className="text-xs">Sessiz</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleVolumeChange([25])}>
            <span className="text-xs">Düşük</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleVolumeChange([50])}>
            <span className="text-xs">Orta</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleVolumeChange([75])}>
            <span className="text-xs">Yüksek</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleVolumeChange([100])}>
            <span className="text-xs">Maksimum</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-6 w-px bg-gray-300" />

      {/* Advanced Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            <span className="text-xs">Seçenekler</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePlayAll} disabled={activePlayersCount === 0}>
            <Play className="h-4 w-4 mr-2" />
            <span>Tümünü Oynat</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handlePauseAll} disabled={activePlayersCount === 0}>
            <Pause className="h-4 w-4 mr-2" />
            <span>Tümünü Duraklat</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleMuteAll} disabled={activePlayersCount === 0}>
            <VolumeX className="h-4 w-4 mr-2" />
            <span>Tümünü Sessize Al</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleUnmuteAll} disabled={activePlayersCount === 0}>
            <Volume2 className="h-4 w-4 mr-2" />
            <span>Tümünün Sesini Aç</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-gray-500">Durum</p>
          </div>

          <DropdownMenuItem disabled>
            <span className="text-xs">
              Aktif Oynatıcılar: {activePlayersCount}
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem disabled>
            <span className="text-xs">
              Ses: {isMuted ? 'Sessiz' : `${localVolume}%`}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Display */}
      <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
        {activePlayersCount > 0 && (
          <>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>{activePlayersCount} oynatıcı aktif</span>
          </>
        )}
      </div>
    </div>
  );
}
