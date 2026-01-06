'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Scene, Animation, TransitionType } from '@/lib/scene-types';
import { ContentItem } from '@/lib/initial-content';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  ChevronDown,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  ZoomIn,
  ZoomOut,
  Move,
  Square,
  Maximize2,
  Grid3x3,
  Settings,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface SceneEditorProps {
  sceneId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({
  sceneId,
  isOpen,
  onClose,
}) => {
  const {
    scenes,
    currentSceneId,
    setCurrentScene,
    updateScene,
    addSceneAnimation,
    updateViewportEditorState,
    viewportEditorState,
  } = useAppStore();

  const scene = scenes.find((s) => s.id === sceneId);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [animationSettingsOpen, setAnimationSettingsOpen] = useState(false);
  const [selectedAnimationId, setSelectedAnimationId] = useState<string | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen || !scene) return null;

  // Canvas event handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('scene-item')) {
      const itemElement = (e.target as HTMLElement).closest('[data-item-id]');
      if (itemElement) {
        const itemId = itemElement.getAttribute('data-item-id');
        if (itemId) {
          const rect = itemElement.getBoundingClientRect();
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          setDraggedItemId(itemId);

          if (!e.ctrlKey && !e.metaKey) {
            setSelectedItemIds([itemId]);
          } else {
            setSelectedItemIds((prev) =>
              prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId]
            );
          }
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedItemId && canvasRef.current) {
      const items = (scene.items || []).map((item: any) => {
        if (item.id === draggedItemId) {
          let newX = e.clientX - dragOffset.x;
          let newY = e.clientY - dragOffset.y;

          if (snapToGrid) {
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          return {
            ...item,
            x: newX,
            y: newY,
          };
        }
        return item;
      });

      updateScene(sceneId, { items } as any);
    }
  };

  const handleMouseUp = () => {
    setDraggedItemId(null);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? zoom * 1.2 : zoom / 1.2;
    setZoom(Math.min(3, Math.max(0.1, newZoom)));
    updateViewportEditorState({
      zoom: Math.min(3, Math.max(0.1, newZoom)),
    });
  };

  const handleDuplicateItem = (itemId: string) => {
    const item = (scene.items || []).find((i: any) => i.id === itemId);
    if (item) {
      const newItem = {
        ...item,
        id: `item-${Date.now()}`,
        x: (item.x || 0) + 20,
        y: (item.y || 0) + 20,
      };
      updateScene(sceneId, {
        items: [...(scene.items || []), newItem],
      } as any);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const newItems = (scene.items || []).filter((i: any) => i.id !== itemId);
    updateScene(sceneId, { items: newItems } as any);
    setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
  };

  const handleAddAnimation = () => {
    if (selectedItemIds.length === 0) return;

    const newAnimation: Animation = {
      id: `anim-${Date.now()}`,
      item_id: selectedItemIds[0],
      name: 'Yeni Animasyon',
      keyframes: [
        { timestamp: 0, properties: {} },
        { timestamp: 1, properties: { opacity: 1 } },
      ],
      loop: false,
      loopCount: 1,
      autoPlay: true,
      startDelay: 0,
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addSceneAnimation(sceneId, newAnimation);
    setSelectedAnimationId(newAnimation.id);
  };

  return (
    <>
      {/* Editor Container */}
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Sahne Editörü: {scene.title}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleZoom('out')}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-sm font-medium">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleZoom('in')}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(1)}
                className="h-8 px-2"
              >
                100%
              </Button>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowGrid(!showGrid)}
                className={showGrid ? 'bg-blue-50 dark:bg-blue-950' : ''}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>

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
            </div>

            {/* Close */}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800">
            <div
              ref={canvasRef}
              className="relative inline-block min-h-full min-w-full"
              style={{
                width: `${(scene.width || 1920) * zoom}px`,
                height: `${(scene.height || 1080) * zoom}px`,
                padding: '20px',
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Canvas Background */}
              <div
                className="absolute inset-0 rounded border-2 border-slate-300 dark:border-slate-600"
                style={{
                  backgroundColor:
                    scene.background?.type === 'color'
                      ? scene.background?.value
                      : '#ffffff',
                  backgroundImage:
                    scene.background?.type === 'image'
                      ? `url(${scene.background?.value})`
                      : undefined,
                }}
              >
                {/* Grid */}
                {showGrid && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(200, 200, 200, 0.05) 25%, rgba(200, 200, 200, 0.05) 26%, transparent 27%, transparent 74%, rgba(200, 200, 200, 0.05) 75%, rgba(200, 200, 200, 0.05) 76%, transparent 77%, transparent)`,
                      backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
                    }}
                  />
                )}

                {/* Items */}
                {(scene.items || []).map((item: any) => (
                  <SceneItemElement
                    key={item.id}
                    item={item}
                    isSelected={selectedItemIds.includes(item.id)}
                    onSelect={() => {
                      if (!event?.ctrlKey && !event?.metaKey) {
                        setSelectedItemIds([item.id]);
                      }
                    }}
                    zoom={zoom}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panels */}
          <div className="w-80 border-l bg-white dark:border-slate-700 dark:bg-slate-900 flex flex-col">
            <Tabs defaultValue="properties" className="flex-1 flex flex-col">
              <TabsList className="m-4 grid grid-cols-2">
                <TabsTrigger value="properties">Özellikler</TabsTrigger>
                <TabsTrigger value="animations">Animasyonlar</TabsTrigger>
              </TabsList>

              {/* Properties Tab */}
              <TabsContent
                value="properties"
                className="flex-1 overflow-hidden flex flex-col m-0"
              >
                <ScrollArea className="flex-1">
                  <div className="space-y-4 p-4">
                    {selectedItemIds.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">Öğe seçiniz</p>
                      </div>
                    ) : (
                      <>
                        {selectedItemIds.map((itemId) => {
                          const item = (scene.items || []).find(
                            (i: any) => i.id === itemId
                          );
                          return (
                            <SceneItemProperties
                              key={itemId}
                              item={item}
                              onUpdate={(updates) => {
                                const newItems = (scene.items || []).map(
                                  (i: any) =>
                                    i.id === itemId ? { ...i, ...updates } : i
                                );
                                updateScene(sceneId, {
                                  items: newItems,
                                } as any);
                              }}
                              onDuplicate={() => handleDuplicateItem(itemId)}
                              onDelete={() => handleDeleteItem(itemId)}
                            />
                          );
                        })}

                        {/* Add Animation Button */}
                        <Button
                          onClick={handleAddAnimation}
                          className="w-full"
                          variant="outline"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Animasyon Ekle
                        </Button>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Animations Tab */}
              <TabsContent
                value="animations"
                className="flex-1 overflow-hidden flex flex-col m-0"
              >
                <ScrollArea className="flex-1">
                  <div className="space-y-3 p-4">
                    {(scene.animations || []).length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">Animasyon yok</p>
                      </div>
                    ) : (
                      (scene.animations || []).map((anim: Animation) => (
                        <AnimationListItem
                          key={anim.id}
                          animation={anim}
                          isSelected={selectedAnimationId === anim.id}
                          onSelect={() => setSelectedAnimationId(anim.id)}
                          onEdit={() => setAnimationSettingsOpen(true)}
                          onDelete={() => {
                            const newAnims = (scene.animations || []).filter(
                              (a: any) => a.id !== anim.id
                            );
                            updateScene(sceneId, {
                              animations: newAnims,
                            } as any);
                          }}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Animation Settings Dialog */}
      <Dialog open={animationSettingsOpen} onOpenChange={setAnimationSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Animasyon Ayarları</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Döngü</label>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Döngüye Al</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnimationSettingsOpen(false)}>
              İptal
            </Button>
            <Button onClick={() => setAnimationSettingsOpen(false)}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Scene Item Element Component
 */
interface SceneItemElementProps {
  item: any;
  isSelected: boolean;
  onSelect: () => void;
  zoom: number;
}

const SceneItemElement: React.FC<SceneItemElementProps> = ({
  item,
  isSelected,
  onSelect,
  zoom,
}) => (
  <div
    data-item-id={item.id}
    className={`scene-item absolute rounded border-2 transition-colors cursor-move ${
      isSelected
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
        : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
    }`}
    style={{
      left: `${(item.x || 0) * zoom}px`,
      top: `${(item.y || 0) * zoom}px`,
      width: `${(item.width || 100) * zoom}px`,
      height: `${(item.height || 100) * zoom}px`,
      opacity: item.opacity || 1,
    }}
    onClick={onSelect}
  >
    <div className="flex h-full items-center justify-center p-2 text-center">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {item.title || 'Öğe'}
      </span>
    </div>
  </div>
);

/**
 * Scene Item Properties Panel
 */
interface SceneItemPropertiesProps {
  item: any;
  onUpdate: (updates: any) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const SceneItemProperties: React.FC<SceneItemPropertiesProps> = ({
  item,
  onUpdate,
  onDuplicate,
  onDelete,
}) => (
  <div className="rounded-lg border p-3 dark:border-slate-700">
    <div className="mb-3 flex items-center justify-between">
      <h4 className="font-medium text-sm">{item.title || 'Adsız Öğe'}</h4>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={onDuplicate}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>

    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">X</label>
          <Input
            type="number"
            value={item.x || 0}
            onChange={(e) => onUpdate({ x: parseFloat(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">Y</label>
          <Input
            type="number"
            value={item.y || 0}
            onChange={(e) => onUpdate({ y: parseFloat(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">
            Genişlik
          </label>
          <Input
            type="number"
            value={item.width || 100}
            onChange={(e) => onUpdate({ width: parseFloat(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400">
            Yükseklik
          </label>
          <Input
            type="number"
            value={item.height || 100}
            onChange={(e) => onUpdate({ height: parseFloat(e.target.value) })}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-600 dark:text-slate-400">
          Opaklık
        </label>
        <Slider
          value={[(item.opacity || 1) * 100]}
          onValueChange={(val) => onUpdate({ opacity: val[0] / 100 })}
          max={100}
          step={1}
          className="mt-1"
        />
      </div>
    </div>
  </div>
);

/**
 * Animation List Item
 */
interface AnimationListItemProps {
  animation: Animation;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AnimationListItem: React.FC<AnimationListItemProps> = ({
  animation,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => (
  <div
    className={`rounded-lg border p-3 cursor-pointer transition-colors ${
      isSelected
        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
    }`}
    onClick={onSelect}
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium text-sm">{animation.name}</h4>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400">
      <div className="flex items-center justify-between">
        <span>{animation.keyframes.length} Keyframe</span>
        {animation.autoPlay && (
          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs dark:bg-green-950 dark:text-green-200">
            Otomatik
          </span>
        )}
      </div>
    </div>
  </div>
);
