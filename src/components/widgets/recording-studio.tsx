'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Clock,
  Film,
  Settings,
  Plus,
  Download,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timeline, Scene, Action, ActionType } from '@/lib/recording-studio-types';
import { useAutomationEngine } from '@/hooks/use-automation-engine';
import { useScreenRecorder } from '@/hooks/use-screen-recorder';
import { TimelineEditor } from '@/components/recording-studio/timeline-editor';

interface RecordingStudioProps {
  size?: 'small' | 'medium' | 'large';
}

export function RecordingStudio({ size = 'large' }: RecordingStudioProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'scenes' | 'settings'>('timeline');
  const [autoRecord, setAutoRecord] = useState(true);
  
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  // Automation engine
  const {
    timeline,
    currentTime,
    isPlaying,
    isPaused,
    currentScene,
    sceneProgress,
    speed,
    loop,
    setTimeline,
    play,
    pause,
    resume,
    stop,
    seekTo,
    setPlaybackSpeed,
    toggleLoop,
  } = useAutomationEngine();

  // Screen recorder
  const {
    recordingState,
    startRecording,
    stopRecording,
    downloadRecording,
    hasRecording,
  } = useScreenRecorder({ audio: true, video: true });

  // Format time as MM:SS.mmm
  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }, []);

  // Handle play/pause with auto-record
  const handlePlayPause = useCallback(async () => {
    if (!isPlaying) {
      // Start playing
      if (autoRecord && recordingState === 'idle') {
        await startRecording();
        // Small delay to ensure recording started
        setTimeout(() => play(), 100);
      } else {
        play();
      }
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPlaying, isPaused, autoRecord, recordingState, play, pause, resume, startRecording]);

  // Handle stop
  const handleStop = useCallback(() => {
    stop();
    if (recordingState === 'recording' || recordingState === 'paused') {
      stopRecording();
    }
  }, [stop, recordingState, stopRecording]);

  // Demo timeline oluşturma
  const createDemoTimeline = useCallback(() => {
    const demoTimeline: Timeline = {
      id: 'demo-1',
      name: 'Demo Sunum',
      description: 'Örnek otomasyon timeline',
      scenes: [
        {
          id: 'scene-1',
          name: 'Açılış',
          description: 'İlk sahne - zoom in',
          actions: [
            {
              id: 'action-1',
              type: 'zoom',
              startTime: 0,
              duration: 2000,
              easing: 'ease-in-out',
              fromZoom: 0.5,
              toZoom: 1,
              label: 'Zoom In',
            },
            {
              id: 'action-2',
              type: 'wait',
              startTime: 2000,
              duration: 1000,
              easing: 'linear',
              label: 'Bekleme',
            },
          ],
          duration: 3000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'scene-2',
          name: 'İçerik',
          description: 'Ana içerik gösterimi',
          actions: [
            {
              id: 'action-3',
              type: 'scroll',
              startTime: 0,
              duration: 3000,
              easing: 'ease-in-out-cubic',
              targetPosition: { x: 0, y: 500 },
              smooth: true,
              label: 'Scroll Animasyonu',
            },
          ],
          duration: 3000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      totalDuration: 6000,
      fps: 60,
      resolution: { width: 1920, height: 1080 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setTimeline(demoTimeline);
  }, [setTimeline]);

  // Action handlers for timeline editor
  const handleSceneAdd = useCallback(() => {
    if (!timeline) {
      // Create first scene
      const newTimeline: Timeline = {
        id: `timeline-${Date.now()}`,
        name: 'Yeni Timeline',
        description: '',
        scenes: [{
          id: `scene-${Date.now()}`,
          name: 'Yeni Sahne',
          description: '',
          actions: [],
          duration: 5000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        totalDuration: 5000,
        fps: 60,
        resolution: { width: 1920, height: 1080 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTimeline(newTimeline);
    } else {
      // Add new scene to existing timeline
      const newScene: Scene = {
        id: `scene-${Date.now()}`,
        name: `Sahne ${timeline.scenes.length + 1}`,
        description: '',
        actions: [],
        duration: 5000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedTimeline = {
        ...timeline,
        scenes: [...timeline.scenes, newScene],
        totalDuration: timeline.totalDuration + newScene.duration,
        updatedAt: new Date().toISOString(),
      };
      setTimeline(updatedTimeline);
    }
  }, [timeline, setTimeline]);

  const handleSceneRemove = useCallback((sceneId: string) => {
    if (!timeline) return;
    const updatedScenes = timeline.scenes.filter(s => s.id !== sceneId);
    const newTotalDuration = updatedScenes.reduce((sum, s) => sum + s.duration, 0);
    setTimeline({
      ...timeline,
      scenes: updatedScenes,
      totalDuration: newTotalDuration,
      updatedAt: new Date().toISOString(),
    });
  }, [timeline, setTimeline]);

  const handleActionAdd = useCallback((sceneId: string, actionType: ActionType) => {
    if (!timeline) return;
    
    const scene = timeline.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    // Create base action
    const baseAction = {
      id: `action-${Date.now()}`,
      type: actionType,
      startTime: 0,
      duration: 1000,
      easing: 'ease-in-out' as const,
      label: `Yeni ${actionType}`,
    };

    // Type-specific properties
    let newAction: Action;
    switch (actionType) {
      case 'scroll':
        newAction = { ...baseAction, type: 'scroll', targetPosition: { x: 0, y: 100 }, smooth: true };
        break;
      case 'zoom':
        newAction = { ...baseAction, type: 'zoom', fromZoom: 1, toZoom: 1.5 };
        break;
      case 'wait':
        newAction = { ...baseAction, type: 'wait' };
        break;
      case 'animation':
        newAction = { ...baseAction, type: 'animation', animationType: 'fade-in', properties: {} };
        break;
      default:
        newAction = { ...baseAction, type: actionType } as Action;
    }

    const updatedScenes = timeline.scenes.map(s => 
      s.id === sceneId 
        ? { ...s, actions: [...s.actions, newAction], updatedAt: new Date().toISOString() }
        : s
    );

    setTimeline({
      ...timeline,
      scenes: updatedScenes,
      updatedAt: new Date().toISOString(),
    });
  }, [timeline, setTimeline]);

  const handleActionRemove = useCallback((sceneId: string, actionId: string) => {
    if (!timeline) return;
    
    const updatedScenes = timeline.scenes.map(s => 
      s.id === sceneId 
        ? { ...s, actions: s.actions.filter(a => a.id !== actionId), updatedAt: new Date().toISOString() }
        : s
    );

    setTimeline({
      ...timeline,
      scenes: updatedScenes,
      updatedAt: new Date().toISOString(),
    });
  }, [timeline, setTimeline]);

  const handleActionEdit = useCallback((sceneId: string, actionId: string) => {
    // TODO: Open action editor dialog
    console.log('Edit action:', sceneId, actionId);
  }, []);

  return (
    <Card className={cn(
      "w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700",
      isSmall && "text-xs"
    )}>
      <CardHeader className={cn(
        "pb-3 border-b border-slate-700",
        isSmall && "p-3"
      )}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center gap-2",
            isSmall && "text-sm",
            !isSmall && "text-lg"
          )}>
            <Film className={cn(
              "text-purple-400",
              isSmall && "h-5 w-5",
              !isSmall && "h-6 w-6"
            )} />
            Kayıt Stüdyosu
            {recordingState === 'recording' && (
              <Badge variant="destructive" className="animate-pulse">
                REC
              </Badge>
            )}
          </CardTitle>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={createDemoTimeline}
              className="border-slate-600 hover:bg-slate-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Demo
            </Button>
            
            {hasRecording && (
              <Button
                variant="default"
                size="sm"
                onClick={downloadRecording}
              >
                <Download className="h-4 w-4 mr-1" />
                İndir
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {/* Playback Controls */}
        <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => seekTo(0)}
            disabled={!timeline}
            className="text-white hover:bg-slate-700"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant={isPlaying ? 'secondary' : 'default'}
            size="icon"
            onClick={handlePlayPause}
            disabled={!timeline}
            className="h-12 w-12"
          >
            {isPlaying && !isPaused ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="text-white hover:bg-slate-700"
          >
            <Square className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {}}
            disabled={!timeline}
            className="text-white hover:bg-slate-700"
          >
            <SkipForward className="h-5 w-5" />
          </Button>

          <Separator orientation="vertical" className="h-8 bg-slate-600" />

          <div className="flex-1 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-sm font-bold text-purple-400">
                {formatTime(currentTime)}
              </span>
              <span className="text-slate-500">/</span>
              <span className="font-mono text-sm text-slate-400">
                {formatTime(currentScene?.duration || 0)}
              </span>
            </div>

            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                style={{ width: `${sceneProgress * 100}%` }}
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 bg-slate-600" />

          <Button
            variant={loop ? 'default' : 'ghost'}
            size="icon"
            onClick={toggleLoop}
            className={cn(
              "text-white",
              loop ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-slate-700"
            )}
          >
            <Repeat className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlaybackSpeed(Math.max(0.25, speed - 0.25))}
              className="text-white hover:bg-slate-700 h-8 px-2"
            >
              -
            </Button>
            <Badge variant="outline" className="font-mono border-slate-600 text-white">
              {speed}x
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlaybackSpeed(Math.min(4, speed + 0.25))}
              className="text-white hover:bg-slate-700 h-8 px-2"
            >
              +
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="scenes">Sahneler</TabsTrigger>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="flex-1 mt-4 border border-slate-700 rounded-lg p-0 bg-slate-800/30 overflow-hidden">
            <TimelineEditor
              timeline={timeline}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTimeChange={seekTo}
              onSceneAdd={handleSceneAdd}
              onSceneRemove={handleSceneRemove}
              onActionAdd={handleActionAdd}
              onActionRemove={handleActionRemove}
              onActionEdit={handleActionEdit}
            />
          </TabsContent>

          <TabsContent value="scenes" className="flex-1 mt-4">
            <div className="space-y-2">
              {currentScene ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{currentScene.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-400">
                    <p>{currentScene.description}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="border-slate-600">
                        {currentScene.actions.length} aksiyon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-slate-400 text-center">Sahne seçilmedi</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Otomatik Kayıt</span>
                <Button
                  variant={autoRecord ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoRecord(!autoRecord)}
                  className={autoRecord ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-600'}
                >
                  {autoRecord ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
              
              <Separator className="bg-slate-700" />
              
              <div className="space-y-2">
                <span className="text-sm">FPS: {timeline?.fps || 60}</span>
                <span className="text-sm block">
                  Çözünürlük: {timeline?.resolution.width || 1920} x {timeline?.resolution.height || 1080}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default RecordingStudio;
