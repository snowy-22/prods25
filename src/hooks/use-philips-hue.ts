/**
 * usePhilipsHue Hook
 * Philips Hue ışıklarını kontrol etmek için
 */

import { useState, useEffect, useCallback } from 'react';

export interface HueLight {
  id: string;
  name: string;
  state: {
    on: boolean;
    bri?: number;
    hue?: number;
    sat?: number;
  };
  type: string;
}

export interface HueGroup {
  id: string;
  name: string;
  lights: string[];
  state: {
    on: boolean;
    bri?: number;
  };
}

export interface HueStatus {
  connected: boolean;
  lights: HueLight[];
  groups: HueGroup[];
  loading: boolean;
  error: string | null;
}

export function usePhilipsHue() {
  const [status, setStatus] = useState<HueStatus>({
    connected: false,
    lights: [],
    groups: [],
    loading: true,
    error: null,
  });

  // Durum yenile
  const refresh = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/hue');
      if (!response.ok) {
        throw new Error('Hue Bridge\'e bağlanılamıyor');
      }

      const data = await response.json();
      setStatus({
        connected: data.connected,
        lights: data.lights,
        groups: data.groups,
        loading: false,
        error: null,
      });
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      }));
    }
  }, []);

  // İlk yükleme
  useEffect(() => {
    refresh();
    // 30 saniyede bir yenile
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Işığı aç/kapat
  const toggleLight = useCallback(async (lightId: string, on: boolean) => {
    try {
      const response = await fetch('/api/hue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lightId,
          action: 'toggle',
          on,
        }),
      });

      if (!response.ok) {
        throw new Error('İşık kontrol hatası');
      }

      // Lokal state'i güncelle (optimistic update)
      setStatus(prev => ({
        ...prev,
        lights: prev.lights.map(light =>
          light.id === lightId ? { ...light, state: { ...light.state, on } } : light
        ),
      }));
    } catch (error) {
      console.error('Toggle light hatası:', error);
    }
  }, []);

  // Parlaklık değiştir
  const setBrightness = useCallback(
    async (lightId: string, brightness: number) => {
      try {
        const response = await fetch('/api/hue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lightId,
            action: 'brightness',
            brightness,
          }),
        });

        if (!response.ok) {
          throw new Error('Parlaklık değiştirme hatası');
        }

        // Lokal state'i güncelle
        setStatus(prev => ({
          ...prev,
          lights: prev.lights.map(light =>
            light.id === lightId
              ? { ...light, state: { ...light.state, on: brightness > 0, bri: brightness } }
              : light
          ),
        }));
      } catch (error) {
        console.error('Set brightness hatası:', error);
      }
    },
    []
  );

  // Renk değiştir
  const setColor = useCallback(
    async (lightId: string, hue: number, saturation: number = 200) => {
      try {
        const response = await fetch('/api/hue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lightId,
            action: 'color',
            hue,
            saturation,
          }),
        });

        if (!response.ok) {
          throw new Error('Renk değiştirme hatası');
        }

        // Lokal state'i güncelle
        setStatus(prev => ({
          ...prev,
          lights: prev.lights.map(light =>
            light.id === lightId
              ? {
                  ...light,
                  state: { ...light.state, on: true, hue, sat: saturation },
                }
              : light
          ),
        }));
      } catch (error) {
        console.error('Set color hatası:', error);
      }
    },
    []
  );

  return {
    ...status,
    refresh,
    toggleLight,
    setBrightness,
    setColor,
  };
}
