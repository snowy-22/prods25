'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { SceneEditor } from '@/components/scene/scene-editor';
import { PresentationTimeline } from '@/components/presentation/presentation-timeline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Play,
  Eye,
  Code2,
} from 'lucide-react';
import { RemoteControlConfig } from '@/lib/scene-types';

interface ViewportEditorProps {
  presentationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewportEditor: React.FC<ViewportEditorProps> = ({
  presentationId,
  isOpen,
  onClose,
}) => {
  const {
    presentations,
    scenes,
    currentSceneId,
    setCurrentScene,
    viewportEditorState,
    updateViewportEditorState,
    updateScene,
    createScene,
  } = useAppStore();

  const { toast } = useToast();

  const presentation = presentations.find((p) => p.id === presentationId);
  const presentationScenes = scenes.filter(
    (s) => s.presentation_id === presentationId
  );
  const currentScene = scenes.find((s) => s.id === currentSceneId);

  const [sceneEditorOpen, setSceneEditorOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [dividerX, setDividerX] = useState(60); // 60% left, 40% right
  const [codeText, setCodeText] = useState('');
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [newRemoteName, setNewRemoteName] = useState('');
  const [newRemoteTarget, setNewRemoteTarget] = useState<'scene' | 'folder' | 'item'>('scene');

  const remoteControls = viewportEditorState.remoteControls || [];

  useEffect(() => {
    if (currentScene) {
      const json = JSON.stringify(currentScene, null, 2);
      setCodeText(json);
      setCodeHistory([json]);
    }
  }, [currentSceneId]);

  if (!isOpen || !presentation) return null;

  // Navigate scenes
  const currentSceneIdx = presentationScenes.findIndex(
    (s) => s.id === currentSceneId
  );

  const goToPreviousScene = () => {
    if (currentSceneIdx > 0) {
      setCurrentScene(presentationScenes[currentSceneIdx - 1].id);
    }
  };

  const goToNextScene = () => {
    if (currentSceneIdx < presentationScenes.length - 1) {
      setCurrentScene(presentationScenes[currentSceneIdx + 1].id);
    }
  };

  const handleApplyCode = async () => {
    if (!currentScene) return;
    try {
      const parsed = JSON.parse(codeText);
      await updateScene(currentScene.id, {
        ...parsed,
        id: currentScene.id,
        presentation_id: presentationId,
      });
      setCodeHistory((prev) => [...prev, codeText].slice(-10));
      toast({ title: 'Kaydedildi', description: 'Sahne kodu güncellendi.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Kod hatası',
        description: error?.message || 'JSON parse başarısız',
      });
    }
  };

  const handleUndoCode = () => {
    if (codeHistory.length <= 1) return;
    const nextHistory = [...codeHistory];
    nextHistory.pop();
    const previous = nextHistory[nextHistory.length - 1];
    setCodeHistory(nextHistory);
    setCodeText(previous);
  };

  const handleRevertCode = () => {
    if (codeHistory.length === 0) return;
    setCodeText(codeHistory[0]);
    setCodeHistory([codeHistory[0]]);
  };

  const handleSaveAs = async () => {
    if (!currentScene) return;
    try {
      const parsed = JSON.parse(codeText);
      const newTitle = parsed.title ? `${parsed.title} (Kopya)` : `${currentScene.title} (Kopya)`;
      const newScene = await createScene(presentationId, newTitle);
      await updateScene(newScene.id, {
        ...parsed,
        id: newScene.id,
        presentation_id: presentationId,
        title: newTitle,
      });
      toast({ title: 'Farklı kaydedildi', description: `${newTitle} oluşturuldu.` });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Farklı kaydet hatası',
        description: error?.message || 'JSON parse başarısız',
      });
    }
  };

  const addRemoteControl = () => {
    if (!newRemoteName.trim()) return;
    const updated: RemoteControlConfig[] = [
      ...remoteControls,
      {
        id: `remote-${Date.now()}`,
        name: newRemoteName.trim(),
        target: newRemoteTarget,
        targetId: currentSceneId || undefined,
        actions: [],
      },
    ];
    updateViewportEditorState({ remoteControls: updated });
    setNewRemoteName('');
  };

  const togglePinRemote = (id: string) => {
    const updated = remoteControls.map((r) =>
      r.id === id ? { ...r, isPinned: !r.isPinned } : r
    );
    updateViewportEditorState({ remoteControls: updated });
  };

