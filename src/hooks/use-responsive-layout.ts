import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface ResponsiveLayout {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  windowWidth: number;
  windowHeight: number;
  isTouchDevice: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>({
    breakpoint: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWide: false,
    windowWidth: 0,
    windowHeight: 0,
    isTouchDevice: false,
    isPortrait: false,
    isLandscape: false,
  });

  useEffect(() => {
    // Detect touch device
    const isTouchDevice = () => {
      return (
        (typeof window !== 'undefined' &&
          ('ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0)) ||
        false
      );
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouch = isTouchDevice();

      let breakpoint: Breakpoint = 'desktop';
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;
      let isWide = false;

      if (width < 640) {
        breakpoint = 'mobile';
        isMobile = true;
      } else if (width < 1024) {
        breakpoint = 'tablet';
        isTablet = true;
      } else if (width < 1280) {
        breakpoint = 'desktop';
        isDesktop = true;
      } else {
        breakpoint = 'wide';
        isWide = true;
      }

      const isPortrait = height > width;
      const isLandscape = width > height;

      setLayout({
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        isWide,
        windowWidth: width,
        windowHeight: height,
        isTouchDevice: isTouch,
        isPortrait,
        isLandscape,
      });
    };

    // Initial call
    handleResize();

    // Add listener
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return layout;
}

// Helper hook for sidebar state management on mobile
export function useResponsiveSidebar() {
  const layout = useResponsiveLayout();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!layout.isMobile);

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (layout.isMobile) {
      setIsSidebarOpen(false);
    }
  }, [layout.isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  return {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    shouldShowSidebar: layout.isDesktop || layout.isWide || isSidebarOpen,
    ...layout,
  };
}
