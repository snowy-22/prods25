

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Info, StickyNote, Smile, Pencil, Star, Plus, Share2, Folder, Archive, List, Home, Settings, Users, Shield, X, Video, Image as ImageIcon, Box, ThumbsUp, Eye, EyeOff, UserCheck, User, GripVertical, RotateCcw, CaseSensitive, TrendingUp, BookOpen, GanttChart, BatteryCharging, Ruler, Scale, Waves, Thermometer, MessageSquare, Lightbulb, Send, Trash2, Edit2 } from 'lucide-react';
import { ContentItem, EnergyScore, LetterGrade, Priority, RatingEvent, SharingSettings, Comment, Analysis } from '@/lib/initial-content';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useDebounce } from 'react-use';
import { ScrollArea } from './ui/scroll-area';
import { iconPacks, getIconByName, IconName, metricIcons } from '@/lib/icons';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Slider } from './ui/slider';


interface ItemInfoDialogProps {
  item: ContentItem | null;
  allItems: ContentItem[];
  onOpenChange: (open: boolean) => void;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
}

const predefinedMetrics = {
    letterGrade: { label: 'Harf Notu', icon: BookOpen },
    fiveStarRating: { label: '5 Yıldız Puanı', icon: Star },
    hundredPointScale: { label: '100\'lük Puan', icon: GanttChart },
    energyScore: { label: 'Enerji Skoru', icon: BatteryCharging },
    temperature: { label: 'Sıcaklık', icon: Thermometer },
    size: { label: 'Boyut', icon: Ruler },
    weight: { label: 'Ağırlık', icon: Scale },
    waves: { label: 'Dalgalanma', icon: Waves },
    price: { label: 'Fiyat', icon: TrendingUp },
};

