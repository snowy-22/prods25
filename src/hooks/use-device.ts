
"use client";

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type OsType = 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS' | 'Unknown';
export type BrowserType = 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'Unknown';

export type DeviceInfo = {
    type: DeviceType;
    os: OsType;
    browser: BrowserType;
};

const breakpoints = {
  mobile: 768,
  tablet: 1024,
};

const isClient = typeof window === 'object';

// Helper function to parse the user agent string as a fallback
function parseUserAgent(ua: string): { os: OsType; browser: BrowserType } {
    let os: OsType = 'Unknown';
    let browser: BrowserType = 'Unknown';

    // OS detection
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

    // Browser detection
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/OPR/i.test(ua)) browser = 'Opera';
    
    return { os, browser };
}

async function getDeviceInfo(): Promise<DeviceInfo> {
    if (!isClient) {
        return { type: 'desktop', os: 'Unknown', browser: 'Unknown' };
    }

    let os: OsType = 'Unknown';
    let browser: BrowserType = 'Unknown';
    let type: DeviceType;

    // Use the modern userAgentData API if available
    if ('userAgentData' in navigator && (navigator as any).userAgentData) {
        const uaData = (navigator as any).userAgentData;
        const platformInfo = await uaData.getHighEntropyValues(['platform', 'platformVersion']);
        
        os = platformInfo.platform as OsType || 'Unknown';
        
        const brand = (uaData.brands as any[]).find(b => b.brand !== "Not A;Brand");
        browser = brand ? brand.brand as BrowserType : 'Unknown';
        type = uaData.mobile ? 'mobile' : 'desktop';
    } else {
        // Fallback to parsing the user agent string for older browsers
        const fallbackInfo = parseUserAgent(navigator.userAgent);
        os = fallbackInfo.os;
        browser = fallbackInfo.browser;
    }

    // Determine device type based on window width as a final check
    if (window.innerWidth < breakpoints.mobile) type = 'mobile';
    else if (window.innerWidth < breakpoints.tablet) type = 'tablet';
    else type = 'desktop';

    return { type, os, browser };
}

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
      type: 'desktop', os: 'Unknown', browser: 'Unknown'
  });

  useEffect(() => {
    if (!isClient) return;

    const updateDeviceInfo = async () => {
        const info = await getDeviceInfo();
        setDeviceInfo(info);
    };
    
    const handleResize = () => {
       updateDeviceInfo();
    };

    updateDeviceInfo(); // Initial call
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}
