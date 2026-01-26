

'use client';

import React, { useState, useMemo, memo, useRef, ChangeEvent, KeyboardEvent, Fragment, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, PanInfo } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ContentItem, SortDirection, SortOption, widgetTemplates, RatingEvent, ItemType, Comment } from '@/lib/initial-content';
import { useAppStore } from '@/lib/store';
import { SocialPanel } from './social-panel';
import { ProfilePanel } from './profile-panel';
import { MessagingPanel } from './messaging/messaging-panel';
import { useRealtimeConversations, useRealtimeMessages } from '@/lib/supabase-realtime';
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
  Bookmark,
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
  UserPlus,
  CheckCheck,
  GanttChart,
  Camera,
  Star,
  ArrowDownAZ,
  Bot,
  Edit2,
  Folder,
  FileText,
  Phone,
  Users2,
  Map,
  TrendingUp,
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
// Advanced Features Components
import { MessageGroupsPanel } from './message-groups-panel';
import { CallManager } from './call-manager';
import { MeetingScheduler } from './meeting-scheduler';
import { SocialGroupsManager } from './social-groups-manager';
import { ProfileSlugCard } from './profile-slug-card';
import { SlugGeneratorEditor } from './slug-generator-editor';
import RewardsDashboard from '@/components/rewards/rewards-dashboard';
import ShoppingPanel from '@/components/shopping/shopping-panel';
import AchievementsFolder from '@/components/achievements/achievements-folder';
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
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Textarea } from './ui/textarea';
import UnifiedGridPreview from './unified-grid-preview';
import UrlInputWidget from './widgets/url-input-widget';
import { WidgetRenderer } from './widget-renderer';
import { Message as StoreMessage } from '@/lib/store';
import { Message as MessagingMessage, MessageType as MessagingMessageType } from '@/lib/messaging-types';

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
    <div className="bg-card p-2 rounded-lg border border-border/60 hover:border-border transition-all hover:shadow-sm">
      <div className="flex items-start gap-2">
        <Avatar className="h-7 w-7">
          <AvatarImage src={`https://robohash.org/${item.author_name}.png`} />
          <AvatarFallback>{item.author_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{item.author_name}</p>
          <p className="text-[10px] text-muted-foreground">
            <TimeAgo date={item.published_at || item.createdAt} />
          </p>
        </div>
        <div className="flex items-center gap-0.5">
             <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[10px] hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); onPreviewItem(item); }}>
                <Eye className="h-3 w-3" /> Önizle
            </Button>
        </div>
      </div>
      <p className="text-xs mt-1.5 font-medium line-clamp-2">{item.title}</p>
      <div className="mt-1.5 aspect-video rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onSetView(item)}>
        <PlayerFrame 
            item={item} 
            isEditMode={false} 
            layoutMode='grid' 
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
          <UnifiedGridPreview items={item.children || []} layoutMode="grid" maxItems={9} showTitle />
        </PlayerFrame>
      </div>
      <div className="flex justify-between items-center mt-1.5 text-xs text-muted-foreground">
        <div className="flex gap-0.5">
          <Button variant="ghost" size="sm" className="flex items-center gap-0.5 h-6 px-1.5 hover:scale-105 transition-transform" onClick={() => toast({ title: 'Beğenildi!', description: `"${item.title}" gönderisini beğendiniz.` })}>
            <ThumbsUp className="h-3 w-3" /> <span className="text-[10px]">{formatCompactNumber(item.likeCount || 0)}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-0.5 h-6 px-1.5 hover:scale-105 transition-transform">
            <MessageCircle className="h-3 w-3" /> <span className="text-[10px]">{formatCompactNumber(item.viewCount || 0)}</span>
          </Button>
        </div>
        <div className="flex gap-0.5">
            <Button variant="ghost" size="sm" className="h-6 w-6 hover:scale-110 transition-transform" onClick={() => onSaveItem(item)}>
                <Save className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 hover:scale-110 transition-transform" onClick={() => {
                alert(`"${item.title}" paylaşılıyor...`);
            }}>
                <Share2 className="h-3 w-3" />
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
      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent cursor-pointer transition-all hover:shadow-sm"
      onClick={onClick}
    >
      <Avatar className="h-7 w-7">
        <AvatarImage
          src={
            user.isBot ? undefined : `https://robohash.org/${user.name}.png`
          }
        />
        <AvatarFallback className="text-xs">
          {user.isBot ? (
            <SocialLogo className="h-5 w-5" />
          ) : (
            user.name.charAt(0)
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{user.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          @{user.name?.toLowerCase().replace(/ /g, '') || 'user'}
        </p>
      </div>
      {!user.isBot && (
        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] hover:scale-105 transition-transform">
          Takip Et
        </Button>
      )}
    </div>
  );
});

