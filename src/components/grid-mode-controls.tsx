"use client";

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Columns3, 
  SquareStack, 
  Info,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Gauge,
  MonitorPlay
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridModeState } from '@/lib/layout-engine';
import { GridModeInfo } from './integration-info-button';
import { SmartPlayerPanel } from './smart-player-panel';
import { ContentItem } from '@/lib/initial-content';

type GridModeControlsProps = {
  gridState: GridModeState;
  onToggleGridMode: (enabled: boolean) => void;
  onChangeGridType: (type: 'vertical' | 'square') => void;
  onChangeColumns: (columns: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  totalItems: number;
  hasVideoItems?: boolean;
  onPlayAll?: () => void;
  onPauseAll?: () => void;
  onMuteAll?: () => void;
  onUnmuteAll?: () => void;
  onSkipForward?: () => void;
  onSkipBack?: () => void;
  onChangeSpeed?: (speed: number) => void;
  activeMediaItem?: ContentItem | null;
};

const GridModeControls = memo(function GridModeControls({
  gridState,
  onToggleGridMode,
  onChangeGridType,
  onChangeColumns,
  onPreviousPage,
  onNextPage,
  totalItems,
  hasVideoItems = false,
  onPlayAll,
  onPauseAll,
  onMuteAll,
  onUnmuteAll,
  onSkipForward,
  onSkipBack,
  onChangeSpeed,
  activeMediaItem = null
}: GridModeControlsProps) {
  const isVertical = gridState.type === 'vertical';
  const isSquare = gridState.type === 'square';
  const canGoPrevious = gridState.currentPage > 1;
  const canGoNext = gridState.currentPage < gridState.totalPages;
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Smart Player Panel state
  const [isSmartPlayerOpen, setIsSmartPlayerOpen] = useState(false);
  
  // Calculate items per page dynamically
  const rowsPerPage = isSquare ? gridState.columns : 1;
  const itemsPerPage = gridState.columns * rowsPerPage;
  const itemsOnPage = Math.min(itemsPerPage, totalItems - ((gridState.currentPage - 1) * itemsPerPage));

  const handlePlayPause = () => {
    if (isPlaying) {
      onPauseAll?.();
      setIsPlaying(false);
    } else {
      onPlayAll?.();
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      onUnmuteAll?.();
      setIsMuted(false);
    } else {
      onMuteAll?.();
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    onChangeSpeed?.(speed);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-900/40 to-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50">
      {/* Left Section: Mode Switcher + Column Selector */}
      <div className="flex items-center gap-2">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/60 rounded-md p-1.5 border border-slate-700/50">
          {/* Vertical Mode Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onToggleGridMode(true);
              onChangeGridType('vertical');
            }}
            className={cn(
              "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5",
              gridState.enabled && isVertical
                ? "bg-blue-500/80 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            )}
            title="Dikey Mod - Aşağıya kaydırarak göz at"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Dikey</span>
          </motion.button>

          {/* Square Grid Mode Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onToggleGridMode(true);
              onChangeGridType('square');
            }}
            className={cn(
              "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5",
              gridState.enabled && isSquare
                ? "bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/30"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            )}
            title="Kare Izgara Modu - Sayfalarla aşın"
          >
            <SquareStack className="w-3.5 h-3.5" />
            <span>Kare</span>
          </motion.button>
        </div>

        {/* Column Count Selector - Moved next to mode switcher */}
        <AnimatePresence mode="wait">
          {gridState.enabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.95, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 bg-slate-900/60 rounded-md p-1 border border-slate-700/50"
            >
              {[2, 3, 4, 5].map((col) => (
                <motion.button
                  key={col}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onChangeColumns(col)}
                  className={cn(
                    "w-7 h-7 rounded text-xs font-medium transition-colors",
                    gridState.columns === col
                      ? "bg-purple-500/80 text-white shadow-lg shadow-purple-500/30"
                      : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                  )}
                  title={`${col} sütun`}
                >
                  {col}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center Section: Page Navigation */}
      <AnimatePresence mode="wait">
        {gridState.enabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {/* Page Navigation */}
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-md p-1.5 border border-slate-700/50">
              {/* Previous Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPreviousPage}
                disabled={!canGoPrevious}
                className={cn(
                  "p-1 rounded transition-colors",
                  canGoPrevious
                    ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "text-slate-600 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>

              {/* Page Indicator (Android-style dots) */}
              <div className="flex items-center gap-1 px-2">
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(gridState.totalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === gridState.currentPage;
                    const isFar = Math.abs(pageNum - gridState.currentPage) > 2;

                    return (
                      <motion.div
                        key={i}
                        animate={{
                          width: isActive ? 24 : 6,
                          backgroundColor: isActive ? '#3b82f6' : '#64748b',
                          opacity: isFar && gridState.totalPages > 5 ? 0 : 1
                        }}
                        transition={{ duration: 0.2 }}
                        className="h-1.5 rounded-full"
                      />
                    );
                  })}
                </div>
              </div>

              {/* Next Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNextPage}
                disabled={!canGoNext}
                className={cn(
                  "p-1 rounded transition-colors",
                  canGoNext
                    ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "text-slate-600 cursor-not-allowed"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Page Info */}
            <div className="text-xs text-slate-400 bg-slate-900/40 rounded px-2.5 py-1.5 border border-slate-700/30 whitespace-nowrap">
              <span className="font-medium">{gridState.currentPage}</span>
              <span className="mx-1">/</span>
              <span>{gridState.totalPages}</span>
              <span className="mx-1.5">•</span>
              <span className="font-medium">{itemsOnPage}</span>
              <span className="mx-1">/</span>
              <span>{totalItems}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Smart Player Button - Before Video Controls */}
      <AnimatePresence mode="wait">
        {hasVideoItems && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSmartPlayerOpen(!isSmartPlayerOpen)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md transition-all border border-slate-700/50",
              isSmartPlayerOpen
                ? "bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white shadow-lg shadow-purple-500/30"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80"
            )}
            title="Akıllı Oynatıcı Panelini Aç/Kapat"
          >
            <MonitorPlay className="w-4 h-4" />
            <span className="text-xs font-medium">Akıllı Oynatıcı</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Right Section: Smart Video Player Controls */}
      <AnimatePresence mode="wait">
        {hasVideoItems && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 bg-slate-900/60 rounded-md p-1.5 border border-slate-700/50"
          >
            {/* Skip Back */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSkipBack}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="10s geri"
            >
              <SkipBack className="w-4 h-4" />
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayPause}
              className={cn(
                "p-1.5 rounded transition-colors",
                isPlaying
                  ? "bg-blue-500/80 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
              title={isPlaying ? "Tümünü duraklat" : "Tümünü oynat"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </motion.button>

            {/* Skip Forward */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSkipForward}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="10s ileri"
            >
              <SkipForward className="w-4 h-4" />
            </motion.button>

            {/* Volume Control */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMuteToggle}
              className={cn(
                "p-1.5 rounded transition-colors",
                isMuted
                  ? "text-red-400 hover:text-red-300"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
              title={isMuted ? "Sesi aç" : "Sesi kapat"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>

            {/* Playback Speed */}
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2 ml-1">
              {[0.5, 1, 1.5, 2].map((speed) => (
                <motion.button
                  key={speed}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSpeedChange(speed)}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-colors",
                    playbackSpeed === speed
                      ? "bg-orange-500/80 text-white shadow-lg shadow-orange-500/30"
                      : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                  )}
                  title={`${speed}x hız`}
                >
                  {speed}x
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Button */}
      <GridModeInfo>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          title="Izgara Modu Bilgisi"
        >
          <Info className="w-4 h-4" />
        </motion.button>
      </GridModeInfo>

      {/* Smart Player Panel */}
      <SmartPlayerPanel
        isOpen={isSmartPlayerOpen}
        onClose={() => setIsSmartPlayerOpen(false)}
        activeMediaItem={activeMediaItem}
      />
    </div>
  );
});

export default GridModeControls;
