'use client';

import React from 'react';
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
  ExternalLink,
  Undo2, 
  Redo2,
  Menu,
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

  // Show full header only on desktop
  if (responsive.isMobile || responsive.isTablet) {
    return null; // Mobile version handled elsewhere
  }

  return (
    <div className="flex items-center gap-2">
      {/* Grid Slider - Desktop only */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/30 backdrop-blur-md px-3 py-1.5 rounded-md h-9 min-w-fit">
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <Slider
          value={[gridSize]}
          min={100}
          max={800}
          step={10}
          onValueChange={(val) => setGridSize(val[0])}
          className="w-32"
        />
        <span className="text-xs font-semibold ml-1 min-w-fit">{gridSize}px</span>
      </div>

      <div className="flex items-center bg-muted/30 p-1 rounded-lg gap-1">
        <TooltipProvider>
          {/* UI Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isUiHidden ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsUiHidden(!isUiHidden)}
              >
                {isUiHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isUiHidden ? 'Arayüzü Göster' : 'Arayüzü Gizle'}</TooltipContent>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}</TooltipContent>
          </Tooltip>

          {/* Pop-out Window */}
          {activeViewId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    window.open(
                      `/popout?itemId=${activeViewId}&layoutMode=${layoutMode}`,
                      'popout-view',
                      'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no'
                    );
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pencereyi Ayır</TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-4 bg-border mx-1" />

          {/* Style Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isStyleSettingsOpen ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9"
                onClick={toggleStyleSettingsPanel}
              >
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Görünüm Ayarları</TooltipContent>
          </Tooltip>

          {/* Undo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  canUndo ? "text-orange-500 hover:bg-orange-500/10" : "text-muted-foreground/50"
                )}
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Geri Al (Ctrl+Z)</TooltipContent>
          </Tooltip>

          {/* Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  canRedo ? "text-orange-500 hover:bg-orange-500/10" : "text-muted-foreground/50"
                )}
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>İleri Al (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Main Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Menü</TooltipContent>
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
    </div>
  );
}

