

'use client';

import { memo, useRef, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Bot, Library, Plus, Trash2, Folder as FolderIcon, FileText as FileIcon, Frame, Copy, List, Eye, Clock, StickyNote, Calendar, Play, Upload, LayoutGrid, AlertCircle, Film, Save, Pencil, MousePointer, Settings, Monitor, Moon, Sun, GripHorizontal, Image as ImageIcon, Expand, RotateCw, ArrowUpNarrowWide, Info, GanttChart, Wand2, User, LogOut, LogIn, ChevronDown, ListIcon, Undo, Redo, Share, Users, MessageSquare, Pin, PinOff, Palette, ArrowDownAZ, ArrowUpAZ, UserPlus, MessageSquarePlus, Minus, EyeOff, ChevronRight, PanelLeft, Link as LinkIcon, ChevronsRight, FolderSync, Award, Mic, History, Sparkles, Bell, Search, Puzzle, Globe, Camera, Tv, UserCog, Home, MonitorSmartphone, Airplay, Projector, QrCode, KeyRound, Maximize, Minimize, ExternalLink, BarChart, ShoppingCart, Columns3, SquareStack, Phone, Users2 } from 'lucide-react';
import { AppLogo } from '@/components/icons/app-logo';
import type { ContentItem, ItemType, SortOption } from '@/lib/initial-content';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuSeparator, ContextMenuItem } from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from './ui/switch';
import { getIconByName, IconName } from '@/lib/icons';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { useRouter } from 'next/navigation';
import { Separator } from './ui/separator';
import { createClient } from '@/lib/supabase/client';


interface PrimarySidebarProps {
  allItems: ContentItem[];
  onSetView: (item: ContentItem | null, event?: React.MouseEvent) => void;
  username: string;
  setUsername: (username: string) => void;
  activeSecondaryPanel: 'library' | 'social' | 'messages' | 'widgets' | 'notifications' | 'spaces' | 'devices' | 'ai-chat' | 'shopping' | 'profile' | 'advanced-profiles' | 'message-groups' | 'calls' | 'meetings' | 'social-groups' | 'achievements' | 'marketplace' | 'rewards' | null;
  setActiveSecondaryPanel: (panel: 'library' | 'social' | 'messages' | 'widgets' | 'notifications' | 'spaces' | 'devices' | 'ai-chat' | 'shopping' | 'profile' | 'advanced-profiles' | 'message-groups' | 'calls' | 'meetings' | 'social-groups' | 'achievements' | 'marketplace' | 'rewards' | null) => void;
  isSecondLeftSidebarOpen: boolean;
  toggleSecondLeftSidebar: (open?: boolean) => void;
  toggleSearchDialog: () => void;
  toggleSettingsDialog: (initialTab: 'integrations' | 'history' | 'shortcuts' | 'trash') => void;
  toggleApiKeysDialog?: () => void;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
  toggleSpacesPanel: () => void;
  toggleDevicesPanel: () => void;
  isSpacesPanelOpen: boolean;
  isDevicesPanelOpen: boolean;
  isViewportEditorOpen?: boolean;
  toggleViewportEditor?: () => void;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  onShare: (item: ContentItem) => void;
  sessionId: string;
  devices: ContentItem[];
  activeBroadcastTargetId: string | null;
  onSetBroadcastTarget: (id: string | null) => void;
  isFullscreen?: boolean;
  toggleFullscreen?: () => void;
  isUiHidden?: boolean;
  setIsUiHidden?: (hidden: boolean) => void;
  isStyleSettingsOpen?: boolean;
  toggleStyleSettingsPanel?: () => void;
  activeViewId?: string;
  // Grid Mode Props
  normalizedLayoutMode?: 'grid' | 'canvas' | 'free';
  gridModeState?: { enabled: boolean; type: 'vertical' | 'square'; columns: number; currentPage: number };
  setGridModeEnabled?: (enabled: boolean) => void;
  setGridModeType?: (type: 'vertical' | 'square') => void;
  setGridColumns?: (columns: number) => void;
  setGridCurrentPage?: (page: number) => void;
}


