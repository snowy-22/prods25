"use client";

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
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
  MonitorPlay,
  Map,
  MessageSquare,
  FileText,
  BarChart3
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
  onToggleMiniMap?: () => void;
  isMiniMapVisible?: boolean;
  onToggleComments?: () => void;
  isCommentsVisible?: boolean;
  onToggleAnalytics?: () => void;
  isAnalyticsVisible?: boolean;
  onToggleDescriptions?: () => void;
  isDescriptionsVisible?: boolean;
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
  activeMediaItem = null,
  onToggleMiniMap,
  isMiniMapVisible = false,
  onToggleComments,
  isCommentsVisible = false,
  onToggleAnalytics,
  isAnalyticsVisible = false,
  onToggleDescriptions,
  isDescriptionsVisible = false
}: GridModeControlsProps) {
  const isVertical = gridState.type === 'vertical';
  const isSquare = gridState.type === 'square';
  
  // Canlı totalPages hesapla
  const rowsPerPageCalc = isSquare ? gridState.columns : 1;
  const itemsPerPageCalc = gridState.columns * rowsPerPageCalc;
  const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / itemsPerPageCalc));
  
  const canGoPrevious = gridState.currentPage > 1;
  const canGoNext = gridState.currentPage < calculatedTotalPages;
  
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
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-900/40 to-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50">
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
            title="Sonsuz Görünüm - Aşağıya kaydırarak göz at"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Sonsuz</span>
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
            title="Sayfa Görünümü - Sayfalarla aşın"
          >
            <SquareStack className="w-3.5 h-3.5" />
            <span>Sayfa</span>
          </motion.button>
        </div>

        {/* Column Count Selector - Only visible in square/page mode */}
        <AnimatePresence mode="wait">
          {gridState.enabled && isSquare && (
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

      {/* Center Section: Page Navigation - Only in square/page mode */}
      <AnimatePresence mode="wait">
        {gridState.enabled && isSquare && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 bg-slate-900/60 rounded-md px-4 py-2.5 border border-slate-700/50"
          >
            {/* Page Indicator - Interactive Swipeable Dots */}
            <motion.div 
              className="flex items-center gap-2 cursor-grab active:cursor-grabbing select-none"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(event, info) => {
                // Swipe threshold: 50px sağa (önceki) veya sola (sonraki)
                if (info.offset.x > 50 && canGoPrevious) {
                  onPreviousPage();
                } else if (info.offset.x < -50 && canGoNext) {
                  onNextPage();
                }
              }}
            >
              {(() => {
                // Canlı totalPages hesapla
                const rowsPerPage = isSquare ? gridState.columns : 1;
                const itemsPerPage = gridState.columns * rowsPerPage;
                const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                
                return Array.from({ length: calculatedTotalPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  const isActive = pageNumber === gridState.currentPage;

                  return (
                    <motion.button
                      key={i}
                      onClick={() => {
                        // Dot'a tıklayarak direkt o sayfaya git
                        const diff = pageNumber - gridState.currentPage;
                        if (diff > 0) {
                          for (let j = 0; j < diff; j++) onNextPage();
                        } else if (diff < 0) {
                          for (let j = 0; j < Math.abs(diff); j++) onPreviousPage();
                        }
                      }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{
                        scale: isActive ? 1.4 : 1,
                        backgroundColor: isActive ? '#3b82f6' : '#64748b',
                        width: isActive ? '32px' : '10px',
                        borderRadius: isActive ? '6px' : '50%'
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="h-2.5 hover:opacity-80 transition-opacity"
                      title={`Sayfa ${pageNumber} / ${calculatedTotalPages}`}
                      aria-label={`Sayfa ${pageNumber}`}
                    />
                  );
                });
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Vertical Mode Controls: Mini Map & Info Panels */}
      <AnimatePresence mode="wait">
        {gridState.enabled && isVertical && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 bg-slate-900/60 rounded-md p-1.5 border border-slate-700/50"
          >
            {/* Mini Map Toggle */}
            {onToggleMiniMap && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleMiniMap}
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5",
                  isMiniMapVisible
                    ? "bg-blue-500/80 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                )}
                title="Mini Haritayı Göster/Gizle"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Mini Harita</span>
              </motion.button>
            )}

            {/* Descriptions Toggle */}
            {onToggleDescriptions && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleDescriptions}
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5",
                  isDescriptionsVisible
                    ? "bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                )}
                title="Açıklamaları Göster/Gizle"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Açıklamalar</span>
              </motion.button>
            )}

            {/* Comments Toggle */}
            {onToggleComments && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleComments}
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5",
                  isCommentsVisible
                    ? "bg-purple-500/80 text-white shadow-lg shadow-purple-500/30"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                )}
                title="Yorumları Göster/Gizle"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Yorumlar</span>
              </motion.button>
            )}

            {/* Analytics Toggle */}
            {onToggleAnalytics && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleAnalytics}
                className={cn(
                  "px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5",
                  isAnalyticsVisible
                    ? "bg-orange-500/80 text-white shadow-lg shadow-orange-500/30"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                )}
                title="Analizleri Göster/Gizle"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analizler</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
