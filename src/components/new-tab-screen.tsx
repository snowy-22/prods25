'use client';

import { useMemo, useState } from 'react';
import { Search, Clock, Star, Folder, Video, Calendar, Award, Settings, Plus, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type ShortcutIcon = 'folder' | 'video' | 'calendar' | 'award' | 'star' | 'clock';
type PanelKey = 'library' | 'widgets' | 'social' | 'messages' | 'notifications' | 'ai-chat';
type ShortcutAction =
  | { type: 'open-panel'; panel: PanelKey }
  | { type: 'open-tab'; tabId: string }
  | { type: 'open-url'; url: string }
  | { type: 'open-recent' };

type ShortcutConfig = {
  id: string;
  label: string;
  icon: ShortcutIcon;
  action: ShortcutAction;
};

const ICON_MAP: Record<ShortcutIcon, LucideIcon> = {
  folder: Folder,
  video: Video,
  calendar: Calendar,
  award: Award,
  star: Star,
  clock: Clock,
};

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'library', label: 'Kitaplık', icon: 'folder', action: { type: 'open-panel', panel: 'library' } },
  { id: 'videos', label: 'Videolar', icon: 'video', action: { type: 'open-url', url: 'https://www.youtube.com' } },
  { id: 'calendar', label: 'Takvim', icon: 'calendar', action: { type: 'open-url', url: 'https://calendar.google.com' } },
  { id: 'awards', label: 'Ödüller', icon: 'award', action: { type: 'open-tab', tabId: 'awards-folder' } },
  { id: 'favorites', label: 'Favoriler', icon: 'star', action: { type: 'open-tab', tabId: 'favorites' } },
  { id: 'recent', label: 'Son Ziyaretler', icon: 'clock', action: { type: 'open-recent' } },
];

const panelOptions: Array<{ value: PanelKey; label: string }> = [
  { value: 'library', label: 'Kitaplık' },
  { value: 'ai-chat', label: 'AI Asistan' },
  { value: 'widgets', label: 'Araç Takımları' },
  { value: 'social', label: 'Sosyal' },
  { value: 'notifications', label: 'Bildirimler' },
  { value: 'messages', label: 'Mesajlar' },
];

const iconOptions: Array<{ value: ShortcutIcon; label: string; icon: LucideIcon }> = [
  { value: 'folder', label: 'Klasör', icon: Folder },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'calendar', label: 'Takvim', icon: Calendar },
  { value: 'award', label: 'Ödül', icon: Award },
  { value: 'star', label: 'Favori', icon: Star },
  { value: 'clock', label: 'Zaman', icon: Clock },
];

