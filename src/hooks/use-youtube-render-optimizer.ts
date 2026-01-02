/**
 * YouTube Render Size Optimizer Hook
 * YouTube öğelerini +%40 ek alanla render etme ve background tab playback
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ContentItem } from '@/lib/initial-content';

export interface YoutubeRenderConfig {
  baseSize: { width: number; height: number };
  extraSize: number; // 0.4 = %40 extra
  muteOnInit: boolean;
  muteOnBackgroundTab: boolean;
  playInBackground: boolean;
}

const DEFAULT_CONFIG: YoutubeRenderConfig = {
  baseSize: { width: 560, height: 315 },
  extraSize: 0.4, // %40 extra
  muteOnInit: true,
  muteOnBackgroundTab: true,
  playInBackground: true,
};

/**
 * YouTube playerlarını kontrol etmek için hook
 */
export function useYoutubeRenderOptimizer(config: Partial<YoutubeRenderConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const playerRefsMap = useRef<Map<string, YT.Player>>(new Map());
  const isPageVisibleRef = useRef(true);

  // Sayfa görünürlüğü değişimini izle
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isPageVisibleRef.current = isVisible;

      if (mergedConfig.muteOnBackgroundTab) {
        // Sayfaya dönüş: tüm playerları sesini aç
        if (isVisible) {
          playerRefsMap.current.forEach((player) => {
            if (player && typeof player.unMute === 'function') {
              player.unMute();
            }
          });
        } else {
          // Sayfadan ayrıl: tüm playerları sesini kapat
          playerRefsMap.current.forEach((player) => {
            if (player && typeof player.mute === 'function') {
              player.mute();
            }
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mergedConfig.muteOnBackgroundTab]);

  // Optimized boyut hesapla
  const getOptimizedSize = useCallback((baseSize?: { width: number; height: number }) => {
    const size = baseSize || mergedConfig.baseSize;
    const multiplier = 1 + mergedConfig.extraSize;
    return {
      width: Math.round(size.width * multiplier),
      height: Math.round(size.height * multiplier),
    };
  }, [mergedConfig.baseSize, mergedConfig.extraSize]);

  // Player kaydını yap
  const registerPlayer = useCallback((id: string, player: YT.Player) => {
    playerRefsMap.current.set(id, player);

    // Initialize mute ayarı
    if (mergedConfig.muteOnInit) {
      if (typeof player.mute === 'function') {
        player.mute();
      }
    }

    // Background tab'da player varsa kontrol et
    if (!isPageVisibleRef.current && mergedConfig.muteOnBackgroundTab) {
      if (typeof player.mute === 'function') {
        player.mute();
      }
    }
  }, [mergedConfig.muteOnInit, mergedConfig.muteOnBackgroundTab]);

  // Player kayıt sil
  const unregisterPlayer = useCallback((id: string) => {
    playerRefsMap.current.delete(id);
  }, []);

  // Tüm playerları kontrol et
  const controlAllPlayers = useCallback((action: 'play' | 'pause' | 'mute' | 'unmute') => {
    playerRefsMap.current.forEach((player) => {
      if (!player) return;

      switch (action) {
        case 'play':
          if (typeof player.playVideo === 'function') player.playVideo();
          break;
        case 'pause':
          if (typeof player.pauseVideo === 'function') player.pauseVideo();
          break;
        case 'mute':
          if (typeof player.mute === 'function') player.mute();
          break;
        case 'unmute':
          if (typeof player.unMute === 'function') player.unMute();
          break;
      }
    });
  }, []);

  // Volume kontrol
  const setVolumeForAll = useCallback((volume: number) => {
    // Sessize almamız gerekiyorsa
    if (volume === 0) {
      controlAllPlayers('mute');
    } else {
      controlAllPlayers('unmute');
      playerRefsMap.current.forEach((player) => {
        if (player && typeof player.setVolume === 'function') {
          player.setVolume(Math.min(100, Math.max(0, volume)));
        }
      });
    }
  }, [controlAllPlayers]);

  // Aktif player sayısı
  const getActivePlayerCount = useCallback(() => {
    return playerRefsMap.current.size;
  }, []);

  return {
    getOptimizedSize,
    registerPlayer,
    unregisterPlayer,
    controlAllPlayers,
    setVolumeForAll,
    getActivePlayerCount,
    config: mergedConfig,
    playerRefsMap,
  };
}

/**
 * YouTube iframe boyutlandırma helper
 */
export function getYoutubeIframeSize(extraPercent: number = 40) {
  const baseWidth = 560;
  const baseHeight = 315;
  const multiplier = 1 + extraPercent / 100;

  return {
    width: Math.round(baseWidth * multiplier),
    height: Math.round(baseHeight * multiplier),
  };
}

/**
 * YouTube URL'den video ID çıkar
 */
export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * ContentItem'i YouTube player için hazırla
 */
export function prepareYoutubeItem(item: ContentItem, extraSize: number = 0.4) {
  if (!item.url || !['video', 'website'].includes(item.type)) {
    return item;
  }

  const videoId = extractYoutubeVideoId(item.url);
  if (!videoId) {
    return item;
  }

  const size = getYoutubeIframeSize((extraSize * 100) || 40);

  return {
    ...item,
    width: size.width,
    height: size.height,
  };
}

/**
 * Mute edilmiş YouTube iframe HTML oluştur
 */
export function createMutedYoutubeIframe(
  videoId: string,
  width: number = 560,
  height: number = 315,
  options?: {
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
  }
): string {
  const {
    autoplay = false,
    controls = true,
    loop = false,
  } = options || {};

  const params = [
    'mute=1', // Mute yap
    autoplay ? 'autoplay=1' : 'autoplay=0',
    controls ? 'controls=1' : 'controls=0',
    loop ? 'loop=1' : 'loop=0',
    'modestbranding=1', // YouTube branding kaldır
    'rel=0', // İlgili videoları gösterme
    'fs=1', // Fullscreen izin ver
  ].join('&');

  return `<iframe
    width="${width}"
    height="${height}"
    src="https://www.youtube.com/embed/${videoId}?${params}"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  ></iframe>`;
}

/**
 * Preview render optimization
 * Yeni render yaratmadan mevcut olanı büyüt
 */
export function optimizePreviewRender(
  containerElement: HTMLElement,
  targetSize: { width: number; height: number },
  options?: {
    duration?: number; // Animation duration (ms)
    smooth?: boolean; // Smooth animation
  }
) {
  const {
    duration = 300,
    smooth = true,
  } = options || {};

  if (!containerElement) return;

  // Mevcut iframe'i bul
  const iframe = containerElement.querySelector('iframe');
  if (!iframe) return;

  // CSS transition ekle
  if (smooth) {
    iframe.style.transition = `all ${duration}ms ease-in-out`;
  }

  // Boyutu güncelle
  iframe.style.width = `${targetSize.width}px`;
  iframe.style.height = `${targetSize.height}px`;

  // Container'ı da güncelle
  containerElement.style.width = `${targetSize.width}px`;
  containerElement.style.height = `${targetSize.height}px`;
}
