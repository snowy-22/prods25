/**
 * Mobil cihazlarda landscape modda otomatik tam ekran ve tarayıcı çubuğu gizleme
 */
import { useEffect } from 'react';

export function useFullscreenLandscape() {
  useEffect(() => {
    // Sadece mobil cihazlarda çalışsın
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    let isFullscreen = false;

    const handleOrientationChange = async () => {
      // Landscape modda mı?
      const isLandscape = 
        window.matchMedia('(orientation: landscape)').matches ||
        (window.innerWidth > window.innerHeight);

      if (isLandscape && !isFullscreen) {
        try {
          // 1. Fullscreen API ile tam ekrana geç
          const docElement = document.documentElement;
          if (docElement.requestFullscreen) {
            await docElement.requestFullscreen().catch(() => {});
          } else if ((docElement as any).webkitRequestFullscreen) {
            // iOS Safari
            await (docElement as any).webkitRequestFullscreen().catch(() => {});
          } else if ((docElement as any).mozRequestFullScreen) {
            // Firefox
            await (docElement as any).mozRequestFullScreen().catch(() => {});
          } else if ((docElement as any).msRequestFullscreen) {
            // IE/Edge
            await (docElement as any).msRequestFullscreen().catch(() => {});
          }
          
          isFullscreen = true;
        } catch (error) {
          console.log('Fullscreen API not available, using fallback');
        }

        // 2. Safari için adres çubuğunu gizle
        setTimeout(() => {
          window.scrollTo(0, 1);
          document.body.scrollTop = 1;
        }, 100);

        // 3. Body'ye tam ekran class ekle
        document.body.classList.add('landscape-fullscreen');
        
        // 4. Viewport height düzeltmesi
        updateViewportHeight();
      } else if (!isLandscape && isFullscreen) {
        // Portrait'e dönünce tam ekrandan çık
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen().catch(() => {});
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen().catch(() => {});
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen().catch(() => {});
          }
          
          isFullscreen = false;
        } catch (error) {
          console.log('Exit fullscreen error');
        }

        document.body.classList.remove('landscape-fullscreen');
      }
    };

    // Viewport height'i dinamik olarak güncelle (iOS Safari için)
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Event listener'ları ekle
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('resize', updateViewportHeight);
    
    // İlk yükleme
    handleOrientationChange();
    updateViewportHeight();

    // Cleanup
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('resize', updateViewportHeight);
      document.body.classList.remove('landscape-fullscreen');
    };
  }, []);
}
