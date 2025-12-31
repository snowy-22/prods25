"use client";

import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Monitor, Tv, Airplay, Wifi, WifiOff, RefreshCw, Settings, Maximize2, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

interface SignageModeSettings {
  autoRotate: boolean;
  rotationInterval: number; // seconds
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  fullscreen: boolean;
  hideUI: boolean;
  syncMode: 'cloud' | 'local' | 'broadcast';
}

export function SignageMode() {
  const { user, activeTabId, tabs } = useAppStore();
  const { toast } = useToast();
  
  const [isSignageMode, setIsSignageMode] = useState(false);
  const [settings, setSettings] = useState<SignageModeSettings>({
    autoRotate: false,
    rotationInterval: 10,
    autoRefresh: true,
    refreshInterval: 30,
    fullscreen: true,
    hideUI: true,
    syncMode: 'cloud'
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (isSignageMode) {
      startSignageMode();
    } else {
      stopSignageMode();
    }
  }, [isSignageMode]);

  useEffect(() => {
    if (!isSignageMode) return;

    // Cloud sync for signage mode
    if (settings.syncMode === 'cloud' && user) {
      const channel = supabase
        .channel('signage-sync')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'items',
            filter: `owner_id=eq.${user.id}` 
          }, 
          (payload) => {
            console.log('Signage sync update:', payload);
            setLastSync(new Date());
            // Refresh current view
            window.location.reload();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            toast({
              title: "Signage Modu Aktif",
              description: "Bulut senkronizasyonu bağlandı"
            });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isSignageMode, settings.syncMode, user]);

  useEffect(() => {
    if (!isSignageMode || !settings.autoRefresh) return;

    const interval = setInterval(() => {
      window.location.reload();
      setLastSync(new Date());
    }, settings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isSignageMode, settings.autoRefresh, settings.refreshInterval]);

  useEffect(() => {
    if (!isSignageMode || !settings.autoRotate) return;

    const interval = setInterval(() => {
      // Rotate to next tab
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      const nextTab = tabs[nextIndex];
      
      if (nextTab) {
        useAppStore.getState().setActiveTab(nextTab.id);
      }
    }, settings.rotationInterval * 1000);

    return () => clearInterval(interval);
  }, [isSignageMode, settings.autoRotate, settings.rotationInterval, tabs, activeTabId]);

  const startSignageMode = () => {
    if (settings.fullscreen) {
      document.documentElement.requestFullscreen();
    }
    
    if (settings.hideUI) {
      useAppStore.getState().setIsUiHidden(true);
    }

    toast({
      title: "Signage Modu Başlatıldı",
      description: "Ekran dijital tabela moduna geçti"
    });
  };

  const stopSignageMode = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    useAppStore.getState().setIsUiHidden(false);

    toast({
      title: "Signage Modu Durduruldu",
      description: "Normal görünüme geri dönüldü"
    });
  };

  const handleManualRefresh = () => {
    window.location.reload();
    setLastSync(new Date());
  };

  if (!isSignageMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Dijital Tabela Modu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Harici ekranlar ve çoklu monitörler için anlık bulut senkronizasyonu ile dijital signage modu
          </p>
          <Button 
            className="w-full" 
            onClick={() => setIsSignageMode(true)}
          >
            <Tv className="mr-2 h-4 w-4" />
            Signage Modunu Başlat
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Airplay className="h-4 w-4 animate-pulse text-primary" />
            Signage Aktif
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSignageMode(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            <span className="text-xs">
              {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
            </span>
          </div>
          <Badge variant={settings.syncMode === 'cloud' ? 'default' : 'secondary'}>
            {settings.syncMode}
          </Badge>
        </div>

        {lastSync && (
          <div className="text-xs text-muted-foreground">
            Son senkronizasyon: {lastSync.toLocaleTimeString('tr-TR')}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-rotate" className="text-xs">Otomatik Dönüş</Label>
          <Switch
            id="auto-rotate"
            checked={settings.autoRotate}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoRotate: checked }))}
          />
        </div>

        {settings.autoRotate && (
          <div className="space-y-2">
            <Label className="text-xs">Dönüş Süresi: {settings.rotationInterval}sn</Label>
            <Slider
              value={[settings.rotationInterval]}
              onValueChange={(value) => setSettings(prev => ({ ...prev, rotationInterval: value[0] }))}
              min={5}
              max={60}
              step={5}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-refresh" className="text-xs">Otomatik Yenileme</Label>
          <Switch
            id="auto-refresh"
            checked={settings.autoRefresh}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoRefresh: checked }))}
          />
        </div>

        {settings.autoRefresh && (
          <div className="space-y-2">
            <Label className="text-xs">Yenileme Süresi: {settings.refreshInterval}sn</Label>
            <Slider
              value={[settings.refreshInterval]}
              onValueChange={(value) => setSettings(prev => ({ ...prev, refreshInterval: value[0] }))}
              min={10}
              max={300}
              step={10}
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleManualRefresh}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Yenile
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
