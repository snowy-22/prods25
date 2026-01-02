"use client";

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LayoutGrid, Columns3, SquareStack, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridModeState } from '@/lib/layout-engine';
import { GridModeInfo } from './integration-info-button';

type GridModeControlsProps = {
  gridState: GridModeState;
  onToggleGridMode: (enabled: boolean) => void;
  onChangeGridType: (type: 'vertical' | 'square') => void;
  onChangeColumns: (columns: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  totalItems: number;
};

const GridModeControls = memo(function GridModeControls({
  gridState,
  onToggleGridMode,
  onChangeGridType,
  onChangeColumns,
  onPreviousPage,
  onNextPage,
  totalItems
}: GridModeControlsProps) {
  const isVertical = gridState.type === 'vertical';
  const isSquare = gridState.type === 'square';
  const canGoPrevious = gridState.currentPage > 1;
  const canGoNext = gridState.currentPage < gridState.totalPages;
  
  // Calculate items per page dynamically
  const rowsPerPage = isSquare ? gridState.columns : 1;
  const itemsPerPage = gridState.columns * rowsPerPage;
  const itemsOnPage = Math.min(itemsPerPage, totalItems - ((gridState.currentPage - 1) * itemsPerPage));

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-slate-900/40 to-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2 bg-slate-900/60 rounded-md p-1.5 border border-slate-700/50">
        {/* Vertical Mode Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onToggleGridMode(true);
            onChangeGridType('vertical');
          }}
          className={cn(
            "px-3 py-1.5 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5",
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
            "px-3 py-1.5 rounded-sm text-xs font-medium transition-colors flex items-center gap-1.5",
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Grid Mode Controls - Visible only when enabled */}
      <AnimatePresence mode="wait">
        {gridState.enabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3"
          >
            {/* Column Count Selector */}
            <div className="flex items-center gap-1 bg-slate-900/60 rounded-md p-1 border border-slate-700/50">
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
            </div>

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
    </div>
  );
});

export default GridModeControls;
