'use client';

import React, { useState } from 'react';
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
  LogOut,
  AlignVerticalJustifyCenter,
  Grid3x3,
  Settings,
  User,
  CreditCard,
  Bell,
  Shield,
  Key,
  HelpCircle,
  Search,
  Wand2,
  Map
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
import { SmartRemote } from './smart-remote';

import { LayoutMode } from '@/lib/layout-engine';

type HeaderControlsProps = {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isUiHidden: boolean;
  setIsUiHidden: (hidden: boolean) => void;
  isStyleSettingsOpen: boolean;
  toggleStyleSettingsPanel: () => void;
  isViewportEditorOpen?: boolean;
  toggleViewportEditor?: () => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  layoutMode?: LayoutMode;
  onSetLayoutMode?: (mode: LayoutMode) => void;
  activeViewId?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  toggleSearchDialog?: () => void;
  isMiniMapOpen?: boolean;
  onToggleMiniMap?: (open: boolean) => void;
};

export default function HeaderControls({
  isFullscreen,
  toggleFullscreen,
  isUiHidden,
  setIsUiHidden,
  isStyleSettingsOpen,
  toggleStyleSettingsPanel,
  isViewportEditorOpen = false,
  toggleViewportEditor,
  gridSize,
  setGridSize,
  layoutMode = 'grid',
  onSetLayoutMode,
  activeViewId,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  toggleSearchDialog,
  isMiniMapOpen = false,
  onToggleMiniMap,
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
      {/* Grid slider moved to bottom control bar */}
      <div className="flex items-center bg-muted/30 p-1 rounded-lg gap-1">
        <TooltipProvider>
          {/* Search Button */}
          {toggleSearchDialog && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={toggleSearchDialog}
                  data-testid="search-button-header"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Arama (F)</TooltipContent>
            </Tooltip>
          )}

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

          {/* Smart Remote */}
          <SmartRemote />

          <div className="w-px h-4 bg-border mx-1" />

          {/* Layout Mode Toggle removed per request */}

          {/* MiniMap Toggle removed per request */}

          {/* Settings Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Ayarlar</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={toggleStyleSettingsPanel}>
                <Palette className="mr-2 h-4 w-4" />
                <span>Görünüm Ayarları</span>
              </DropdownMenuItem>
              {toggleViewportEditor && (
                <DropdownMenuItem onClick={toggleViewportEditor}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  <span>Viewport Editörü</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Gizlilik ve Güvenlik</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/api-keys')}>
                <Key className="mr-2 h-4 w-4" />
                <span>API Anahtarları</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/notifications')}>
                <Bell className="mr-2 h-4 w-4" />
                <span>Bildirimler</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Profil</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
              {user && (
                <>
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profilim</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/profile/payment-methods')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Ödeme Yöntemleri</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/help')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Yardım</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => router.push('/auth/login')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Giriş Yap</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>

        <PlayerModeDialog />
      </div>
    </div>
  );
}

