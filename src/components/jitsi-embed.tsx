"use client";

import React, { useEffect, useRef } from 'react';

type JitsiEmbedProps = {
  roomName: string;
  userName?: string;
  onReady?: () => void;
  onEnd?: () => void;
  width?: string | number;
  height?: string | number;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export function JitsiEmbed({
  roomName,
  userName,
  onReady,
  onEnd,
  width = '100%',
  height = 520,
}: JitsiEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) return resolve();
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Jitsi API yüklenemedi'));
        document.body.appendChild(script);
      });

    const init = async () => {
      await loadScript();
      if (disposed || !containerRef.current) return;

      const domain = 'meet.jit.si';
      const options = {
        roomName,
        parentNode: containerRef.current,
        width,
        height,
        userInfo: userName ? { displayName: userName } : undefined,
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
        },
      } as any;

      const api = new window.JitsiMeetExternalAPI!(domain, options);
      apiRef.current = api;

      api.addListener('videoConferenceJoined', () => onReady?.());
      api.addListener('readyToClose', () => {
        onEnd?.();
      });
    };

    init();

    return () => {
      disposed = true;
      try {
        apiRef.current?.dispose?.();
      } catch {}
    };
  }, [roomName, userName, width, height, onReady, onEnd]);

  return <div ref={containerRef} style={{ width, height, borderRadius: 8, overflow: 'hidden' }} />;
}

export default JitsiEmbed;
