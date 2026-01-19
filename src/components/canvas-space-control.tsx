"use client";

import React from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { getIconByName } from '@/lib/icons';
import { 
  Home, Monitor, Tablet, Smartphone, Tv, 
  Chrome, Globe,
  Circle, X, Settings, Eye, EyeOff, MonitorPlay
} from 'lucide-react';

interface CanvasSpaceControlProps {
  spaces: ContentItem[];
  devices: ContentItem[];
  activeSpaceId: string | null;
  activeDeviceId: string | null;
  browserTabs: Array<{
    id: string;
    title: string;
    spaceId: string;
    deviceId: string;
    isActive: boolean;
    timestamp: number;
  }>;
  onSpaceSelect: (spaceId: string) => void;
  onDeviceSelect: (deviceId: string) => void;
  onTabSelect: (tabId: string) => void;
  onClose: () => void;
}

const getBrowserIcon = (browserName?: string) => {
  const name = browserName?.toLowerCase() || '';
  if (name.includes('chrome')) return Chrome;
  // For edge, firefox, safari, use generic Globe icon (not available in lucide-react)
  return Globe;
};

const getDeviceIcon = (deviceType?: string) => {
  const type = deviceType?.toLowerCase() || '';
  if (type.includes('mobile') || type.includes('phone')) return Smartphone;
  if (type.includes('tablet') || type.includes('ipad')) return Tablet;
  if (type.includes('tv')) return Tv;
  return Monitor;
};

export default function CanvasSpaceControl({
  spaces,
  devices,
  activeSpaceId,
  activeDeviceId,
  browserTabs,
  onSpaceSelect,
  onDeviceSelect,
  onTabSelect,
  onClose
}: CanvasSpaceControlProps) {
  const activeSpace = spaces.find(s => s.id === activeSpaceId);
  const activeDevice = devices.find(d => d.id === activeDeviceId);
  
  const devicesInSpace = devices.filter(d => d.assignedSpaceId === activeSpaceId);
  const tabsInSpaceAndDevice = browserTabs.filter(
    t => t.spaceId === activeSpaceId && t.deviceId === activeDeviceId
  );
  const activeTabs = tabsInSpaceAndDevice.filter(t => t.isActive);
  const inactiveTabs = tabsInSpaceAndDevice.filter(t => !t.isActive);

  return (
    <Card className="fixed top-20 right-4 w-[450px] h-[calc(100vh-160px)] shadow-2xl border-2 z-50 bg-background/95 backdrop-blur-xl">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <MonitorPlay className="h-5 w-5 text-primary" />
            MEKAN KONTROL MERKEZİ
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-80px)] flex flex-col">
        {/* Active Space Display */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Aktif Mekan
            </span>
            <Badge variant="default" className="h-5">
              {devicesInSpace.length} Cihaz
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {activeSpace && (
              <>
                {(() => {
                  const Icon = getIconByName(activeSpace.icon) || Home;
                  return <Icon className="h-6 w-6 text-primary" />;
                })()}
                <div className="flex-1">
                  <h3 className="font-semibold">{activeSpace?.title || 'Mekan Seçilmedi'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {activeTabs.length} aktif sekme • {inactiveTabs.length} pasif
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Devices in Space */}
        <div className="p-4 border-b">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Mekandaki Cihazlar
          </h4>
          <div className="space-y-2">
            {devicesInSpace.map(device => {
              const Icon = getDeviceIcon(device.deviceInfo?.os);
              const BrowserIcon = getBrowserIcon(device.deviceInfo?.browser);
              const isActive = device.id === activeDeviceId;
              
              return (
                <button
                  key={device.id}
                  onClick={() => onDeviceSelect(device.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'bg-primary/10 border-primary shadow-md'
                      : 'bg-card border-transparent hover:border-muted-foreground/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-semibold text-sm">{device.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BrowserIcon className="h-3 w-3" />
                          <span>{device.deviceInfo?.browser}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.isCurrentDevice && (
                        <Badge variant="secondary" className="text-xs">Bu Cihaz</Badge>
                      )}
                      <Circle 
                        className={`h-2 w-2 fill-current ${
                          isActive ? 'text-green-500 animate-pulse' : 'text-muted-foreground/40'
                        }`} 
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Browser Tabs */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 pb-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tarayıcı Sekmeleri
            </h4>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="px-4 pb-4 space-y-3">
              {activeTabs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-3 w-3 text-green-500" />
                    <span className="text-xs font-semibold text-green-600">
                      Aktif Sekmeler ({activeTabs.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {activeTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => onTabSelect(tab.id)}
                        className="w-full p-2.5 rounded-md bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate flex-1">
                            {tab.title}
                          </span>
                          <Circle className="h-2 w-2 fill-current text-green-500 animate-pulse flex-shrink-0 ml-2" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tab.timestamp).toLocaleTimeString('tr-TR')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {inactiveTabs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Pasif Sekmeler ({inactiveTabs.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {inactiveTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => onTabSelect(tab.id)}
                        className="w-full p-2.5 rounded-md bg-muted/30 border border-transparent hover:border-muted-foreground/20 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm truncate flex-1">
                            {tab.title}
                          </span>
                          <Circle className="h-2 w-2 fill-current text-muted-foreground/40 flex-shrink-0 ml-2" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tab.timestamp).toLocaleTimeString('tr-TR')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tabsInSpaceAndDevice.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Bu cihazda aktif sekme yok</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
