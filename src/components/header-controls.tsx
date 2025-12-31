'use client';
import React from 'react';
import { Button } from './ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Maximize, Minimize, EyeOff, Timer, Eye, LayoutGrid, Palette, Router, Minus, Plus, MoreHorizontal, ExternalLink, Undo2, Redo2, ChevronLeft, ChevronRight, Menu, BarChart, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from './icons/app-logo';
import { useDevice } from '@/hooks/use-device';
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
import { PlayerModeDialog } from './player-mode-dialog';

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
  canNavigateBack?: boolean;
  canNavigateForward?: boolean;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
};

export default function HeaderControls({
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
  activeViewId,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  canNavigateBack = false,
  canNavigateForward = false,
  onNavigateBack,
  onNavigateForward,
}: HeaderControlsProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const deviceInfo = useDevice();
  const isMobile = deviceInfo.type === 'mobile';

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
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Grid Slider - Hidden on very small screens, moved to dropdown on mobile */}
      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/30 backdrop-blur-md px-2 py-1.5 rounded-md h-9 mr-1 w-48 lg:w-64">
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <Slider
          value={[gridSize]}
          min={100}
          max={800}
          step={10}
          onValueChange={(val) => setGridSize(val[0])}
          className="flex-1"
        />
        <span className="w-8 text-right shrink-0">{gridSize}</span>
      </div>

      <div className="flex items-center bg-muted/30 p-1 rounded-lg gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isUiHidden ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => setIsUiHidden(!isUiHidden)}
              >
                {isUiHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isUiHidden ? 'Arayüzü Göster' : 'Arayüzü Gizle'}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}</p></TooltipContent>
          </Tooltip>

          {activeViewId && (
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    onClick={() => {
                        window.open(`/popout?itemId=${activeViewId}&layoutMode=${layoutMode}`, 'popout-view', 'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no');
                    }}
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
                </TooltipTrigger>
                <TooltipContent><p>Pencereyi Ayır</p></TooltipContent>
            </Tooltip>
          )}

          <div className="hidden sm:block w-px h-4 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isStyleSettingsOpen ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={toggleStyleSettingsPanel}
              >
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Görünüm Ayarları</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9",
                  canUndo ? "text-orange-500 hover:bg-orange-500/10" : "text-muted-foreground/50"
                )}
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Geri Al (Ctrl+Z)</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9",
                  canRedo ? "text-orange-500 hover:bg-orange-500/10" : "text-muted-foreground/50"
                )}
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>İleri Al (Ctrl+Y)</p></TooltipContent>
          </Tooltip>

          <div className="hidden sm:block w-px h-4 bg-border mx-1" />

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent><p>Menü</p></TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/analytics')} className="cursor-pointer">
                <BarChart className="mr-2 h-4 w-4" />
                <span>Analiz</span>
              </DropdownMenuItem>
              {user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>

        <PlayerModeDialog />
      </div>

      {/* Mobile More Menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Izgara Boyutu</span>
                <span className="text-xs font-mono">{gridSize}px</span>
              </div>
              <Slider
                value={[gridSize]}
                min={100}
                max={800}
                step={10}
                onValueChange={(val) => setGridSize(val[0])}
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleStyleSettingsPanel}>
              <Palette className="mr-2 h-4 w-4" />
              <span>Görünüm Ayarları</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/analytics')} className="cursor-pointer">
              <BarChart className="mr-2 h-4 w-4" />
              <span>Analiz</span>
            </DropdownMenuItem>
            {user && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
