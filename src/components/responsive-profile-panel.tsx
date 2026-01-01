'use client';

import React, { useEffect, useState } from 'react';
import { ProfilePage } from './profile-page';
import { ContentItem } from '@/lib/initial-content';
import { useAppStore } from '@/lib/store';

interface ResponsiveProfilePanelProps {
  userId: string;
  onClose?: () => void;
  isMobile?: boolean;
}

export function ResponsiveProfilePanel({
  userId,
  onClose,
  isMobile: _isMobile
}: ResponsiveProfilePanelProps) {
  const [isMobile, setIsMobile] = useState(_isMobile ?? false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile: open in canvas mode
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <ProfilePage userId={userId} onClose={onClose} />
      </div>
    );
  }

  // Desktop: open in right panel
  return (
    <div className="h-full flex flex-col bg-background border-l">
      <ProfilePage userId={userId} onClose={onClose} />
    </div>
  );
}

// Hook to open profile in responsive way
export function useResponsiveProfilePanel() {
  const { setActiveSecondaryPanel, togglePanel } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openProfile = (userId: string) => {
    if (isMobile) {
      // Mobile: open in full canvas
      // Store the profile ID in app state or navigation
      setActiveSecondaryPanel(null); // Close other panels
      // You can emit custom event or use routing
    } else {
      // Desktop: open in right panel
      setActiveSecondaryPanel('ai-chat'); // Reuse secondary panel
      togglePanel('isSecondLeftSidebarOpen', true);
    }
  };

  return { openProfile, isMobile };
}