export function NewTabScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { tabs } = useAppStore();
  const [shortcuts, setShortcuts] = useLocalStorage<ShortcutConfig[]>('new-tab-shortcuts', DEFAULT_SHORTCUTS);
  const [isEditing, setIsEditing] = useState(false);

  const recentTabs = useMemo(
    () =>
      tabs
        .filter(t => t.lastAccessedAt && t.type !== 'new-tab')
        .sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0))
        .slice(0, 8),
    [tabs]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(searchUrl, '_blank', 'noopener');
  };

  const handleShortcutAction = (shortcut: ShortcutConfig) => {
    const action = shortcut.action;
    switch (action.type) {
      case 'open-url':
        if (action.url) {
          window.open(action.url, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'open-panel':
        useAppStore.getState().setActiveSecondaryPanel(action.panel);
        useAppStore.getState().togglePanel('isSecondLeftSidebarOpen', true);
        break;
      case 'open-tab': {
        const target = tabs.find(t => t.id === action.tabId);
        if (target) {
          useAppStore.getState().setActiveTab(target.id);
        }
        break;
      }
      case 'open-recent':
        if (recentTabs[0]) {
          useAppStore.getState().setActiveTab(recentTabs[0].id);
        }
        break;
      default:
        break;
    }
  };

  const updateShortcut = (id: string, updates: Partial<ShortcutConfig>) => {
    setShortcuts(list => list.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  const updateShortcutAction = (id: string, action: ShortcutAction) => {
    setShortcuts(list => list.map(item => (item.id === id ? { ...item, action } : item)));
  };

  const handleActionTypeChange = (id: string, type: ShortcutAction['type']) => {
    switch (type) {
      case 'open-url':
        updateShortcutAction(id, { type: 'open-url', url: 'https://tv25.app' });
        break;
      case 'open-panel':
        updateShortcutAction(id, { type: 'open-panel', panel: 'library' });
        break;
      case 'open-tab':
        updateShortcutAction(id, { type: 'open-tab', tabId: tabs[0]?.id || 'root' });
        break;
      case 'open-recent':
        updateShortcutAction(id, { type: 'open-recent' });
        break;
      default:
        break;
    }
  };

  const handleAddShortcut = () => {
    const newShortcut: ShortcutConfig = {
      id: `shortcut-${Date.now()}`,
      label: 'Yeni Kısayol',
      icon: 'star',
      action: { type: 'open-url', url: 'https://tv25.app' },
    };
    setShortcuts(list => [...list, newShortcut]);
  };

  const handleRemoveShortcut = (id: string) => {
    setShortcuts(list => list.filter(item => item.id !== id));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      {/* Logo / Branding */}
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
          tv25.app
        </h1>
        <p className="text-slate-400 text-lg">Dijital alanınızı keşfedin</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Web'de ara veya URL gir..."
            className="w-full h-14 pl-12 pr-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-full focus:bg-white/15 focus:border-purple-500 transition-all"
          />
        </div>
      </form>

      {/* Shortcuts Grid */}
      <div className="w-full max-w-4xl mb-12">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-white text-xl font-semibold">Hızlı Erişim</h2>
            <div className="text-xs text-slate-400">Kısayollar cihazında saklanır ve düzenlenebilir.</div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button variant="outline" size="sm" onClick={handleAddShortcut} className="gap-1">
                <Plus className="h-4 w-4" /> Kısayol Ekle
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(edit => !edit)} className="gap-1">
              <Settings className="h-4 w-4" /> {isEditing ? 'Bitti' : 'Düzenle'}
            </Button>
          </div>
        </div>

        {!isEditing && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {shortcuts.map(shortcut => {
              const Icon = ICON_MAP[shortcut.icon] || Folder;
              return (
                <Button
                  key={shortcut.id}
                  variant="ghost"
                  onClick={() => handleShortcutAction(shortcut)}
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  <Icon className="w-8 h-8 text-purple-400" />
                  <span className="text-sm text-slate-300">{shortcut.label}</span>
                </Button>
              );
            })}
          </div>
        )}

        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcuts.map(shortcut => {
              const Icon = ICON_MAP[shortcut.icon] || Folder;
              return (
                <Card key={shortcut.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-purple-300" />
                      </div>
                      <Input
                        value={shortcut.label}
                        onChange={(e) => updateShortcut(shortcut.id, { label: e.target.value })}
                        placeholder="Kısayol adı"
                        className="bg-white/5 border-white/10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-slate-300">Simge</Label>
                        <Select
                          value={shortcut.icon}
                          onValueChange={(val) => updateShortcut(shortcut.id, { icon: val as ShortcutIcon })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-slate-300">İşlem Türü</Label>
                        <Select
                          value={shortcut.action.type}
                          onValueChange={(val) => handleActionTypeChange(shortcut.id, val as ShortcutAction['type'])}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open-panel">Panel Aç</SelectItem>
                            <SelectItem value="open-tab">Sekmeye Git</SelectItem>
                            <SelectItem value="open-url">URL Aç</SelectItem>
                            <SelectItem value="open-recent">Son Ziyareti Aç</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {shortcut.action.type === 'open-panel' && (
                      <div className="space-y-1">
                        <Label className="text-slate-300">Panel</Label>
                        <Select
                          value={shortcut.action.panel}
                          onValueChange={(val) => updateShortcutAction(shortcut.id, { type: 'open-panel', panel: val as PanelKey })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {panelOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {shortcut.action.type === 'open-tab' && (
                      <div className="space-y-1">
                        <Label className="text-slate-300">Hedef Sekme</Label>
                        <Select
                          value={shortcut.action.tabId}
                          onValueChange={(val) => updateShortcutAction(shortcut.id, { type: 'open-tab', tabId: val })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Sekme seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {tabs.map(tab => (
                              <SelectItem key={tab.id} value={tab.id}>
                                {tab.title || tab.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {shortcut.action.type === 'open-url' && (
                      <div className="space-y-1">
                        <Label className="text-slate-300">URL</Label>
                        <Input
                          value={shortcut.action.url}
                          onChange={(e) => updateShortcutAction(shortcut.id, { type: 'open-url', url: e.target.value })}
                          placeholder="https://..."
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveShortcut(shortcut.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Sil
                      </Button>
                      <div className="text-xs text-slate-400">
                        Kısayol devre dışı bırakmak için alanı boş bırakabilirsiniz.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Visited */}
      {recentTabs.length > 0 && (
        <div className="w-full max-w-4xl">
          <h2 className="text-white text-xl font-semibold mb-4">Son Ziyaret Edilen Sekmeler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentTabs.map((tab) => (
              <Card
                key={tab.id}
                className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-all group"
                onClick={() => {
                  useAppStore.getState().setActiveTab(tab.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {tab.icon && (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                        {tab.icon.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">
                        {tab.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {new Date(tab.lastAccessedAt || Date.now()).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-8 text-center text-slate-500 text-sm">
        <p>Yeni bir sekme açmak için <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl+T</kbd> tuşlarına basın</p>
      </div>
    </div>
  );
}
