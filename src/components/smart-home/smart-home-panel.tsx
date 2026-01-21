'use client';

/**
 * Smart Home Control Panel
 * Philips Hue, SmartThings ve Home Assistant kontrol paneli
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, Sun, Moon, Palette, Power, Thermometer,
  Volume2, Tv, Fan, Lock, Camera, Activity, RefreshCw,
  ChevronRight, Settings, Plus, Home, Zap, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  usePhilipsHue, 
  useSmartThings, 
  useHomeAssistant,
  useApiVault
} from '@/lib/api-vault/hooks';
import { cn } from '@/lib/utils';

interface Light {
  id: string;
  name: string;
  on: boolean;
  brightness: number;
  color?: { hue: number; saturation: number };
  reachable: boolean;
}

interface Scene {
  id: string;
  name: string;
  type: string;
}

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  state: Record<string, any>;
}

export function SmartHomePanel() {
  const { hasProvider, isUnlocked } = useApiVault();
  const { client: hueClient, isLoading: hueLoading } = usePhilipsHue();
  const { client: smartThingsClient, isLoading: stLoading } = useSmartThings();
  const { client: haClient, isLoading: haLoading } = useHomeAssistant();
  
  const [lights, setLights] = useState<Light[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('lights');

  // Detect available platforms
  const hasHue = hasProvider('philips_hue');
  const hasSmartThings = hasProvider('smartthings');
  const hasHomeAssistant = hasProvider('home_assistant');
  const hasAnyPlatform = hasHue || hasSmartThings || hasHomeAssistant;

  // Load lights from Hue
  const loadHueLights = useCallback(async () => {
    if (!hueClient) return;
    
    try {
      const hueLights = await hueClient.getLights();
      const formatted: Light[] = Object.entries(hueLights).map(([id, light]: [string, any]) => ({
        id: `hue-${id}`,
        name: light.name,
        on: light.state.on,
        brightness: Math.round((light.state.bri / 254) * 100),
        color: light.state.hue ? {
          hue: light.state.hue,
          saturation: light.state.sat
        } : undefined,
        reachable: light.state.reachable
      }));
      setLights(prev => [...prev.filter(l => !l.id.startsWith('hue-')), ...formatted]);
    } catch (err) {
      console.error('Failed to load Hue lights:', err);
    }
  }, [hueClient]);

  // Load Hue scenes
  const loadHueScenes = useCallback(async () => {
    if (!hueClient) return;
    
    try {
      const hueScenes = await hueClient.getScenes();
      const formatted: Scene[] = Object.entries(hueScenes).map(([id, scene]: [string, any]) => ({
        id: `hue-${id}`,
        name: scene.name,
        type: 'hue'
      }));
      setScenes(prev => [...prev.filter(s => !s.id.startsWith('hue-')), ...formatted]);
    } catch (err) {
      console.error('Failed to load Hue scenes:', err);
    }
  }, [hueClient]);

  // Load SmartThings devices
  const loadSmartThingsDevices = useCallback(async () => {
    if (!smartThingsClient) return;
    
    try {
      const stDevices = await smartThingsClient.getDevices();
      const formatted: Device[] = stDevices.items?.map((device: any) => ({
        id: `st-${device.deviceId}`,
        name: device.label || device.name,
        type: device.deviceTypeName || 'unknown',
        status: device.status?.online ? 'online' : 'offline',
        state: {}
      })) || [];
      setDevices(prev => [...prev.filter(d => !d.id.startsWith('st-')), ...formatted]);
    } catch (err) {
      console.error('Failed to load SmartThings devices:', err);
    }
  }, [smartThingsClient]);

  // Load Home Assistant entities
  const loadHomeAssistant = useCallback(async () => {
    if (!haClient) return;
    
    try {
      const states = await haClient.getStates();
      
      // Filter lights
      const haLights: Light[] = states
        .filter((s: any) => s.entity_id.startsWith('light.'))
        .map((state: any) => ({
          id: `ha-${state.entity_id}`,
          name: state.attributes.friendly_name || state.entity_id,
          on: state.state === 'on',
          brightness: state.attributes.brightness 
            ? Math.round((state.attributes.brightness / 255) * 100) 
            : 100,
          reachable: state.state !== 'unavailable'
        }));
      
      setLights(prev => [...prev.filter(l => !l.id.startsWith('ha-')), ...haLights]);
      
      // Filter other devices
      const haDevices: Device[] = states
        .filter((s: any) => 
          s.entity_id.startsWith('switch.') || 
          s.entity_id.startsWith('climate.') ||
          s.entity_id.startsWith('cover.') ||
          s.entity_id.startsWith('lock.')
        )
        .map((state: any) => ({
          id: `ha-${state.entity_id}`,
          name: state.attributes.friendly_name || state.entity_id,
          type: state.entity_id.split('.')[0],
          status: state.state !== 'unavailable' ? 'online' : 'offline',
          state: state.attributes
        }));
      
      setDevices(prev => [...prev.filter(d => !d.id.startsWith('ha-')), ...haDevices]);
    } catch (err) {
      console.error('Failed to load Home Assistant:', err);
    }
  }, [haClient]);

  // Load all data
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadHueLights(),
      loadHueScenes(),
      loadSmartThingsDevices(),
      loadHomeAssistant()
    ]);
    setIsLoading(false);
  }, [loadHueLights, loadHueScenes, loadSmartThingsDevices, loadHomeAssistant]);

  // Initial load
  useEffect(() => {
    if (hasAnyPlatform && isUnlocked) {
      refreshAll();
    }
  }, [hasAnyPlatform, isUnlocked, refreshAll]);

  // Toggle light
  const toggleLight = async (light: Light) => {
    const [platform, id] = light.id.split('-');
    
    try {
      if (platform === 'hue' && hueClient) {
        await hueClient.setLightState(id, { on: !light.on });
      } else if (platform === 'ha' && haClient) {
        await haClient.callService(
          'light',
          light.on ? 'turn_off' : 'turn_on',
          { entity_id: id }
        );
      }
      
      setLights(prev => prev.map(l => 
        l.id === light.id ? { ...l, on: !l.on } : l
      ));
    } catch (err) {
      console.error('Failed to toggle light:', err);
    }
  };

  // Set brightness
  const setBrightness = async (light: Light, brightness: number) => {
    const [platform, id] = light.id.split('-');
    
    try {
      if (platform === 'hue' && hueClient) {
        await hueClient.setLightState(id, { 
          on: brightness > 0,
          bri: Math.round((brightness / 100) * 254)
        });
      } else if (platform === 'ha' && haClient) {
        await haClient.callService(
          'light',
          'turn_on',
          { 
            entity_id: id,
            brightness: Math.round((brightness / 100) * 255)
          }
        );
      }
      
      setLights(prev => prev.map(l => 
        l.id === light.id ? { ...l, brightness, on: brightness > 0 } : l
      ));
    } catch (err) {
      console.error('Failed to set brightness:', err);
    }
  };

  // Activate scene
  const activateScene = async (scene: Scene) => {
    const [platform, id] = scene.id.split('-');
    
    try {
      if (platform === 'hue' && hueClient) {
        await hueClient.activateScene(id);
      }
      
      // Refresh lights after scene activation
      await loadHueLights();
    } catch (err) {
      console.error('Failed to activate scene:', err);
    }
  };

  // No platforms configured
  if (!hasAnyPlatform) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Home className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Akıllı Ev Entegrasyonu</h3>
          <p className="text-muted-foreground mb-4">
            Philips Hue, SmartThings veya Home Assistant ekleyin
          </p>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Entegrasyon Ekle
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Akıllı Ev</h2>
            <p className="text-sm text-muted-foreground">
              {lights.length} ışık • {devices.length} cihaz
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Platform badges */}
          {hasHue && (
            <Badge variant="outline" className="bg-orange-500/10">
              <Lightbulb className="mr-1 h-3 w-3" />
              Hue
            </Badge>
          )}
          {hasSmartThings && (
            <Badge variant="outline" className="bg-green-500/10">
              <Zap className="mr-1 h-3 w-3" />
              SmartThings
            </Badge>
          )}
          {hasHomeAssistant && (
            <Badge variant="outline" className="bg-blue-500/10">
              <Home className="mr-1 h-3 w-3" />
              HA
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={refreshAll}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="outline"
          className="flex-col h-auto py-3"
          onClick={() => lights.forEach(l => l.on && toggleLight(l))}
        >
          <Moon className="h-5 w-5 mb-1" />
          <span className="text-xs">Tümünü Kapat</span>
        </Button>
        <Button
          variant="outline"
          className="flex-col h-auto py-3"
          onClick={() => lights.forEach(l => !l.on && toggleLight(l))}
        >
          <Sun className="h-5 w-5 mb-1" />
          <span className="text-xs">Tümünü Aç</span>
        </Button>
        <Button
          variant="outline"
          className="flex-col h-auto py-3"
          onClick={() => lights.forEach(l => setBrightness(l, 50))}
        >
          <Activity className="h-5 w-5 mb-1" />
          <span className="text-xs">%50 Parlaklık</span>
        </Button>
        <Button
          variant="outline"
          className="flex-col h-auto py-3"
        >
          <Palette className="h-5 w-5 mb-1" />
          <span className="text-xs">Renkler</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="lights">
            <Lightbulb className="mr-2 h-4 w-4" />
            Işıklar ({lights.length})
          </TabsTrigger>
          <TabsTrigger value="scenes">
            <Palette className="mr-2 h-4 w-4" />
            Sahneler ({scenes.length})
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Power className="mr-2 h-4 w-4" />
            Cihazlar ({devices.length})
          </TabsTrigger>
        </TabsList>

        {/* Lights Tab */}
        <TabsContent value="lights">
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {lights.map((light) => (
                <Card 
                  key={light.id}
                  className={cn(
                    'transition-all',
                    !light.reachable && 'opacity-50'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                            light.on 
                              ? 'bg-yellow-500/20' 
                              : 'bg-muted'
                          )}
                        >
                          <Lightbulb 
                            className={cn(
                              'h-5 w-5',
                              light.on ? 'text-yellow-500' : 'text-muted-foreground'
                            )} 
                          />
                        </div>
                        <div>
                          <div className="font-medium">{light.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {light.id.split('-')[0].toUpperCase()}
                            {!light.reachable && ' • Ulaşılamıyor'}
                          </div>
                        </div>
                      </div>
                      
                      <Switch
                        checked={light.on}
                        onCheckedChange={() => toggleLight(light)}
                        disabled={!light.reachable}
                      />
                    </div>
                    
                    {light.on && (
                      <div className="flex items-center gap-4">
                        <Sun className="h-4 w-4 text-muted-foreground" />
                        <Slider
                          value={[light.brightness]}
                          max={100}
                          step={1}
                          className="flex-1"
                          onValueChange={([v]) => setBrightness(light, v)}
                        />
                        <span className="text-sm text-muted-foreground w-8">
                          {light.brightness}%
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {lights.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Işık bulunamadı</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Scenes Tab */}
        <TabsContent value="scenes">
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-2 gap-2">
              {scenes.map((scene) => (
                <Button
                  key={scene.id}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => activateScene(scene)}
                >
                  <Palette className="mr-2 h-4 w-4 text-primary" />
                  {scene.name}
                </Button>
              ))}
              
              {scenes.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <Palette className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Sahne bulunamadı</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {devices.map((device) => (
                <Card key={device.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {device.type === 'switch' && <Power className="h-5 w-5" />}
                          {device.type === 'climate' && <Thermometer className="h-5 w-5" />}
                          {device.type === 'cover' && <ChevronRight className="h-5 w-5" />}
                          {device.type === 'lock' && <Lock className="h-5 w-5" />}
                          {!['switch', 'climate', 'cover', 'lock'].includes(device.type) && (
                            <Zap className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {device.type} • {device.id.split('-')[0].toUpperCase()}
                          </div>
                        </div>
                      </div>
                      
                      <Badge 
                        variant={device.status === 'online' ? 'default' : 'secondary'}
                      >
                        {device.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {devices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Cihaz bulunamadı</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
