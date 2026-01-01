'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Button } from './ui/button';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

interface ContentGroupPlayerProps {
  items: ContentItem[];
  isActive: boolean;
  onItemClick: (item: ContentItem) => void;
}

export function ContentGroupPlayer({ items, isActive, onItemClick }: ContentGroupPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [allMuted, setAllMuted] = useState(true);
  const [volume, setVolume] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Auto-play videos when folder opens
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const videos = containerRef.current.querySelectorAll('video');
    videosRef.current.clear();

    videos.forEach((video, idx) => {
      const itemId = video.getAttribute('data-item-id') || `video-${idx}`;
      videosRef.current.set(itemId, video);

      // Set initial state
      video.muted = allMuted;
      video.volume = volume;
      video.controls = true;

      // Auto-play with fallback
      if (isPlaying) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Video autoplay prevented:', error);
            // Show play button
            const playButton = document.createElement('button');
            playButton.className = cn(
              'absolute inset-0 m-auto w-12 h-12',
              'bg-black/50 hover:bg-black/70 rounded-full',
              'flex items-center justify-center transition-colors',
              'text-white'
            );
            playButton.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
            playButton.onclick = (e) => {
              e.preventDefault();
              video.play();
            };
            if (video.parentElement) {
              video.parentElement.style.position = 'relative';
              video.parentElement.appendChild(playButton);
            }
          });
        }
      }
    });
  }, [isActive, containerRef, allMuted, volume, isPlaying]);

  const handleMuteToggle = () => {
    const newMuted = !allMuted;
    setAllMuted(newMuted);

    videosRef.current.forEach(video => {
      video.muted = newMuted;
    });
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    videosRef.current.forEach(video => {
      video.volume = newVolume;
    });
  };

  const handlePlayPauseToggle = () => {
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);

    videosRef.current.forEach(video => {
      if (newPlaying) {
        video.play().catch(e => console.warn('Cannot play:', e));
      } else {
        video.pause();
      }
    });
  };

  if (items.length === 0) return null;

  const videoCount = items.filter(
    item => ['video', 'youtube', 'vimeo', 'iframe'].includes(item.type)
  ).length;

  if (videoCount === 0) return null;

  return (
    <>
      {/* Content Container */}
      <div ref={containerRef} className="contents">
        {/* Content rendered here via parent */}
      </div>

      {/* Video Controls Bar */}
      {videoCount > 0 && isActive && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom">
          {/* Video Count */}
          <span className="text-xs text-white font-semibold whitespace-nowrap">
            {videoCount} video
          </span>

          {/* Play/Pause Button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
            onClick={handlePlayPauseToggle}
            title={isPlaying ? 'Duraklat' : 'Oynat'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {/* Mute Button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
            onClick={handleMuteToggle}
            title={allMuted ? 'Sesi Aç' : 'Sustur'}
          >
            {allMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          {/* Volume Slider */}
          {!allMuted && (
            <div className="flex items-center gap-2 w-32">
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) => handleVolumeChange(v / 100)}
                className="flex-1"
              />
              <span className="text-xs text-white w-6 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}

          {/* Close Button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
            onClick={() => {
              // Pause all videos
              videosRef.current.forEach(video => video.pause());
            }}
            title="Kapat"
          >
            ✕
          </Button>
        </div>
      )}
    </>
  );
}

// Hook for managing auto-play videos in folders
export function useContentGroupAutoPlay(
  containerRef: React.RefObject<HTMLDivElement>,
  isActive: boolean,
  autoPlayOptions = { autoPlay: true, muted: true }
) {
  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const videos = containerRef.current.querySelectorAll('video');
    videosRef.current.clear();

    videos.forEach((video, idx) => {
      const itemId = video.getAttribute('data-item-id') || `video-${idx}`;
      videosRef.current.set(itemId, video);

      // Apply settings
      video.muted = autoPlayOptions.muted;
      video.controls = true;

      // Auto-play if enabled
      if (autoPlayOptions.autoPlay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Video autoplay prevented:', error);
          });
        }
      }
    });

    return () => {
      // Cleanup
      videosRef.current.forEach(video => {
        video.pause();
        video.currentTime = 0;
      });
    };
  }, [isActive, containerRef, autoPlayOptions]);

  return {
    videosRef,
    pauseAll: () => videosRef.current.forEach(v => v.pause()),
    playAll: () => videosRef.current.forEach(v => v.play().catch(e => console.warn('Cannot play:', e))),
    muteAll: () => videosRef.current.forEach(v => v.muted = true),
    unmuteAll: () => videosRef.current.forEach(v => v.muted = false),
    count: videosRef.current.size
  };
}
