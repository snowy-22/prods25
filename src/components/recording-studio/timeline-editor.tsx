'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  SkipBack,
  Plus,
  Trash2,
  Edit,
  Move,
  MousePointer,
  Navigation,
  Palette,
  Box,
  Eye,
  Clock,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timeline, Scene, Action, ActionType } from '@/lib/recording-studio-types';

interface TimelineEditorProps {
  timeline: Timeline | null;
  currentTime: number;
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
  onSceneAdd: () => void;
  onSceneRemove: (sceneId: string) => void;
  onActionAdd: (sceneId: string, actionType: ActionType) => void;
  onActionRemove: (sceneId: string, actionId: string) => void;
  onActionEdit: (sceneId: string, actionId: string) => void;
}

const ACTION_TYPE_ICONS: Record<ActionType, any> = {
  scroll: MousePointer,
  navigate: Navigation,
  'style-change': Palette,
  'item-change': Box,
  zoom: ZoomIn,
  'layout-change': Box,
  'item-add': Plus,
  'item-remove': Trash2,
  'item-move': Move,
  animation: Play,
  wait: Clock,
  'camera-move': Camera,
};

const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  scroll: 'bg-blue-500',
  navigate: 'bg-green-500',
  'style-change': 'bg-purple-500',
  'item-change': 'bg-yellow-500',
  zoom: 'bg-pink-500',
  'layout-change': 'bg-indigo-500',
  'item-add': 'bg-emerald-500',
  'item-remove': 'bg-red-500',
  'item-move': 'bg-orange-500',
  animation: 'bg-cyan-500',
  wait: 'bg-gray-500',
  'camera-move': 'bg-violet-500',
};

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  scroll: 'Kaydırma',
  navigate: 'Gezinme',
  'style-change': 'Stil',
  'item-change': 'Öğe',
  zoom: 'Yakınlaştırma',
  'layout-change': 'Düzen',
  'item-add': 'Ekle',
  'item-remove': 'Sil',
  'item-move': 'Taşı',
  animation: 'Animasyon',
  wait: 'Bekle',
  'camera-move': 'Kamera',
};

