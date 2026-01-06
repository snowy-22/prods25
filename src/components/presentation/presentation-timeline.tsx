'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Scene, Presentation, TransitionType } from '@/lib/scene-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  ChevronRight,
  Copy,
  Trash2,
  Plus,
  Play,
  Pause,
  Settings,
  ChevronDown,
  Eye,
  Maximize,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TRANSITION_TYPES: TransitionType[] = [
  'fade',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'zoom-in',
  'zoom-out',
  'rotate',
  'flip',
  'scale-bounce',
  'blur',
  'pixelate',
  'wave',
  'curtain',
  'vignette',
  'morph',
];

interface PresentationTimelineProps {
  presentationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationTimeline: React.FC<PresentationTimelineProps> = ({
  presentationId,
  isOpen,
  onClose,
}) => {
  const {
    presentations,
    scenes,
    currentSceneId,
    setCurrentScene,
    createScene,
    deleteScene,
    updateScene,
    updatePresentation,
    updateViewportEditorState,
  } = useAppStore();

  const presentation = presentations.find((p) => p.id === presentationId);
  const presentationScenes = scenes.filter(
    (s) => s.presentation_id === presentationId
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    presentationScenes[0]?.id || null
  );
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);
  const [selectedTransition, setSelectedTransition] =
    useState<TransitionType>('fade');
  const [transitionDuration, setTransitionDuration] = useState(500);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);

  if (!isOpen || !presentation) return null;

  // Calculate total duration
  const totalDuration = presentationScenes.reduce(
    (sum, scene) => sum + (scene.duration || 5000),
    0
  );

  // Handle scene reordering
  const handleDragStart = (sceneId: string) => {
    setDraggedSceneId(sceneId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropScene = async (targetSceneId: string) => {
    if (!draggedSceneId || draggedSceneId === targetSceneId) return;

    const draggedIdx = presentationScenes.findIndex(
      (s) => s.id === draggedSceneId
    );
    const targetIdx = presentationScenes.findIndex(
      (s) => s.id === targetSceneId
    );

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newScenes = [...presentationScenes];
    const [removed] = newScenes.splice(draggedIdx, 1);
    newScenes.splice(targetIdx, 0, removed);

    // Update order
    for (let i = 0; i < newScenes.length; i++) {
      await updateScene(newScenes[i].id, { order: i } as any);
    }

    setDraggedSceneId(null);
  };

  const handleAddScene = async () => {
    const newScene = await createScene(
      presentationId,
      `Sahne ${presentationScenes.length + 1}`
    );
    setSelectedSceneId(newScene.id);
    setCurrentScene(newScene.id);
  };

  const handleDeleteScene = async () => {
    if (sceneToDelete) {
      await deleteScene(sceneToDelete);
      if (selectedSceneId === sceneToDelete) {
        setSelectedSceneId(presentationScenes[0]?.id || null);
      }
      setSceneToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleDuplicateScene = async (sceneId: string) => {
    const sceneIdx = presentationScenes.findIndex((s) => s.id === sceneId);
    if (sceneIdx === -1) return;

    const sceneToDuplicate = presentationScenes[sceneIdx];
    const newScene = await createScene(
      presentationId,
      `${sceneToDuplicate.title} (Kopya)`
    );

    // Copy properties
    await updateScene(newScene.id, {
      background: sceneToDuplicate.background,
      items: [...(sceneToDuplicate.items || [])],
      duration: sceneToDuplicate.duration,
      transition: sceneToDuplicate.transition,
      animations: [...(sceneToDuplicate.animations || [])],
    } as any);
  };

  const handleApplyTransition = async (sceneId: string) => {
    await updateScene(sceneId, {
      transition: {
        type: selectedTransition,
        duration: transitionDuration,
        ease: 'ease-in-out',
      },
    } as any);

    setTransitionDialogOpen(false);
  };

  return (
    <>
      {/* Timeline Panel */}
      <div className="fixed bottom-0 left-0 right-0 h-72 bg-white dark:bg-slate-900 border-t dark:border-slate-700 shadow-lg z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Sunum Zaman Çizelgesi</h2>
            <Badge variant="secondary">
              {presentationScenes.length} Sahne
            </Badge>
            <Badge variant="outline">
              {Math.round(totalDuration / 1000)}s
            </Badge>
          </div>

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

            <Button size="sm" variant="outline" onClick={handleAddScene}>
              <Plus className="mr-2 h-4 w-4" />
              Sahne Ekle
            </Button>

            <Button size="sm" variant="ghost" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="flex-1 flex flex-col m-0">
          <TabsList className="m-3 grid w-auto grid-cols-2">
            <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent
            value="timeline"
            className="flex-1 overflow-hidden m-0 flex flex-col"
          >
            <ScrollArea className="flex-1">
              <div className="flex gap-2 p-4">
                {presentationScenes.map((scene, idx) => (
                  <TimelineSceneCard
                    key={scene.id}
                    scene={scene}
                    sceneIndex={idx}
                    isSelected={selectedSceneId === scene.id}
                    onSelect={() => {
                      setSelectedSceneId(scene.id);
                      setCurrentScene(scene.id);
                    }}
                    onDragStart={() => handleDragStart(scene.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropScene(scene.id)}
                    onDuplicate={() => handleDuplicateScene(scene.id)}
                    onDelete={() => {
                      setSceneToDelete(scene.id);
                      setDeleteConfirmOpen(true);
                    }}
                    onTransition={() => {
                      setSelectedSceneId(scene.id);
                      setTransitionDialogOpen(true);
                    }}
                    totalDuration={totalDuration}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent
            value="settings"
            className="flex-1 overflow-hidden m-0 flex flex-col"
          >
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                <PresentationSettings
                  presentation={presentation}
                  onUpdate={(updates) =>
                    updatePresentation(presentationId, updates)
                  }
                />

                {selectedSceneId && (
                  <SceneSettings
                    scene={presentationScenes.find(
                      (s) => s.id === selectedSceneId
                    )}
                    onUpdate={(updates) =>
                      updateScene(selectedSceneId, updates)
                    }
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transition Dialog */}
      <Dialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Geçiş Efekti Ayarla</DialogTitle>
            <DialogDescription>
              Sahne geçişini özelleştirin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Geçiş Türü</label>
              <Select
                value={selectedTransition}
                onValueChange={(val: any) => setSelectedTransition(val)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSITION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type
                        .split('-')
                        .map(
                          (w) => w.charAt(0).toUpperCase() + w.slice(1)
                        )
                        .join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                Süre (ms): {transitionDuration}
              </label>
              <Slider
                value={[transitionDuration]}
                onValueChange={(val) => setTransitionDuration(val[0])}
                min={100}
                max={2000}
                step={50}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransitionDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              onClick={() =>
                handleApplyTransition(selectedSceneId || '')
              }
            >
              Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Sahneyi Sil?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu sahne silinecektir. Bu işlem geri alınamaz.
          </AlertDialogDescription>
          <div className="flex gap-4">
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteScene}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/**
 * Timeline Scene Card
 */
interface TimelineSceneCardProps {
  scene: Scene;
  sceneIndex: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTransition: () => void;
  totalDuration: number;
}

const TimelineSceneCard: React.FC<TimelineSceneCardProps> = ({
  scene,
  sceneIndex,
  isSelected,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDuplicate,
  onDelete,
  onTransition,
  totalDuration,
}) => {
  const cardWidth = Math.max(80, (scene.duration || 5000) / (totalDuration / 200));

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex-shrink-0 rounded-lg border-2 p-2 transition-all cursor-move ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
      }`}
      style={{ width: `${cardWidth}px` }}
      onClick={onSelect}
    >
      {/* Content */}
      <div className="space-y-2">
        {/* Thumbnail */}
        <div className="rounded bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 aspect-video flex items-center justify-center text-xs text-slate-600 dark:text-slate-400">
          <span>{sceneIndex + 1}</span>
        </div>

        {/* Info */}
        <div className="space-y-1 text-xs">
          <h4 className="font-medium truncate">{scene.title}</h4>
          <p className="text-slate-500 dark:text-slate-400">
            {Math.round((scene.duration || 5000) / 1000)}s
          </p>

          {scene.transition && (
            <Badge variant="secondary" className="text-xs">
              {(scene.transition as any).type}
            </Badge>
          )}
        </div>

        {/* Actions */}
        {isSelected && (
          <div className="flex gap-1 pt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onTransition();
              }}
              title="Geçiş"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              title="Kopya"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-600 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Sil"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Presentation Settings
 */
interface PresentationSettingsProps {
  presentation: Presentation;
  onUpdate: (updates: Partial<Presentation>) => void;
}

const PresentationSettings: React.FC<PresentationSettingsProps> = ({
  presentation,
  onUpdate,
}) => {
  const settings = presentation.settings || {};

  return (
    <div className="rounded-lg border p-4 dark:border-slate-700">
      <h3 className="font-semibold mb-4 text-sm">Sunum Ayarları</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Başlık</label>
          <Input
            value={presentation.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Açıklama</label>
          <Input
            value={presentation.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="mt-1"
            placeholder="Sunum açıklaması..."
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.autoPlay || false}
              onChange={(e) =>
                onUpdate({
                  settings: { ...settings, autoPlay: e.target.checked },
                })
              }
              className="rounded"
            />
            <label className="text-sm">Otomatik Oynat</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.loop || false}
              onChange={(e) =>
                onUpdate({
                  settings: { ...settings, loop: e.target.checked },
                })
              }
              className="rounded"
            />
            <label className="text-sm">Döngüye Al</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.recordingEnabled || false}
              onChange={(e) =>
                onUpdate({
                  settings: { ...settings, recordingEnabled: e.target.checked },
                })
              }
              className="rounded"
            />
            <label className="text-sm">Kaydı Etkinleştir</label>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Scene Settings
 */
interface SceneSettingsProps {
  scene: Scene | undefined;
  onUpdate: (updates: any) => void;
}

const SceneSettings: React.FC<SceneSettingsProps> = ({ scene, onUpdate }) => {
  if (!scene) return null;

  return (
    <div className="rounded-lg border p-4 dark:border-slate-700">
      <h3 className="font-semibold mb-4 text-sm">Sahne Ayarları</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Sahne Adı</label>
          <Input
            value={scene.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Süre (ms): {scene.duration}
          </label>
          <Slider
            value={[scene.duration || 5000]}
            onValueChange={(val) => onUpdate({ duration: val[0] })}
            min={1000}
            max={30000}
            step={500}
            className="mt-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={scene.auto_advance || false}
            onChange={(e) => onUpdate({ auto_advance: e.target.checked })}
            className="rounded"
          />
          <label className="text-sm">Otomatik İleri</label>
        </div>
      </div>
    </div>
  );
};
