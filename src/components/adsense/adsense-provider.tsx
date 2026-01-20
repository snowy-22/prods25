'use client';

import Script from 'next/script';
import { createContext, useContext, ReactNode } from 'react';

// Google AdSense Publisher ID
const ADSENSE_CLIENT_ID = 'ca-pub-9227909707622616';

interface AdSenseContextType {
  clientId: string;
  isEnabled: boolean;
}

const AdSenseContext = createContext<AdSenseContextType>({
  clientId: ADSENSE_CLIENT_ID,
  isEnabled: true,
});

export function useAdSense() {
  return useContext(AdSenseContext);
}

interface AdSenseProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function AdSenseProvider({ children, enabled = true }: AdSenseProviderProps) {
  return (
    <AdSenseContext.Provider value={{ clientId: ADSENSE_CLIENT_ID, isEnabled: enabled }}>
      {enabled && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
      {children}
    </AdSenseContext.Provider>
  );
}
