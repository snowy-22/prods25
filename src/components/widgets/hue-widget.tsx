'use client';

import React, { useState } from 'react';
import { usePhilipsHue } from '@/hooks/use-philips-hue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, AlertTriangle, Loader2, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PhilipsHueWidget() {
  const hue = usePhilipsHue();
  const [expandedLight, setExpandedLight] = useState<string | null>(null);

  if (!hue.connected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Philips Hue
          </CardTitle>
          <CardDescription>Akıllı Işıklar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
            <div className="text-center">
              <h3 className="font-semibold mb-1">Bridge Bağlanılamıyor</h3>
              <p className="text-sm text-muted-foreground">
                Hue Bridge lokal ağda bulunamadı. Yapılandırmayı kontrol et.
              </p>
            </div>
            <Button onClick={hue.refresh} variant="outline" size="sm">
              Yeniden Deneyin
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-500" />
              <CardTitle>Philips Hue</CardTitle>
            </div>
          </div>
          <Button
            onClick={hue.refresh}
            disabled={hue.loading}
            variant="ghost"
            size="sm"
          >
            {hue.loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              '⟲'
            )}
          </Button>
        </div>
        <CardDescription>
          {hue.lights.length} ışık - {hue.lights.filter(l => l.state.on).length} açık
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {hue.lights.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Işık bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hue.lights.map(light => (
              <div
                key={light.id}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full transition-all',
                        light.state.on
                          ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
                          : 'bg-gray-400'
                      )}
                    />
                    <span className="font-medium text-sm">{light.name}</span>
                  </div>
                  <Button
                    onClick={() => hue.toggleLight(light.id, !light.state.on)}
                    variant={light.state.on ? 'default' : 'outline'}
                    size="sm"
                  >
                    {light.state.on ? 'Aç' : 'Kapalı'}
                  </Button>
                </div>

                {light.state.on && (
                  <>
                    {/* Parlaklık */}
                    {light.state.bri !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          Parlaklık: {Math.round((light.state.bri / 254) * 100)}%
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="254"
                            value={light.state.bri}
                            onChange={(e) =>
                              hue.setBrightness(light.id, parseInt(e.target.value))
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Renk */}
                    {light.state.hue !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          Renk
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
                          ].map(color => (
                            <Button
                              key={color.label}
                              onClick={() => hue.setColor(light.id, color.hue)}
                              variant={
                                light.state.hue === color.hue
                                  ? 'default'
                                  : 'outline'
                              }
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
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
            {hue.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
