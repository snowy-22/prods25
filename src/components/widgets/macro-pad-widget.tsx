'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { ContentItem, MacroPadLayout, MacroDefinition } from '@/lib/initial-content';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipForward, 
  SkipBack,
  Zap,
  Settings,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

type MacroPadWidgetProps = {
  item: ContentItem;
  onUpdate: (itemId: string, updates: Partial<ContentItem>) => void;
};

export function MacroPadWidget({ item, onUpdate }: MacroPadWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const macroPadLayouts = useAppStore(state => state.macroPadLayouts);
  const macros = useAppStore(state => state.macros);
  const activeMacroPadLayoutId = useAppStore(state => state.activeMacroPadLayoutId);
  const executeMacro = useAppStore(state => state.executeMacro);
  const setActiveMacroPadLayout = useAppStore(state => state.setActiveMacroPadLayout);
  
  // Get active layout or first available
  const activeLayout = macroPadLayouts.find(l => l.id === activeMacroPadLayoutId) || macroPadLayouts[0];
  
  // If no layouts exist, show setup UI
  if (!activeLayout) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
        <Zap className="w-12 h-12 text-purple-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Makro Pad</h3>
          <p className="text-sm text-slate-400 mb-4">
            Henüz makro pad layoutu oluşturulmamış.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {/* Open macro pad editor */}}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Layout Oluştur
          </motion.button>
        </div>
      </div>
    );
  }
  
  // Get button size class
  const buttonSizeClass = {
    small: 'h-12',
    medium: 'h-16',
    large: 'h-20'
  }[activeLayout.buttonSize];
  
  // Get icon for macro
  const getIconForMacro = (macro: MacroDefinition) => {
    if (macro.icon === 'play') return Play;
    if (macro.icon === 'pause') return Pause;
    if (macro.icon === 'volume') return Volume2;
    if (macro.icon === 'mute') return VolumeX;
    if (macro.icon === 'skip-forward') return SkipForward;
    if (macro.icon === 'skip-back') return SkipBack;
    if (macro.icon === 'zap') return Zap;
    return Zap; // Default icon
  };
  
  // Handle macro execution
  const handleMacroClick = async (macroId: string) => {
    await executeMacro(macroId);
  };
  
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">{activeLayout.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {macroPadLayouts.length > 1 && (
            <select
              value={activeLayout.id}
              onChange={(e) => setActiveMacroPadLayout(e.target.value)}
              className="text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded px-2 py-1"
            >
              {macroPadLayouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Düzenle"
          >
            {isEditing ? <Settings className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
      
      {/* Macro Pad Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div 
          className="grid gap-2 h-full"
          style={{
            gridTemplateColumns: `repeat(${activeLayout.columns}, 1fr)`,
            gridTemplateRows: `repeat(${activeLayout.rows}, 1fr)`
          }}
        >
          {activeLayout.buttons.map((button) => {
            const macro = macros.find(m => m.id === button.macroId);
            if (!macro) return null;
            
            const IconComponent = getIconForMacro(macro);
            const buttonColor = button.customColor || macro.color || '#8b5cf6'; // purple default
            
            return (
              <motion.button
                key={button.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMacroClick(macro.id)}
                disabled={!macro.isEnabled}
                className={cn(
                  buttonSizeClass,
                  "rounded-lg flex flex-col items-center justify-center gap-1 transition-all",
                  "border border-slate-700/50 shadow-lg",
                  macro.isEnabled 
                    ? "opacity-100 cursor-pointer" 
                    : "opacity-50 cursor-not-allowed"
                )}
                style={{
                  gridColumn: `${button.position.col} / span ${button.span?.cols || 1}`,
                  gridRow: `${button.position.row} / span ${button.span?.rows || 1}`,
                  backgroundColor: `${buttonColor}33`, // 20% opacity
                  color: buttonColor
                }}
              >
                {activeLayout.showIcons && (
                  <IconComponent className="w-6 h-6" />
                )}
                {activeLayout.showLabels && (
                  <span className="text-xs font-medium">
                    {button.customLabel || macro.name}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Edit Mode Footer */}
      {isEditing && (
        <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400">
              {activeLayout.columns}×{activeLayout.rows} grid • {activeLayout.buttons.length} buton
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {/* Open macro editor */}}
                className="text-xs px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors"
              >
                Makro Ekle
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {/* Open layout editor */}}
                className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Layout Düzenle
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
