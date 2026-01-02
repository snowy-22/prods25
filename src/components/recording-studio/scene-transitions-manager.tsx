'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Zap,
  RotateCw,
  Eye,
  Volume2,
  Wind,
  Lightbulb,
  Sparkles,
  Radio,
  Copy,
  Trash2,
  Settings,
  Plus,
} from 'lucide-react';
import { Scene } from '@/lib/recording-studio-types';

export type TransitionType =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'rotate'
  | 'blur'
  | 'wipe-left'
  | 'wipe-right'
  | 'dissolve'
  | 'none';

export interface SceneTransition {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  type: TransitionType;
  duration: number; // milliseconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  properties: Record<string, any>;
}

interface SceneTransitionsManagerProps {
  scenes: Scene[];
  transitions: SceneTransition[];
  onTransitionAdd: (transition: SceneTransition) => void;
  onTransitionUpdate: (transitionId: string, updates: Partial<SceneTransition>) => void;
  onTransitionDelete: (transitionId: string) => void;
  activeSceneId?: string;
}

const TRANSITION_TYPES: Array<{
  type: TransitionType;
  label: string;
  icon: any;
  description: string;
}> = [
  { type: 'fade', label: 'Solma', icon: Eye, description: 'Fade in/out efekti' },
  { type: 'slide-left', label: 'Sola Kaydır', icon: Wind, description: 'Soldan sağa geçiş' },
  { type: 'slide-right', label: 'Sağa Kaydır', icon: Wind, description: 'Sağdan sola geçiş' },
  { type: 'slide-up', label: 'Yukarı Kaydır', icon: Wind, description: 'Aşağıdan yukarı geçiş' },
  { type: 'slide-down', label: 'Aşağı Kaydır', icon: Wind, description: 'Yukarıdan aşağı geçiş' },
  { type: 'zoom-in', label: 'Yakınlaş', icon: Zap, description: 'Yakınlaştırma efekti' },
  { type: 'zoom-out', label: 'Uzaklaş', icon: Zap, description: 'Uzaklaştırma efekti' },
  { type: 'rotate', label: 'Döndür', icon: RotateCw, description: '360° döndürme' },
  { type: 'blur', label: 'Bulanıklaş', icon: Lightbulb, description: 'Blur efekti' },
  { type: 'wipe-left', label: 'Sola Temizle', icon: Radio, description: 'Sola doğru temizleme' },
  { type: 'wipe-right', label: 'Sağa Temizle', icon: Radio, description: 'Sağa doğru temizleme' },
  { type: 'dissolve', label: 'Dağıl', icon: Sparkles, description: 'Parçalanma efekti' },
  { type: 'none', label: 'Yok', icon: Settings, description: 'Hiçbir efekt' },
];

