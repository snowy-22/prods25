"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * Oynatılan öğeleri izlemek için hook
 * Video ve audio öğelerinin oynatılma durumunu takip eder
 */
export function usePlayingItems(containerSelector?: string) {
  const [playingItems, setPlayingItems] = useState<string[]>([]);

  useEffect(() => {
    // Container belirtilmişse, o container içinde oynatıcıları bul
    const container = containerSelector
      ? document.querySelector(containerSelector)
      : document;

    if (!container) return;

    // Video ve audio öğelerini bul
    const videoElements = container.querySelectorAll('video');
    const audioElements = container.querySelectorAll('audio');

    const handlePlayingChange = () => {
      const playing: string[] = [];

      // Video öğelerini kontrol et
      videoElements.forEach((video) => {
        if (!video.paused && video.dataset.itemId) {
          playing.push(video.dataset.itemId);
        }
      });

      // Audio öğelerini kontrol et
      audioElements.forEach((audio) => {
        if (!audio.paused && audio.dataset.itemId) {
          playing.push(audio.dataset.itemId);
        }
      });

      setPlayingItems(playing);
    };

    // Event listener'ları ekle
    videoElements.forEach((video) => {
      video.addEventListener('play', handlePlayingChange);
      video.addEventListener('pause', handlePlayingChange);
      video.addEventListener('ended', handlePlayingChange);
    });

    audioElements.forEach((audio) => {
      audio.addEventListener('play', handlePlayingChange);
      audio.addEventListener('pause', handlePlayingChange);
      audio.addEventListener('ended', handlePlayingChange);
    });

    // Initial check
    handlePlayingChange();

    return () => {
      // Listener'ları kaldır
      videoElements.forEach((video) => {
        video.removeEventListener('play', handlePlayingChange);
        video.removeEventListener('pause', handlePlayingChange);
        video.removeEventListener('ended', handlePlayingChange);
      });

      audioElements.forEach((audio) => {
        audio.removeEventListener('play', handlePlayingChange);
        audio.removeEventListener('pause', handlePlayingChange);
        audio.removeEventListener('ended', handlePlayingChange);
      });
    };
  }, [containerSelector]);

  return playingItems;
}

/**
 * Hareket hızını izlemek için hook
 * Fare hareketinin hızını hesaplar
 */
export function useMouseVelocity() {
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let lastPos = { x: 0, y: 0 };
    let lastTime = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = Math.max(now - lastTime, 16); // Min 16ms (60fps)

      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;

      // Hız = piksel / milisaniye
      const vx = dx / dt;
      const vy = dy / dt;

      setVelocity({ x: vx, y: vy });

      lastPos = { x: e.clientX, y: e.clientY };
      lastTime = now;
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return velocity;
}

/**
 * Etkinleştirme/devre dışı bırakma geçişleri için hook
 * Flaş efektleri oluşturur
 */
export function useToggleFlash(enabled?: boolean) {
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsFlashing(false);
      return;
    }

    // Açılırken flaş
    setIsFlashing(true);
    const timer = setTimeout(() => setIsFlashing(false), 300);

    return () => clearTimeout(timer);
  }, [enabled]);

  return isFlashing;
}
