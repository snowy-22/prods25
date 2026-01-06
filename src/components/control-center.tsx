'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { 
  X, 
  Wifi, 
  Bluetooth,
  Volume2,
  Sun,
  Moon,
  Maximize2,
  LayoutGrid,
  Grid3x3,
  Palette,
  Settings,
  Bell,
  Zap,
  Eye,
  Radio,
  MapPin,
  Home,
  Cast,
  Users,
  LogOut,
  LogIn,
  Plus,
  ChevronRight,
  Circle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

type ControlCenterProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ControlCenter({ isOpen, onClose }: ControlCenterProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Store selectors
  const {
    user,
    username,
    pointerFrameEnabled,
    audioTrackerEnabled,
    mouseTrackerEnabled,
    virtualizerMode,
    visualizerMode,
    layoutMode,
    gridModeState,
    isUiHidden,
    // Actions
    setPointerFrameEnabled,
    setAudioTrackerEnabled,
    setMouseTrackerEnabled,
    setVirtualizerMode,
    setVisualizerMode,
    setLayoutMode,
    setGridColumns,
    setGridModeEnabled,
    setIsUiHidden,
    isSecondLeftSidebarOpen,
    togglePanel,
  } = useAppStore();

  const handleSectionToggle = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-4 md:inset-auto md:right-6 md:bottom-6 md:w-96 max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header - Profile Section */}
            <div className="p-6 border-b border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-transparent">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {username || 'Kullanıcı'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {user ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Account Switcher - Future: Multi-account */}
              <Button
                variant="outline"
                className="w-full text-xs justify-between"
              >
                <span>Kişisel Hesap</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
              <motion.div
                className="p-4 space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Media Controls */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => handleSectionToggle('media')}
                    className={cn(
                      "w-full p-3 rounded-lg border transition-all",
                      expandedSection === 'media'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium">Ortam</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === 'media' ? 90 : 0 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'media' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-slate-900/50 rounded-lg space-y-3 border border-slate-700/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Sesli Çerçeve</span>
                          <Switch
                            checked={audioTrackerEnabled}
                            onCheckedChange={setAudioTrackerEnabled}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Fare İzleyici</span>
                          <Switch
                            checked={mouseTrackerEnabled}
                            onCheckedChange={setMouseTrackerEnabled}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Gösterge</span>
                          <Switch
                            checked={virtualizerMode}
                            onCheckedChange={setVirtualizerMode}
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs text-slate-300 block">Görselleştirme</span>
                          <div className="flex gap-1 flex-wrap">
                            {(['off', 'bars', 'wave', 'circular', 'particles'] as const).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setVisualizerMode(mode)}
                                className={cn(
                                  "px-2 py-1 text-xs rounded transition-all",
                                  visualizerMode === mode
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                )}
                              >
                                {mode === 'off' ? 'Kapalı' : mode}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Display Controls */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => handleSectionToggle('display')}
                    className={cn(
                      "w-full p-3 rounded-lg border transition-all",
                      expandedSection === 'display'
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium">Görünüm</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === 'display' ? 90 : 0 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'display' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-slate-900/50 rounded-lg space-y-3 border border-slate-700/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">UI Gizle</span>
                          <Switch
                            checked={isUiHidden}
                            onCheckedChange={setIsUiHidden}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Gösterge Paneli</span>
                          <Switch
                            checked={pointerFrameEnabled}
                            onCheckedChange={setPointerFrameEnabled}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Kenar Çubuğu</span>
                          <Switch
                            checked={isSecondLeftSidebarOpen}
                            onCheckedChange={() =>
                              togglePanel('isSecondLeftSidebarOpen')
                            }
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Layout Controls */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => handleSectionToggle('layout')}
                    className={cn(
                      "w-full p-3 rounded-lg border transition-all",
                      expandedSection === 'layout'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium">Düzen</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === 'layout' ? 90 : 0 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'layout' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-slate-900/50 rounded-lg space-y-3 border border-slate-700/50"
                      >
                        <div className="space-y-2">
                          <span className="text-xs text-slate-300 block">Düzen Modu</span>
                          <div className="flex gap-1 flex-wrap">
                            {(['grid', 'canvas'] as const).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setLayoutMode(mode)}
                                className={cn(
                                  "px-2 py-1 text-xs rounded transition-all",
                                  layoutMode === mode
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                )}
                              >
                                {mode === 'grid' ? 'İzgara' : 'Kanvas'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {gridModeState.enabled && (
                          <>
                            <Separator className="bg-slate-700/30" />
                            <div className="space-y-2">
                              <span className="text-xs text-slate-300 block">
                                Sütun Sayısı
                              </span>
                              <div className="flex gap-1">
                                {[2, 3, 4, 5].map((col) => (
                                  <button
                                    key={col}
                                    onClick={() => setGridColumns(col)}
                                    className={cn(
                                      "px-2 py-1 text-xs rounded transition-all",
                                      gridModeState.columns === col
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                                    )}
                                  >
                                    {col}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-300">İzgara Modu</span>
                              <Switch
                                checked={gridModeState.enabled}
                                onCheckedChange={setGridModeEnabled}
                              />
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Devices Section - Future Integration */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => handleSectionToggle('devices')}
                    className={cn(
                      "w-full p-3 rounded-lg border transition-all",
                      expandedSection === 'devices'
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-medium">Cihazlar</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === 'devices' ? 90 : 0 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'devices' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-slate-900/50 rounded-lg space-y-3 border border-slate-700/50 text-center"
                      >
                        <p className="text-xs text-slate-400">
                          Bağlı cihaz yok
                        </p>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Cihaz Ekle
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Places Section - Future Integration */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => handleSectionToggle('places')}
                    className={cn(
                      "w-full p-3 rounded-lg border transition-all",
                      expandedSection === 'places'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium">Mekanlar</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === 'places' ? 90 : 0 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'places' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-slate-900/50 rounded-lg space-y-2 border border-slate-700/50"
                      >
                        <Button variant="outline" size="sm" className="w-full text-xs justify-start">
                          <Home className="h-3 w-3 mr-2" />
                          Ev
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs justify-start">
                          <MapPin className="h-3 w-3 mr-2" />
                          İş
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Broadcast Section - Future Integration */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => handleSectionToggle('broadcast')}
                    className={cn(
                      "w-full p-3 rounded-lg border transition-all",
                      expandedSection === 'broadcast'
                        ? 'bg-pink-500/10 border-pink-500/30'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cast className="h-4 w-4 text-pink-400" />
                        <span className="text-sm font-medium">Yayın</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === 'broadcast' ? 90 : 0 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'broadcast' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-slate-900/50 rounded-lg space-y-3 border border-slate-700/50 text-center"
                      >
                        <p className="text-xs text-slate-400">
                          Kullanılabilir cihaz yok
                        </p>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Yayın Başlat
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Settings & Account */}
                <Separator className="bg-slate-700/30" />

                <motion.div variants={itemVariants} className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-xs">
                    <Settings className="h-4 w-4 mr-2" />
                    Ayarlar
                  </Button>
                  {user ? (
                    <Button variant="destructive" className="w-full justify-start text-xs">
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </Button>
                  ) : (
                    <Button className="w-full justify-start text-xs" variant="default">
                      <LogIn className="h-4 w-4 mr-2" />
                      Giriş Yap
                    </Button>
                  )}
                </motion.div>
              </motion.div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
