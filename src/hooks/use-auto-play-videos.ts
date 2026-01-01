'use client';

import { useEffect, useRef } from 'react';
import { ContentItem } from '@/lib/initial-content';

export interface VideoAutoPlayOptions {
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  volume?: number;
}

// Hook for auto-playing videos in folders
export function useAutoPlayVideos(
  containerRef: React.RefObject<HTMLDivElement>,
  isActive: boolean,
  options: VideoAutoPlayOptions = { autoPlay: true, muted: true }
) {
  const videosRef = useRef<HTMLVideoElement[]>([]);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Find all video elements
    const videos = containerRef.current.querySelectorAll('video');
    videosRef.current = Array.from(videos);

    // Apply settings and start playing
    videosRef.current.forEach(video => {
      video.muted = options.muted ?? true;
      video.controls = options.controls ?? true;
      video.loop = options.loop ?? false;
      
      if (options.volume !== undefined) {
        video.volume = Math.max(0, Math.min(1, options.volume));
      }

      // Auto-play if specified
      if (options.autoPlay) {
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Video autoplay prevented:', error);
            // Fallback: show play button
            video.controls = true;
          });
        }
      }
    });

    return () => {
      // Cleanup: pause videos when unmounting
      videosRef.current.forEach(video => {
        video.pause();
        video.currentTime = 0;
      });
    };
  }, [containerRef, isActive, options]);

  // Control functions
  const playAll = () => {
    videosRef.current.forEach(video => {
      video.play().catch(e => console.warn('Cannot play video:', e));
    });
  };

  const pauseAll = () => {
    videosRef.current.forEach(video => video.pause());
  };

  const muteAll = () => {
    videosRef.current.forEach(video => video.muted = true);
  };

  const unmuteAll = () => {
    videosRef.current.forEach(video => video.muted = false);
  };

  const setVolume = (volume: number) => {
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    videosRef.current.forEach(video => video.volume = normalizedVolume);
  };

  return {
    videosRef,
    playAll,
    pauseAll,
    muteAll,
    unmuteAll,
    setVolume,
    videoCount: videosRef.current.length
  };
}

// Detect if item is a video
export function isVideoItem(item: ContentItem): boolean {
  const videoTypes = ['video', 'youtube', 'vimeo', 'twitch', 'stream'];
  return videoTypes.includes(item.type);
}

// Detect if item is a folder with videos
export function isFolderWithVideos(item: ContentItem): boolean {
  if (item.type !== 'folder') return false;
  
  const title = item.title?.toLowerCase() || '';
  const videoFolderPatterns = ['video', 'filme', 'medya', 'müzik', 'podcast'];
  
  return videoFolderPatterns.some(pattern => title.includes(pattern));
}

// Extract video URL from item
export function getVideoUrl(item: ContentItem): string | null {
  if (!isVideoItem(item)) return null;

  // Direct video URL
  if (item.url) return item.url;

  // YouTube URL extraction
  if (item.type === 'youtube' && item.content) {
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = item.content.match(youtubeRegex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  return null;
}

// Get video metadata
export function getVideoMetadata(item: ContentItem) {
  return {
    title: item.title,
    duration: (item.metadata as any)?.duration,
    thumbnail: item.thumbnail_url,
    views: item.view_count,
    likes: item.like_count,
    author: item.author_name
  };
}
