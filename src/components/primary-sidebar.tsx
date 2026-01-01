

'use client';

import { memo, useRef, useState, useEffect, useMemo, ReactNode } from 'react';
import { Bot, Library, Plus, Trash2, Folder as FolderIcon, FileText as FileIcon, Frame, Copy, List, Eye, Clock, StickyNote, Calendar, Play, Upload, LayoutGrid, AlertCircle, Film, Save, Pencil, MousePointer, Settings, Monitor, Moon, Sun, GripHorizontal, Image as ImageIcon, Expand, RotateCw, ArrowUpNarrowWide, Info, GanttChart, Wand2, User, LogOut, LogIn, ChevronDown, ListIcon, Undo, Redo, Share, Users, MessageSquare, Pin, PinOff, Palette, ArrowDownAZ, ArrowUpAZ, UserPlus, MessageSquarePlus, Minus, EyeOff, ChevronRight, PanelLeft, Link as LinkIcon, ChevronsRight, FolderSync, Award, Mic, History, Sparkles, Bell, Search, Puzzle, Globe, Camera, Tv, UserCog, Home, MonitorSmartphone, Airplay, Projector, QrCode } from 'lucide-react';
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
  activeSecondaryPanel: 'library' | 'social' | 'messages' | 'widgets' | 'notifications' | 'spaces' | 'devices' | 'ai-chat' | null;
  setActiveSecondaryPanel: (panel: 'library' | 'social' | 'messages' | 'widgets' | 'notifications' | 'spaces' | 'devices' | 'ai-chat' | null) => void;
  isSecondLeftSidebarOpen: boolean;
  toggleSecondLeftSidebar: (open?: boolean) => void;
  toggleSearchDialog: () => void;
  toggleSettingsDialog: (initialTab: 'integrations' | 'history' | 'shortcuts' | 'trash') => void;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
  toggleSpacesPanel: () => void;
  toggleDevicesPanel: () => void;
  isSpacesPanelOpen: boolean;
  isDevicesPanelOpen: boolean;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  onShare: (item: ContentItem) => void;
  sessionId: string;
  devices: ContentItem[];
  activeBroadcastTargetId: string | null;
  onSetBroadcastTarget: (id: string | null) => void;
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
    onSetBroadcastTarget,
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
    }
    
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
            <div className="w-14 flex flex-col items-center py-2 border-r bg-sidebar z-20">
            </div>
        );
    }

    const activeBroadcastTarget = devices.find(d => d.id === activeBroadcastTargetId);


  return (
    <div className="flex min-h-0 relative">
        <div className="w-14 flex flex-col items-center py-2 border-r bg-sidebar/60 backdrop-blur-md z-20 h-screen hidden md:flex">
            {/* Fixed Header */}
             <Button variant="ghost" className="h-10 w-10 p-0" onClick={handleLogoClick}>
                <AppLogo className="h-6 w-6 text-primary" />
            </Button>
            
            {/* Scrollable Middle */}
            <ScrollArea className="flex-1 mt-4">
                 <div className='flex flex-col items-center gap-2 p-2'>
                        {/* Main Tools */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button 
                                variant={activeSecondaryPanel === 'library' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                size="icon" 
                                className='h-10 w-10' 
                                onClick={() => {
                                    if (activeSecondaryPanel === 'library' && isSecondLeftSidebarOpen) {
                                        toggleSecondLeftSidebar(false);
                                    } else {
                                        setActiveSecondaryPanel('library');
                                    }
                                }} 
                                data-testid="library-button"
                            >
                                <Library className="h-5 w-5"/>
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Kitaplık</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button 
                                variant={activeSecondaryPanel === 'ai-chat' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                size="icon" 
                                className='h-10 w-10' 
                                onClick={() => {
                                    if (activeSecondaryPanel === 'ai-chat' && isSecondLeftSidebarOpen) {
                                        toggleSecondLeftSidebar(false);
                                    } else {
                                        setActiveSecondaryPanel('ai-chat');
                                    }
                                }} 
                                data-testid="ai-chat-button"
                            >
                                <Bot className="h-5 w-5"/>
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>AI Asistan</p></TooltipContent>
                        </Tooltip>
                         
                        <Separator className='my-2 w-8' />

                        {/* Interaction & Discovery Tools */}
                         <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className='h-10 w-10' onClick={toggleSearchDialog} data-testid="search-button">
                                <Search className="h-5 w-5"/>
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Arama ve Komut</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild>
                               <Button 
                                    variant={activeSecondaryPanel === 'widgets' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                    size="icon" 
                                    className='h-10 w-10' 
                                    onClick={() => {
                                        if (activeSecondaryPanel === 'widgets' && isSecondLeftSidebarOpen) {
                                            toggleSecondLeftSidebar(false);
                                        } else {
                                            setActiveSecondaryPanel('widgets');
                                        }
                                    }} 
                                    data-testid="widgets-button"
                                >
                                    <Puzzle className="h-5 w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Araç Takımları</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button 
                                variant={activeSecondaryPanel === 'social' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                size="icon" 
                                className='h-10 w-10' 
                                onClick={() => {
                                    if (activeSecondaryPanel === 'social' && isSecondLeftSidebarOpen) {
                                        toggleSecondLeftSidebar(false);
                                    } else {
                                        setActiveSecondaryPanel('social');
                                    }
                                }} 
                                data-testid="social-button"
                            >
                                <Users className="h-5 w-5"/>
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Sosyal Merkez</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button 
                                variant={activeSecondaryPanel === 'notifications' && isSecondLeftSidebarOpen ? "secondary" : "ghost"} 
                                size="icon" 
                                className='h-10 w-10 relative' 
                                onClick={() => {
                                    if (activeSecondaryPanel === 'notifications' && isSecondLeftSidebarOpen) {
                                        toggleSecondLeftSidebar(false);
                                    } else {
                                        setActiveSecondaryPanel('notifications');
                                    }
                                }} 
                                data-testid="notifications-button"
                            >
                                <Bell className="h-5 w-5"/>
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
                                className='h-10 w-10 relative' 
                                onClick={() => {
                                    if (activeSecondaryPanel === 'messages' && isSecondLeftSidebarOpen) {
                                        toggleSecondLeftSidebar(false);
                                    } else {
                                        setActiveSecondaryPanel('messages');
                                    }
                                }} 
                                data-testid="messages-button"
                            >
                                    <MessageSquare className="h-5 w-5"/>
                                    <NotificationBadge count={unreadMessagesCount} />
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right"><p>Sohbetler</p></TooltipContent>
                        </Tooltip>

                        <Separator className='my-2 w-8' />"""1"
                 </div>
            </ScrollArea>

            {/* Fixed Footer */}
            <div className="mt-auto flex flex-col items-center gap-2 p-2">
                    {/* System & Device Management */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={isSpacesPanelOpen ? "secondary" : "ghost"} size="icon" className='h-10 w-10' onClick={() => toggleSpacesPanel()} data-testid="spaces-button"><Home className="h-5 w-5"/></Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>Mekanlar</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={isDevicesPanelOpen ? "secondary" : "ghost"} size="icon" className='h-10 w-10' onClick={() => toggleDevicesPanel()} data-testid="devices-button"><MonitorSmartphone className="h-5 w-5"/></Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>Eşyalarım</p></TooltipContent>
                    </Tooltip>
                    <Popover>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button variant={activeBroadcastTargetId ? "secondary" : "ghost"} size="icon" className="h-10 w-10">
                                        <Airplay className="h-5 w-5" />
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
                            className='h-10 w-10' 
                            onClick={() => toggleSettingsDialog('integrations')}
                        >
                            <Settings className="h-5 w-5" />
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
                                <Button variant="ghost" size="icon" className='h-10 w-10'>
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
                        {isUserLoggedIn ? (
                            <>
                                <DropdownMenuItem onClick={(e) => userProfileItem && onSetView(userProfileItem, e)}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profilim</span>
                                </DropdownMenuItem>
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
