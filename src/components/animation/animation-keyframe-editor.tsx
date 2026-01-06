'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Trash2,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Settings,
  ChevronDown,
} from 'lucide-react';

// Easing functions
const EASING_FUNCTIONS = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'ease-in-sine',
  'ease-out-sine',
  'ease-in-out-sine',
  'ease-in-cubic',
  'ease-out-cubic',
  'ease-in-out-cubic',
  'ease-in-quart',
  'ease-out-quart',
  'ease-in-out-quart',
];

// Animatable properties
const PROPERTIES = [
  { id: 'opacity', label: 'Opaklık', min: 0, max: 100, unit: '%' },
  { id: 'scaleX', label: 'X Ölçeği', min: 0.1, max: 5, unit: 'x' },
  { id: 'scaleY', label: 'Y Ölçeği', min: 0.1, max: 5, unit: 'x' },
  { id: 'rotateZ', label: 'Dönüş', min: 0, max: 360, unit: '°' },
  { id: 'x', label: 'X Pozisyonu', min: -2000, max: 2000, unit: 'px' },
  { id: 'y', label: 'Y Pozisyonu', min: -2000, max: 2000, unit: 'px' },
  { id: 'blur', label: 'Bulanıklaştırma', min: 0, max: 20, unit: 'px' },
  { id: 'brightness', label: 'Parlaklık', min: 0, max: 200, unit: '%' },
  { id: 'contrast', label: 'Zıtlık', min: 0, max: 200, unit: '%' },
  { id: 'saturate', label: 'Doygunluk', min: 0, max: 200, unit: '%' },
  { id: 'hueRotate', label: 'Renk Döndürme', min: 0, max: 360, unit: '°' },
];

interface Keyframe {
  id: string;
  time: number; // milliseconds
  properties: Record<string, number>;
  easing: string;
}

interface AnimationKeyframeEditorProps {
  animationName: string;
  duration: number;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (keyframes: Keyframe[]) => void;
}

