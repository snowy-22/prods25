

'use client';

import React, { useState, useMemo, memo, useRef, ChangeEvent, KeyboardEvent, Fragment, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, PanInfo } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ContentItem, SortDirection, SortOption, widgetTemplates, RatingEvent, ItemType } from '@/lib/initial-content';
import { SocialPanel } from './social-panel';
import {
  ThumbsUp,
  Save,
  Share2,
  MessageCircle,
  Plus,
  ArrowUpAZ,
  ArrowUp,
  ArrowDown,
  User,
  Folder as FolderIcon,
  FileText as FileIcon,
  List,
  Play,
  Clock,
  StickyNote,
  Wand2,
  AlertCircle,
  Pin,
  PinOff,
  Copy,
  Pencil,
  Trash2,
  Info,
  ChevronRight,
  Filter,
  Users,
  Search,
  Award,
  Building,
  Sparkles,
  Bell,
  Settings,
  X,
  Eye,
  EyeOff,
  FolderOpen,
  Upload,
  Link as LinkIcon,
  Cloud,
  Home,
  MonitorSmartphone,
  Library,
  Columns2,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  View,
  Puzzle,
  Lightbulb,
  Compass,
  Flame,
  BrainCircuit,
  Calendar,
  MessageSquare,
  MessageSquarePlus,
  UserPlus,
  CheckCheck,
  GanttChart,
  Camera,
  Star,
  ArrowDownAZ,
  Bot,
  Edit2,
  Folder,
  FileText
} from 'lucide-react';
import { FaGoogleDrive, FaDropbox } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useSidebar } from './ui/sidebar';
import { getIconByName, IconName } from '@/lib/icons';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AiChatDialog } from './ai-chat-dialog';
import { ChatPanelState } from '@/lib/store';
import { Separator } from './ui/separator';
import { Message } from '@/ai/flows/assistant-schema';
import { Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { SocialLogo } from './icons/social-logo';
import { MessagingLogo } from './icons/messaging-logo';
import PlayerFrame from './player-frame';
import LibraryContextMenu from './library-context-menu';
import { PharmacyLogo } from './icons/pharmacy-logo';
import { AppLogo } from './icons/app-logo';
import { analyzeContent } from '@/ai/flows/content-analysis-flow';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Textarea } from './ui/textarea';
import MiniGridPreview from './mini-grid-preview';
import UrlInputWidget from './widgets/url-input-widget';
import { WidgetRenderer } from './widget-renderer';

function formatCompactNumber(number: number) {
  if (number < 1000) return number.toString();
  if (number < 1000000) return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (number < 1000000000) return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  return (number / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
}

const TimeAgo = ({ date }: { date: string | Date | undefined }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted || !date) return <span className="opacity-50">...</span>;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return <span className="opacity-50">...</span>;

    return (
        <span>
            {formatDistanceToNow(d, {
                addSuffix: true,
                locale: tr,
            })}
        </span>
    );
};

const SocialFeedCard = memo(function SocialFeedCard({ item, onSetView, onPreviewItem, onSaveItem }: { item: ContentItem, onSetView: (item: ContentItem) => void, onPreviewItem: (item: ContentItem) => void, onSaveItem: (item: ContentItem) => void }) {
  const { toast } = useToast();
  return (
    <div className="bg-card p-3 rounded-lg border">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://robohash.org/${item.author_name}.png`} />
          <AvatarFallback>{item.author_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold">{item.author_name}</p>
          <p className="text-xs text-muted-foreground">
            <TimeAgo date={item.published_at || item.createdAt} />
          </p>
        </div>
        <div className="flex items-center gap-1">
             <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={(e) => { e.stopPropagation(); onPreviewItem(item); }}>
                <Eye className="h-4 w-4" /> Önizle
            </Button>
        </div>
      </div>
      <p className="text-sm mt-2 font-semibold">{item.title}</p>
      <div className="mt-2 aspect-video rounded-md overflow-hidden bg-muted cursor-pointer" onClick={() => onSetView(item)}>
        <PlayerFrame 
            item={item} 
            isEditMode={false} 
            layoutMode='free' 
            onLoad={()=>{}} 
            isSelected={false}
            isPlayerHeaderVisible={false}
            isPlayerSettingsVisible={false}
            onUpdateItem={()=>{}}
            onDeleteItem={()=>{}}
            onCopyItem={()=>{}}
            onShare={()=>{}}
            onShowInfo={()=>{}}
            onNewItemInPlayer={()=>{}}
            onItemClick={() => {}}
             onPreviewItem={() => {}}
             onSaveItem={() => {}}
        >
          <MiniGridPreview item={item} onLoad={() => {}} />
        </PlayerFrame>
      </div>
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="flex items-center gap-1 h-7" onClick={() => toast({ title: 'Beğenildi!', description: `"${item.title}" gönderisini beğendiniz.` })}>
            <ThumbsUp className="h-4 w-4" /> {formatCompactNumber(item.likeCount || 0)}
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1 h-7">
            <MessageCircle className="h-4 w-4" /> {formatCompactNumber(item.viewCount || 0)}
          </Button>
        </div>
        <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7" onClick={() => onSaveItem(item)}>
                <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7" onClick={() => {
                alert(`"${item.title}" paylaşılıyor...`);
            }}>
                <Share2 className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
});

