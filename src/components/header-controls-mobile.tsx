'use client';

import React, { useMemo } from 'react';
import { Button } from './ui/button';
import { 
  Tooltip, 
  TooltipProvider, 
  TooltipTrigger, 
  TooltipContent 
} from './ui/tooltip';
import { 
  Maximize, 
  Minimize, 
  EyeOff, 
  Eye, 
  LayoutGrid, 
  Palette, 
  MoreHorizontal,
  Undo2, 
  Redo2, 
  BarChart, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Slider } from './ui/slider';

import { LayoutMode } from '@/lib/layout-engine';

type HeaderControlsProps = {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isUiHidden: boolean;
  setIsUiHidden: (hidden: boolean) => void;
  isStyleSettingsOpen: boolean;
  toggleStyleSettingsPanel: () => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  layoutMode?: LayoutMode;
  onSetLayoutMode?: (mode: LayoutMode) => void;
  activeViewId?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
};

export default function HeaderControlsMobile({
  isFullscreen,
  toggleFullscreen,
  isUiHidden,
  setIsUiHidden,
  isStyleSettingsOpen,
  toggleStyleSettingsPanel,
  gridSize,
  setGridSize,
  layoutMode = 'grid',
  onSetLayoutMode,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: HeaderControlsProps) {
  const responsive = useResponsiveLayout();
  const { theme } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Çıkış yapıldı", description: "Başarıyla çıkış yaptınız." });
      router.push('/');
    } catch (error: any) {
      toast({ 
        title: "Hata", 
        description: error.message || "Çıkış yapılırken hata oluştu.",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between gap-1",
      responsive.isMobile ? "gap-1" : "gap-2"
    )}>
      {/* Left Controls */}
      <div className="flex items-center gap-1">
        {/* UI Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isUiHidden ? "default" : "ghost"}
              size="icon"
              className={cn(
                "touch-target",
                responsive.isMobile ? "h-10 w-10" : "h-9 w-9"
              )}
              onClick={() => setIsUiHidden(!isUiHidden)}
            >
              {isUiHidden ? <Eye className="h-5 w-5 md:h-4 md:w-4" /> : <EyeOff className="h-5 w-5 md:h-4 md:w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="hidden md:block">
            {isUiHidden ? 'Arayüzü Göster' : 'Arayüzü Gizle'}
          </TooltipContent>
        </Tooltip>

        {/* Fullscreen Toggle - Hide on mobile in landscape */}
        {!responsive.isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "touch-target",
                  responsive.isMobile ? "h-10 w-10" : "h-9 w-9"
                )}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-5 w-5 md:h-4 md:w-4" /> : <Maximize className="h-5 w-5 md:h-4 md:w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="hidden md:block">
              {isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Undo/Redo - Tablet+ only */}
        {!responsive.isMobile && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "touch-target h-9 w-9",
                    canUndo ? "text-orange-500 hover:bg-orange-500/10" : "text-muted-foreground/50"
                  )}
                  onClick={onUndo}
                  disabled={!canUndo}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Geri Al</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "touch-target h-9 w-9",
                    canRedo ? "text-orange-500 hover:bg-orange-500/10" : "text-muted-foreground/50"
                  )}
                  onClick={onRedo}
                  disabled={!canRedo}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">İleri Al</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* More Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className={cn(
              "touch-target",
              responsive.isMobile ? "h-10 w-10" : "h-9 w-9"
            )}
          >
            <MoreHorizontal className="h-5 w-5 md:h-4 md:w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className={cn(
            responsive.isMobile ? "w-64" : "w-72"
          )}
        >
          {/* Grid Slider */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Izgara Boyutu
              </span>
              <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{gridSize}px</span>
            </div>
            <Slider
              value={[gridSize]}
              min={100}
              max={800}
              step={10}
              onValueChange={(val) => setGridSize(val[0])}
              className="w-full"
            />
          </div>

          <DropdownMenuSeparator />

          {/* Style Settings */}
          <DropdownMenuItem 
            onClick={toggleStyleSettingsPanel}
            className="cursor-pointer flex items-center gap-2"
          >
            <Palette className="h-4 w-4" />
            <span>Görünüm Ayarları</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Analytics */}
          <DropdownMenuItem 
            onClick={() => router.push('/analytics')}
            className="cursor-pointer flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            <span>Analiz</span>
          </DropdownMenuItem>

          {/* Logout */}
          {user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="cursor-pointer text-destructive flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Çıkış Yap</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