export const AnimationKeyframeEditor: React.FC<AnimationKeyframeEditorProps> = ({
  animationName,
  duration,
  isOpen,
  onClose,
  onSave,
}) => {
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    {
      id: 'kf-0',
      time: 0,
      properties: {},
      easing: 'linear',
    },
    {
      id: 'kf-end',
      time: duration,
      properties: {},
      easing: 'linear',
    },
  ]);

  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string>('kf-0');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<string>('opacity');
  const [propertyValue, setPropertyValue] = useState<number>(100);

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);

  // Add new keyframe at current playhead time
  const addKeyframe = () => {
    const newKeyframe: Keyframe = {
      id: `kf-${Date.now()}`,
      time: playheadTime,
      properties: {},
      easing: 'linear',
    };
    const updated = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    setKeyframes(updated);
    setSelectedKeyframeId(newKeyframe.id);
  };

  // Duplicate selected keyframe
  const duplicateKeyframe = (keyframeId: string) => {
    const kf = keyframes.find((k) => k.id === keyframeId);
    if (!kf) return;
    const newKeyframe: Keyframe = {
      id: `kf-${Date.now()}`,
      time: kf.time + 100,
      properties: { ...kf.properties },
      easing: kf.easing,
    };
    const updated = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    setKeyframes(updated);
  };

  // Delete keyframe
  const deleteKeyframe = (keyframeId: string) => {
    if (keyframes.length <= 2) return; // Keep at least start and end
    const updated = keyframes.filter((kf) => kf.id !== keyframeId);
    setKeyframes(updated);
    if (selectedKeyframeId === keyframeId) {
      setSelectedKeyframeId(updated[0].id);
    }
  };

  // Update keyframe property
  const updateKeyframeProperty = (value: number) => {
    if (!selectedKeyframe) return;
    setKeyframes(
      keyframes.map((kf) =>
        kf.id === selectedKeyframeId
          ? {
              ...kf,
              properties: {
                ...kf.properties,
                [selectedProperty]: value,
              },
            }
          : kf
      )
    );
    setPropertyValue(value);
  };

  // Calculate timeline width for keyframes
  const getKeyframePosition = (time: number) => {
    return (time / duration) * 100;
  };

  // Timeline playback animation
  React.useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      setPlayheadTime(Math.min(elapsed, duration));

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, duration]);

  const prop = PROPERTIES.find((p) => p.id === selectedProperty);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Animasyon Keyframe Editörü</DialogTitle>
          <DialogDescription>
            {animationName} - Süre: {(duration / 1000).toFixed(1)}s
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
            <TabsTrigger value="properties">Özellikler</TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPlayheadTime(0);
                  setIsPlaying(false);
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium ml-2">
                {(playheadTime / 1000).toFixed(2)}s / {(duration / 1000).toFixed(1)}s
              </span>
            </div>

            {/* Timeline visualization */}
            <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
              <div className="relative h-20 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-red-500 z-10 pointer-events-none"
                  style={{ left: `${getKeyframePosition(playheadTime)}%` }}
                />

                {/* Grid lines */}
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-slate-200 dark:border-slate-700"
                    style={{ left: `${i * 10}%` }}
                  />
                ))}

                {/* Keyframes */}
                {keyframes.map((kf) => (
                  <div
                    key={kf.id}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full cursor-pointer border-2 transition-colors ${
                      selectedKeyframeId === kf.id
                        ? 'bg-blue-500 border-blue-600'
                        : 'bg-slate-300 dark:bg-slate-600 border-slate-400 dark:border-slate-500 hover:bg-slate-400 dark:hover:bg-slate-500'
                    }`}
                    style={{ left: `${getKeyframePosition(kf.time)}%` }}
                    onClick={() => {
                      setSelectedKeyframeId(kf.id);
                      setPlayheadTime(kf.time);
                    }}
                    title={`${(kf.time / 1000).toFixed(2)}s`}
                  />
                ))}
              </div>

              {/* Time indicators */}
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                {Array.from({ length: 11 }).map((_, i) => (
                  <span key={i}>{(i * (duration / 10000)).toFixed(1)}s</span>
                ))}
              </div>
            </div>

            {/* Keyframe List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Keyframe'ler</h4>
                <Button size="sm" onClick={addKeyframe}>
                  <Plus className="mr-2 h-4 w-4" />
                  Keyframe Ekle
                </Button>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {keyframes.map((kf) => (
                  <div
                    key={kf.id}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                      selectedKeyframeId === kf.id
                        ? 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => setSelectedKeyframeId(kf.id)}
                  >
                    <div className="flex-1">
                      <span className="font-mono text-sm">
                        {(kf.time / 1000).toFixed(2)}s
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        {Object.keys(kf.properties).length} özellik
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateKeyframe(kf.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={keyframes.length <= 2}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteKeyframe(kf.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            {selectedKeyframe ? (
              <div className="space-y-4">
                {/* Keyframe Info */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded">
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Zaman:</strong> {(selectedKeyframe.time / 1000).toFixed(2)}s
                    </p>
                    <p>
                      <strong>Easing:</strong> {selectedKeyframe.easing}
                    </p>
                    <p>
                      <strong>Özellikler:</strong> {Object.keys(selectedKeyframe.properties).length}
                    </p>
                  </div>
                </div>

                {/* Property Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Özellik Seç</label>
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTIES.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Value */}
                {prop && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      {prop.label}
                    </label>
                    <div className="space-y-2">
                      <Slider
                        min={prop.min}
                        max={prop.max}
                        step={0.1}
                        value={[
                          selectedKeyframe.properties[selectedProperty] ?? prop.min,
                        ]}
                        onValueChange={(val) =>
                          updateKeyframeProperty(val[0])
                        }
                        className="w-full"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={prop.min}
                          max={prop.max}
                          step={0.1}
                          value={
                            selectedKeyframe.properties[selectedProperty] ?? prop.min
                          }
                          onChange={(e) =>
                            updateKeyframeProperty(parseFloat(e.target.value))
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-slate-500">{prop.unit}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Easing Function */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Easing Fonksiyonu</label>
                  <Select
                    value={selectedKeyframe.easing}
                    onValueChange={(val) => {
                      setKeyframes(
                        keyframes.map((kf) =>
                          kf.id === selectedKeyframeId ? { ...kf, easing: val } : kf
                        )
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EASING_FUNCTIONS.map((fn) => (
                        <SelectItem key={fn} value={fn}>
                          {fn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Applied Properties */}
                {Object.keys(selectedKeyframe.properties).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Uygulanan Özellikler</label>
                    <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      {Object.entries(selectedKeyframe.properties).map(
                        ([key, value]) => {
                          const p = PROPERTIES.find((pr) => pr.id === key);
                          return (
                            <div
                              key={key}
                              className="flex justify-between items-center text-sm"
                            >
                              <span>{p?.label || key}</span>
                              <span className="font-mono">
                                {value.toFixed(1)} {p?.unit || ''}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Keyframe seçiniz</p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button
            onClick={() => {
              onSave?.(keyframes);
              onClose();
            }}
          >
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
