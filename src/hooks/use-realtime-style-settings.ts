/**
 * Realtime Style Settings Synchronization
 * Instantly sync style changes to database
 */

import { useEffect, useRef } from 'react';
import { useToast } from './use-toast';

export interface ItemStyleSettings {
  border?: string;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  opacity?: number;
  shadow?: string;
  borderRadius?: number;
  transform?: string;
  filter?: string;
  animation?: string;
  theme?: 'light' | 'dark' | 'auto';
  frameStyle?: 'none' | 'rounded' | 'shadow' | 'gradient' | 'glass';
}

interface StyleSyncOptions {
  debounceMs?: number;
  autoSync?: boolean;
  onRemoteChange?: (settings: ItemStyleSettings) => void;
}

export function useRealtimeStyleSettings(
  itemId: string,
  settings: ItemStyleSettings,
  onSettingsChange: (settings: ItemStyleSettings) => void,
  options: StyleSyncOptions = {}
) {
  const { debounceMs = 800, autoSync = true, onRemoteChange } = options;
  const { toast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<string>(JSON.stringify(settings));

  // Debounced sync to database
  useEffect(() => {
    if (!autoSync || !itemId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const currentJson = JSON.stringify(settings);
    if (currentJson === lastSyncRef.current) return;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/items/${itemId}/style`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style: settings,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          lastSyncRef.current = currentJson;
          console.log('Style settings synced:', itemId);
        } else {
          console.error('Failed to sync style settings:', response.statusText);
          toast({
            title: 'Stil Senkronizasyonu Başarısız',
            description: 'Değişiklikler kaydedilemedi',
            variant: 'destructive',
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Style sync error:', error);
        toast({
          title: 'Bağlantı Hatası',
          description: 'Stil değişiklikleri senkronize edilemedi',
          variant: 'destructive',
        });
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [itemId, settings, autoSync, debounceMs, toast]);

  // Subscribe to remote style changes (Broadcast channel for real-time collab)
  useEffect(() => {
    if (!itemId) return;

    // Use Broadcast Channel API for real-time updates
    const broadcastChannel = new BroadcastChannel(`style:${itemId}`);

    const handleStyleUpdate = (event: MessageEvent) => {
      if (event.data.type === 'STYLE_UPDATE' && event.data.itemId === itemId) {
        console.log('Received remote style update:', event.data.style);
        onSettingsChange(event.data.style);
        onRemoteChange?.(event.data.style);

        toast({
          title: 'Stil Güncellendi',
          description: 'Başka bir oturumdan stil ayarları değiştirildi',
          duration: 2000,
        });
      }
    };

    broadcastChannel.addEventListener('message', handleStyleUpdate);

    return () => {
      broadcastChannel.removeEventListener('message', handleStyleUpdate);
      broadcastChannel.close();
    };
  }, [itemId, onSettingsChange, onRemoteChange, toast]);

  // Broadcast local style changes to other tabs
  const broadcastStyleChange = (newSettings: ItemStyleSettings) => {
    const broadcastChannel = new BroadcastChannel(`style:${itemId}`);
    broadcastChannel.postMessage({
      type: 'STYLE_UPDATE',
      itemId,
      style: newSettings,
      timestamp: new Date().toISOString(),
    });
    broadcastChannel.close();
  };

  return {
    applyStyles: (newSettings: ItemStyleSettings) => {
      broadcastStyleChange(newSettings);
      onSettingsChange(newSettings);
    },
    getCurrentSettings: () => settings,
  };
}
