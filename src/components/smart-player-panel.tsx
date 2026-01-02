'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ContentItem } from '@/lib/initial-content';

interface SmartPlayerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeMediaItem: ContentItem | null;
}

export function SmartPlayerPanel({ isOpen, onClose, activeMediaItem }: SmartPlayerPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    // Find video/audio element in the DOM
    const mediaElement = document.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement;
    if (!mediaElement) return;

    const updateTime = () => setCurrentTime(mediaElement.currentTime);
    const updateDuration = () => setDuration(mediaElement.duration);
    const updatePlayState = () => setIsPlaying(!mediaElement.paused);

    mediaElement.addEventListener('timeupdate', updateTime);
    mediaElement.addEventListener('durationchange', updateDuration);
    mediaElement.addEventListener('play', updatePlayState);
    mediaElement.addEventListener('pause', updatePlayState);

    // Initialize
    updateDuration();
    updatePlayState();

    return () => {
      mediaElement.removeEventListener('timeupdate', updateTime);
      mediaElement.removeEventListener('durationchange', updateDuration);
      mediaElement.removeEventListener('play', updatePlayState);
      mediaElement.removeEventListener('pause', updatePlayState);
    };
  }, [isOpen]);

  const handlePlayPause = () => {
    const mediaElement = document.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement;
    if (!mediaElement) return;

    if (mediaElement.paused) {
      mediaElement.play();
    } else {
      mediaElement.pause();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    const mediaElement = document.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement;
    if (mediaElement) {
      mediaElement.volume = value[0] / 100;
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    const mediaElement = document.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement;
    if (mediaElement) {
      mediaElement.muted = !isMuted;
    }
  };

  const handleSeek = (value: number[]) => {
    const mediaElement = document.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement;
    if (mediaElement) {
      mediaElement.currentTime = value[0];
    }
  };

  const handleSkipBack = () => {
    const mediaElement = document.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement;
    if (mediaElement) {
      mediaElement.currentTime = Math.max(0, mediaElement.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    const mediaElement = document.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement;
    if (mediaElement) {
      mediaElement.currentTime = Math.min(mediaElement.duration, mediaElement.currentTime + 10);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    const mediaElement = document.querySelector('video, audio') as HTMLVideoElement | HTMLAudioElement;
    if (mediaElement) {
      mediaElement.playbackRate = speed;
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-16 bottom-0 w-80 bg-slate-900/95 backdrop-blur-lg border-l border-slate-700/50 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Play className="w-4 h-4" />
              Akıllı Oynatıcı
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Media Info */}
          {activeMediaItem && (
            <div className="p-4 border-b border-slate-700/50">
              <div className="aspect-video bg-slate-800 rounded-lg mb-3 overflow-hidden">
                {activeMediaItem.thumbnail_url && (
                  <img
                    src={activeMediaItem.thumbnail_url}
                    alt={activeMediaItem.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <h4 className="font-medium text-white text-sm mb-1 truncate">
                {activeMediaItem.title}
              </h4>
              {activeMediaItem.author_name && (
                <p className="text-xs text-slate-400 truncate">{activeMediaItem.author_name}</p>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex-1 p-4 space-y-6">
            {/* Timeline */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Play Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipBack}
                className="text-slate-400 hover:text-white"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                onClick={handlePlayPause}
                className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipForward}
                className="text-slate-400 hover:text-white"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMuteToggle}
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Slider
                  value={volume}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />
                <span className="text-xs text-slate-400 w-10 text-right">{volume[0]}%</span>
              </div>
            </div>

            {/* Playback Speed */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Oynatma Hızı</label>
              <div className="grid grid-cols-5 gap-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                  <Button
                    key={speed}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSpeedChange(speed)}
                    className={cn(
                      'text-xs h-8',
                      playbackRate === speed
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-700/50 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Maximize2 className="w-4 h-4 mr-2" />
              Tam Ekran
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              Ayarlar
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
