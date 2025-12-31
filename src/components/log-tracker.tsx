'use client';

import { useEffect, useRef } from 'react';
import { getDeviceInfo, capturePerformanceMetrics } from '@/lib/metrics';

export function LogTracker() {
  const hasLogged = useRef(false);

  useEffect(() => {
    if (hasLogged.current) return;
    hasLogged.current = true;

    const trackInitialLoad = async () => {
      const deviceInfo = getDeviceInfo();
      const performanceMetrics = capturePerformanceMetrics();
      
      // Bu değerler normalde uygulama içindeki gerçek olaylardan (event) beslenmelidir.
      // Örnek olarak rastgele değerler atanmıştır.
      const foldersOpenTime = Math.floor(Math.random() * 500) + 200;
      const personalFoldersLoadTime = Math.floor(Math.random() * 1000) + 1000;

      const logData = {
        event_type: 'initial_load',
        loading_time_ms: Math.round(performanceMetrics.loadingTime),
        folders_open_time_ms: foldersOpenTime,
        personal_folders_load_time_ms: personalFoldersLoadTime,
        device_info: deviceInfo,
        created_at: new Date().toISOString(),
      };

      if (process.env.NODE_ENV === 'development') {
        console.debug('Interaction Logged:', logData);
      }

      // Supabase entegrasyonu yapıldığında buraya insert kodu eklenebilir:
      /*
      const { error } = await supabase
        .from('logs')
        .insert([logData]);
      */
    };

    if (document.readyState === 'complete') {
      trackInitialLoad();
    } else {
      window.addEventListener('load', trackInitialLoad);
      return () => window.removeEventListener('load', trackInitialLoad);
    }
  }, []);

  return null;
}
