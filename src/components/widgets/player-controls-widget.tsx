// src/components/widgets/player-controls-widget.tsx

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { ContentItem, PlayerControlGroup } from '@/lib/initial-content';
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2, 
  VolumeX,
  Gauge,
  Maximize,
  PictureInPicture,
  Subtitles,
  Settings,
  Repeat,
  Shuffle,
  Pin,
  MapPin,
  Plus
} from 'lucide-react';

type PlayerControlsWidgetProps = {
  item: ContentItem;
  onUpdate: (itemId: string, updates: Partial<ContentItem>) => void;
};

export default function PlayerControlsWidget({ item, onUpdate }: PlayerControlsWidgetProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  const playerControlGroups = useAppStore(state => state.playerControlGroups);
  const togglePlayerControlPin = useAppStore(state => state.togglePlayerControlPin);
  const togglePlayerControlMiniMapPin = useAppStore(state => state.togglePlayerControlMiniMapPin);
  
  // Get pinned groups
  const pinnedGroups = playerControlGroups.filter(g => g.isPinned);
  
  // Get selected group or first pinned group
  const selectedGroup = pinnedGroups.find(g => g.id === selectedGroupId) || pinnedGroups[0];
  
  // Control icons mapping
  const controlIcons = {
    'play-pause': Play,
    'stop': Square,
    'previous': SkipBack,
    'next': SkipForward,
    'volume': Volume2,
    'mute': VolumeX,
    'speed': Gauge,
    'progress': Gauge,
    'fullscreen': Maximize,
    'pip': PictureInPicture,
    'subtitle': Subtitles,
    'quality': Settings,
    'loop': Repeat,
    'shuffle': Shuffle
  };
  
  if (pinnedGroups.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
        <Settings className="w-12 h-12 text-blue-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Oynatıcı Kontrolleri</h3>
          <p className="text-sm text-slate-400 mb-4">
            Henüz sabitlenmiş oynatıcı grubu yok.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {/* Open player control group creator */}}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Grup Oluştur
          </motion.button>
        </div>
      </div>
    );
  }
  
  if (!selectedGroup) return null;
  
  // Layout classes based on group layout
  const layoutClass = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
    grid: 'grid grid-cols-3'
  }[selectedGroup.layout];
  
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">{selectedGroup.name}</h3>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded",
            selectedGroup.type === 'smart' 
              ? "bg-purple-500/20 text-purple-400" 
              : "bg-blue-500/20 text-blue-400"
          )}>
            {selectedGroup.type === 'smart' ? 'Akıllı' : 'Tanımlı'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {pinnedGroups.length > 1 && (
            <select
              value={selectedGroup.id}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded px-2 py-1"
            >
              {pinnedGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePlayerControlPin(selectedGroup.id, false)}
            className="p-1.5 rounded hover:bg-slate-800 text-blue-400 hover:text-blue-300 transition-colors"
            title="Widget'tan kaldır"
          >
            <Pin className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePlayerControlMiniMapPin(selectedGroup.id, !selectedGroup.isPinnedToMiniMap)}
            className={cn(
              "p-1.5 rounded transition-colors",
              selectedGroup.isPinnedToMiniMap
                ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                : "hover:bg-slate-800 text-slate-400 hover:text-orange-400"
            )}
            title={selectedGroup.isPinnedToMiniMap ? "Mini Map'ten kaldır" : "Mini Map'e sabitle"}
          >
            <MapPin className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex-1 p-4 overflow-auto">
        <div className={cn("flex items-center justify-center gap-3 flex-wrap", layoutClass)}>
          {selectedGroup.controls.map((controlType) => {
            const IconComponent = controlIcons[controlType];
            if (!IconComponent) return null;
            
            return (
              <motion.button
                key={controlType}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {/* Execute control action */}}
                className={cn(
                  "p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50",
                  "border border-slate-700/50 text-slate-300 hover:text-white",
                  "transition-all shadow-lg"
                )}
                title={controlType}
              >
                <IconComponent className="w-5 h-5" />
              </motion.button>
            );
          })}
        </div>
        
        {/* Player Info */}
        {selectedGroup.type === 'defined' && selectedGroup.playerIds && (
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
            <div className="text-xs text-slate-400 mb-1">Kontrol edilen oynatıcılar:</div>
            <div className="text-sm text-slate-300 font-mono">
              {selectedGroup.playerIds.length} oynatıcı
            </div>
          </div>
        )}
        
        {selectedGroup.type === 'smart' && (
          <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-700/30">
            <div className="text-xs text-purple-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              Akıllı mod: Tüm aktif oynatıcıları otomatik kontrol eder
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{selectedGroup.controls.length} kontrol</span>
          <div className="flex items-center gap-3">
            {selectedGroup.isPinned && (
              <span className="flex items-center gap-1 text-blue-400">
                <Pin className="w-3 h-3" />
                Widget'a sabitlendi
              </span>
            )}
            {selectedGroup.isPinnedToMiniMap && (
              <span className="flex items-center gap-1 text-orange-400">
                <MapPin className="w-3 h-3" />
                Mini Map'te
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