export function TimelineEditor({
  timeline,
  currentTime,
  isPlaying,
  onTimeChange,
  onSceneAdd,
  onSceneRemove,
  onActionAdd,
  onActionRemove,
  onActionEdit,
}: TimelineEditorProps) {
  const [zoom, setZoom] = useState(1); // pixels per millisecond
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate pixel position from milliseconds
  const msToPixels = useCallback((ms: number) => {
    return ms * zoom;
  }, [zoom]);

  // Calculate milliseconds from pixel position
  const pixelsToMs = useCallback((pixels: number) => {
    return pixels / zoom;
  }, [zoom]);

  // Handle timeline click to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timeline || isPlaying) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToMs(x);
    
    onTimeChange(Math.max(0, Math.min(time, timeline.totalDuration)));
  }, [timeline, isPlaying, pixelsToMs, onTimeChange]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  }, []);

  // Format time for display
  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }, []);

  if (!timeline) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Timeline yok</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onSceneAdd}
            className="mt-4 border-slate-600 hover:bg-slate-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            İlk Sahneyi Oluştur
          </Button>
        </div>
      </div>
    );
  }

  // Calculate cumulative scene start times
  let cumulativeTime = 0;
  const sceneStartTimes = timeline.scenes.map(scene => {
    const startTime = cumulativeTime;
    cumulativeTime += scene.duration;
    return startTime;
  });

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2 border border-slate-700">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="text-white hover:bg-slate-700 h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="border-slate-600 text-white font-mono text-xs">
            {(zoom * 100).toFixed(0)}%
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="text-white hover:bg-slate-700 h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-600" />

        <Button
          variant="outline"
          size="sm"
          onClick={onSceneAdd}
          className="border-slate-600 hover:bg-slate-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Sahne
        </Button>

        <div className="flex-1" />

        <Badge variant="outline" className="border-slate-600 text-white font-mono">
          {formatTime(currentTime)} / {formatTime(timeline.totalDuration)}
        </Badge>
      </div>

      {/* Timeline View */}
      <div className="flex-1 overflow-auto bg-slate-900 rounded-lg border border-slate-700">
        <div className="min-h-full p-4">
          {/* Time Ruler */}
          <div className="relative h-8 bg-slate-800 rounded mb-2 border border-slate-700">
            <div className="absolute inset-0 flex items-center px-2">
              {Array.from({ length: Math.ceil(timeline.totalDuration / 1000) + 1 }).map((_, i) => {
                const time = i * 1000;
                const x = msToPixels(time);
                
                return (
                  <div
                    key={i}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${x}px` }}
                  >
                    <div className="h-2 w-px bg-slate-500" />
                    <span className="text-xs text-slate-400 mt-1 font-mono">
                      {formatTime(time)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scenes */}
          <div className="space-y-2">
            {timeline.scenes.map((scene, sceneIndex) => {
              const sceneStartTime = sceneStartTimes[sceneIndex];
              const sceneWidth = msToPixels(scene.duration);
              
              return (
                <div key={scene.id} className="space-y-1">
                  {/* Scene Header */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-slate-600 text-white text-xs">
                      Sahne {sceneIndex + 1}
                    </Badge>
                    <span className="text-sm text-slate-300">{scene.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSceneRemove(scene.id)}
                      className="h-6 w-6 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Scene Track */}
                  <div
                    className="relative h-16 bg-slate-800 rounded border border-slate-700 cursor-pointer hover:border-slate-600"
                    style={{ width: `${sceneWidth}px`, minWidth: '100px' }}
                    onClick={handleTimelineClick}
                  >
                    {/* Actions */}
                    {scene.actions.map(action => {
                      const actionX = msToPixels(action.startTime);
                      const actionWidth = msToPixels(action.duration);
                      const Icon = ACTION_TYPE_ICONS[action.type];
                      const isHovered = hoveredAction === action.id;
                      
                      return (
                        <div
                          key={action.id}
                          className={cn(
                            "absolute top-1 h-14 rounded border-2 cursor-pointer transition-all",
                            ACTION_TYPE_COLORS[action.type],
                            isHovered ? "border-white z-10 scale-105" : "border-transparent"
                          )}
                          style={{ left: `${actionX}px`, width: `${actionWidth}px` }}
                          onMouseEnter={() => setHoveredAction(action.id)}
                          onMouseLeave={() => setHoveredAction(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onActionEdit(scene.id, action.id);
                          }}
                        >
                          <div className="h-full flex items-center justify-center gap-1 px-2">
                            <Icon className="h-4 w-4 text-white" />
                            <span className="text-xs text-white font-medium truncate">
                              {action.label || ACTION_TYPE_LABELS[action.type]}
                            </span>
                          </div>
                          
                          {isHovered && (
                            <div className="absolute -top-8 left-0 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white whitespace-nowrap z-20">
                              {formatTime(action.startTime)} - {formatTime(action.startTime + action.duration)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Controls */}
                  <div className="flex gap-1 flex-wrap">
                    {(['scroll', 'zoom', 'wait', 'animation'] as ActionType[]).map(type => {
                      const Icon = ACTION_TYPE_ICONS[type];
                      return (
                        <Button
                          key={type}
                          variant="ghost"
                          size="sm"
                          onClick={() => onActionAdd(scene.id, type)}
                          className="h-7 text-xs border-slate-600 hover:bg-slate-700"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {ACTION_TYPE_LABELS[type]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-50"
            style={{ left: `${msToPixels(currentTime)}px` }}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 p-2 bg-slate-800/30 rounded border border-slate-700">
        {Object.entries(ACTION_TYPE_LABELS).map(([type, label]) => {
          const Icon = ACTION_TYPE_ICONS[type as ActionType];
          return (
            <div key={type} className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded", ACTION_TYPE_COLORS[type as ActionType])} />
              <Icon className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimelineEditor;
