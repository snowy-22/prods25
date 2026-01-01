"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { usePhilipsHue } from '@/hooks/use-philips-hue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertTriangle, Loader2, Wifi, SunMedium, House, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScenePreset = {
  id: string;
  name: string;
  hue: number;
  sat: number;
  bri: number;
  accent?: string;
};

const SCENE_PRESETS: ScenePreset[] = [
  { id: 'focus', name: 'Odak', hue: 46920, sat: 180, bri: 220, accent: 'bg-sky-100 text-sky-800' },
  { id: 'relax', name: 'Dinlen', hue: 8000, sat: 140, bri: 180, accent: 'bg-amber-100 text-amber-800' },
  { id: 'movie', name: 'Film', hue: 56100, sat: 200, bri: 120, accent: 'bg-purple-100 text-purple-800' },
  { id: 'party', name: 'Parti', hue: 0, sat: 254, bri: 254, accent: 'bg-rose-100 text-rose-800' },
];

export default function PhilipsHueWidget() {
  const hue = usePhilipsHue();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [sceneLoading, setSceneLoading] = useState<string | null>(null);
  const [groupBrightness, setGroupBrightness] = useState<number>(180);

  const selectedGroup = useMemo(() => hue.groups.find((g) => g.id === selectedGroupId), [hue.groups, selectedGroupId]);

  const targetLights = useMemo(() => {
    if (selectedGroupId === 'all') return hue.lights;
    if (!selectedGroup) return [];
    return hue.lights.filter((l) => selectedGroup.lights.includes(l.id));
  }, [hue.lights, selectedGroup, selectedGroupId]);

  useEffect(() => {
    if (!targetLights.length) return;
    const avg = Math.round(
      targetLights.reduce((sum, l) => sum + (l.state.bri ?? 180), 0) / targetLights.length
    );
    setGroupBrightness(avg);
  }, [targetLights]);

  const applyGroupBrightness = async (value: number) => {
    if (!targetLights.length) return;
    await Promise.all(targetLights.map((l) => hue.setBrightness(l.id, value)));
  };

  const applyScene = async (preset: ScenePreset) => {
    if (!targetLights.length) return;
    setSceneLoading(preset.id);
    try {
      await Promise.all(
        targetLights.map(async (l) => {
          await hue.setColor(l.id, preset.hue, preset.sat);
          await hue.setBrightness(l.id, preset.bri);
        })
      );
      setGroupBrightness(preset.bri);
    } finally {
      setSceneLoading(null);
    }
  };

  const toggleGroup = async (on: boolean) => {
    if (!targetLights.length) return;
    await Promise.all(targetLights.map((l) => hue.toggleLight(l.id, on)));
  };

  if (!hue.connected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Philips Hue
          </CardTitle>
          <CardDescription>Akıllı ışıklar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
            <div className="text-center space-y-1">
              <h3 className="font-semibold">Bridge Bağlanılamıyor</h3>
              <p className="text-sm text-muted-foreground">Lokal ağ bağlantısını ve yapılandırmayı kontrol et.</p>
            </div>
            <Button onClick={hue.refresh} variant="outline" size="sm">
              Yeniden dene
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            <CardTitle>Philips Hue</CardTitle>
          </div>
          <Button onClick={hue.refresh} disabled={hue.loading} variant="ghost" size="sm">
            {hue.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '⟲'}
          </Button>
        </div>
        <CardDescription>
          {hue.lights.length} ışık · {hue.lights.filter((l) => l.state.on).length} açık · {hue.groups.length} oda/alan
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground flex items-center gap-2">
              <House className="w-4 h-4" /> Oda/Sahne hedefi
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tüm odalar</option>
              {hue.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground flex items-center gap-2">
              <SunMedium className="w-4 h-4" /> Grup parlaklığı
            </label>
            <input
              type="range"
              min="1"
              max="254"
              value={groupBrightness}
              onChange={(e) => setGroupBrightness(parseInt(e.target.value))}
              onMouseUp={(e) => applyGroupBrightness(parseInt((e.target as HTMLInputElement).value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>%{Math.round((groupBrightness / 254) * 100)}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleGroup(true)}>Aç</Button>
                <Button size="sm" variant="secondary" onClick={() => toggleGroup(false)}>Kapat</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SCENE_PRESETS.map((scene) => (
            <div key={scene.id} className={cn('border rounded-lg p-3 space-y-2', scene.accent ?? 'bg-muted/40')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span className="text-sm font-semibold">{scene.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">hue {scene.hue}</Badge>
              </div>
              <Button
                size="sm"
                className="w-full"
                variant="default"
                disabled={!!sceneLoading}
                onClick={() => applyScene(scene)}
              >
                {sceneLoading === scene.id ? 'Uygulanıyor...' : 'Sahneyi Aç'}
              </Button>
            </div>
          ))}
        </div>

        {hue.lights.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Işık bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hue.lights.map((light) => (
              <div key={light.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full transition-all',
                        light.state.on ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-gray-400'
                      )}
                    />
                    <span className="font-medium text-sm">{light.name}</span>
                  </div>
                  <Button onClick={() => hue.toggleLight(light.id, !light.state.on)} variant={light.state.on ? 'default' : 'outline'} size="sm">
                    {light.state.on ? 'Açık' : 'Kapalı'}
                  </Button>
                </div>

                {light.state.on && (
                  <>
                    {light.state.bri !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Parlaklık: {Math.round((light.state.bri / 254) * 100)}%</label>
                        <input
                          type="range"
                          min="0"
                          max="254"
                          value={light.state.bri}
                          onChange={(e) => hue.setBrightness(light.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}

                    {light.state.hue !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Palette className="w-3 h-3" /> Renk seçimi
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                          {[
                            { name: 'K', hue: 0, label: 'Kırmızı' },
                            { name: 'O', hue: 5000, label: 'Turuncu' },
                            { name: 'S', hue: 12750, label: 'Sarı' },
                            { name: 'Y', hue: 25500, label: 'Yeşil' },
                            { name: 'M', hue: 46920, label: 'Mavi' },
                            { name: 'P', hue: 54600, label: 'Mor' },
                            { name: 'R', hue: 56100, label: 'Pembe' },
                          ].map((color) => (
                            <Button
                              key={color.label}
                              onClick={() => hue.setColor(light.id, color.hue)}
                              variant={light.state.hue === color.hue ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs font-bold"
                              title={color.label}
                            >
                              {color.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {hue.error && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">{hue.error}</div>
        )}
      </CardContent>
    </Card>
  );
}