const UserCard = memo(function UserCard({
  user,
  onClick,
}: {
  user: { name: string; isBot?: boolean };
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
      onClick={onClick}
    >
      <Avatar>
        <AvatarImage
          src={
            user.isBot ? undefined : `https://robohash.org/${user.name}.png`
          }
        />
        <AvatarFallback>
          {user.isBot ? (
            <SocialLogo className="h-7 w-7" />
          ) : (
            user.name.charAt(0)
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-muted-foreground">
          @{user.name?.toLowerCase().replace(/ /g, '') || 'user'}
        </p>
      </div>
      {!user.isBot && (
        <Button size="sm" variant="outline">
          Takip Et
        </Button>
      )}
    </div>
  );
});

const OrganizationCard = ({ name, members }: { name: string, members: string[] }) => (
    <div className="bg-card p-3 rounded-lg border">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-md">
                    <Building className="h-5 w-5 text-foreground" />
                </div>
                <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">{members.length} üye</p>
                </div>
            </div>
            <Button variant="outline" size="sm">Yönet</Button>
        </div>
        <div className="flex items-center gap-2 mt-3">
            <div className="flex -space-x-2 overflow-hidden">
                {members.slice(0, 5).map((member) => (
                    <Avatar key={member} className="inline-block h-6 w-6 border-2 border-card">
                        <AvatarImage src={`https://robohash.org/${member}.png`} />
                        <AvatarFallback>{member.charAt(0)}</AvatarFallback>
                    </Avatar>
                ))}
            </div>
            {members.length > 5 && (
                <span className="text-xs text-muted-foreground">+{members.length - 5} daha</span>
            )}
        </div>
    </div>
);

const MessagePreviewCard = memo(function MessagePreviewCard({
  message,
  onClick,
  isPinned,
}: {
  message: {
    id: string;
    name: string;
    lastMessage: string;
    avatar: string;
    type: 'text' | 'list' | 'user' | 'bot' | 'group' | 'channel' | 'social';
    action?: () => void;
  };
  onClick: () => void;
  isPinned: boolean;
}) {
  const getAvatar = () => {
    switch (message.type) {
        case 'bot': return <Bot className="h-6 w-6 text-primary"/>;
        case 'user': return <AvatarImage src={`https://robohash.org/${message.avatar}.png`} />;
        case 'group': return <Users className="h-6 w-6" />;
        case 'channel': return <Building className="h-6 w-6" />;
        case 'social': return <Sparkles className="h-6 w-6 text-primary" />;
        default: return message.name.charAt(0);
    }
  }
  return (
    <div
      className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer", isPinned && 'bg-accent/50')}
      onClick={message.action ? message.action : onClick}
    >
      <div className="relative">
        <Avatar>
            <AvatarFallback>
                {getAvatar()}
            </AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold truncate">{message.name}</p>
        <p
          className={cn(
            'text-xs truncate',
            message.type === 'list' || message.type === 'social'
              ? 'text-primary italic'
              : 'text-muted-foreground'
          )}
        >
          {message.lastMessage}
        </p>
      </div>
      {isPinned && <Pin className="h-4 w-4 text-primary flex-shrink-0" />}
    </div>
  );
});

type NotificationType = 'like' | 'follow' | 'task' | 'message' | 'share';
type Notification = {
    id: string;
    type: NotificationType;
    user: { name: string; avatar: string; };
    content: string;
    time: string;
};

const notificationIcons: Record<NotificationType, React.ElementType> = {
    like: ThumbsUp,
    follow: UserPlus,
    task: GanttChart,
    message: MessageSquare,
    share: Share2,
};

const NotificationCard = memo(function NotificationCard({ 
    notification, 
    onDismiss 
}: { 
    notification: Notification;
    onDismiss?: (id: string) => void;
}) {
    const Icon = notificationIcons[notification.type];
    const [isDismissed, setIsDismissed] = useState(false);

    const handleDismiss = () => {
        setIsDismissed(true);
        setTimeout(() => {
            onDismiss?.(notification.id);
        }, 300);
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Swipe threshold: 100px to left or right
        if (Math.abs(info.offset.x) > 100) {
            handleDismiss();
        }
    };

    return (
        <motion.div 
            className="flex items-start gap-3 p-3 text-sm hover:bg-accent rounded-lg group cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 1, x: 0 }}
            animate={{ 
                opacity: isDismissed ? 0 : 1,
                x: isDismissed ? -300 : 0,
                height: isDismissed ? 0 : 'auto'
            }}
            transition={{ 
                opacity: { duration: 0.3 },
                x: { duration: 0.3 },
                height: { duration: 0.3, delay: isDismissed ? 0.15 : 0 }
            }}
        >
            <div className="relative pointer-events-none">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={notification.user.avatar} />
                    <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                    <Icon className={cn("h-3.5 w-3.5", 
                        notification.type === 'like' && 'text-blue-500',
                        notification.type === 'follow' && 'text-green-500',
                        notification.type === 'share' && 'text-purple-500'
                    )} />
                </div>
            </div>
            <div className='flex-1 pointer-events-none'>
                <p dangerouslySetInnerHTML={{ __html: notification.content }} />
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                onClick={handleDismiss}
            >
                <X className="h-4 w-4" />
            </Button>
        </motion.div>
    )
});


const WidgetCard = memo(function WidgetCard({ 
    widget, 
    viewMode,
    onWidgetClick,
    onDragStart,
}: { 
    widget: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>,
    viewMode: 'preview' | 'icon',
    onWidgetClick: (w: any) => void,
    onDragStart: (e: React.DragEvent) => void,
}) {
    const Icon = getIconByName(widget.icon as IconName | undefined);

    if (viewMode === 'icon') {
        return (
             <div
                className="flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => onWidgetClick(widget)}
                onDragStart={onDragStart}
                draggable
              >
                {Icon && <Icon className="h-6 w-6 mb-1" />}
                <p className="text-xs text-center">{widget.title}</p>
            </div>
        )
    }

    return (
        <div
            className="cursor-pointer group"
            onClick={() => onWidgetClick(widget)}
            onDragStart={onDragStart}
            draggable
        >
            <div className="border rounded-lg overflow-hidden aspect-video pointer-events-none bg-card relative">
                <PlayerFrame
                    item={{...widget, id: `preview-${widget.title}`, createdAt: '', updatedAt: ''} as any}
                    isEditMode={false}
                    layoutMode='free'
                    onLoad={() => {}}
                    isSelected={false}
                    isPlayerHeaderVisible={false}
                    isPlayerSettingsVisible={false}
                    onUpdateItem={()=>{}}
                    onDeleteItem={()=>{}}
                    onCopyItem={()=>{}}
                    onShare={()=>{}}
                    onShowInfo={()=>{}}
                    onNewItemInPlayer={()=>{}}
                    onItemClick={() => {}}
                     onPreviewItem={() => {}}
                     onSaveItem={() => {}}
                >
                  <WidgetRenderer item={{...widget, id: `preview-${widget.title}`} as any} />
                </PlayerFrame>
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 transition-colors" />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-1">{widget.title}</p>
        </div>
    );
});


type SecondarySidebarProps = {
  type: 'library' | 'social' | 'messages' | 'widgets' | 'notifications' | 'spaces' | 'devices' | 'ai-chat';
  // Library props
  allItems?: ContentItem[];
  onSetView?: (item: ContentItem | null, event?: React.MouseEvent | React.TouchEvent) => void;
  activeView?: ContentItem;
  draggedItem?: any;
  setDraggedItem?: (item: any) => void;
  onDeleteItem?: (itemId: string) => void;
  onSetClipboard?: (items: { item: ContentItem; operation: 'copy' | 'cut' }[]) => void;
  onPaste?: () => void;
  clipboard?: { item: ContentItem; operation: 'copy' | 'cut' }[];
  onShowInfo?: (item: ContentItem | null) => void;
  onPreviewItem: (item: ContentItem) => void;
  onShare?: (item: ContentItem) => void;
  onRenameItem?: (itemId: string, newName: string) => void;
  onTogglePinItem?: (item: ContentItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
  onToolCall?: (toolName: string, args: any) => void;
  username?: string;
  onUploadVideo?: () => void;
  onNewFolder?: () => void;
  onNewList?: () => void;
  onNewPlayer?: () => void;
  onNewCalendar?: () => void;
  onNewSpace?: () => void;
  onNewDevice?: () => void;
  expandedItems?: string[];
  onToggleExpansion?: (itemId: string) => void;
  setActiveDevice?: (deviceId: string | null) => void;
  activeDeviceId?: string | null;
  onLibraryDrop?: (result: DropResult) => void;
  selectedItemIds: string[];
  onItemClick: (item: ContentItem, event: React.MouseEvent | React.TouchEvent) => void;
  onOpenInNewTab?: (item: ContentItem, allItems: ContentItem[]) => void;

  // Social props
  socialUsers?: any[];
  socialContent?: any[];
  onUserCardClick?: (user: any) => void;
  
  // Widgets props
  widgetTemplates?: Record<string, Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>[]>;
  onWidgetClick?: (item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>) => void;
  onSaveItem?: (item: ContentItem) => void;
  onAddItem: (itemData: any, parentId: string | null, index?: number) => Promise<any>;
  onAddFolderWithItems: (folderName: string, itemsToAdd: { type: ItemType; url: string }[], parentId: string | null) => void;
};

export const RatingPopoverContent = ({ item, onUpdateItem }: { item: ContentItem, onUpdateItem: (id: string, updates: Partial<ContentItem>) => void }) => {
    const { toast } = useToast();
    const handleRating = (newRating: number) => {
        const newRatingEvent: RatingEvent = {
            userId: 'guest', // Replace with actual user ID
            rating: newRating,
            timestamp: new Date().toISOString(),
        };
        const updatedRatings = [...(item.ratings || [])];
        const userRatingIndex = updatedRatings.findIndex(r => r.userId === 'guest');

        if (userRatingIndex > -1) {
            updatedRatings[userRatingIndex] = newRatingEvent;
        } else {
            updatedRatings.push(newRatingEvent);
        }
        onUpdateItem(item.id, { ratings: updatedRatings, myRating: newRating });
    };

    const renderStars = (currentRating: number | undefined) => {
        const stars = [];
        for (let i = 1; i <= 10; i++) {
            stars.push(
                <Star 
                    key={i} 
                    className={cn("h-5 w-5 cursor-pointer transition-colors", i <= (currentRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400/50")}
                    onClick={() => handleRating(i)}
                />
            );
        }
        return stars;
    }
    
    return (
        <PopoverContent className="w-80 bg-popover/80 backdrop-blur-lg border-border/50">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Puan Ver & Yorum Yap</h4>
                    <p className="text-sm text-muted-foreground">
                        Bu öğeyi değerlendirin ve düşüncelerinizi paylaşın.
                    </p>
                </div>
                {item.sharing?.canRate !== false && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Puanınız</label>
                        <div className="flex items-center gap-1">
                            {renderStars(item.myRating)}
                        </div>
                    </div>
                )}
                 {item.sharing?.canComment !== false && (
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Yorum</label>
                        <Textarea placeholder="Yorumunuzu buraya yazın..."/>
                        <Button size="sm" className="w-full mt-2" onClick={() => toast({ title: 'Yorum ve Puan Gönderildi!' })}>
                            Yorumu ve Puanı Paylaş
                        </Button>
                    </div>
                 )}
            </div>
        </PopoverContent>
    );
};


const LibraryGridCard = memo(function LibraryGridCard({ 
    item, 
    onShowInfo, 
    onItemClick,
    onDeleteItem,
    onTogglePinItem,
    onRenameItem
}: { 
    item: ContentItem; 
    onShowInfo: (item: ContentItem) => void;
    onItemClick?: (item: ContentItem) => void;
    onDeleteItem: (id: string) => void;
    onTogglePinItem: (id: string) => void;
    onRenameItem: (id: string, name: string) => void;
}) {
    const ItemIcon = (getIconByName(item.icon as IconName) || (item.type === 'video' ? Play : item.type === 'website' ? Globe : item.type === 'image' ? ImageIcon : FileIcon)) as React.ElementType;
    
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Card 
                    className="group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all aspect-square flex flex-col items-center justify-center p-4 text-center bg-muted/30"
                    onClick={() => onItemClick?.(item)}
                >
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePinItem(item.id);
                            }}
                        >
                            <Star className={cn("h-3 w-3", item.isPinned && "fill-yellow-400 text-yellow-400")} />
                        </Button>
                    </div>
                    
                    <div className="mb-2 p-3 rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform">
                        <ItemIcon className="h-8 w-8 text-primary" />
                    </div>
                    
                    <div className="w-full px-1">
                        <p className="text-xs font-medium truncate w-full">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{item.type}</p>
                    </div>

                    {item.type === 'video' && (
                        <div className="absolute bottom-1 right-1">
                            <Play className="h-3 w-3 text-muted-foreground/50" />
                        </div>
                    )}
                </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => onShowInfo(item)}>
                    <Info className="mr-2 h-4 w-4" /> Bilgi
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onRenameItem(item.id, item.title)}>
                    <Edit2 className="mr-2 h-4 w-4" /> Yeniden Adlandır
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-destructive" onClick={() => onDeleteItem(item.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
});


const LibraryItem = memo(function LibraryItem({
  item,
  index,
  activeView,
  onSetView,
  onShowInfo,
  onShare,
  onDeleteItem,
  onSetClipboard,
  onTogglePinItem,
  onRenameItem,
  onPreviewItem,
  isExpanded,
  toggleExpansion,
  activeDeviceId,
  onDeviceClick,
  onDragStart: onDragStartProp,
  onUpdateItem,
  onSaveItem,
  onAddItem,
  onOpenInNewTab,
  visibleColumns,
  allItems,
  dragHandleProps,
  isSelected,
  onItemClick,
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(item.title);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const { toast } = useToast();
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const contextMenuTriggerRef = useRef<HTMLDivElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);


  const isContainer = ['folder', 'list', 'inventory', 'space', 'saved-items'].includes(item.type);
  const isDevice = item.type === 'devices';
  const Icon = getIconByName(item.icon as IconName | undefined) || FolderIcon;

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    // Handle Ctrl+Click or middle mouse button - open in new tab
    if ((e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).button === 1) {
      e.preventDefault();
      if (onOpenInNewTab && (isContainer || ['video', 'website', 'iframe', '3dplayer'].includes(item.type))) {
        onOpenInNewTab(item, allItems);
      }
      return;
    }
    
    // Handle Ctrl+Shift+Click - open in browser new tab
    if ((e as React.MouseEvent).ctrlKey && (e as React.MouseEvent).shiftKey) {
      e.preventDefault();
      if (item.url) {
        window.open(item.url, '_blank');
      }
      return;
    }
    
    // Single click - flash border animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 600);
    
    if (onItemClick) {
        onItemClick(item, e);
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    longPressTimer.current = setTimeout(() => {
        if(contextMenuTriggerRef.current) {
            // Create and dispatch a native contextmenu event
            const event = new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: window,
                buttons: 2, // Right button
                clientX: (e.touches[0] || e.changedTouches[0]).clientX,
                clientY: (e.touches[0] || e.changedTouches[0]).clientY
            });
            contextMenuTriggerRef.current.dispatchEvent(event);
        }
    }, 500); // 500ms for long press
  };

  const handleTouchMove = () => {
     if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    // This prevents click from firing after a long press that opened a context menu
    if (e.timeStamp - (longPressTimer.current as any) > 500) {
        e.preventDefault();
    }
  };


  const handleRename = () => {
    if (newName.trim() && newName !== item.title) {
      onRenameItem(item.id, newName);
    }
    setIsEditing(false);
  };
  
  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnalyzing(true);
    try {
        const result = await analyzeContent({ item });
        if (process.env.NODE_ENV === 'development') {
          console.log("Analysis Result:", result);
        }
        // Here you would typically show the result in a dialog or toast
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Analysis failed:", error);
        }
    } finally {
        setIsAnalyzing(false);
    }
  }

  const hasChildren = item.children && item.children.length > 0;
  
  const isActive = activeView?.id === item.id || (isDevice && activeDeviceId === item.id) || isSelected;

  return (
    <Fragment>
      <ContextMenu>
        <ContextMenuTrigger asChild>
            <div
                ref={contextMenuTriggerRef}
                className={cn(
                'relative flex items-center gap-2 p-2 rounded-md cursor-pointer group w-full text-sm transition-all duration-200',
                isActive ? 'bg-accent font-semibold' : 'hover:bg-accent',
                isFlashing && 'ring-2 ring-primary ring-opacity-50 animate-pulse',
                isSelected && 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background'
                )}
                style={{ paddingLeft: `${0.5 + (item.level || 0) * 0.75}rem` }}
                onClick={handleClick}
                onMouseDown={(e) => {
                  // Prevent default for middle mouse button to avoid unwanted behavior
                  if (e.button === 1) {
                    e.preventDefault();
                  }
                }}
                onDragStart={onDragStartProp}
                draggable
                onDragOver={(e) => {
                    if (isContainer) {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-primary/10');
                    }
                }}
                onDragLeave={(e) => {
                    if (isContainer) {
                        e.currentTarget.classList.remove('bg-primary/10');
                    }
                }}
                onDrop={(e) => {
                    if (isContainer) {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-primary/10');
                        const data = e.dataTransfer.getData('application/json');
                        if (data) {
                            try {
                                const droppedItem = JSON.parse(data);
                                onAddItem(droppedItem, item.id);
                            } catch (err) {
                                if (process.env.NODE_ENV === 'development') {
                                  console.error("Drop failed", err);
                                }
                            }
                        }
                    }
                }}
                onDoubleClick={(e) => { 
                    e.stopPropagation();
                    const isContainer = ['folder', 'list', 'inventory', 'space', 'calendar', 'saved-items', 'root'].includes(item.type);
                    // Double click - open folder/list in same tab
                    if (isContainer && onSetView) {
                        onSetView(item, e);
                    }
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove} 
                {...dragHandleProps}
            >
                <div className="flex items-center gap-1 w-8 flex-shrink-0 text-muted-foreground font-mono text-xs">
                {(isContainer || isDevice) && hasChildren ? (
                    <ChevronRight
                        className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-200', isExpanded && 'rotate-90')}
                        onClick={(e) => { e.stopPropagation(); toggleExpansion(item.id); }}
                    />
                ) : <div className="w-4 h-4 flex-shrink-0" />}
                <span>{item.hierarchyId}</span>
                </div>
                <div className="flex items-center justify-center h-4 w-4 flex-shrink-0">
                  {item.thumbnail_url ? (
                    <div className="relative h-4 w-4 rounded-sm overflow-hidden">
                      <Image 
                        src={item.thumbnail_url} 
                        alt={item.title} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <Icon className="h-4 w-4 flex-shrink-0" />
                  )}
                </div>
                {isEditing ? (
                <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    autoFocus
                    className="h-7 text-sm"
                    onClick={(e) => e.stopPropagation()}
                />
                ) : (
                <span className="truncate flex-1 min-w-0">{item.title}</span>
                )}
                <div className="flex items-center ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 gap-2">
                    {item.averageRating !== undefined && visibleColumns.has('rating') && (
                         <div className="flex items-center gap-1 font-bold text-sm text-amber-500">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span>{(item.averageRating || 0).toFixed(1)}</span>
                        </div>
                    )}
                    {item.likeCount !== undefined && visibleColumns.has('likes') && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground" onClick={(e) => { e.stopPropagation(); onUpdateItem(item.id, { isLiked: !item.isLiked, likeCount: (item.likeCount || 0) + (item.isLiked ? -1 : 1) })}}>
                            <ThumbsUp className={cn("h-4 w-4", item.isLiked && "fill-primary text-primary")} />
                            <span>{item.likeCount || 0}</span>
                        </div>
                    )}
                    {item.viewCount !== undefined && visibleColumns.has('views') && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            <span>{item.viewCount || 0}</span>
                        </div>
                    )}
                    {isContainer && visibleColumns.has('items') && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <List className="h-4 w-4" />
                            <span>{item.itemCount || 0}</span>
                        </div>
                    )}
                    {visibleColumns.has('share') && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground" onClick={(e) => {e.stopPropagation(); onShare(item)}}>
                            <Share2 className="h-4 w-4" />
                        </div>
                    )}
                    {visibleColumns.has('save') && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground" onClick={(e) => {e.stopPropagation(); onSaveItem(item)}}>
                            <Save className="h-4 w-4" />
                        </div>
                    )}
                    {visibleColumns.has('preview') && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground" onClick={(e) => {e.stopPropagation(); onPreviewItem(item)}}>
                            <Eye className="h-4 w-4" />
                        </div>
                    )}
                </div>
                {isSelected && (
                    <div className="absolute right-2 top-2 text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                        Seçili • Shift/Ctrl
                    </div>
                )}
            </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <LibraryContextMenu
            item={item}
            allItems={allItems}
            panelType='library' // This needs to be dynamic if used elsewhere
            isViewOwnedByUser={true}
            onSetClipboard={onSetClipboard}
            onPaste={()=>{}} // onPaste is for background
            clipboard={[]} // clipboard state is for background
            onShowInfo={onShowInfo}
            onUpdateItem={onUpdateItem}
            onNewFile={() => {}}
            onNewFolder={() => {}}
            onNewList={() => {}}
            onNewPlayer={() => {}}
            onNewCalendar={() => {}}
            onNewSpace={() => {}}
            onNewDevice={() => {}}
            onDeleteItem={onDeleteItem}
          />
        </ContextMenuContent>
      </ContextMenu>
    </Fragment>
  );
});

