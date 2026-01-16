'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Columns3, 
  SquareStack, 
  ChevronLeft, 
  ChevronRight,
  Infinity,
  Grid3X3,
  Layers,
  Info
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { calculateGridPagination } from '@/lib/layout-engine';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GridModeViewportSettingsProps {
  totalItems?: number;
}

/**
 * GridModeViewportSettings
 * 
 * Bu bileşen, ızgara ve sayfa modlarını YALNIZCA viewport editörde yönetmek için tasarlandı.
 * Başka hiçbir yerde bu ayarlar bulunmamalıdır.
 * 
 * Özellikler:
 * - Sonsuz mod (vertical): Scroll ile göz at, 4x sütun sayısı kadar öğe render edilir
 * - Sayfa modu (square): Sayfalar halinde göz at, columns x columns grid
 * - Sütun sayısı ayarı: Cihaza göre min/max sınırları
 * - Sayfa navigasyonu: Sadece sayfa modunda aktif
 */
export function GridModeViewportSettings({ totalItems = 0 }: GridModeViewportSettingsProps) {
  const responsive = useResponsiveLayout();
  
  // Grid mode state from store
  const gridModeState = useAppStore(state => state.gridModeState);
  const setGridModeEnabled = useAppStore(state => state.setGridModeEnabled);
  const setGridModeType = useAppStore(state => state.setGridModeType);
  const setGridColumns = useAppStore(state => state.setGridColumns);
  const setGridCurrentPage = useAppStore(state => state.setGridCurrentPage);

  // Calculate responsive column limits
  const columnLimits = useMemo(() => ({
    min: responsive.isMobile ? 2 : responsive.isTablet ? 3 : 4,
    max: responsive.isMobile ? 4 : responsive.isTablet ? 6 : 8,
  }), [responsive.isMobile, responsive.isTablet]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const isSquareMode = gridModeState.type === 'square';
    return calculateGridPagination(
      totalItems,
      gridModeState.columns,
      isSquareMode,
      gridModeState.currentPage
    );
  }, [totalItems, gridModeState.columns, gridModeState.type, gridModeState.currentPage]);

  const isVertical = gridModeState.type === 'vertical';
  const isSquare = gridModeState.type === 'square';

  const handlePreviousPage = () => {
    if (gridModeState.currentPage > 1) {
      setGridCurrentPage(gridModeState.currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (gridModeState.currentPage < paginationInfo.totalPages) {
      setGridCurrentPage(gridModeState.currentPage + 1);
    }
  };

  const handleColumnChange = (value: number[]) => {
    const clampedValue = Math.max(columnLimits.min, Math.min(value[0], columnLimits.max));
    setGridColumns(clampedValue);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-1">
        {/* Grid Mode Enable/Disable */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Izgara Modu</CardTitle>
              </div>
              <Switch
                checked={gridModeState.enabled}
                onCheckedChange={setGridModeEnabled}
              />
            </div>
            <CardDescription className="text-xs">
              İçerikleri ızgara veya sayfa düzeninde görüntüle
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Mode Selector */}
        <AnimatePresence mode="wait">
          {gridModeState.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Görünüm Modu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mode Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Sonsuz Mod */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isVertical ? 'default' : 'outline'}
                          className={cn(
                            'h-auto py-4 flex flex-col gap-2 transition-all',
                            isVertical && 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                          )}
                          onClick={() => {
                            setGridModeType('vertical');
                            setGridCurrentPage(1);
                          }}
                        >
                          <Infinity className="h-6 w-6" />
                          <span className="text-xs font-medium">Sonsuz</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Kaydırarak tüm içeriklere göz at</p>
                        <p className="text-xs text-muted-foreground">
                          Performans için {gridModeState.columns * 4} öğe render edilir
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Sayfa Modu */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isSquare ? 'default' : 'outline'}
                          className={cn(
                            'h-auto py-4 flex flex-col gap-2 transition-all',
                            isSquare && 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30'
                          )}
                          onClick={() => {
                            setGridModeType('square');
                            setGridCurrentPage(1);
                          }}
                        >
                          <SquareStack className="h-6 w-6" />
                          <span className="text-xs font-medium">Sayfa</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Sayfalar halinde içeriklere göz at</p>
                        <p className="text-xs text-muted-foreground">
                          Sayfa başına {gridModeState.columns * gridModeState.columns} öğe
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <Separator />

                  {/* Column Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Sütun Sayısı</Label>
                      <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                        {gridModeState.columns}
                      </span>
                    </div>
                    <Slider
                      value={[gridModeState.columns]}
                      onValueChange={handleColumnChange}
                      min={columnLimits.min}
                      max={columnLimits.max}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{columnLimits.min}</span>
                      <span>{columnLimits.max}</span>
                    </div>
                  </div>

                  {/* Stats Info */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="h-3 w-3" />
                      <span>
                        {isVertical
                          ? `Render: ${Math.min(totalItems, gridModeState.columns * 4)} / ${totalItems} öğe`
                          : `Sayfa: ${paginationInfo.currentPage} / ${paginationInfo.totalPages}`
                        }
                      </span>
                    </div>
                    {isSquare && (
                      <div className="text-xs text-muted-foreground">
                        Bu sayfada: {paginationInfo.itemsOnCurrentPage} öğe
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Page Navigation - Only in Square Mode */}
              {isSquare && paginationInfo.totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Sayfa Navigasyonu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={gridModeState.currentPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Önceki
                        </Button>

                        {/* Page Dots */}
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: Math.min(paginationInfo.totalPages, 7) }).map((_, i) => {
                            let pageNum: number;
                            const totalPages = paginationInfo.totalPages;
                            const current = gridModeState.currentPage;
                            
                            if (totalPages <= 7) {
                              pageNum = i + 1;
                            } else if (current <= 4) {
                              pageNum = i + 1;
                            } else if (current >= totalPages - 3) {
                              pageNum = totalPages - 6 + i;
                            } else {
                              pageNum = current - 3 + i;
                            }

                            const isActive = pageNum === current;

                            return (
                              <button
                                key={i}
                                onClick={() => setGridCurrentPage(pageNum)}
                                className={cn(
                                  'transition-all duration-200',
                                  isActive
                                    ? 'w-6 h-2 bg-primary rounded-sm'
                                    : 'w-2 h-2 bg-muted-foreground/40 rounded-full hover:bg-muted-foreground/60'
                                )}
                                title={`Sayfa ${pageNum}`}
                              />
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={gridModeState.currentPage >= paginationInfo.totalPages}
                        >
                          Sonraki
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

export default GridModeViewportSettings;