const OrganizationCard = ({ name, members }: { name: string, members: string[] }) => (
    <div className="bg-card p-2 rounded-lg border border-border/60 hover:border-border transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-muted rounded-md">
                    <Building className="h-4 w-4 text-foreground" />
                </div>
                <div>
                    <p className="text-xs font-semibold">{name}</p>
                    <p className="text-[10px] text-muted-foreground">{members.length} üye</p>
                </div>
            </div>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] hover:scale-105 transition-transform">Yönet</Button>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
            <div className="flex -space-x-1.5 overflow-hidden">
                {members.slice(0, 5).map((member) => (
                    <Avatar key={member} className="inline-block h-5 w-5 border-2 border-card">
                        <AvatarImage src={`https://robohash.org/${member}.png`} />
                        <AvatarFallback className="text-[10px]">{member.charAt(0)}</AvatarFallback>
                    </Avatar>
                ))}
            </div>
            {members.length > 5 && (
                <span className="text-[10px] text-muted-foreground">+{members.length - 5} daha</span>
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
        case 'bot': return <Bot className="h-5 w-5 text-primary"/>;
        case 'user': return <AvatarImage src={`https://robohash.org/${message.avatar}.png`} />;
        case 'group': return <Users className="h-5 w-5" />;
        case 'channel': return <Building className="h-5 w-5" />;
        case 'social': return <Sparkles className="h-5 w-5 text-primary" />;
        default: return message.name.charAt(0);
    }
  }
  return (
    <div
      className={cn("flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent cursor-pointer transition-all", isPinned && 'bg-accent/50')}
      onClick={message.action ? message.action : onClick}
    >
      <div className="relative">
        <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">
                {getAvatar()}
            </AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-card" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-xs font-semibold truncate">{message.name}</p>
        <p
          className={cn(
            'text-[10px] truncate',
            message.type === 'list' || message.type === 'social'
              ? 'text-primary italic'
              : 'text-muted-foreground'
          )}
        >
          {message.lastMessage}
        </p>
      </div>
      {isPinned && <Pin className="h-3 w-3 text-primary flex-shrink-0" />}
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
                    layoutMode='grid'
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
  type: 'library' | 'social' | 'messages' | 'widgets' | 'notifications' | 'spaces' | 'devices' | 'ai-chat' | 'shopping' | 'profile' | 'advanced-profiles' | 'message-groups' | 'calls' | 'meetings' | 'social-groups' | 'achievements' | 'marketplace' | 'rewards' | 'search' | 'enterprise';
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
    const [commentText, setCommentText] = useState('');
    const [likesCount, setLikesCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Load like status on mount
    useEffect(() => {
      const loadLikeStatus = async () => {
        try {
          const { getLikesCount } = await import('@/lib/supabase-sync');
          const supabase = await import('@/lib/supabase/client').then(m => m.createClient());
          
          const count = await getLikesCount(item.id);
          setLikesCount(count);
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: likeData } = await supabase
              .from('item_likes')
              .select('id')
              .eq('item_id', item.id)
              .eq('user_id', user.id)
              .maybeSingle();
            setIsLiked(!!likeData);
          }
        } catch (error) {
          console.warn('Failed to load like status:', error);
        }
      };
      loadLikeStatus();
    }, [item.id]);

    const handleToggleLike = useCallback(async () => {
      if (!item) return;
      try {
        setIsSyncing(true);
        const { saveLike, getLikesCount } = await import('@/lib/supabase-sync');
        
        const liked = await saveLike(item.id);
        const count = await getLikesCount(item.id);
        
        setIsLiked(liked);
        setLikesCount(count);
        
        toast({
          title: liked ? '❤️ Beğendim' : '💔 Beğeni Kaldırıldı',
          description: `Toplam beğeni: ${count}`
        });
      } catch (error) {
        console.warn('Like toggle failed:', error);
        setIsLiked(!isLiked);
        setLikesCount(l => isLiked ? l - 1 : l + 1);
      } finally {
        setIsSyncing(false);
      }
    }, [item, toast]);

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
        const averageRating = updatedRatings.length > 0
          ? updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length
          : 0;
        onUpdateItem(item.id, { ratings: updatedRatings, myRating: newRating, averageRating });
    };

    const handleSubmitComment = () => {
        if (!commentText.trim()) return;
        const newComment: Comment = {
            id: `c-${Date.now()}`,
            userId: 'guest',
            userName: 'Misafir',
            content: commentText.trim(),
            createdAt: new Date().toISOString(),
            likes: 0,
        };
        const updatedComments = [...(item.comments || []), newComment];
        onUpdateItem(item.id, { 
            comments: updatedComments, 
            commentCount: (item.commentCount || 0) + 1
        });
        setCommentText('');
        toast({ title: 'Yorum eklendi' });
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

                {/* Like Button Section */}
                <div className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{likesCount} {likesCount === 1 ? 'beğeni' : 'beğeni'}</span>
                    </div>
                    <Button 
                        variant={isLiked ? "default" : "ghost"}
                        size="sm"
                        className={cn(isLiked && "bg-red-500 hover:bg-red-600")}
                        onClick={handleToggleLike}
                        disabled={isSyncing}
                    >
                        <ThumbsUp className={cn("h-4 w-4", isLiked && "fill-current")} />
                        {isLiked ? 'Beğendim' : 'Beğen'}
                    </Button>
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
                        <Textarea 
                            placeholder="Yorumunuzu buraya yazın..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <Button 
                            size="sm" 
                            className="w-full mt-2" 
                            disabled={!commentText.trim()}
                            onClick={handleSubmitComment}
                        >
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
    onRenameItem,
    onDragStart: onDragStartProp
}: { 
    item: ContentItem; 
    onShowInfo: (item: ContentItem) => void;
    onItemClick?: (item: ContentItem) => void;
    onDeleteItem: (id: string) => void;
    onTogglePinItem: (id: string) => void;
    onRenameItem: (id: string, name: string) => void;
    onDragStart?: (e: React.DragEvent) => void;
}) {
    const [isDragging, setIsDragging] = useState(false);
    const ItemIcon = (getIconByName(item.icon as IconName) || (item.type === 'video' ? Play : item.type === 'website' ? Globe : item.type === 'image' ? ImageIcon : FileIcon)) as React.ElementType;
    
    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Card 
                    className={cn(
                        "group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all aspect-square flex flex-col items-center justify-center p-4 text-center bg-muted/30",
                        isDragging && "opacity-60 bg-primary/20 ring-2 ring-primary ring-opacity-75"
                    )}
                    onClick={() => onItemClick?.(item)}
                    draggable
                    onDragStart={(e: React.DragEvent) => {
                        setIsDragging(true);
                        if (onDragStartProp) {
                            onDragStartProp(e);
                        } else {
                            const payload = JSON.stringify({ ...item, isNew: true });
                            e.dataTransfer.effectAllowed = 'copy';
                            e.dataTransfer.dropEffect = 'copy';
                            e.dataTransfer.setData('application/json', payload);
                            // Fallback for browsers that strip custom types (iOS Safari)
                            e.dataTransfer.setData('text/plain', payload);
                        }
                    }}
                    onDragEnd={() => setIsDragging(false)}
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
  itemNumber,
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
  hasChildren,
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
  const [isDragging, setIsDragging] = useState(false); // Drag state for visual feedback
  const [dropZonePosition, setDropZonePosition] = useState<'before' | 'after' | null>(null); // Drop zone indicator position for reordering
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
    
    // Single click - flash border animation and open in canvas
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 600);
    
    // Selection handling
    if (onItemClick) {
        onItemClick(item, e);
    }
    
    // Open in canvas (active view)
    if (onSetView) {
        onSetView(item, e);
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
                isSelected && 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background',
                isDragging && 'opacity-60 bg-primary/20 ring-2 ring-primary ring-opacity-75',
                dropZonePosition === 'before' && 'border-t-2 border-primary/50 animate-pulse',
                dropZonePosition === 'after' && 'border-b-2 border-primary/50 animate-pulse'
                )}
                style={{ paddingLeft: `${0.5 + (item.level || 0) * 0.75}rem` }}
                onClick={handleClick}
                onMouseDown={(e) => {
                  // Prevent default for middle mouse button to avoid unwanted behavior
                  if (e.button === 1) {
                    e.preventDefault();
                  }
                }}
                onDragStart={(e) => {
                  setIsDragging(true);
                  if (onDragStartProp) {
                    onDragStartProp(e);
                  }
                }}
                onDragEnd={() => setIsDragging(false)}
                draggable
                onDragOver={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const midpoint = rect.height / 2;
                    const offsetY = e.clientY - rect.top;
                    
                    // Detect drop position for internal reordering
                    if (offsetY < midpoint) {
                        setDropZonePosition('before');
                    } else {
                        setDropZonePosition('after');
                    }
                    
                    // Also support folder drops
                    if (isContainer) {
                        e.currentTarget.classList.add('bg-primary/10');
                    }
                }}
                onDragLeave={(e) => {
                    setDropZonePosition(null);
                    if (isContainer) {
                        e.currentTarget.classList.remove('bg-primary/10');
                    }
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    setDropZonePosition(null);
                    
                    // Handle folder drops
                    if (isContainer) {
                        e.currentTarget.classList.remove('bg-primary/10');
                    }
                    
                    const data = e.dataTransfer.getData('application/json');
                    if (data) {
                        try {
                            const droppedItem = JSON.parse(data);
                            
                            // Check if this is a library item reorder (same parent)
                            if (!droppedItem.isNew && droppedItem.parentId === item.parentId && droppedItem.id !== item.id) {
                                // Internal reordering - update order property
                                const siblings = allItems.filter((i: ContentItem) => i.parentId === item.parentId);
                                const droppedIndex = siblings.findIndex((i: ContentItem) => i.id === droppedItem.id);
                                const currentIndex = siblings.findIndex((i: ContentItem) => i.id === item.id);
                                
                                let newOrder = item.order ?? 0;
                                if (dropZonePosition === 'before') {
                                    newOrder = (currentIndex > 0 ? siblings[currentIndex - 1].order ?? 0 : 0) + ((item.order ?? 0) - (siblings[currentIndex - 1]?.order ?? 0)) / 2;
                                } else {
                                    newOrder = (item.order ?? 0) + 1;
                                }
                                
                                // Update dropped item's order
                                if (onUpdateItem) {
                                    onUpdateItem(droppedItem.id, { ...droppedItem, order: newOrder });
                                }
                            } else if (isContainer) {
                                // Folder drop - add item to folder
                                onAddItem(droppedItem, item.id);
                            }
                        } catch (err) {
                            if (process.env.NODE_ENV === 'development') {
                              console.error("Drop failed", err);
                            }
                        }
                    }
                }}
                onDoubleClick={(e) => { 
                    e.stopPropagation();
                    // Double click - open in new tab
                    if (onOpenInNewTab && (isContainer || ['video', 'website', 'iframe', '3dplayer'].includes(item.type))) {
                        onOpenInNewTab(item, allItems);
                    }
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove} 
                {...dragHandleProps}
            >
                {/* Collapsible accordion with item number */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Item Number */}
                    <span className="text-muted-foreground font-mono text-xs w-6 text-right">{itemNumber}.</span>
                    
                    {/* Chevron for folders/containers */}
                    {hasChildren ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 hover:bg-transparent"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                toggleExpansion(item.id); 
                            }}
                        >
                            <ChevronRight
                                className={cn(
                                    'h-4 w-4 transition-transform duration-200 text-muted-foreground',
                                    isExpanded && 'rotate-90'
                                )}
                            />
                        </Button>
                    ) : (
                        <div className="w-5 h-5" />
                    )}
                </div>
                
                {/* Icon */}
                <div className="flex items-center justify-center h-4 w-4 min-h-4 min-w-4 flex-shrink-0 overflow-hidden">
                    {item.thumbnail_url || item.coverImage ? (
                        <Image 
                            src={item.thumbnail_url || item.coverImage} 
                            alt={item.title} 
                            width={16}
                            height={16}
                            className="h-4 w-4 object-cover rounded-sm flex-shrink-0"
                            unoptimized
                            priority={false}
                        />
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
                    {(item.averageRating !== undefined || item.tenPointRating !== undefined) && visibleColumns.has('rating') && (
                         <div className="flex items-center gap-1 font-bold text-sm text-amber-500" title={item.tenPointRating !== undefined ? `${(item.tenPointRating || 0).toFixed(1)}/10` : `${(item.averageRating || 0).toFixed(1)}/5`}>
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span>{item.tenPointRating !== undefined ? (item.tenPointRating || 0).toFixed(1) : (item.averageRating || 0).toFixed(1)}</span>
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
    const [contentTabValue, setContentTabValue] = useState<'my-library' | 'shared-by-me' | 'shared-with-me' | 'saved'>('my-library');
    
    // Default state managed locally
    const [sortOption, setSortOption] = useState<SortOption>('manual');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [visibleColumns, setVisibleColumns] = useState(new Set(['rating', 'likes', 'share', 'save', 'preview', 'items', 'updatedAt']));
    
    const [widgetSearchQuery, setWidgetSearchQuery] = useState('');
    const [isWidgetSearchOpen, setIsWidgetSearchOpen] = useState(false);
    
    // Library panel controls - must be at top level for Rules of Hooks
    const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
    const [showLibraryDetails, setShowLibraryDetails] = useState(true);
    
    // Resize state for sidebar
    const [isResizing, setIsResizing] = useState(false);

    // Resize handlers for dragging the sidebar edge
    const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);
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

    // Zustand selectors - memoized to avoid infinite loops
    const user = useAppStore((state) => state.user);
    const secondarySidebarOverlayMode = useAppStore((state) => state.secondarySidebarOverlayMode);
    const toggleSecondarySidebarOverlayMode = useAppStore((state) => state.toggleSecondarySidebarOverlayMode);
    const secondarySidebarWidth = useAppStore((state) => state.secondarySidebarWidth);
    const setSecondarySidebarWidth = useAppStore((state) => state.setSecondarySidebarWidth);
    const secondarySidebarBehavior = useAppStore((state) => state.secondarySidebarBehavior);
    const isSecondLeftSidebarOpen = useAppStore((state) => state.isSecondLeftSidebarOpen);
    const togglePanel = useAppStore((state) => state.togglePanel);
    
    // Hover mode state for hover-to-expand behavior
    const [isHovering, setIsHovering] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Handle hover-to-expand behavior
    const handleMouseEnter = useCallback(() => {
        if (secondarySidebarBehavior === 'hover') {
            // Clear any pending close timeout
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
            setIsHovering(true);
        }
    }, [secondarySidebarBehavior]);
    
    const handleMouseLeave = useCallback(() => {
        if (secondarySidebarBehavior === 'hover') {
            // Add small delay before closing to prevent flickering
            hoverTimeoutRef.current = setTimeout(() => {
                setIsHovering(false);
            }, 300);
        }
    }, [secondarySidebarBehavior]);
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);
    
    // Handle drag events
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const containerLeft = 56; // Left sidebar width (w-12 = 48px + some margin)
            const newWidth = e.clientX - containerLeft;
            setSecondarySidebarWidth(newWidth); // Already clamped in store action
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const containerLeft = 56;
            const newWidth = touch.clientX - containerLeft;
            setSecondarySidebarWidth(newWidth);
        };

        const handleEnd = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [isResizing, setSecondarySidebarWidth]);

    // Cursor feedback during resize
    useEffect(() => {
        if (isResizing) {
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    const conversations = useAppStore((state) => state.conversations);
    const groups = useAppStore((state) => state.groups);
    const messages = useAppStore((state) => state.messages);
    const calls = useAppStore((state) => state.calls);
    const createGroup = useAppStore((state) => state.createGroup);
    const updateGroup = useAppStore((state) => state.updateGroup);
    const removeGroupMember = useAppStore((state) => state.removeGroupMember);
    const updateMemberRole = useAppStore((state) => state.updateMemberRole);
    const addMessage = useAppStore((state) => state.addMessage);
    const searchMessages = useAppStore((state) => state.searchMessages);
    const startCall = useAppStore((state) => state.startCall);
    const initiateCall = useAppStore((state) => state.initiateCall);
    const endCallSession = useAppStore((state) => state.endCallSession);
    const setCurrentConversation = useAppStore((state) => state.setCurrentConversation);
    const setCurrentGroup = useAppStore((state) => state.setCurrentGroup);
    const currentConversationId = useAppStore((state) => state.currentConversationId);
    const currentGroupId = useAppStore((state) => state.currentGroupId);
    const socialGroups = useAppStore((state) => state.socialGroups);
    const createSocialGroup = useAppStore((state) => state.createSocialGroup);
    const deleteSocialGroup = useAppStore((state) => state.deleteSocialGroup);
    const removeSocialGroupMember = useAppStore((state) => state.removeSocialGroupMember);

    const currentUserId = user?.id ?? 'guest';
  
    // Messages hooks - must be at top level
    const { conversations: realtimeConversations, loading: convsLoading } = useRealtimeConversations();
    const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
    const { messages: conversationMessages } = useRealtimeMessages(selectedConversationId || '');
    
    // Notifications hooks - must be at top level (will be populated with real notifications later)
    const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
    
    const handleDismissNotification = useCallback((id: string) => {
        setActiveNotifications(prev => prev.filter(n => n.id !== id));
    }, []);
    
    const handleMarkAllRead = useCallback(() => {
        setActiveNotifications([]);
    }, []);

    // Shopping panel hooks - must be at top level for Rules of Hooks
    const products = useAppStore((state) => state.products);
    const shoppingCart = useAppStore((state) => state.shoppingCart);
    const ecommerceView = useAppStore((state) => state.ecommerceView);
    const setEcommerceView = useAppStore((state) => state.setEcommerceView);
    const addToCart = useAppStore((state) => state.addToCart);
    const marketplaceListings = useAppStore((state) => state.marketplaceListings);
    const myInventoryItems = useAppStore((state) => state.myInventoryItems);
    const orders = useAppStore((state) => state.orders);
    const router = useRouter(); // For shopping navigation
    
    // Responsive layout detection
    const useResponsiveLayout = () => {
        const [responsive, setResponsive] = React.useState({
            isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
            isTablet: typeof window !== 'undefined' && (window.innerWidth >= 768 && window.innerWidth < 1024),
            isDesktop: typeof window !== 'undefined' && window.innerWidth >= 1024,
        });

        React.useEffect(() => {
            const handleResize = () => {
                setResponsive({
                    isMobile: window.innerWidth < 768,
                    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                    isDesktop: window.innerWidth >= 1024,
                });
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        return responsive;
    };

    const responsive = useResponsiveLayout();
        
    useEffect(() => {
        // Initialize notifications with defaults if empty
        if (activeNotifications.length === 0) {
            const defaultNotifications: Notification[] = [
              { id: '1', type: 'like', user: { name: 'Zeynep Kaya', avatar: 'https://robohash.org/zeynep.png'}, content: `<b>Yaz Koleksiyonu</b> listenizi beğendi.`, time: '5 dakika önce' },
              { id: '2', type: 'follow', user: { name: 'Ahmet Yılmaz', avatar: 'https://robohash.org/ahmet.png'}, content: `sizi takip etmeye başladı.`, time: '1 saat önce' },
              { id: '3', type: 'task', user: { name: 'Proje Ekibi', avatar: 'https://robohash.org/proje.png'}, content: `sizi bir göreve atadı: <b>Giriş sayfasını tasarla</b>`, time: '3 saat önce' },
              { id: '4', type: 'message', user: { name: 'Can', avatar: 'https://robohash.org/can.png'}, content: `size bir mesaj gönderdi.`, time: 'dün' },
              { id: '5', type: 'share', user: { name: 'Elif', avatar: 'https://robohash.org/elif.png'}, content: `sizinle <b>Sunum</b> listesini paylaştı.`, time: '2 gün önce' },
            ];
            setActiveNotifications(defaultNotifications);
        }
    }, [activeNotifications, setActiveNotifications]);
  
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
        // Aynı sütuna ikinci tıklamada ters yöne dön
        const newDirection = sortOption === option ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
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

        // İçerikler tab filtresi (sadece library için)
        if (type === 'library' && contentTabValue !== 'my-library') {
            if (contentTabValue === 'shared-with-me') {
                // Benimle paylaşılanlar: Tüm sistemdeki benimle paylaşılanlar
                itemsToSort = allItems.filter(i => 
                    i.sharing?.allowedUsers?.includes(username || '')
                );
            } else if (contentTabValue === 'saved') {
                // Kaydedilenler: Tüm sistemdeki kaydedilenler
                itemsToSort = allItems.filter(i => 
                    i.parentId === 'saved-items' || 
                    (i as any).isSaved === true ||
                    i.isPinned === true
                );
            }
        }

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
                return sortDirection === 'asc' ? ((a as any).platformViewCount || 0) - ((b as any).platformViewCount || 0) : ((b as any).platformViewCount || 0) - ((a as any).platformViewCount || 0);
            }
            if (sortOption === 'platformLikes') {
                return sortDirection === 'asc' ? ((a as any).platformLikeCount || 0) - ((b as any).platformLikeCount || 0) : ((b as any).platformLikeCount || 0) - ((a as any).platformLikeCount || 0);
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
    }, [allItems, activeView, sortOption, sortDirection, librarySearchQuery, filterType, type, contentTabValue, username]);
    
    const renderItems = (items: ContentItem[], level = 0): React.ReactNode[] => {
        return items.map((item, index) => {
            const children = allItems.filter(child => child.parentId === item.id);
            children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const isExpanded = (props.expandedItems || []).includes(item.id);
            const hasChildren = children.length > 0;
            const itemNumber = index + 1; // Her seviyede 1'den başlar
            
            return (
                <Fragment key={item.id}>
                    <LibraryItem
                        item={{...item, level}}
                        index={index}
                        itemNumber={itemNumber}
                        activeView={props.activeView}
                        onSetView={handleSetView}
                        isExpanded={isExpanded}
                        hasChildren={hasChildren}
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
                                const payload = JSON.stringify({ ...item, isNew: true });
                                e.dataTransfer.effectAllowed = 'copy';
                                e.dataTransfer.dropEffect = 'copy';
                                e.dataTransfer.setData('application/json', payload);
                                e.dataTransfer.setData('text/plain', payload);
                                props.setDraggedItem(item);
                            }
                        }}
                    />
                    {isExpanded && hasChildren &&
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

    // Mobile backdrop - click to close
    const MobileBackdrop = () => (
        <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
        />
    );

    // Common panel wrapper with mobile optimizations - memoized to prevent flicker
    const PanelWrapper = memo(({ children, testId }: { children: React.ReactNode; testId?: string }) => {
        const [isDesktop, setIsDesktop] = useState(() => {
            if (typeof window === 'undefined') return true;
            return window.matchMedia('(min-width: 1024px)').matches;
        });

        useEffect(() => {
            // Use matchMedia for better performance and accuracy
            const mediaQuery = window.matchMedia('(min-width: 1024px)');
            
            const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
                setIsDesktop(e.matches);
            };
            
            // Modern browsers support addEventListener
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
                return () => mediaQuery.removeEventListener('change', handleChange);
            } else {
                // Fallback for older browsers
                // @ts-ignore
                mediaQuery.addListener(handleChange);
                // @ts-ignore
                return () => mediaQuery.removeListener(handleChange);
            }
        }, []);

        // Determine if panel should be visible based on behavior
        const shouldShowPanel = useMemo(() => {
            if (!isDesktop) return true; // Mobile always shows when open
            if (secondarySidebarBehavior === 'expanded') return true;
            if (secondarySidebarBehavior === 'collapsed') return false;
            if (secondarySidebarBehavior === 'hover') return isHovering;
            return true;
        }, [isDesktop, secondarySidebarBehavior, isHovering]);

        return (
            <>
                {!isDesktop && <MobileBackdrop />}
                {/* Hover trigger zone for hover mode - only visible when collapsed in hover mode */}
                {isDesktop && secondarySidebarBehavior === 'hover' && !isHovering && (
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-4 z-30 cursor-pointer"
                        onMouseEnter={handleMouseEnter}
                        title="Paneli göstermek için üzerine gelin"
                    />
                )}
                <div 
                    className={cn(
                        "h-full flex flex-col bg-card/60 backdrop-blur-md z-40 shadow-xl",
                        isDesktop ? "relative" : "fixed inset-y-0 left-12 sm:left-14 w-72 sm:w-80",
                        "lg:relative lg:left-auto lg:shadow-none",
                        isResizing ? "transition-none" : "transition-all duration-300",
                        // Hide panel in collapsed mode or hover mode when not hovering
                        isDesktop && !shouldShowPanel && "hidden"
                    )}
                    style={{
                        width: isDesktop ? `${secondarySidebarWidth}px` : undefined,
                        zIndex: isDesktop ? 'auto' : 40,
                        willChange: isResizing ? 'width' : 'auto'
                    }}
                    data-testid={testId}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {children}
                    {/* Resize handle - only visible on desktop */}
                    {isDesktop && (
                        <div
                            className={cn(
                                "absolute right-0 top-0 bottom-0 w-1 bg-transparent cursor-col-resize transition-all z-50 group",
                                "hover:w-2 hover:bg-primary/50",
                                isResizing && "w-2 bg-primary"
                            )}
                            onMouseDown={handleResizeStart}
                            onTouchStart={handleResizeStart}
                        >
                            {/* Wider hit area for easier grabbing */}
                            <div className="absolute right-0 top-0 bottom-0 w-4 -mr-2" />
                        </div>
                    )}
                </div>
            </>
        );
    });

    // Destructure common props once
    const { onSetClipboard, onPaste, clipboard, onShowInfo, onShare, onRenameItem, onTogglePinItem, onNewFolder, onNewList, onNewPlayer, onNewCalendar, onNewSpace, onNewDevice, expandedItems, onToggleExpansion, setActiveDevice, activeDeviceId, setDraggedItem, onDeleteItem, onLibraryDrop } = props;

    // Helper function to render panel content
    const renderPanel = () => {
        switch (type) {
        case 'library':
        case 'spaces':
        case 'devices': {
            return (
              <PanelWrapper testId={`${props.type}-panel`}>
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between h-12 sm:h-14 shrink-0">
                  <h2 className="font-bold text-base sm:text-lg px-1 sm:px-2 flex items-center gap-1.5 sm:gap-2">
                    {headerIconMap[type]} <span className="hidden xs:inline">{panelTitleMap[type]}</span>
                  </h2>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => setLibraryViewMode(libraryViewMode === 'list' ? 'grid' : 'list')}
                        title={libraryViewMode === 'list' ? 'Izgara Görünümü' : 'Liste Görünümü'}
                    >
                        {libraryViewMode === 'list' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                    </Button>
                    {!responsive.isMobile && !responsive.isTablet && (
                        <Button
                            variant={secondarySidebarOverlayMode ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleSecondarySidebarOverlayMode()}
                            title={secondarySidebarOverlayMode ? 'Normal Modu Aç' : 'Katman Modunu Aç'}
                        >
                            {secondarySidebarOverlayMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                    )}
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
                
                {/* İçerikler Tabs - Only shown for Library */}
                {type === 'library' && (
                    <div className="px-2 sm:px-3 pt-2 border-b">
                        <Tabs value={contentTabValue} onValueChange={(value: any) => setContentTabValue(value)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-2 h-10 sm:h-9">
                                <TabsTrigger value="my-library" className="text-[10px] sm:text-xs px-1 sm:px-2 flex flex-col gap-0.5 py-1.5 sm:py-1 touch-manipulation">
                                    <Library className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span className="truncate leading-none hidden xs:inline">Kitaplığım</span>
                                </TabsTrigger>
                                <TabsTrigger value="shared-with-me" className="text-[10px] sm:text-xs px-1 sm:px-2 flex flex-col gap-0.5 py-1.5 sm:py-1 touch-manipulation">
                                    <Users className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span className="truncate leading-none hidden xs:inline">Benimle</span>
                                </TabsTrigger>
                                <TabsTrigger value="saved" className="text-[10px] sm:text-xs px-1 sm:px-2 flex flex-col gap-0.5 py-1.5 sm:py-1 touch-manipulation">
                                    <Bookmark className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span className="truncate leading-none hidden xs:inline">Kaydedilenler</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                )}
                
                <div className="px-2 sm:px-3 py-2 border-b space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input 
                            placeholder="Ara..." 
                            className="pl-8 h-10 sm:h-9 text-sm" 
                            value={librarySearchQuery}
                            onChange={(e) => setLibrarySearchQuery(e.target.value)}
                        />
                        {librarySearchQuery && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-1 top-1.5 sm:top-1 h-7 w-7 touch-manipulation" 
                                onClick={() => setLibrarySearchQuery('')}
                            >
                                <X className="h-4 w-4 sm:h-3 sm:w-3" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <div className='flex items-center gap-1 border-r pr-2 mr-1'>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation">
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation">
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
                            className="h-8 sm:h-7 px-3 sm:px-2 text-xs rounded-full touch-manipulation"
                            onClick={() => setFilterType([])}
                        >
                            Hepsi
                        </Button>
                        {(['folder', 'video', 'website', 'image', 'notes', 'clock'] as ItemType[]).map(t => (
                            <Button 
                                key={t}
                                variant={filterType.includes(t) ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-8 sm:h-7 px-3 sm:px-2 text-xs rounded-full capitalize touch-manipulation whitespace-nowrap"
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
                                                                            {(item.averageRating !== undefined || item.tenPointRating !== undefined) && <span className="text-[9px] text-amber-500 flex items-center gap-0.5 font-semibold" title={item.tenPointRating !== undefined ? `${(item.tenPointRating || 0).toFixed(1)}/10` : `${(item.averageRating || 0).toFixed(1)}/5`}><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />{item.tenPointRating !== undefined ? (item.tenPointRating || 0).toFixed(1) : (item.averageRating || 0).toFixed(1)}</span>}
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
              </PanelWrapper>
            );
        }
        case 'social': {
            return (
                <PanelWrapper testId="social-panel">
                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between h-12 sm:h-14 shrink-0">
                        <h2 className="font-bold text-base sm:text-lg px-1 sm:px-2 flex items-center gap-1.5 sm:gap-2">
                            <Users className="h-5 w-5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Sosyal Merkez</span>
                        </h2>
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
                    <div className='flex-1 min-h-0 overflow-hidden flex flex-col'>
                        <Tabs defaultValue="akis" className="flex-1 flex flex-col min-h-0">
                            <TabsList className="grid w-full grid-cols-3 mb-2 h-10 sm:h-9">
                                <TabsTrigger value="akis" className="gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="hidden sm:inline">Akış</span>
                                </TabsTrigger>
                                <TabsTrigger value="kesfet" className="gap-2">
                                    <Compass className="w-4 h-4" />
                                    <span className="hidden sm:inline">Keşfet</span>
                                </TabsTrigger>
                                <TabsTrigger value="profilim" className="gap-2">
                                    <User className="w-4 h-4" />
                                    <span className="hidden sm:inline">Profilim</span>
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="akis" className="flex-1 min-h-0">
                                <SocialPanel onOpenContent={(item) => {
                                    if (props.onOpenInNewTab) {
                                        props.onOpenInNewTab(item, allItems);
                                    }
                                }} />
                            </TabsContent>
                            <TabsContent value="kesfet" className="flex-1 min-h-0">
                                <SocialPanel onOpenContent={(item) => {
                                    if (props.onOpenInNewTab) {
                                        props.onOpenInNewTab(item, allItems);
                                    }
                                }} />
                            </TabsContent>
                            <TabsContent value="profilim" className="flex-1 min-h-0">
                                <ProfilePanel onOpenContent={(item) => {
                                    if (props.onOpenInNewTab) {
                                        props.onOpenInNewTab(item, allItems);
                                    }
                                }} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </PanelWrapper>
            );
        }
        case 'messages': {
            // Use hooks from component level
            const conversationsToUse = realtimeConversations || conversations;
            
            const mapStoreToMessaging = useCallback((msg: StoreMessage): MessagingMessage => ({
                id: msg.id,
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                senderName: msg.senderName,
                content: msg.content,
                type: msg.type as MessagingMessageType,
                mediaUrl: msg.mediaUrl,
                metadata: msg.mediaUrl ? { mediaUrl: msg.mediaUrl } : undefined,
                reactions: {},
                mentions: [],
                isEdited: msg.isEdited ?? false,
                readBy: msg.isRead ? [msg.senderId] : [],
                createdAt: msg.createdAt,
                updatedAt: msg.editedAt ?? msg.createdAt,
                replyToId: msg.replyToId,
            }), []);

            // Combine all messages from state
            const messagesMap: Record<string, MessagingMessage[]> = {};
            conversationsToUse.forEach(conv => {
                const storeMessages = (messages[conv.id] as StoreMessage[] | undefined) || [];
                messagesMap[conv.id] = storeMessages.map(mapStoreToMessaging);
            });

            const handleAddMessage = (message: MessagingMessage) => {
                const storeMessage: StoreMessage = {
                    id: message.id,
                    conversationId: message.conversationId,
                    senderId: message.senderId,
                    senderName: message.senderName || 'Kullanıcı',
                    type: message.type as any,
                    content: message.content,
                    mediaUrl: (message as any).mediaUrl,
                    createdAt: message.createdAt || new Date().toISOString(),
                    isRead: true,
                    isEdited: message.isEdited,
                    editedAt: message.updatedAt,
                    replyToId: message.replyToId,
                    reactions: [],
                };
                addMessage(storeMessage);
            };

            const handleSearchMessages = (filter: any) => {
                return searchMessages(filter).map(mapStoreToMessaging);
            };

            return (
                <PanelWrapper testId="messages-panel">
                    <div className='flex-1 min-h-0 overflow-hidden'>
                        {convsLoading ? (
                            <div className='flex items-center justify-center h-full'>
                                <div className='text-center'>
                                    <Sparkles className='h-8 w-8 animate-spin mx-auto mb-2 text-primary' />
                                    <p className='text-sm text-muted-foreground'>Sohbetler yükleniyor...</p>
                                </div>
                            </div>
                        ) : (
                            <MessagingPanel
                                conversations={conversationsToUse}
                                groups={groups}
                                messages={messagesMap}
                                calls={calls}
                                currentUserId={user?.id || ''}
                                currentConversationId={selectedConversationId || currentConversationId}
                                currentGroupId={currentGroupId}
                                onAddMessage={handleAddMessage}
                                onSearchMessages={handleSearchMessages}
                                onCreateGroup={createGroup}
                                onUpdateGroup={updateGroup}
                                onRemoveGroupMember={removeGroupMember}
                                onUpdateMemberRole={updateMemberRole}
                                onStartCall={startCall}
                                onSetCurrentConversation={(id) => {
                                    setSelectedConversationId(id);
                                    setCurrentConversation(id);
                                }}
                                onSetCurrentGroup={setCurrentGroup}
                            />
                        )}
                    </div>
                </PanelWrapper>
            );
        }
        case 'notifications': {
            // Use hooks from component level
            return (
                <PanelWrapper testId="notifications-panel">
                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between h-12 sm:h-14 shrink-0">
                        <h2 className="font-bold text-base sm:text-lg px-1 sm:px-2 flex items-center gap-1.5 sm:gap-2">
                            <Bell className="h-5 w-5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Bildirimler</span>
                            {activeNotifications.length > 0 && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                    {activeNotifications.length}
                                </span>
                            )}
                        </h2>
                         <div className="flex items-center gap-0.5 sm:gap-1">
                             <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={handleMarkAllRead}
                                disabled={activeNotifications.length === 0}
                                className="h-8 text-xs px-2 touch-manipulation"
                             >
                                <CheckCheck className="mr-1 h-4 w-4 sm:h-3 sm:w-3"/><span className="hidden xs:inline">Temizle</span>
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 touch-manipulation">
                                <Settings className="h-4 w-4"/>
                             </Button>
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
                    <ScrollArea className='flex-1 min-h-0'>
                        {activeNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                                <Bell className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-sm">Bildiriminiz yok</p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {activeNotifications.map((n, index) => (
                                   <Fragment key={n.id}>
                                     <NotificationCard 
                                        notification={n} 
                                        onDismiss={handleDismissNotification}
                                     />
                                     {index < activeNotifications.length - 1 && <Separator className="my-2" />}
                                   </Fragment>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </PanelWrapper>
            );
        }
        case 'profile': {
            return (
                <PanelWrapper testId="profile-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <User className="h-5 w-5" /> Profilim
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ProfilePanel onOpenContent={(item) => {
                            if (props.onOpenInNewTab) {
                                props.onOpenInNewTab(item, allItems);
                            }
                        }} />
                    </div>
                </PanelWrapper>
            );
        }
        case 'ai-chat': {
            return (
                <PanelWrapper testId="ai-chat-panel">
                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between h-12 sm:h-14 shrink-0">
                        <h2 className="font-bold text-base sm:text-lg px-1 sm:px-2 flex items-center gap-1.5 sm:gap-2">
                            <Bot className="h-5 w-5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">AI Asistan</span>
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 touch-manipulation"
                            onClick={() => setSidebarOpen(false)}
                            title="Paneli Kapat"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
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
                </PanelWrapper>
            );
        }
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
                <PanelWrapper testId="widgets-panel">
                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between h-12 sm:h-14 shrink-0">
                        <h2 className="font-bold text-base sm:text-lg px-1 sm:px-2 flex items-center gap-1.5 sm:gap-2">
                            <Puzzle className="h-5 w-5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Araçlar</span>
                        </h2>
                        <div className='flex items-center gap-0.5 sm:gap-1'>
                            <Button 
                                variant={isWidgetSearchOpen ? 'secondary': 'ghost'} 
                                size="icon" 
                                className="h-8 w-8 touch-manipulation" 
                                onClick={() => setIsWidgetSearchOpen(!isWidgetSearchOpen)}
                            >
                                <Search className="h-4 w-4"/>
                            </Button>
                            <div className='flex items-center gap-0.5 p-0.5 rounded-md border bg-muted'>
                                <Button 
                                    variant={widgetViewMode === 'preview' ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    className="h-7 w-7 touch-manipulation" 
                                    onClick={() => setWidgetViewMode('preview')}
                                >
                                    <View className="h-4 w-4"/>
                                </Button>
                                <Button 
                                    variant={widgetViewMode === 'icon' ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    className="h-7 w-7 touch-manipulation" 
                                    onClick={() => setWidgetViewMode('icon')}
                                >
                                    <Columns2 className="h-4 w-4"/>
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 touch-manipulation"
                                onClick={() => setSidebarOpen(false)}
                                title="Paneli Kapat"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
                        <Tabs defaultValue="Genel" className="w-full h-full flex flex-col">
                            {isWidgetSearchOpen && (
                                <div className='p-3 border-b shrink-0'>
                                    <Input
                                        placeholder='Araç takımı ara...'
                                        value={widgetSearchQuery}
                                        onChange={(e) => setWidgetSearchQuery(e.target.value)}
                                        className='h-9'
                                    />
                                </div>
                            )}
                            <div className="border-b shrink-0">
                                <ScrollArea className="w-full">
                                    <TabsList className="p-3 h-auto flex-wrap justify-start w-max">
                                        {Object.keys(filteredTemplates).map(category => (
                                            <TabsTrigger key={category} value={category} className="text-xs">{category}</TabsTrigger>
                                        ))}
                                    </TabsList>
                                    <ScrollBar orientation='horizontal' />
                                </ScrollArea>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ScrollArea className="h-full">
                                    <div className="p-2">
                                        {Object.entries(filteredTemplates).map(([category, widgets]) => (
                                            <TabsContent key={category} value={category} className="mt-0">
                                                <div className={cn(widgetViewMode === 'preview' ? 'space-y-4' : 'grid grid-cols-3 gap-2')}>
                                                    {widgets.map(widget => (
                                                        <WidgetCard 
                                                            key={widget.title}
                                                            widget={widget} 
                                                            viewMode={widgetViewMode}
                                                            onWidgetClick={onWidgetClick!}
                                                            onDragStart={(e) => {
                                                                if (setDraggedItem && widget.type) {
                                                                    const payload = JSON.stringify({ ...widget, isNew: true });
                                                                    e.dataTransfer.effectAllowed = 'copy';
                                                                    e.dataTransfer.dropEffect = 'copy';
                                                                    e.dataTransfer.setData('application/json', payload);
                                                                    e.dataTransfer.setData('text/plain', payload);
                                                                    setDraggedItem(widget);
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                         </Tabs>
                    </div>
                    <div className="p-2 border-t shrink-0 space-y-2">
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
                </PanelWrapper>
            );
        }
        case 'shopping': {
            // Hooks are now at component top level - just use the variables here

            return (
                <PanelWrapper testId="shopping-panel">
                    {/* Header */}
                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between h-12 sm:h-14 shrink-0">
                        <h2 className="font-bold text-base sm:text-lg px-1 sm:px-2 flex items-center gap-1.5 sm:gap-2">
                            🛒 <span className="hidden xs:inline">E-Ticaret</span>
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 touch-manipulation"
                            onClick={() => setSidebarOpen(false)}
                            title="Paneli Kapat"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* View Buttons */}
                    <div className="p-3 border-b flex gap-2 shrink-0 flex-wrap">
                        <Button
                            variant={ecommerceView === 'products' ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => setEcommerceView('products')}
                        >
                            📦 Ürünler
                        </Button>
                        <Button
                            variant={ecommerceView === 'marketplace' ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => setEcommerceView('marketplace')}
                        >
                            🏪 Market
                        </Button>
                        <Button
                            variant={ecommerceView === 'cart' ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => setEcommerceView('cart')}
                        >
                            🛍️ Sepet ({shoppingCart.items.length})
                        </Button>
                        <Button
                            variant={ecommerceView === 'orders' ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => setEcommerceView('orders')}
                        >
                            📋 Siparişler
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {ecommerceView === 'products' && (
                            <div className="p-3 space-y-3">
                                <div className="text-xs font-semibold text-muted-foreground">Ürün Listesi ({products.length})</div>
                                <ScrollArea className="h-96">
                                    <div className="space-y-2 pr-4">
                                        {products.slice(0, 6).map((product) => {
                                            return (
                                                <div
                                                    key={product.id}
                                                    className="p-2 rounded-lg border border-border/60 hover:bg-accent/50 transition-all"
                                                >
                                                    <div className="flex gap-2 items-start">
                                                        {product.image && (
                                                            <img 
                                                                src={product.image} 
                                                                alt={product.title}
                                                                className="h-12 w-12 rounded object-cover"
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold truncate">{product.title}</p>
                                                            <p className="text-[10px] text-muted-foreground">${(product.price / 100).toFixed(2)}</p>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <span className={cn(
                                                                    "inline-block text-[9px] px-1.5 py-0.5 rounded",
                                                                    product.type === 'digital' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                                                                )}>
                                                                    {product.type === 'digital' ? '💾 Dijital' : '📦 Fiziksel'}
                                                                </span>
                                                                <Button 
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-[9px] h-5 px-1.5 ml-auto"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        addToCart(product, 1);
                                                                    }}
                                                                >
                                                                    🛒 Ekle
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        {ecommerceView === 'cart' && (
                            <div className="p-3 space-y-3">
                                <div className="text-xs font-semibold text-muted-foreground">Sepet ({shoppingCart.items.length})</div>
                                {shoppingCart.items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <p className="text-sm text-muted-foreground">Sepetiniz boş</p>
                                    </div>
                                ) : (
                                    <>
                                        <ScrollArea className="h-48">
                                            <div className="space-y-2 pr-4">
                                                {shoppingCart.items.map((item: any) => (
                                                    <div key={item.id} className="p-2 rounded-lg border border-border/60 bg-accent/30">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold truncate">{item.productName}</p>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {item.quantity}x ${(item.unitPrice / 100).toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs font-semibold whitespace-nowrap">
                                                                ${(item.totalPrice / 100).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                        <div className="space-y-2 p-2 bg-muted/50 rounded-lg text-xs">
                                            <div className="flex justify-between">
                                                <span>Toplam:</span>
                                                <span className="font-semibold text-blue-400">${(shoppingCart.total / 100).toFixed(2)}</span>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="w-full text-xs mt-2"
                                                onClick={() => {
                                                    setEcommerceView('cart');
                                                    const params = new URLSearchParams(window.location.search);
                                                    params.set('ecommerce', 'cart');
                                                    window.history.pushState({}, '', `?${params.toString()}`);
                                                }}
                                            >
                                                Sepete Git →
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {ecommerceView === 'marketplace' && (
                            <div className="p-3 space-y-3">
                                <div className="text-xs font-semibold text-muted-foreground">Market Yeri - Satış Listelerim</div>
                                {(() => {
                                    const userListings = marketplaceListings.filter(l => 
                                        l.sellerId === (user?.id || 'guest')
                                    );
                                    
                                    if (userListings.length === 0) {
                                        return (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <p className="text-sm text-muted-foreground mb-3">Henüz satış listeleriniz yok</p>
                                                <Button size="sm" variant="outline" className="text-xs">
                                                    + Satış Listesi Oluştur
                                                </Button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <ScrollArea className="h-96">
                                            <div className="space-y-2 pr-4">
                                                {userListings.map((listing) => (
                                                    <div 
                                                        key={listing.id}
                                                        className="p-2 rounded-lg border border-border/60 hover:bg-accent cursor-pointer transition-all"
                                                    >
                                                        <div className="flex gap-2 items-start">
                                                            {listing.images?.[0] && (
                                                                <img 
                                                                    src={listing.images[0]} 
                                                                    alt={listing.title}
                                                                    className="h-12 w-12 rounded object-cover"
                                                                />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold truncate">{listing.title}</p>
                                                                <p className="text-[10px] text-muted-foreground">${(listing.price / 100).toFixed(2)}</p>
                                                                <span className={cn(
                                                                    "inline-block text-[9px] px-1.5 py-0.5 rounded mt-1",
                                                                    listing.status === 'active' ? 'bg-green-500/20 text-green-400' : listing.status === 'sold' ? 'bg-gray-500/20 text-gray-400' : 'bg-orange-500/20 text-orange-400'
                                                                )}>
                                                                    {listing.status === 'active' ? '🟢 Aktif' : listing.status === 'sold' ? '✓ Satıldı' : '⏸️ Durduruldu'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    );
                                })()}
                            </div>
                        )}

                        {ecommerceView === 'orders' && (
                            <div className="p-3 space-y-3">
                                <div className="text-xs font-semibold text-muted-foreground">Sipariş Geçmişi</div>
                                {(() => {
                                    if (orders.length === 0) {
                                        return (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <p className="text-sm text-muted-foreground">Siparişleriniz yok</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <ScrollArea className="h-96">
                                            <div className="space-y-2 pr-4">
                                                {orders.slice(0, 10).map((order) => (
                                                    <div 
                                                        key={order.id}
                                                        className="p-2 rounded-lg border border-border/60 hover:bg-accent cursor-pointer transition-all"
                                                    >
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold truncate">#{order.id.slice(-6)}</p>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {order.items.length} ürün • ${(order.total / 100).toFixed(2)}
                                                                </p>
                                                                <span className={cn(
                                                                    "inline-block text-[9px] px-1.5 py-0.5 rounded mt-1",
                                                                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' : order.status === 'pending' ? 'bg-orange-500/20 text-orange-400' : order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                                                )}>
                                                                    {order.status === 'completed' ? '✓ Tamamlandı' : order.status === 'pending' ? '⏳ Bekleniyor' : order.status === 'cancelled' ? '✗ İptal Edildi' : '📦 Gönderiliyor'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </PanelWrapper>
            );
        }
        case 'advanced-profiles': {
            return (
                <PanelWrapper testId="profiles-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <User className="h-5 w-5" /> Profil Slugları
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-4">
                                <SlugGeneratorEditor 
                                    title="Profil Slug Oluştur"
                                    description="Profil bağlantınızı kişiselleştirin"
                                    initialTitle={username || 'Profil'}
                                    onSlugChange={() => {}}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                </PanelWrapper>
            );
        }
        case 'message-groups': {
            return (
                <PanelWrapper testId="message-groups-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" /> Mesaj Grupları
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <MessageGroupsPanel 
                            groups={groups as any}
                            currentGroupId={currentGroupId}
                            onSelectGroup={(groupId) => setCurrentGroup(groupId)}
                            onCreateGroup={async (name, description) => {
                                await createGroup({ name, description: description || '', members: [] } as any);
                            }}
                        />
                    </div>
                </PanelWrapper>
            );
        }
        case 'calls': {
            return (
                <PanelWrapper testId="calls-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <Phone className="h-5 w-5" /> Aramalar
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-4">
                                <CallManager 
                                    onInitiateCall={async (callType, recipientId) => {
                                        const session = await initiateCall(callType, recipientId ? [recipientId] : []);
                                        if (!session) throw new Error('Call could not be started');
                                        return session;
                                    }}
                                    onEndCall={async (callId) => {
                                        await endCallSession(callId);
                                    }}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                </PanelWrapper>
            );
        }
        case 'meetings': {
            return (
                <PanelWrapper testId="meetings-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <Calendar className="h-5 w-5" /> Toplantılar
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-4">
                                <MeetingScheduler />
                            </div>
                        </ScrollArea>
                    </div>
                </PanelWrapper>
            );
        }
        case 'social-groups': {
            return (
                <PanelWrapper testId="social-groups-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <Users2 className="h-5 w-5" /> Sosyal Gruplar
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-4">
                                <SocialGroupsManager 
                                    groups={socialGroups as any}
                                    onSelectGroup={() => {}}
                                    onCreateGroup={async (name, category) => {
                                        await createSocialGroup(name, category);
                                    }}
                                    onDeleteGroup={async (groupId) => {
                                        await deleteSocialGroup(groupId);
                                    }}
                                    onRemoveMember={async (groupId, userId) => {
                                        await removeSocialGroupMember(groupId, userId);
                                    }}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                </PanelWrapper>
            );
        }
        case 'achievements': {
            return (
                <PanelWrapper testId="achievements-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <Award className="h-5 w-5" /> Başarılar & Ödüller
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <RewardsDashboard 
                            userId={user?.id}
                            defaultTab="overview"
                            className="h-full"
                        />
                    </div>
                </PanelWrapper>
            );
        }
        case 'marketplace': {
            return (
                <PanelWrapper testId="marketplace-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <Globe className="h-5 w-5" /> Marketplace
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ShoppingPanel
                            defaultTab="cart"
                            className="h-full"
                        />
                    </div>
                </PanelWrapper>
            );
        }
        case 'rewards': {
            return (
                <PanelWrapper testId="rewards-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <Star className="h-5 w-5" /> Ödüllerim
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <RewardsDashboard
                            userId={user?.id}
                            defaultTab="coupons"
                            className="h-full"
                        />
                    </div>
                </PanelWrapper>
            );
        }
        case 'enterprise': {
            // Lazy import the enterprise menu to avoid bundle bloat
            const EnterpriseMenuCompact = React.lazy(() => 
                import('@/components/integrations/enterprise-menu').then(mod => ({ default: mod.EnterpriseMenuCompact }))
            );
            return (
                <PanelWrapper testId="enterprise-panel">
                    <div className="p-3 border-b flex items-center justify-between h-14 shrink-0">
                        <h2 className="font-bold text-lg px-2 flex items-center gap-2">
                            <Building className="h-5 w-5" /> Enterprise
                        </h2>
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
                    <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
                        <React.Suspense fallback={<div className="animate-pulse space-y-2"><div className="h-6 bg-muted rounded"/><div className="h-24 bg-muted rounded"/></div>}>
                            <EnterpriseMenuCompact />
                        </React.Suspense>
                        
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-blue-500/10 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">6</p>
                                <p className="text-xs text-muted-foreground">Entegrasyon</p>
                            </div>
                            <div className="bg-purple-500/10 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-purple-600">3</p>
                                <p className="text-xs text-muted-foreground">Depo</p>
                            </div>
                            <div className="bg-orange-500/10 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-orange-600">12</p>
                                <p className="text-xs text-muted-foreground">Bekleyen Sipariş</p>
                            </div>
                            <div className="bg-green-500/10 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">45</p>
                                <p className="text-xs text-muted-foreground">B2B Müşteri</p>
                            </div>
                        </div>
                        
                        {/* Full Dashboard Link */}
                        <Link 
                            href="/enterprise"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                        >
                            Enterprise Dashboard'a Git
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                </PanelWrapper>
            );
        }
        default: {
            return (
              <div className="h-full flex flex-col bg-card p-4 items-center justify-center">
                  <h2 className="font-bold text-lg capitalize">{type}</h2>
                  <p className="text-sm text-muted-foreground mt-2 text-center">Bu panel içeriği henüz oluşturulmadı.</p>
              </div>
            );
        }
    }
    };

    return renderPanel();
});

export default SecondarySidebar;

    

    