const SecondarySidebar = memo(function SecondarySidebar(props: SecondarySidebarProps) {
    const { setOpen: setSidebarOpen } = useSidebar();
    const [widgetViewMode, setWidgetViewMode] = useState<'preview' | 'icon'>('preview');
    const [libraryViewMode, setLibraryViewMode] = useState<'list' | 'grid'>('list');
    const [librarySearchQuery, setLibrarySearchQuery] = useState('');
    const [filterType, setFilterType] = useState<ItemType[]>([]);
    
    // Default state managed locally
    const [sortOption, setSortOption] = useState<SortOption>('manual');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [visibleColumns, setVisibleColumns] = useState(new Set(['rating', 'likes', 'share', 'save', 'preview', 'items', 'updatedAt']));
    
    const [widgetSearchQuery, setWidgetSearchQuery] = useState('');
    const [isWidgetSearchOpen, setIsWidgetSearchOpen] = useState(false);
    
    // Library panel controls - must be at top level for Rules of Hooks
    const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
    const [showLibraryDetails, setShowLibraryDetails] = useState(true);


    const {
        type,
        allItems = [],
        onSetView,
        onPreviewItem,
        socialUsers = [],
        socialContent = [],
        onUserCardClick,
        onSaveItem,
        onUpdateItem,
        activeView,
        onAddItem,
        onAddFolderWithItems,
        onItemClick,
        selectedItemIds,
        username,
    } = props;
  
    const handleSetView = useCallback((item: ContentItem | null, event?: React.MouseEvent | React.TouchEvent) => {
        if(onSetView) {
            onSetView(item, event);
        }
    }, [onSetView]);

    const pinnedItems = useMemo(() => allItems.filter((c) => c.isPinned), [allItems]);

    const userProfileItem = useMemo(() => allItems.find(item => item.id === 'user-profile'), [allItems]);

    const publicCollections = useMemo(() => allItems.filter(item => item.isPublic && (item.type === 'folder' || item.type === 'list')), [allItems]);

    const panelTitleMap: Record<string, string> = {
        library: 'Kitaplık',
        social: 'Sosyal Merkez',
        messages: 'Sohbetler',
        widgets: 'Araç Takımları',
        notifications: 'Bildirimler',
        spaces: 'Mekanlar',
        devices: 'Eşyalarım'
    };
    
    const headerIconMap: Record<string, React.ReactNode> = {
        library: <Library className='h-5 w-5' />,
        social: <Users className='h-5 w-5' />,
        messages: <MessageSquare className='h-5 w-5' />,
        widgets: <Puzzle className='h-5 w-5' />,
        notifications: <Bell className='h-5 w-5' />,
        spaces: <Home className='h-5 w-5' />,
        devices: <MonitorSmartphone className='h-5 w-5' />
    };
    
     const handleSort = (option: SortOption) => {
        const newDirection = sortOption === option && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortOption(option);
        setSortDirection(newDirection);
        if(activeView && onUpdateItem) {
            onUpdateItem(activeView.id, { sortOption: option, sortDirection: newDirection });
        }
    };

    useEffect(() => {
        if(activeView?.sortOption) setSortOption(activeView.sortOption);
        if(activeView?.sortDirection) setSortDirection(activeView.sortDirection);
    }, [activeView]);

    const sortedItems = useMemo(() => {
        // Başlangıç: mevcut aktif klasörün çocukları
        let itemsToSort = allItems.filter(i => i.parentId === (activeView?.id ?? null));

        // Arama: başlık, içerik veya URL'de eşleşme (aktif klasör içi)
        if (librarySearchQuery.trim()) {
            const query = librarySearchQuery.toLowerCase();
            itemsToSort = itemsToSort.filter(i =>
                (i.title || '').toLowerCase().includes(query) ||
                (i.content && i.content.toLowerCase().includes(query)) ||
                (i.url && i.url.toLowerCase().includes(query))
            );
        }

        // Tür filtreleri
        if (filterType.length > 0) {
            itemsToSort = itemsToSort.filter(i => filterType.includes(i.type));
        }

        return [...itemsToSort].sort((a, b) => {
             if (sortOption === 'manual') {
                return (a.order ?? 0) - (b.order ?? 0);
            }
            if (sortOption === 'name') {
                return sortDirection === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
            }
            if (sortOption === 'createdAt') {
                return sortDirection === 'asc' ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (sortOption === 'updatedAt') {
                return sortDirection === 'asc'
                  ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
                  : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            if (sortOption === 'averageRating') {
                 return sortDirection === 'asc' ? (a.averageRating || 0) - (b.averageRating || 0) : (b.averageRating || 0) - (a.averageRating || 0);
            }
            if (sortOption === 'itemCount') {
                return sortDirection === 'asc' ? (a.itemCount || 0) - (b.itemCount || 0) : (b.itemCount || 0) - (a.itemCount || 0);
            }
            if (sortOption === 'platformViews') {
                return sortDirection === 'asc' ? (a.platformViewCount || 0) - (b.platformViewCount || 0) : (b.platformViewCount || 0) - (a.platformViewCount || 0);
            }
            if (sortOption === 'platformLikes') {
                return sortDirection === 'asc' ? (a.platformLikeCount || 0) - (b.platformLikeCount || 0) : (b.platformLikeCount || 0) - (a.platformLikeCount || 0);
            }
            if (sortOption === 'sourceViews') {
                return sortDirection === 'asc' ? (a.viewCount || 0) - (b.viewCount || 0) : (b.viewCount || 0) - (a.viewCount || 0);
            }
            if (sortOption === 'sourceLikes') {
                return sortDirection === 'asc' ? (a.likeCount || 0) - (b.likeCount || 0) : (b.likeCount || 0) - (a.likeCount || 0);
            }
            if (sortOption === 'sourceCreatedAt') {
                if (!a.published_at && !b.published_at) return 0;
                if (!a.published_at) return sortDirection === 'asc' ? 1 : -1;
                if (!b.published_at) return sortDirection === 'asc' ? -1 : 1;
                return sortDirection === 'asc' 
                  ? new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
                  : new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
            }
            return 0;
        });
    }, [allItems, activeView, sortOption, sortDirection, librarySearchQuery, filterType]);
    
    const renderItems = (items: ContentItem[], level = 0): React.ReactNode[] => {
        return items.map((item, index) => {
             const children = allItems.filter(child => child.parentId === item.id);
             children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return (
                 <Fragment key={item.id}>
                    <LibraryItem
                        item={{...item, level}}
                        index={index}
                        activeView={props.activeView}
                        onSetView={handleSetView}
                        isExpanded={(props.expandedItems || []).includes(item.id)}
                        toggleExpansion={props.onToggleExpansion!}
                        onShowInfo={props.onShowInfo!}
                        onShare={props.onShare!}
                        onDeleteItem={props.onDeleteItem!}
                        onSetClipboard={props.onSetClipboard!}
                        onTogglePinItem={props.onTogglePinItem!}
                        onRenameItem={props.onRenameItem!}
                        onPreviewItem={props.onPreviewItem!}
                        onSaveItem={onSaveItem!}
                        onUpdateItem={onUpdateItem!}
                        onAddItem={onAddItem}
                        onOpenInNewTab={props.onOpenInNewTab}
                        visibleColumns={visibleColumns}
                        allItems={allItems}
                        clipboard={props.clipboard}
                        onItemClick={onItemClick}
                        isSelected={selectedItemIds.includes(item.id)}
                        onDragStart={(e: React.DragEvent) => {
                            if (props.setDraggedItem) {
                                e.dataTransfer.setData('application/json', JSON.stringify({ ...item, isNew: true }));
                                props.setDraggedItem(item);
                            }
                        }}
                    />
                    {(props.expandedItems || []).includes(item.id) && children.length > 0 &&
                        renderItems(children, level + 1)
                    }
                </Fragment>
            );
        });
    };


    const notifications: Notification[] = [
      { id: '1', type: 'like', user: { name: 'Zeynep Kaya', avatar: 'https://robohash.org/zeynep.png'}, content: `<b>Yaz Koleksiyonu</b> listenizi beğendi.`, time: '5 dakika önce' },
      { id: '2', type: 'follow', user: { name: 'Ahmet Yılmaz', avatar: 'https://robohash.org/ahmet.png'}, content: `sizi takip etmeye başladı.`, time: '1 saat önce' },
      { id: '3', type: 'task', user: { name: 'Proje Ekibi', avatar: 'https://robohash.org/proje.png'}, content: `sizi bir göreve atadı: <b>Giriş sayfasını tasarla</b>`, time: '3 saat önce' },
      { id: '4', type: 'message', user: { name: 'Can', avatar: 'https://robohash.org/can.png'}, content: `size bir mesaj gönderdi.`, time: 'dün' },
      { id: '5', type: 'share', user: { name: 'Elif', avatar: 'https://robohash.org/elif.png'}, content: `sizinle <b>Sunum</b> listesini paylaştı.`, time: '2 gün önce' },
    ];

    const pinnedMessages = [ { id: 'asistan', name: 'Asistan', lastMessage: 'Size nasıl yardımcı olabilirim?', avatar: '', type: 'bot' as const }];
    const recentMessages = (socialUsers || []).map(u => ({ 
        id: (u.name || u.title || 'user').toLowerCase().replace(/\s+/g, '-'), 
        name: u.name || u.title || 'User', 
        lastMessage: 'Harika görünüyor!', 
        avatar: u.avatar || u.title, 
        type: 'user' as const 
    }));

    const columnOptions = [
        { id: 'items', label: 'Öğe Sayısı'},
        { id: 'createdAt', label: 'Oluşturma Tarihi'},
        { id: 'updatedAt', label: 'Güncelleme Tarihi'},
        { id: 'rating', label: 'Puan' },
        { id: 'likes', label: 'Beğeni' },
        { id: 'views', label: 'İzlenme'},
        { id: 'share', label: 'Paylaş' },
        { id: 'save', label: 'Kaydet' },
        { id: 'preview', label: 'Önizle' },
    ];

    switch (type) {
        case 'library':
        case 'spaces':
        case 'devices':
            const { onSetClipboard, onPaste, clipboard, onShowInfo, onShare, onRenameItem, onTogglePinItem, onNewFolder, onNewList, onNewPlayer, onNewCalendar, onNewSpace, onNewDevice, expandedItems, onToggleExpansion, setActiveDevice, activeDeviceId, setDraggedItem, onDeleteItem, onLibraryDrop } = props;
            
            return (
              <div className="h-full flex flex-col bg-card/60 backdrop-blur-md hidden lg:flex" data-testid={`${props.type}-panel`}>
                                <div className="p-3 border-b flex items-center justify-between h-16">
                  <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                    {headerIconMap[type]} {panelTitleMap[type]}
                  </h2>
                  <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => setLibraryViewMode(libraryViewMode === 'list' ? 'grid' : 'list')}
                        title={libraryViewMode === 'list' ? 'Izgara Görünümü' : 'Liste Görünümü'}
                    >
                        {libraryViewMode === 'list' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                    </Button>
                    {type === 'library' && (
                        <>
                            <Button
                                variant={showLibraryDetails ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setShowLibraryDetails(!showLibraryDetails)}
                                title="Detayları Göster/Gizle"
                            >
                                <Info className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={isLibraryExpanded ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                                title={isLibraryExpanded ? 'Küçült' : 'Genişlet'}
                            >
                                {isLibraryExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rotate-180" />}
                            </Button>
                        </>
                    )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setSidebarOpen(false)}
                                            title="Paneli Kapat"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                  </div>
                </div>
                
                {/* Breadcrumb Navigation */}
                {type === 'library' && (
                  <div className="px-3 py-2 border-b bg-primary/5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto no-scrollbar">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs hover:text-primary"
                        onClick={() => props.onSetView?.(allItems.find(i => i.id === 'root') || null)}
                      >
                        <Home className="h-3 w-3 mr-1" /> Ana Dizin
                      </Button>
                      {props.activeView && props.activeView.id !== 'root' && (() => {
                        // Build breadcrumb path from root to current
                        const breadcrumbPath: ContentItem[] = [];
                                                let current: ContentItem | null = props.activeView;

                                                while (current && current.id !== 'root') {
                                                    breadcrumbPath.unshift(current);
                                                    const parentId: string | null = current ? current.parentId ?? null : null;
                                                    const parent: ContentItem | null = parentId ? (allItems.find(i => i.id === parentId) ?? null) : null;
                                                    current = parent;
                                                }
                        
                        return breadcrumbPath.map((item, index) => (
                          <Fragment key={item.id}>
                            <ChevronRight className="h-3 w-3 flex-shrink-0" />
                            {index === breadcrumbPath.length - 1 ? (
                              <span className="font-semibold text-primary whitespace-nowrap">{item.title}</span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs hover:text-primary whitespace-nowrap"
                                onClick={() => props.onSetView?.(item)}
                              >
                                {item.title}
                              </Button>
                            )}
                          </Fragment>
                        ));
                      })()}
                    </div>
                  </div>
                )}
                
                <div className="px-3 py-2 border-b space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Kitaplıkta ara..." 
                            className="pl-8 h-9" 
                            value={librarySearchQuery}
                            onChange={(e) => setLibrarySearchQuery(e.target.value)}
                        />
                        {librarySearchQuery && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-1 top-1 h-7 w-7" 
                                onClick={() => setLibrarySearchQuery('')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <div className='flex items-center gap-1 border-r pr-2 mr-1'>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <Columns2 className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Ayrıntılar</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {columnOptions.map(col => (
                                        <DropdownMenuCheckboxItem
                                            key={col.id}
                                            checked={visibleColumns.has(col.id)}
                                            onCheckedChange={(checked) => {
                                                const newColumns = new Set(visibleColumns);
                                                if(checked) newColumns.add(col.id);
                                                else newColumns.delete(col.id);
                                                setVisibleColumns(newColumns);
                                            }}
                                        >
                                            {col.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        {sortDirection === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Sırala</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleSort('manual')} className="flex items-center">
                                        <span className="flex-1">Manuel</span>
                                        {sortOption === 'manual' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort('name')} className="flex items-center">
                                        <span className="flex-1">İsim</span>
                                        {sortOption === 'name' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort('createdAt')} className="flex items-center">
                                        <span className="flex-1">Oluşturma Tarihi</span>
                                        {sortOption === 'createdAt' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort('updatedAt')} className="flex items-center">
                                        <span className="flex-1">Güncelleme Tarihi</span>
                                        {sortOption === 'updatedAt' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort('itemCount')} className="flex items-center">
                                        <span className="flex-1">Öğe Sayısı</span>
                                        {sortOption === 'itemCount' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort('averageRating')} className="flex items-center">
                                        <span className="flex-1">Puan</span>
                                        {sortOption === 'averageRating' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort('platformViews')} className="flex items-center">
                                        <span className="flex-1">İzlenme Sayısı</span>
                                        {sortOption === 'platformViews' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort('platformLikes')} className="flex items-center">
                                        <span className="flex-1">Beğeni Sayısı</span>
                                        {sortOption === 'platformLikes' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs text-muted-foreground">Kaynağa Göre Sırala</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleSort('sourceViews')} className="flex items-center">
                                        <span className="flex-1">İzlenme (Kaynak)</span>
                                        {sortOption === 'sourceViews' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort('sourceLikes')} className="flex items-center">
                                        <span className="flex-1">Beğeni (Kaynak)</span>
                                        {sortOption === 'sourceLikes' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSort('sourceCreatedAt')} className="flex items-center">
                                        <span className="flex-1">Oluşturulma (Kaynak)</span>
                                        {sortOption === 'sourceCreatedAt' && (sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <Button 
                            variant={filterType.length === 0 ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="h-7 text-xs rounded-full"
                            onClick={() => setFilterType([])}
                        >
                            Hepsi
                        </Button>
                        {(['folder', 'video', 'website', 'image', 'notes', 'clock'] as ItemType[]).map(t => (
                            <Button 
                                key={t}
                                variant={filterType.includes(t) ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-7 text-xs rounded-full capitalize"
                                onClick={() => {
                                    setFilterType(prev => {
                                        if (prev.includes(t)) {
                                            return prev.filter(type => type !== t);
                                        } else {
                                            return [...prev, t];
                                        }
                                    });
                                }}
                            >
                                {t === 'folder' ? 'Klasör' : t === 'video' ? 'Video' : t === 'website' ? 'Site' : t === 'image' ? 'Resim' : t === 'notes' ? 'Not' : 'Saat'}
                            </Button>
                        ))}
                    </div>
                </div>
                <ContextMenu>
                  <ContextMenuTrigger className="flex-1 min-h-0">
                    <ScrollArea 
                        className="h-full"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const data = e.dataTransfer.getData('application/json');
                            if (data) {
                                try {
                                    const item = JSON.parse(data);
                                    // Move to root (parentId: null)
                                    onAddItem(item, null);
                                } catch (err) {
                                    if (process.env.NODE_ENV === 'development') {
                                      console.error("Drop failed", err);
                                    }
                                }
                            }
                        }}
                    >
                      {libraryViewMode === 'list' ? (
                        <>
                          {pinnedItems.length > 0 && props.type === 'library' && (
                            <div className="p-2 border-b">
                              <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-1">İşaretlenenler</h3>
                              {pinnedItems.map((item, index) => (
                                <LibraryItem
                                  key={item.id}
                                  item={item}
                                  index={index}
                                  activeView={activeView}
                                  onSetView={handleSetView}
                                  onShowInfo={onShowInfo!}
                                  onShare={onShare!}
                                  onDeleteItem={onDeleteItem!}
                                  onSetClipboard={onSetClipboard!}
                                  onTogglePinItem={onTogglePinItem!}
                                  onRenameItem={onRenameItem!}
                                  onPreviewItem={props.onPreviewItem!}
                                  onSaveItem={onSaveItem!}
                                  onUpdateItem={onUpdateItem!}
                                  onAddItem={onAddItem}
                                  onOpenInNewTab={props.onOpenInNewTab}
                                  isExpanded={false}
                                  toggleExpansion={() => {}}
                                  visibleColumns={visibleColumns}
                                  allItems={allItems}
                                  onItemClick={onItemClick}
                                  isSelected={selectedItemIds.includes(item.id)}
                                />
                              ))}
                            </div>
                          )}
                          <div className="p-2">
                              {renderItems(sortedItems)}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 grid grid-cols-2 gap-4">
                          {sortedItems.map((item) => (
                                                        <ContextMenu key={item.id}>
                                                            <ContextMenuTrigger>
                                                                <div className="group relative h-40 rounded-lg border bg-card overflow-hidden hover:bg-accent transition-colors cursor-pointer flex flex-col" onClick={() => handleSetView(item)}>
                                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                        {item.type === 'folder' ? <Folder className="h-6 w-6" /> : 
                                                                         item.type === 'video' ? <Play className="h-6 w-6" /> :
                                                                         item.type === 'image' ? <ImageIcon className="h-6 w-6" /> :
                                                                         item.type === 'website' ? <Globe className="h-6 w-6" /> :
                                                                         <FileText className="h-6 w-6" />}
                                                                    </div>
                                                                    {/* Top row: Info and rating */}
                                                                    <div className="absolute top-1 left-1 right-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onShowInfo?.(item); }} title="Bilgi">
                                                                            <Info className="h-3 w-3" />
                                                                        </Button>
                                                                        <div className="flex items-center gap-1">
                                                                            {item.averageRating !== undefined && <span className="text-[9px] text-amber-500 flex items-center gap-0.5 font-semibold"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />{(item.averageRating || 0).toFixed(1)}</span>}
                                                                            {item.itemCount !== undefined && <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><List className="h-2.5 w-2.5" />{item.itemCount}</span>}
                                                                        </div>
                                                                    </div>
                                                                    {/* Center: Title and type */}
                                                                    <div className="flex-1 flex flex-col items-center justify-center gap-1 overflow-hidden w-full px-2 py-2">
                                                                        <span className="text-xs font-medium truncate w-full text-center">{item.title}</span>
                                                                        <span className="text-[10px] text-muted-foreground capitalize">{item.type}</span>
                                                                    </div>
                                                                    {/* Bottom row: Share and save buttons */}
                                                                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onShare?.(item); }} title="Paylaş">
                                                                            <Share2 className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onSaveItem?.(item); }} title="Kaydet">
                                                                            <Save className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </ContextMenuTrigger>
                                                            <ContextMenuContent>
                                                                <ContextMenuItem onClick={() => onShowInfo?.(item)}>
                                                                    <Info className="mr-2 h-4 w-4" /> Bilgi
                                                                </ContextMenuItem>
                                                                <ContextMenuItem onClick={() => onShare?.(item)}>
                                                                    <Share2 className="mr-2 h-4 w-4" /> Paylaş
                                                                </ContextMenuItem>
                                                                <ContextMenuSeparator />
                                                                <ContextMenuItem className="text-destructive" onClick={() => onDeleteItem?.(item.id)}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                                                                </ContextMenuItem>
                                                            </ContextMenuContent>
                                                        </ContextMenu>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <LibraryContextMenu
                      item={null}
                      allItems={allItems}
                      panelType={props.type as any}
                      isViewOwnedByUser={true}
                      onSetClipboard={onSetClipboard!}
                      onPaste={onPaste!}
                      clipboard={clipboard!}
                      onShowInfo={() => onShowInfo!(activeView!)}
                      onUpdateItem={onUpdateItem}
                      onNewFile={()=>{}}
                      onNewFolder={onNewFolder!}
                      onNewList={onNewList!}
                      onNewPlayer={onNewPlayer!}
                      onNewCalendar={onNewCalendar!}
                      onNewSpace={() => props.type === 'spaces' && onNewSpace && onNewSpace()}
                      onNewDevice={() => props.type === 'devices' && onNewDevice && onNewDevice()}
                      onDeleteItem={() => {}}
                    />
                  </ContextMenuContent>
                </ContextMenu>
                {type === 'library' && (
                    <div className="p-2 border-t mt-auto space-y-2">
                        <UrlInputWidget onAddItem={onAddItem} onAddFolderWithItems={onAddFolderWithItems} parentId={activeView?.id ?? null} activeView={activeView}/>
                        <div className="grid grid-cols-6 gap-1">
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs" onClick={onNewPlayer}><Play className="h-5 w-5 mb-1" /> Oynatıcı</Button>
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs" onClick={() => handleSetView({type: 'widgets'} as any)}><Puzzle className="h-5 w-5 mb-1" /> Araç T.</Button>
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs" onClick={onNewList}><List className="h-5 w-5 mb-1" /> Liste</Button>
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs" onClick={onNewFolder}><FolderIcon className="h-5 w-5 mb-1" /> Klasör</Button>
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs"><Upload className="h-5 w-5 mb-1" /> Yükle</Button>
                            <Link href="/scan">
                                <Button variant="ghost" className="flex-col h-auto p-2 text-xs w-full">
                                    <Camera className="h-5 w-5 mb-1" /> Tarama
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
              </div>
            );
        case 'social':
            return (
                <div className="h-full flex flex-col bg-card/60 backdrop-blur-md" data-testid="social-panel">
                    <div className="p-3 border-b flex items-center justify-between h-16">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2"><Users /> Sosyal Merkez</h2>
                    </div>
                    <div className='flex-1 min-h-0 p-4'>
                        <SocialPanel onOpenContent={(item) => {
                            if (props.onOpenInNewTab) {
                                props.onOpenInNewTab(item, allItems);
                            }
                        }} />
                    </div>
                </div>
            );
        case 'messages':
            return (
                <div className="h-full flex flex-col bg-card/60 backdrop-blur-md" data-testid="messages-panel">
                    <div className="p-3 border-b flex items-center justify-between h-16">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2"><MessageSquare /> Sohbetler</h2>
                        <Button variant="ghost" size="icon"><MessageSquarePlus className="h-5 w-5"/></Button>
                    </div>
                    <Tabs defaultValue="chats" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="flex flex-wrap w-full mx-2 w-[calc(100%-16px)] mt-2 gap-1">
                            <TabsTrigger value="chats" className="flex-1 min-w-[120px]">Mesajlar</TabsTrigger>
                            <TabsTrigger value="calls" className="flex-1 min-w-[120px]">Aramalar</TabsTrigger>
                        </TabsList>
                        <TabsContent value="chats" className="flex-1 min-h-0 mt-0">
                            <ScrollArea className='h-full p-2'>
                                <div className='space-y-1'>
                                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-1">Sabitlenenler</h3>
                                    {pinnedMessages.map(msg => <MessagePreviewCard key={msg.id} message={msg} onClick={() => onUserCardClick?.({id: msg.id, title: msg.name} as any)} isPinned={true} />)}
                                    <Separator className='my-3' />
                                    <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-1">Son Sohbetler</h3>
                                    {recentMessages.map(msg => <MessagePreviewCard key={msg.id} message={msg} onClick={() => onUserCardClick?.({id: msg.id, title: msg.name} as any)} isPinned={false} />)}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="calls" className="flex-1 min-h-0 mt-0">
                            <ScrollArea className='h-full p-4'>
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                                    <div className="p-4 rounded-full bg-muted">
                                        <MonitorSmartphone className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Arama Geçmişi Boş</p>
                                        <p className="text-xs text-muted-foreground">Henüz bir sesli veya görüntülü arama yapmadınız.</p>
                                    </div>
                                    <Button variant="outline" size="sm">Yeni Arama Başlat</Button>
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            );
        case 'notifications':
            const [activeNotifications, setActiveNotifications] = useState(notifications);
            
            const handleDismissNotification = (id: string) => {
                setActiveNotifications(prev => prev.filter(n => n.id !== id));
            };
            
            const handleMarkAllRead = () => {
                // Clear all notifications
                setActiveNotifications([]);
            };
            
            return (
                 <div className="h-full flex flex-col bg-card/60 backdrop-blur-md" data-testid="notifications-panel">
                    <div className="p-3 border-b flex items-center justify-between h-16">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <Bell /> Bildirimler
                            {activeNotifications.length > 0 && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                    {activeNotifications.length}
                                </span>
                            )}
                        </h2>
                         <div className="flex items-center gap-1">
                             <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={handleMarkAllRead}
                                disabled={activeNotifications.length === 0}
                             >
                                <CheckCheck className="mr-2 h-4 w-4"/>Tümünü Temizle
                             </Button>
                             <Button variant="ghost" size="icon"><Settings className="h-4 w-4"/></Button>
                         </div>
                    </div>
                    <ScrollArea className='flex-1 p-1'>
                        {activeNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                                <Bell className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-sm">Bildiriminiz yok</p>
                            </div>
                        ) : (
                            activeNotifications.map((n, index) => (
                               <Fragment key={n.id}>
                                 <NotificationCard 
                                    notification={n} 
                                    onDismiss={handleDismissNotification}
                                 />
                                 {index < activeNotifications.length - 1 && <Separator className="mx-2" />}
                               </Fragment>
                            ))
                        )}
                    </ScrollArea>
                </div>
            );
        case 'ai-chat':
            return (
                <div className="h-full flex flex-col bg-card/60 backdrop-blur-md" data-testid="ai-chat-panel">
                    <div className="p-3 border-b flex items-center justify-between h-16">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2"><Bot /> Yapay Zeka Asistanı</h2>
                    </div>
                    <div className="flex-1 min-h-0">
                        <AiChatDialog 
                            panelState={{
                                id: 'asistan',
                                isOpen: true,
                                isPinned: true,
                                isDraggable: false,
                                x: 0,
                                y: 0,
                                width: 0,
                                height: 0,
                                zIndex: 0
                            }}
                            scale={100}
                            onOpenChange={() => {}}
                            onStateChange={() => {}}
                            onFocus={() => {}}
                            isPanel={true}
                            onPinToggle={() => {}}
                            onToolCall={props.onToolCall}
                        />
                    </div>
                </div>
            );
        case 'widgets': {
            const { widgetTemplates: templates = {}, onWidgetClick, setDraggedItem, onNewFolder, onNewList, onNewPlayer } = props;
            const filteredTemplates = Object.entries(templates).reduce((acc, [category, widgets]) => {
                const filteredWidgets = widgets.filter(w => (w.title || '').toLowerCase().includes(widgetSearchQuery.toLowerCase()));
                if (filteredWidgets.length > 0) {
                    acc[category] = filteredWidgets;
                }
                return acc;
            }, {} as Record<string, Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>[]>);

            return (
                <div className="h-full flex flex-col bg-card/60 backdrop-blur-md" data-testid="widgets-panel">
                                        <div className="p-3 border-b flex items-center justify-between h-16">
                         <h2 className="font-bold text-lg px-2 flex items-center gap-2"><Puzzle /> Araç Takımları</h2>
                         <div className='flex items-center gap-1 p-1'>
                            <Button variant={isWidgetSearchOpen ? 'secondary': 'ghost'} size="icon" className="h-8 w-8" onClick={() => setIsWidgetSearchOpen(!isWidgetSearchOpen)}><Search className="h-4 w-4"/></Button>
                            <div className='flex items-center gap-1 p-0.5 rounded-md border bg-muted'>
                                <Button variant={widgetViewMode === 'preview' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setWidgetViewMode('preview')}><View className="h-4 w-4"/></Button>
                                <Button variant={widgetViewMode === 'icon' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setWidgetViewMode('icon')}><Columns2 className="h-4 w-4"/></Button>
                            </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => setSidebarOpen(false)}
                                                            title="Paneli Kapat"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                         </div>
                    </div>
                    <div className='flex-1 min-h-0 flex flex-col'>
                         <Tabs defaultValue="Genel" className="w-full h-full flex flex-col">
                            {isWidgetSearchOpen && (
                                <div className='p-2 border-b'>
                                    <Input
                                        placeholder='Araç takımı ara...'
                                        value={widgetSearchQuery}
                                        onChange={(e) => setWidgetSearchQuery(e.target.value)}
                                        className='h-9'
                                    />
                                </div>
                            )}
                            <ScrollArea>
                                <TabsList className="p-2 h-auto flex-wrap justify-start">
                                    {Object.keys(filteredTemplates).map(category => (
                                        <TabsTrigger key={category} value={category} className="text-xs">{category}</TabsTrigger>
                                    ))}
                                </TabsList>
                                <ScrollBar orientation='horizontal' />
                            </ScrollArea>
                             <div className="flex-1 min-h-0 mt-auto">
                                <ScrollArea className="h-full">
                                    {Object.entries(filteredTemplates).map(([category, widgets]) => (
                                        <TabsContent key={category} value={category}>
                                             <div className={cn("p-2", widgetViewMode === 'preview' ? 'space-y-4' : 'grid grid-cols-3 gap-2')}>
                                                 {widgets.map(widget => (
                                                    <WidgetCard 
                                                        key={widget.title}
                                                        widget={widget} 
                                                        viewMode={widgetViewMode}
                                                        onWidgetClick={onWidgetClick!}
                                                        onDragStart={(e) => {
                                                            if (setDraggedItem && widget.type) {
                                                                e.dataTransfer.setData('application/json', JSON.stringify({ ...widget, isNew: true }));
                                                                setDraggedItem(widget);
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </TabsContent>
                                    ))}
                                </ScrollArea>
                             </div>
                         </Tabs>
                    </div>
                    <div className="p-2 border-t mt-auto space-y-2">
                        <UrlInputWidget onAddItem={onAddItem} onAddFolderWithItems={onAddFolderWithItems} parentId={activeView?.id ?? null} activeView={activeView}/>
                        <div className="grid grid-cols-6 gap-1">
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs" onClick={onNewPlayer}><Play className="h-5 w-5 mb-1" /> Oynatıcı</Button>
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs" onClick={() => props.onSetView?.({ type: 'widgets' } as any)}><Puzzle className="h-5 w-5 mb-1" /> Araç T.</Button>
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs" onClick={onNewList}><List className="h-5 w-5 mb-1" /> Liste</Button>
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs" onClick={onNewFolder}><FolderIcon className="h-5 w-5 mb-1" /> Klasör</Button>
                            <Button variant="ghost" className="flex-col h-auto p-2 text-xs"><Upload className="h-5 w-5 mb-1" /> Yükle</Button>
                            <Link href="/scan">
                                <Button variant="ghost" className="flex-col h-auto p-2 text-xs w-full">
                                    <Camera className="h-5 w-5 mb-1" /> Tarama
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }
        default:
            return (
              <div className="h-full flex flex-col bg-card p-4 items-center justify-center">
                  <h2 className="font-bold text-lg capitalize">{type}</h2>
                  <p className="text-sm text-muted-foreground mt-2 text-center">Bu panel içeriği henüz oluşturulmadı.</p>
              </div>
            );
    }
});

export default SecondarySidebar;

    

    