  const handleDividerDrag = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startDivider = dividerX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const containerWidth = window.innerWidth;
      const newDivider = startDivider + (diff / containerWidth) * 100;
      setDividerX(Math.max(20, Math.min(80, newDivider)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* Main Editor Container */}
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between border-b bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">{presentation.title}</h1>
            <Select
              value={currentSceneId || ''}
              onValueChange={(val) => setCurrentScene(val)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sahne seçin" />
              </SelectTrigger>
              <SelectContent>
                {presentationScenes.map((scene, idx) => (
                  <SelectItem key={scene.id} value={scene.id}>
                    {idx + 1}. {scene.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* Scene Navigation */}
            <Button
              size="sm"
              variant="outline"
              onClick={goToPreviousScene}
              disabled={currentSceneIdx === 0}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {currentSceneIdx + 1} / {presentationScenes.length}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={goToNextScene}
              disabled={currentSceneIdx === presentationScenes.length - 1}
              className="h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />

            {/* Preview Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className={
                showPreview ? 'bg-blue-50 dark:bg-blue-950' : ''
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              Önizleme
            </Button>

            {/* Settings */}
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>

            {/* Close */}
            <Button size="sm" variant="ghost" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Scene Editor */}
          <div
            className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800 border-r dark:border-slate-700"
            style={{ width: `${dividerX}%` }}
          >
            {currentScene ? (
              <div className="p-4 h-full">
                <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 h-full flex items-center justify-center bg-white dark:bg-slate-900">
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="inline-block rounded-lg bg-slate-100 dark:bg-slate-800 p-4">
                        <span className="text-4xl">📐</span>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{currentScene.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {currentScene.width}x{currentScene.height}px
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setSceneEditorOpen(true)}
                    >
                      Düzenle
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Sahne seçiniz
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            className="w-1 bg-slate-300 hover:bg-blue-500 cursor-col-resize dark:bg-slate-600 hover:dark:bg-blue-400 transition-colors"
            onMouseDown={handleDividerDrag}
          />

          {/* Right: Timeline & Settings */}
          <div
            className="flex flex-col border-l dark:border-slate-700"
            style={{ width: `${100 - dividerX}%` }}
          >
            {/* Quick Actions */}
            <div className="border-b p-3 dark:border-slate-700 space-y-2">
              <Button
                size="sm"
                className="w-full"
                onClick={() => setSceneEditorOpen(true)}
              >
                Sahneyi Düzenle
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                Oynat
              </Button>
            </div>

            {/* Code View & Controls */}
            <div className="border-b p-3 dark:border-slate-700 space-y-3 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" onClick={handleApplyCode} disabled={!currentScene}>
                  Kaydet
                </Button>
                <Button size="sm" variant="outline" onClick={handleUndoCode} disabled={codeHistory.length <= 1}>
                  Geri Al
                </Button>
                <Button size="sm" variant="outline" onClick={handleRevertCode} disabled={codeHistory.length === 0}>
                  Başlangıca Dön
                </Button>
                <Button size="sm" variant="outline" onClick={handleSaveAs} disabled={!currentScene}>
                  Farklı Kaydet
                </Button>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Mevcut tuval kodu (JSON). Güncellemeler iki yönlü senkronizedir.</div>
              <textarea
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                className="w-full h-64 rounded border bg-slate-50 dark:bg-slate-800 text-sm font-mono p-2 focus:outline-none focus:ring"
                spellCheck={false}
              />
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
              <PresentationTimeline
                presentationId={presentationId}
                isOpen={true}
                onClose={() => {}}
              />
            </div>

            {/* Remote Controls */}
            <div className="border-t p-3 dark:border-slate-700 space-y-3 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Akıllı Kumandalar</h4>
                <span className="text-xs text-slate-500">{remoteControls.length} adet</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <input
                  className="flex-1 min-w-[140px] rounded border px-2 py-1 text-sm bg-slate-50 dark:bg-slate-800"
                  placeholder="Kumanda adı"
                  value={newRemoteName}
                  onChange={(e) => setNewRemoteName(e.target.value)}
                />
                <Select value={newRemoteTarget} onValueChange={(val) => setNewRemoteTarget(val as any)}>
                  <SelectTrigger className="w-28 h-9">
                    <SelectValue placeholder="Hedef" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scene">Sahne</SelectItem>
                    <SelectItem value="folder">Klasör</SelectItem>
                    <SelectItem value="item">Öğe</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={addRemoteControl}>Ekle</Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-auto">
                {remoteControls.length === 0 && (
                  <div className="text-sm text-slate-500">Henüz kumanda yok.</div>
                )}
                {remoteControls.map((remote) => (
                  <div
                    key={remote.id}
                    className="rounded border p-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800"
                  >
                    <div>
                      <div className="font-semibold text-sm">{remote.name}</div>
                      <div className="text-xs text-slate-500">Hedef: {remote.target}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="xs" variant="outline" onClick={() => togglePinRemote(remote.id)}>
                        {remote.isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scene Editor Modal */}
        <SceneEditor
          sceneId={currentSceneId || ''}
          isOpen={sceneEditorOpen}
          onClose={() => setSceneEditorOpen(false)}
        />
      </div>
    </>
  );
};