export function SceneTransitionsManager({
  scenes,
  transitions,
  onTransitionAdd,
  onTransitionUpdate,
  onTransitionDelete,
  activeSceneId,
}: SceneTransitionsManagerProps) {
  const [selectedFromSceneId, setSelectedFromSceneId] = useState<string | null>(null);
  const [selectedToSceneId, setSelectedToSceneId] = useState<string | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<SceneTransition | null>(null);
  const [transitionType, setTransitionType] = useState<TransitionType>('fade');
  const [transitionDuration, setTransitionDuration] = useState(500);

  // Create new transition
  const handleAddTransition = useCallback(() => {
    if (!selectedFromSceneId || !selectedToSceneId) return;

    const newTransition: SceneTransition = {
      id: `transition-${Date.now()}`,
      fromSceneId: selectedFromSceneId,
      toSceneId: selectedToSceneId,
      type: transitionType,
      duration: transitionDuration,
      easing: 'ease-in-out',
      properties: {},
    };

    onTransitionAdd(newTransition);

    // Reset form
    setSelectedFromSceneId(null);
    setSelectedToSceneId(null);
    setTransitionType('fade');
    setTransitionDuration(500);
  }, [
    selectedFromSceneId,
    selectedToSceneId,
    transitionType,
    transitionDuration,
    onTransitionAdd,
  ]);

  // Get scene name by id
  const getSceneName = useCallback((sceneId: string) => {
    return scenes.find(s => s.id === sceneId)?.name || 'Unknown';
  }, [scenes]);

  return (
    <div className="space-y-4">
      {/* Transition Creator */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Yeni Geçiş Oluştur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scene Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Başlangıç Sahnesi</label>
              <div className="space-y-1">
                {scenes.map(scene => (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedFromSceneId(scene.id)}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded text-sm transition-colors",
                      selectedFromSceneId === scene.id
                        ? "bg-purple-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    )}
                  >
                    {scene.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Hedef Sahne</label>
              <div className="space-y-1">
                {scenes.map(scene => (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedToSceneId(scene.id)}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded text-sm transition-colors",
                      selectedToSceneId === scene.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    )}
                  >
                    {scene.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Transition Type Selection */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Geçiş Tipi</label>
            <div className="grid grid-cols-3 gap-2">
              {TRANSITION_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setTransitionType(type)}
                  className={cn(
                    "p-2 rounded border-2 transition-all text-center",
                    transitionType === type
                      ? "border-yellow-500 bg-yellow-500/10 text-yellow-300"
                      : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                  )}
                >
                  <Icon className="h-4 w-4 mx-auto mb-1" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Duration Control */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">
              Süre: <span className="text-white font-mono">{transitionDuration}ms</span>
            </label>
            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={transitionDuration}
              onChange={(e) => setTransitionDuration(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex gap-2 text-xs text-slate-400">
              <span>100ms</span>
              <div className="flex-1" />
              <span>3000ms</span>
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleAddTransition}
            disabled={!selectedFromSceneId || !selectedToSceneId}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Geçiş Oluştur
          </Button>
        </CardContent>
      </Card>

      {/* Existing Transitions List */}
      {transitions.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Mevcut Geçişler ({transitions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transitions.map(transition => {
                const fromScene = getSceneName(transition.fromSceneId);
                const toScene = getSceneName(transition.toSceneId);
                const transType = TRANSITION_TYPES.find(t => t.type === transition.type);
                const Icon = transType?.icon;

                return (
                  <div
                    key={transition.id}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all cursor-pointer",
                      selectedTransition?.id === transition.id
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-slate-700 bg-slate-700/50 hover:border-slate-600"
                    )}
                    onClick={() => setSelectedTransition(transition)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
                        <div className="flex-1">
                          <div className="text-sm text-white">
                            {fromScene}
                            <span className="text-slate-500 mx-2">→</span>
                            {toScene}
                          </div>
                          <div className="text-xs text-slate-400">
                            {transType?.label} • {transition.duration}ms
                          </div>
                        </div>
                      </div>

                      <Badge variant="outline" className="border-slate-600 bg-slate-700">
                        {transition.easing}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransitionDelete(transition.id);
                        }}
                        className="h-8 w-8 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transition Details */}
      {selectedTransition && (
        <Card className="bg-slate-800 border-slate-700 border-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Geçiş Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400">Easing</label>
                <select
                  value={selectedTransition.easing}
                  onChange={(e) =>
                    onTransitionUpdate(selectedTransition.id, {
                      easing: e.target.value as any,
                    })
                  }
                  className="w-full mt-1 px-2 py-1 rounded text-sm bg-slate-700 text-white border border-slate-600"
                >
                  <option>linear</option>
                  <option>ease-in</option>
                  <option>ease-out</option>
                  <option>ease-in-out</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">
                  Süre: {selectedTransition.duration}ms
                </label>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={selectedTransition.duration}
                  onChange={(e) =>
                    onTransitionUpdate(selectedTransition.id, {
                      duration: Number(e.target.value),
                    })
                  }
                  className="w-full mt-2"
                />
              </div>
            </div>

            <Separator className="bg-slate-700" />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-slate-600 hover:bg-slate-700"
              >
                <Copy className="h-4 w-4 mr-1" />
                Klonla
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onTransitionDelete(selectedTransition.id);
                  setSelectedTransition(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Sil
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="text-xs text-slate-400 p-3 bg-slate-800/50 rounded border border-slate-700">
        <p>
          💡 Geçişler, sahne bittiğinde uygulanır. Başlangıç ve hedef sahnesi seçerek yeni geçişler
          oluşturun.
        </p>
      </div>
    </div>
  );
}

export default SceneTransitionsManager;