export default function PrimarySidebar({ 
    allItems,
    onSetView,
    username,
    setUsername,
    activeSecondaryPanel,
    setActiveSecondaryPanel,
    isSecondLeftSidebarOpen,
    toggleSecondLeftSidebar,
    toggleSearchDialog,
    toggleSettingsDialog,
    toggleApiKeysDialog,
    onUpdateItem,
    toggleSpacesPanel,
    toggleDevicesPanel,
    isSpacesPanelOpen,
    isDevicesPanelOpen,
    unreadMessagesCount,
    unreadNotificationsCount,
    onShare,
    sessionId,
    devices,
    activeBroadcastTargetId,
    onSetBroadcastTarget,    isFullscreen = false,
    toggleFullscreen,
    isUiHidden = false,
    setIsUiHidden,
    isStyleSettingsOpen = false,
    toggleStyleSettingsPanel,
    activeViewId,
    normalizedLayoutMode = 'grid',
    gridModeState = { enabled: false, type: 'vertical', columns: 3, currentPage: 1 },
    setGridModeEnabled,
    setGridModeType,
    setGridColumns,
    setGridCurrentPage,
}: PrimarySidebarProps) {

    const router = useRouter();
    const supabase = createClient();
    
    const isUserLoggedIn = !!username;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUsername('');
        router.push('/');
    };
    
    const handleLogoClick = (event: React.MouseEvent) => {
        event.preventDefault();
        onSetView(null);
        router.push('/canvas'); 
    };
    
    // Stable handlers for sidebar buttons to prevent infinite rerenders
    const handleLibraryClick = useCallback(() => {
        if (activeSecondaryPanel === 'library' && isSecondLeftSidebarOpen) {
            toggleSecondLeftSidebar(false);
        } else {
            setActiveSecondaryPanel('library');
            toggleSecondLeftSidebar(true);
        }
    }, [activeSecondaryPanel, isSecondLeftSidebarOpen, toggleSecondLeftSidebar, setActiveSecondaryPanel]);
    
    const handleProfileClick = useCallback(() => {
        if (activeSecondaryPanel === 'profile' && isSecondLeftSidebarOpen) {
            toggleSecondLeftSidebar(false);
        } else {
            setActiveSecondaryPanel('profile');
            toggleSecondLeftSidebar(true);
        }
    }, [activeSecondaryPanel, isSecondLeftSidebarOpen, toggleSecondLeftSidebar, setActiveSecondaryPanel]);
    
    const awardsFolder = useMemo(() => allItems?.find(item => item.id === 'awards-folder'), [allItems]);
    const userProfileItem = useMemo(() => allItems?.find(item => item.id === 'user-profile'), [allItems]);
    const savedItems = useMemo(() => allItems?.find(item => item.id === 'saved-items'), [allItems]);

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`tv25:remote?session=${sessionId}`)}`;


    const handleShowAwardsInLibrary = (checked: boolean) => {
        if (awardsFolder) {
            onUpdateItem(awardsFolder.id, { showInLibrary: checked });
        }
    };
    
    const NotificationBadge = ({ count }: { count: number }) => {
        if (count === 0) return null;
        return (
            <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                {count}
            </div>
        );
    };
    
    if (!allItems) {
        return (
            <div className="w-12 sm:w-14 flex flex-col items-center py-2 border-r bg-sidebar z-20">
            </div>
        );
    }

    const activeBroadcastTarget = devices.find(d => d.id === activeBroadcastTargetId);


  return (
    <div className="flex min-h-0 relative">
        <div className="w-12 sm:w-14 flex flex-col items-center py-1 sm:py-2 border-r bg-sidebar/60 backdrop-blur-md z-20 h-screen">
            {/* Fixed Header */}
             <Button variant="ghost" className="h-8 w-8 sm:h-10 sm:w-10 p-0" onClick={handleLogoClick}>
                <AppLogo className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </Button>
            
            {/* Scrollable Middle */}
            <ScrollArea className="flex-1 mt-2 sm:mt-4">
                 <div className='flex flex-col items-center gap-1 sm:gap-2 p-1 sm:p-2'>
                        {/* Main Tools */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'library' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={handleLibraryClick}
                                    data-testid="library-button"
                                >
                                    <Library className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Kitaplık</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'profile' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={handleProfileClick}
                                    data-testid="profile-button"
                                >
                                    <UserCog className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Profilim</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'ai-chat' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'ai-chat' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('ai-chat');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="ai-chat-button"
                                >
                                    <Bot className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>AI Asistan</p></TooltipContent>
                        </Tooltip>
                         
                        <Separator className='my-2 w-8' />

                        {/* Interaction & Discovery Tools */}
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'widgets' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'widgets' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('widgets');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="widgets-button"
                                >
                                    <Puzzle className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Araç Takımları</p></TooltipContent>
                        </Tooltip>
                        {/* --- Main Messaging/Notification Row --- */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'notifications' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10 relative' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'notifications' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('notifications');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="notifications-button"
                                >
                                    <Bell className="h-4 w-4 sm:h-5 sm:w-5"/>
                                    <NotificationBadge count={unreadNotificationsCount} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Bildirimler</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'messages' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10 relative' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'messages' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('messages');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="messages-button"
                                >
                                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5"/>
                                    <NotificationBadge count={unreadMessagesCount} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Sohbetler</p></TooltipContent>
                        </Tooltip>
                        {/* --- Search and Calendar below messages --- */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'search' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'search' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('search');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="search-button"
                                >
                                    <Puzzle className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Arama</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'meetings' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'meetings' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('meetings');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="meetings-button"
                                >
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Takvim</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'calls' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'calls' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('calls');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="calls-button"
                                >
                                    <Phone className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Aramalar</p></TooltipContent>
                        </Tooltip>
                        
                        <Separator className='my-2 w-8' />
                        
                        {/* E-Commerce, Marketplace & Social Section */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'shopping' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'shopping' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('shopping');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="shopping-button"
                                >
                                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>E-Ticaret</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'social' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'social' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('social');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="social-button"
                                >
                                    <Globe className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Marketplace</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'social-groups' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'social-groups' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('social-groups');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }} 
                                    data-testid="social-feed-button"
                                >
                                    <Users2 className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Sosyal Akış</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={activeSecondaryPanel === 'achievements' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-8 w-8 sm:h-10 sm:w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'achievements' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('achievements');
                                            toggleSecondLeftSidebar(true);
                                        }
                                    }}
                                    data-testid="achievements-button"
                                >
                                    <Award className="h-4 w-4 sm:h-5 sm:w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Başarılar & Ödüller</p></TooltipContent>
                        </Tooltip>
                        
                        <Separator className='my-2 w-8' />
                 </div>
            </ScrollArea>

            {/* Fixed Footer */}
            <div className="mt-auto flex flex-col items-center gap-2 p-2">
                    {/* System & Device Management */}
                    <Popover>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button variant={activeBroadcastTargetId ? "secondary" : "ghost"} size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                                        <Airplay className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Yayın Hedefi: {activeBroadcastTarget ? activeBroadcastTarget.title : 'Yok'}</p>
                            </TooltipContent>
                        </Tooltip>
                        <PopoverContent side="right" align="center" className="w-64 p-2 bg-popover/80 backdrop-blur-lg border-border/50">
                             <div className="text-sm font-semibold p-2">Yayın Yapılacak Cihaz Seç</div>
                             <ScrollArea className="h-48">
                                <div className="p-1 space-y-1">
                                {devices.map(device => {
                                    const Icon = getIconByName(device.icon as IconName | undefined) || MonitorSmartphone;
                                    return (
                                        <Button
                                            key={device.id}
                                            variant={activeBroadcastTargetId === device.id ? 'secondary' : 'ghost'}
                                            className="w-full justify-start"
                                            onClick={() => onSetBroadcastTarget(device.id === activeBroadcastTargetId ? null : device.id)}
                                        >
                                            <Icon className="mr-2 h-4 w-4" />
                                            <span className='flex-1 text-left'>{device.title}</span>
                                            {device.isCurrentDevice && <span className='text-xs text-muted-foreground'>(Bu Cihaz)</span>}
                                        </Button>
                                    )
                                })}
                                </div>
                             </ScrollArea>
                        </PopoverContent>
                    </Popover>
                </div>

            {/* Fixed Bottom: Ayarlar ve Profil */}
            <div className="flex flex-col gap-2 mt-auto pb-2">
                <Separator className="my-1" />
                
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className='h-8 w-8 sm:h-10 sm:w-10' 
                            onClick={() => toggleSettingsDialog('integrations')}
                        >
                            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Ayarlar</p>
                    </TooltipContent>
                </Tooltip>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className='h-8 w-8 sm:h-10 sm:w-10'>
                                    <Avatar className='h-9 w-9'>
                                        <AvatarImage src={`https://avatar.vercel.sh/${username}.png`} alt={username} />
                                        <AvatarFallback>
                                            <UserCog />
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{username}</p>
                            </TooltipContent>
                        </Tooltip>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 mb-2 p-2" side="right" align="end">
                        <DropdownMenuLabel>{username}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {/* Tarayıcı Kontrolleri */}
                        <DropdownMenuItem onClick={() => setIsUiHidden?.(!isUiHidden)}>
                            {isUiHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                            <span>{isUiHidden ? 'Arayüzü Göster' : 'Arayüzü Gizle'}</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => toggleFullscreen?.()}>
                            {isFullscreen ? <Minimize className="mr-2 h-4 w-4" /> : <Maximize className="mr-2 h-4 w-4" />}
                            <span>{isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}</span>
                        </DropdownMenuItem>
                        
                        {activeViewId && (
                            <DropdownMenuItem onClick={() => {
                                window.open(
                                    `/popout?itemId=${activeViewId}`,
                                    'popout-view',
                                    'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no'
                                );
                            }}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                <span>Pencereyi Ayır</span>
                            </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => toggleStyleSettingsPanel?.()}>
                            <Palette className="mr-2 h-4 w-4" />
                            <span>Görünüm Ayarları</span>
                        </DropdownMenuItem>
                        

                        
                        <DropdownMenuSeparator />
                        {isUserLoggedIn ? (
                            <>
                                {savedItems && (
                                     <DropdownMenuItem onClick={(e) => { e.preventDefault(); onSetView(savedItems, e); }}>
                                        <Save className="mr-2 h-4 w-4" />
                                        <span>Kaydedilenler</span>
                                    </DropdownMenuItem>
                                )}
                                 <DropdownMenuItem onClick={() => userProfileItem && onShare(userProfileItem)}>
                                    <Share className="mr-2 h-4 w-4" />
                                    <span>Profili Paylaş</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Award className="mr-2 h-4 w-4" />
                                        <span>Başarılar</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={(e) => awardsFolder && onSetView(awardsFolder, e)}>
                                            Başarıları Görüntüle
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem
                                            checked={awardsFolder?.showInLibrary !== false}
                                            onCheckedChange={handleShowAwardsInLibrary}
                                        >
                                            Kitaplığımda Göster
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem>
                                            Profilimde Göster
                                        </DropdownMenuCheckboxItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem onClick={() => router.push('/analytics')}>
                                    <BarChart className="mr-2 h-4 w-4" />
                                    <span>Analiz</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Oturumu Kapat</span>
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <>
                                <DropdownMenuItem onClick={() => router.push('/')}>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    <span>Giriş Yap</span>
                                </DropdownMenuItem>
                            </>
                        )}
                         <DropdownMenuSeparator />
                         
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </div>
    </div>
  );
}
