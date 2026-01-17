"use client";

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Columns3, 
  SquareStack, 
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
  BarChart3,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridModeState } from '@/lib/layout-engine';
import { SmartPlayerPanel } from './smart-player-panel';
import { ContentItem } from '@/lib/initial-content';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type GridModeControlsProps = {
  gridState: GridModeState;
  onToggleGridMode: (enabled: boolean) => void;
  onChangeGridType: (type: 'vertical' | 'square') => void;
  onChangeColumns: (columns: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onChangePaginationMode?: (mode: 'pagination' | 'infinite') => void;
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
  onChangePaginationMode,
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
  // Responsive layout hook for device-specific columns
  const responsive = useResponsiveLayout();
  
  const isVertical = gridState.type === 'vertical';
  const isSquare = gridState.type === 'square';
  
  // Canlı totalPages hesapla - Grid span desteği ile
  const rowsPerPageCalc = isSquare ? gridState.columns : 1;
  const itemsPerPageCalc = gridState.columns * rowsPerPageCalc;
  // Grid span büyük öğeler için daha fazla alan kullanır, bu yüzden tahmini bir sayfa hesabı
  const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, itemsPerPageCalc * 0.8)));
  
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
    console.debug('[GridModeControls] handlePlayPause', { isPlaying });
    if (isPlaying) {
      onPauseAll?.();
      setIsPlaying(false);
    } else {
      onPlayAll?.();
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    console.debug('[GridModeControls] handleMuteToggle', { isMuted });
    if (isMuted) {
      onUnmuteAll?.();
      setIsMuted(false);
    } else {
      onMuteAll?.();
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    console.debug('[GridModeControls] handleSpeedChange', { speed });
    setPlaybackSpeed(speed);
    onChangeSpeed?.(speed);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 min-w-0 max-w-full overflow-x-auto">
      {/* Mode Switcher ve Column Selector artık sadece Viewport Editor'da.
          Bu bileşen sadece pagination dots ve video kontrollerini içerir. */}

      {/* Center Section: Page Navigation - Only in square/page mode */}
      <AnimatePresence mode="wait">
        {gridState.enabled && gridState.type === 'square' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 bg-slate-900/70 rounded-lg px-3 py-1.5 border border-slate-700/40 shadow-sm"
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
                        console.debug('[GridModeControls] Page dot clicked', { pageNumber, current: gridState.currentPage, diff });
                        if (diff > 0) {
                          for (let j = 0; j < diff; j++) onNextPage();
                        } else if (diff < 0) {
                          for (let j = 0; j < Math.abs(diff); j++) onPreviousPage();
                        }
                      }}
                      whileHover={{ scale: 1.25 }}
                      whileTap={{ scale: 0.85 }}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isActive ? '#3b82f6' : '#475569',
                        width: isActive ? '24px' : '8px',
                        height: isActive ? '8px' : '8px',
                        borderRadius: isActive ? '4px' : '50%'
                      }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="hover:opacity-90 transition-opacity shadow-sm"
                      style={{ minWidth: '8px', minHeight: '8px' }}
                      title={`Sayfa ${pageNumber} / ${calculatedTotalPages}`}
                      aria-label={`Sayfa ${pageNumber}`}
                    />
                  );
                });
              })()}
            </motion.div>
            
            {/* Page Counter Badge */}
            <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md ml-1 whitespace-nowrap tabular-nums">
              {gridState.currentPage} / {calculatedTotalPages}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Mode Toggle - Switch between pagination and infinite scroll */}
      {gridState.enabled && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const newMode = gridState.paginationMode === 'pagination' ? 'infinite' : 'pagination';
            onChangePaginationMode?.(newMode);
          }}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border text-[11px] font-semibold",
            gridState.paginationMode === 'pagination'
              ? "bg-gradient-to-r from-blue-500/80 to-cyan-500/80 text-white shadow-lg shadow-blue-500/30 border-blue-400/40"
              : "bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white shadow-lg shadow-amber-500/30 border-amber-400/40"
          )}
          title={`Sayfalama: ${gridState.paginationMode === 'pagination' ? 'Sayfa tabanlı' : 'Sonsuz kaydırma'}`}
        >
          {gridState.paginationMode === 'pagination' ? (
            <>
              <SquareStack className="w-4 h-4" />
              <span className="hidden sm:inline">Sayfalama</span>
            </>
          ) : (
            <>
              <Columns3 className="w-4 h-4" />
              <span className="hidden sm:inline">Sonsuz</span>
            </>
          )}
        </motion.button>
      )}

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
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border",
              isSmartPlayerOpen
                ? "bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white shadow-lg shadow-purple-500/30 border-purple-400/40"
                : "bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800/90 border-slate-700/40"
            )}
            title="Akıllı Oynatıcı Panelini Aç/Kapat"
          >
            <MonitorPlay className="w-4 h-4" />
            <span className="text-[11px] font-semibold hidden sm:inline">Akıllı Oynatıcı</span>
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
            className="flex items-center gap-1.5 bg-slate-900/70 rounded-lg p-1.5 border border-slate-700/40 shadow-sm"
          >
            {/* Skip Back */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                console.debug('[GridModeControls] SkipBack clicked');
                onSkipBack?.();
              }}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="10s geri"
            >
              <SkipBack className="w-4 h-4" />
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                console.debug('[GridModeControls] PlayPause clicked');
                handlePlayPause();
              }}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isPlaying
                  ? "bg-blue-500/90 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              )}
              title={isPlaying ? "Tümünü duraklat" : "Tümünü oynat"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </motion.button>

            {/* Skip Forward */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                console.debug('[GridModeControls] SkipForward clicked');
                onSkipForward?.();
              }}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="10s ileri"
            >
              <SkipForward className="w-4 h-4" />
            </motion.button>

            {/* Separator */}
            <div className="w-px h-5 bg-slate-700/60 mx-0.5" />

            {/* Volume Control */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                console.debug('[GridModeControls] Mute/Unmute clicked', { isMuted });
                handleMuteToggle();
              }}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isMuted
                  ? "text-red-400 hover:text-red-300 bg-red-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              )}
              title={isMuted ? "Sesi aç" : "Sesi kapat"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>

            {/* Playback Speed */}
            <div className="flex items-center gap-1 border-l border-slate-700/50 pl-2 ml-1">
              {[0.5, 1, 1.5, 2].map((speed) => (
                <motion.button
                  key={speed}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    console.debug('[GridModeControls] Speed button clicked', { speed });
                    handleSpeedChange(speed);
                  }}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-semibold transition-colors",
                    playbackSpeed === speed
                      ? "bg-orange-500/90 text-white shadow-md shadow-orange-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  )}
                  title={`${speed}x hız`}
                >
                  {speed}x
                </motion.button>
              ))}
            </div>

            {/* Quality Selector - Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors border-l border-slate-700/50 ml-1.5 pl-2.5"
                  title="Video Kalitesi"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kalite</span>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {['144p', '240p', '360p', '480p', '720p', '1080p', '2K', '4K'].map((quality) => (
                  <DropdownMenuItem
                    key={quality}
                    onClick={() => {
                      // Quality change logic - iframe.contentWindow.postMessage for YouTube/Vimeo
                      const iframes = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"]');
                      iframes.forEach(iframe => {
                        iframe.contentWindow?.postMessage(JSON.stringify({
                          event: 'command',
                          func: 'setPlaybackQuality',
                          args: [quality]
                        }), '*');
                      });
                    }}
                    className="text-xs font-medium"
                  >
                    {quality}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>

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