const getMetricInput = (metricKey: string, item: ContentItem, onUpdate: (updates: Partial<ContentItem>) => void) => {
    switch (metricKey) {
        case 'letterGrade':
            return (
                <Select value={item.letterGrade} onValueChange={(val) => onUpdate({ letterGrade: val as LetterGrade })}>
                    <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                    <SelectContent>{(Object.keys(metricIcons.letterGrade) as LetterGrade[]).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'fiveStarRating':
            return <Slider value={[item.fiveStarRating || 0]} onValueChange={(val) => onUpdate({ fiveStarRating: val[0] })} min={0} max={5} step={0.5} />;
        case 'hundredPointScale':
            return <Input type="number" value={item.hundredPointScale || 0} onChange={(e) => onUpdate({ hundredPointScale: parseInt(e.target.value) })} />;
        case 'energyScore':
            return (
                 <Select value={item.energyScore} onValueChange={(val) => onUpdate({ energyScore: val as EnergyScore })}>
                    <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                    <SelectContent>{(Object.keys(metricIcons.energyScore) as EnergyScore[]).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
            );
        default:
            const metricValue = (item.metrics && item.metrics[metricKey]) || '';
            return <Input value={metricValue} onChange={(e) => onUpdate({ metrics: { ...item.metrics, [metricKey]: e.target.value }})} placeholder="Değer girin..." />;
    }
};


export default function ItemInfoDialog({ item, allItems, onOpenChange, onUpdateItem }: ItemInfoDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(item?.title || '');
  const [notes, setNotes] = useState(item?.content || '');
  const [sharing, setSharing] = useState<SharingSettings>(item?.sharing || { privacy: 'private' });
  const [itemImageUrl, setItemImageUrl] = useState(item?.itemImageUrl || '');
  const [itemVideoUrl, setItemVideoUrl] = useState(item?.itemVideoUrl || '');
  const [item3dModelUrl, setItem3dModelUrl] = useState(item?.item3dModelUrl || '');
  const [assignedSpaceId, setAssignedSpaceId] = useState(item?.assignedSpaceId || '');
  const [newComment, setNewComment] = useState('');
  const [newAnalysis, setNewAnalysis] = useState({ title: '', content: '', type: 'observation' as const });
  const [explanation, setExplanation] = useState(item?.explanation || '');


  useDebounce(() => { if (item && item.title !== title) { onUpdateItem(item.id, { title }); } }, 500, [title, item, onUpdateItem]);
  useDebounce(() => { if (item && item.content !== notes) { onUpdateItem(item.id, { content: notes }); } }, 500, [notes, item, onUpdateItem]);
  useDebounce(() => { if (item && JSON.stringify(item.sharing) !== JSON.stringify(sharing)) { onUpdateItem(item.id, { sharing }); } }, 500, [sharing, item, onUpdateItem]);
  useDebounce(() => { if (item && item.itemImageUrl !== itemImageUrl) { onUpdateItem(item.id, { itemImageUrl }); } }, 500, [itemImageUrl, item, onUpdateItem]);
  useDebounce(() => { if (item && item.itemVideoUrl !== itemVideoUrl) { onUpdateItem(item.id, { itemVideoUrl }); } }, 500, [itemVideoUrl, item, onUpdateItem]);
  useDebounce(() => { if (item && item.item3dModelUrl !== item3dModelUrl) { onUpdateItem(item.id, { item3dModelUrl }); } }, 500, [item3dModelUrl, item, onUpdateItem]);
  useDebounce(() => { if (item && item.assignedSpaceId !== assignedSpaceId) { onUpdateItem(item.id, { assignedSpaceId }); } }, 500, [assignedSpaceId, item, onUpdateItem]);
  useDebounce(() => { if (item && item.explanation !== explanation) { onUpdateItem(item.id, { explanation }); } }, 500, [explanation, item, onUpdateItem]);


  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setNotes(item.content || '');
      setSharing(item.sharing || { privacy: 'private', allowedUsers: [], userRoles: {}, identityDisplay: 'full' });
      setItemImageUrl(item.itemImageUrl || '');
      setItemVideoUrl(item.itemVideoUrl || '');
      setItem3dModelUrl(item.item3dModelUrl || '');
      setAssignedSpaceId(item.assignedSpaceId || '');
      setExplanation(item.explanation || '');
    }
  }, [item]);


  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onOpenChange(false);
    }
  };
  
  const handleUpdateSettings = (updates: Partial<SharingSettings>) => {
    if(!item) return;
    const newSettings = { ...sharing, ...updates };
    setSharing(newSettings);
    onUpdateItem(item.id, { sharing: newSettings });
  }


  const handleIconSelect = (iconName: IconName) => {
    if(item) {
      onUpdateItem(item.id, { icon: iconName });
    }
  }
  
  const handleAddUser = () => {
    // Placeholder for adding a user from contacts/social
    const newUser = `user-${Math.floor(Math.random() * 1000)}`;
    const newSharing = {
        ...sharing,
        allowedUsers: [...(sharing.allowedUsers || []), newUser],
        userRoles: {
            ...(sharing.userRoles || {}),
            [newUser]: 'viewer'
        }
    };
    setSharing(newSharing as SharingSettings);
  };

  const handleRemoveUser = (userId: string) => {
      const newSharing = {
          ...sharing,
          allowedUsers: (sharing.allowedUsers || []).filter(id => id !== userId),
      };
      delete newSharing.userRoles?.[userId];
      setSharing(newSharing as SharingSettings);
  }

  const handleRoleChange = (userId: string, role: 'viewer' | 'editor') => {
      const newSharing = {
          ...sharing,
          userRoles: {
              ...(sharing.userRoles || {}),
              [userId]: role
          }
      };
      setSharing(newSharing as SharingSettings);
  };

    const handleRating = (newRating: number) => {
        if (!item) return;
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

  const renderStars = (currentRating: number | undefined, onUpdate: (newRating: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 10; i++) {
        stars.push(
            <Star 
                key={i} 
                className={cn("h-5 w-5 cursor-pointer transition-colors", i <= (currentRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400/50")}
                onClick={() => onUpdate(i)}
            />
        );
    }
    return stars;
  }

  const renderPriority = (priority: Priority | undefined, onUpdate: (newPriority: Priority | undefined) => void) => {
    const priorities: Priority[] = ['+', '++', '+++'];
    return (
        <div className="flex items-center gap-2 rounded-lg border p-2">
            {priorities.map(p => (
                <Button 
                    key={p} 
                    variant={priority === p ? "secondary" : "ghost"}
                    onClick={() => onUpdate(priority === p ? undefined : p)}
                    className="flex-1"
                >
                    {p}
                </Button>
            ))}
        </div>
    );
  }
  
    const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !item || !item.visibleMetrics) return;

    const items = Array.from(item.visibleMetrics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onUpdateItem(item.id, { visibleMetrics: items });
  };
  
    const handleAddMetric = (key: string) => {
    if (!item) return;
    const currentMetrics = item.metrics || {};
    if (!(key in currentMetrics) && !item.hasOwnProperty(key as keyof ContentItem)) {
      onUpdateItem(item.id, { metrics: { ...currentMetrics, [key]: '' } });
    }
  };

  const handleRemoveMetric = (key: string) => {
      if (!item) return;
      if (predefinedMetrics.hasOwnProperty(key as keyof typeof predefinedMetrics)) {
          const update: Partial<ContentItem> = {[key]: undefined};
          onUpdateItem(item.id, update);
      } else if (item.metrics) {
          const newMetrics = { ...item.metrics };
          delete newMetrics[key];
          onUpdateItem(item.id, { metrics: newMetrics });
      }
  };


  if (!item) return null;
  
  const allItemMetrics = {
    ...item.metrics,
    ...(item.letterGrade ? { letterGrade: item.letterGrade } : {}),
    ...(item.fiveStarRating ? { fiveStarRating: item.fiveStarRating } : {}),
    ...(item.hundredPointScale ? { hundredPointScale: item.hundredPointScale } : {}),
    ...(item.energyScore ? { energyScore: item.energyScore } : {}),
  };

  const isContainer = item.type === 'folder' || item.type === 'list' || item.type === 'inventory' || item.type === 'space';
  const ItemIcon = getIconByName(item.icon as IconName | undefined);
  const isItemType = item.type === 'item' || item.type === 'devices';
  const spaces = allItems.filter(i => i.type === 'space');


  return (
    <Dialog open={!!item} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col">
        <DialogHeader>
            <div className='flex items-center gap-2'>
                 {ItemIcon && <ItemIcon className="h-6 w-6" />}
                 <DialogTitle className='flex-1'>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className='text-lg font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto' />
                 </DialogTitle>
                 {isContainer && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Settings className='h-4 w-4'/>
                             </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Klasör Tipini Değiştir</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onUpdateItem(item.id, { type: 'folder', icon: 'folder' })}>
                                <Folder className="mr-2 h-4 w-4" /> Koleksiyon
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateItem(item.id, { type: 'inventory', icon: 'archive' })}>
                                <Archive className="mr-2 h-4 w-4" /> Envanter
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => onUpdateItem(item.id, { type: 'list', icon: 'list' })}>
                                <List className="mr-2 h-4 w-4" /> Liste
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateItem(item.id, { type: 'space', icon: 'home' })}>
                               <Home className="mr-2 h-4 w-4" /> Mekan
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 )}
            </div>
          <DialogDescription>
            Öğe detayları, derecelendirme ve görünüm ayarları.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general"><Info className="mr-1 h-4 w-4" /> Genel</TabsTrigger>
            <TabsTrigger value="explanation"><BookOpen className="mr-1 h-4 w-4" /> Açıklama</TabsTrigger>
            <TabsTrigger value="comments"><MessageSquare className="mr-1 h-4 w-4" /> Yorumlar</TabsTrigger>
            <TabsTrigger value="analysis"><Lightbulb className="mr-1 h-4 w-4"/> Analiz</TabsTrigger>
            <TabsTrigger value="metrics"><TrendingUp className="mr-1 h-4 w-4"/> Metrikler</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4 flex-1">
             <ScrollArea className="h-full pr-4">
                 <div className="space-y-4">
                    {isItemType && (
                        <>
                             <div className="space-y-2">
                                <Label htmlFor="assignedSpace">Atanan Mekan</Label>
                                <Select value={assignedSpaceId} onValueChange={setAssignedSpaceId}>
                                    <SelectTrigger id="assignedSpace">
                                        <SelectValue placeholder="Bir mekan seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Yok</SelectItem>
                                        {spaces.map(space => (
                                            <SelectItem key={space.id} value={space.id}>{space.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />
                        </>
                    )}
                    <div className="space-y-2">
                        <Label>Puan</Label>
                        <div className="flex items-center gap-1">
                            {renderStars(item.myRating, (newRating) => handleRating(newRating))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Öncelik</Label>
                        {renderPriority(item.priority, (newPriority) => onUpdateItem(item.id, { priority: newPriority }))}
                    </div>
                     <div className="space-y-2">
                        <Label>Notlar</Label>
                         <Textarea 
                            placeholder='Bu öğe için notlar alın...'
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                        />
                    </div>
                     <Separator />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Öğe Sayısı:</span>
                        <span className="font-medium">{item.children?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Oluşturulma:</span>
                        <span className="font-medium">{format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm', { locale: tr })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Güncelleme:</span>
                        <span className="font-medium">{formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true, locale: tr })}</span>
                      </div>
                       <div className="flex justify-between">
                        <span className="text-muted-foreground">Tip:</span>
                        <span className="font-medium capitalize">{item.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Kaynak:</span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate max-w-[200px]">
                          {item.url || 'Yok'}
                        </a>
                      </div>
                    </div>

                    {item.url?.includes('youtube.com') || item.url?.includes('youtu.be') ? (
                        <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">YouTube İstatistikleri</Label>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-[10px]" 
                                    onClick={async () => {
                                        if (!item.url) return;
                                        const { fetchOembedMetadata } = await import('@/lib/oembed-helpers');
                                        const metadata = await fetchOembedMetadata(item.url);
                                        if (!('error' in metadata)) {
                                            onUpdateItem(item.id, {
                                                title: metadata.title,
                                                author_name: metadata.author_name,
                                                thumbnail_url: metadata.thumbnail_url,
                                                published_at: metadata.published_at,
                                                viewCount: metadata.viewCount,
                                                likeCount: metadata.likeCount,
                                                commentCount: metadata.commentCount,
                                            });
                                            toast({ title: 'YouTube verileri güncellendi' });
                                        }
                                    }}
                                >
                                    <RotateCcw className="mr-1 h-3 w-3" /> Yenile
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">İzlenme</span>
                                        <span className="font-medium">{item.viewCount?.toLocaleString() || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Beğeni</span>
                                        <span className="font-medium">{item.likeCount?.toLocaleString() || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Yorum</span>
                                        <span className="font-medium">{item.commentCount?.toLocaleString() || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Video className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Yayınlanma</span>
                                        <span className="font-medium">
                                            {item.published_at ? format(new Date(item.published_at), 'dd.MM.yyyy', { locale: tr }) : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="explanation" className="mt-4 space-y-4 flex-1">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Detaylı Açıklama</Label>
                        <Textarea 
                            placeholder='Bu öğe hakkında kapsamlı bir açıklama yazın. Özellikleri, kullanımı, tarihçesi vb. hakkında bilgiler ekleyebilirsiniz...'
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            rows={8}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">{explanation.length} karakter</p>
                    </div>
                    {explanation && (
                        <div className="p-3 rounded-lg bg-muted/50 border border-muted">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">ÖNİZLEME</p>
                            <p className="text-sm whitespace-pre-wrap">{explanation}</p>
                        </div>
                    )}
                </div>
              </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="mt-4 space-y-4 flex-1">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                    {!sharing.canComment && (
                        <div className="rounded-lg bg-muted/50 border border-warning/30 p-3">
                            <p className="text-sm text-muted-foreground">Bu öğeye yorum eklemek devre dışı bırakılmıştır.</p>
                        </div>
                    )}
                    
                    {sharing.canComment !== false && (
                        <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                            <Textarea 
                                placeholder='Bir yorum ekleyin...'
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                            <Button 
                                onClick={() => {
                                    if (!newComment.trim() || !item) return;
                                    const comment: Comment = {
                                        id: `comment-${Date.now()}`,
                                        userId: 'guest',
                                        userName: 'Siz',
                                        content: newComment,
                                        createdAt: new Date().toISOString(),
                                        likes: 0
                                    };
                                    onUpdateItem(item.id, { comments: [...(item.comments || []), comment] });
                                    setNewComment('');
                                    toast({ title: 'Yorum eklendi!' });
                                }}
                                disabled={!newComment.trim()}
                                size="sm"
                                className="w-full"
                            >
                                <Send className="mr-2 h-4 w-4" /> Yorum Ekle
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Yorumlar ({item.comments?.length || 0})</p>
                        {(!item.comments || item.comments.length === 0) && (
                            <p className="text-xs text-muted-foreground text-center py-4">Henüz yorum yok</p>
                        )}
                        {item.comments && item.comments.map((comment, idx) => (
                            <div key={comment.id} className="rounded-lg border p-3 bg-card/50 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{comment.userName || 'Anonim'}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: tr })}</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={() => {
                                            const updated = item.comments?.filter((_, i) => i !== idx) || [];
                                            onUpdateItem(item.id, { comments: updated });
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => {
                                            const updated = item.comments?.map((c, i) => 
                                                i === idx ? { ...c, likes: (c.likes || 0) + 1 } : c
                                            ) || [];
                                            onUpdateItem(item.id, { comments: updated });
                                        }}
                                    >
                                        <ThumbsUp className="h-3 w-3 mr-1" /> {comment.likes || 0}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              </ScrollArea>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4 space-y-4 flex-1">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                    <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                        <Input 
                            placeholder='Analiz başlığı (örn: "Fiyat Analizi", "Pazar Trendi")'
                            value={newAnalysis.title}
                            onChange={(e) => setNewAnalysis({ ...newAnalysis, title: e.target.value })}
                        />
                        <Select value={newAnalysis.type} onValueChange={(value) => setNewAnalysis({ ...newAnalysis, type: value as any })}>
                            <SelectTrigger className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="observation">Gözlem</SelectItem>
                                <SelectItem value="insight">İçgörü</SelectItem>
                                <SelectItem value="summary">Özet</SelectItem>
                                <SelectItem value="recommendation">Tavsiye</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea 
                            placeholder='Analiz içeriğini yazın...'
                            value={newAnalysis.content}
                            onChange={(e) => setNewAnalysis({ ...newAnalysis, content: e.target.value })}
                            rows={4}
                            className="resize-none"
                        />
                        <Button 
                            onClick={() => {
                                if (!newAnalysis.title.trim() || !newAnalysis.content.trim() || !item) return;
                                const analysis: Analysis = {
                                    id: `analysis-${Date.now()}`,
                                    userId: 'guest',
                                    title: newAnalysis.title,
                                    content: newAnalysis.content,
                                    type: newAnalysis.type,
                                    createdAt: new Date().toISOString(),
                                    tags: []
                                };
                                onUpdateItem(item.id, { analyses: [...(item.analyses || []), analysis] });
                                setNewAnalysis({ title: '', content: '', type: 'observation' });
                                toast({ title: 'Analiz eklendi!' });
                            }}
                            disabled={!newAnalysis.title.trim() || !newAnalysis.content.trim()}
                            size="sm"
                            className="w-full"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Analiz Ekle
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Analizler ({item.analyses?.length || 0})</p>
                        {(!item.analyses || item.analyses.length === 0) && (
                            <p className="text-xs text-muted-foreground text-center py-4">Henüz analiz yok</p>
                        )}
                        {item.analyses && item.analyses.map((analysis, idx) => (
                            <div key={analysis.id} className="rounded-lg border p-3 bg-card/50 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm">{analysis.title}</p>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">
                                                {analysis.type === 'observation' ? 'Gözlem' : analysis.type === 'insight' ? 'İçgörü' : analysis.type === 'summary' ? 'Özet' : 'Tavsiye'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true, locale: tr })}</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={() => {
                                            const updated = item.analyses?.filter((_, i) => i !== idx) || [];
                                            onUpdateItem(item.id, { analyses: updated });
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{analysis.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
              </ScrollArea>
          </TabsContent>

          <TabsContent value="metrics" className="mt-4 space-y-4 flex-1">
                <ScrollArea className="h-full pr-4">
                    <div className='space-y-4'>
                    {Object.keys(allItemMetrics).map(key => {
                        const label = (predefinedMetrics as any)[key]?.label || key;
                        const Icon = (predefinedMetrics as any)[key]?.icon || CaseSensitive;
                        return (
                             <div key={key} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2"><Icon className="h-4 w-4"/> {label}</Label>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveMetric(key)}><X className="h-4 w-4 text-destructive"/></Button>
                                </div>
                                {getMetricInput(key, item, (updates) => onUpdateItem(item.id, updates))}
                            </div>
                        )
                    })}
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full mt-4"><Plus className="mr-2 h-4 w-4"/> Ölçüm Birimi Ekle</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Ön Tanımlı Metrikler</DropdownMenuLabel>
                            {Object.entries(predefinedMetrics).map(([key, {label, icon: Icon}]) => (
                                <DropdownMenuItem key={key} onClick={() => handleAddMetric(key)}>
                                    <Icon className="mr-2 h-4 w-4"/> {label}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={(e) => {
                                 e.preventDefault();
                                 const newKey = prompt("Yeni metrik adı girin:");
                                 if (newKey) handleAddMetric(newKey);
                             }}>
                                <Pencil className="mr-2 h-4 w-4"/> Özel Metrik Ekle...
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                </ScrollArea>
          </TabsContent>

            <TabsContent value="view" className="mt-4 space-y-2 flex-1 flex flex-col">
                <div className="flex justify-between items-center pr-4">
                    <Label>Kartta Gösterilecek Metrikler</Label>
                    <Button variant="ghost" size="sm" onClick={() => onUpdateItem(item.id, { visibleMetrics: ['myRating', 'letterGrade'] })}>
                        <RotateCcw className="mr-2 h-4 w-4"/>Sıfırla
                    </Button>
                </div>
                 <p className='text-xs text-muted-foreground pr-4'>Metrikleri sürükleyerek sıralayın ve göz ikonuna tıklayarak görünürlüğünü değiştirin.</p>
                <ScrollArea className="h-full pr-4">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="visible-metrics">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                    {(item.visibleMetrics || []).map((metricKey, index) => (
                                        <Draggable key={metricKey} draggableId={metricKey} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                    <span className="flex-1 text-sm">{(predefinedMetrics as any)[metricKey]?.label || metricKey}</span>
                                                    <Button variant="ghost" size="icon" className='h-7 w-7' onClick={() => {
                                                        const newVisible = (item.visibleMetrics || []).filter(m => m !== metricKey);
                                                        onUpdateItem(item.id, { visibleMetrics: newVisible });
                                                    }}><EyeOff className="h-4 w-4" /></Button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                    <Separator className='my-4'/>
                     <p className='text-xs text-muted-foreground pr-4 mb-2'>Görünmeyen Metrikler</p>
                     <div className='space-y-2'>
                        {Object.keys(allItemMetrics)
                            .filter(key => !(item.visibleMetrics || []).includes(key))
                            .map(metricKey => (
                                <div key={metricKey} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <span className="flex-1 text-sm text-muted-foreground">{(predefinedMetrics as any)[metricKey]?.label || metricKey}</span>
                                     <Button variant="ghost" size="icon" className='h-7 w-7' onClick={() => {
                                         const newVisible = [...(item.visibleMetrics || []), metricKey];
                                         onUpdateItem(item.id, { visibleMetrics: newVisible });
                                     }}><Eye className="h-4 w-4" /></Button>
                                </div>
                            ))
                        }
                    </div>
                </ScrollArea>
          </TabsContent>

          <TabsContent value="view" className="mt-4 space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Kimlik Görünürlüğü</h4>
                 <p className="text-sm text-muted-foreground">
                   Bu öğe üzerindeki etkileşimlerinizde (yorum, puan vb.) kimliğinizin nasıl görüneceğini seçin.
                </p>
                 <RadioGroup value={sharing.identityDisplay || 'full'} onValueChange={(value) => handleUpdateSettings({ identityDisplay: value as any })}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="id-full" />
                        <Label htmlFor="id-full" className='font-normal flex items-center gap-2'><UserCheck className='h-4 w-4'/> Profil Adımı ve Bağlantımı Göster</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="initials" id="id-initials" />
                        <Label htmlFor="id-initials" className='font-normal flex items-center gap-2'><User className='h-4 w-4'/> Sadece İsim Baş Harflerimi Göster</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="anonymous" id="id-anonymous" />
                        <Label htmlFor="id-anonymous" className='font-normal flex items-center gap-2'><EyeOff className='h-4 w-4'/> Beni Gizli Tut</Label>
                    </div>
                </RadioGroup>
              </div>
              <Separator />
              <h4 className="font-semibold">Paylaşım İzinleri</h4>
              <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="can-rate" className="flex flex-col gap-1">
                      <span>Başkaları Puan Verebilir</span>
                      <span className="text-xs font-normal text-muted-foreground">İçeriği görüntüleyenler puan verebilir.</span>
                  </Label>
                  <Switch id="can-rate" checked={sharing.canRate} onCheckedChange={(checked) => handleUpdateSettings({ canRate: checked })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="can-comment" className="flex flex-col gap-1">
                      <span>Başkaları Yorum Yapabilir</span>
                      <span className="text-xs font-normal text-muted-foreground">İçeriği görüntüleyenler yorum ekleyebilir.</span>
                  </Label>
                  <Switch id="can-comment" checked={sharing.canComment} onCheckedChange={(checked) => handleUpdateSettings({ canComment: checked })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="can-add-details" className="flex flex-col gap-1">
                      <span>Başkaları Açıklama Ekleyebilir</span>
                      <span className="text-xs font-normal text-muted-foreground">İçeriği görüntüleyenler detaylar bölümüne katkıda bulunabilir.</span>
                  </Label>
                  <Switch id="can-add-details" checked={sharing.canAddDetails} onCheckedChange={(checked) => handleUpdateSettings({ canAddDetails: checked })} />
              </div>
               <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="can-set-priority" className="flex flex-col gap-1">
                      <span>Başkaları Öncelik Belirleyebilir</span>
                      <span className="text-xs font-normal text-muted-foreground">İçeriği görüntüleyenler öncelik atayabilir.</span>
                  </Label>
                  <Switch id="can-set-priority" checked={sharing.canSetPriority} onCheckedChange={(checked) => handleUpdateSettings({ canSetPriority: checked })} />
              </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
