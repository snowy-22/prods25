'use client';

import { FolderOpen, ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, Share2, Save, Star, Info, BarChart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentItem } from '@/lib/initial-content';
import Canvas from './canvas';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { useHotkeys } from 'react-hotkeys-hook';
import { DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { RatingPopoverContent } from './secondary-sidebar';
import { useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

interface PreviewDialogProps {
  item: ContentItem | null;
  context: { items: ContentItem[]; currentIndex: number } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onSetView: (item: ContentItem) => void;
  updateItem: (itemId: string, updates: Partial<ContentItem>) => void;
  onShare: (item: ContentItem) => void;
  onSaveItem: (item: ContentItem) => void;
}

export default function PreviewDialog({
  item,
  context,
  isOpen,
  onOpenChange,
  onNavigate,
  onSetView,
  updateItem,
  onShare,
  onSaveItem,
}: PreviewDialogProps) {
  
  const { toast } = useToast();
  const responsive = useResponsiveLayout();
  
  useHotkeys('arrow-left', () => isOpen && onNavigate('prev'), { enableOnFormTags: true, preventDefault: true }, [isOpen, onNavigate]);
  useHotkeys('arrow-right', () => isOpen && onNavigate('next'), { enableOnFormTags: true, preventDefault: true }, [isOpen, onNavigate]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    if (!item) return;
    e.stopPropagation();
    const newIsLiked = !item.isLiked;
    const newLikeCount = (item.likeCount || 0) + (newIsLiked ? 1 : -1);
    updateItem(item.id, { isLiked: newIsLiked, likeCount: newLikeCount < 0 ? 0 : newLikeCount });
  }, [item, updateItem]);

  const handleComment = useCallback((e: React.MouseEvent) => {
    if (!item) return;
    e.stopPropagation();
    updateItem(item.id, { commentCount: (item.commentCount || 0) + 1 });
    toast({ title: 'Yorum paneli açılıyor...' });
  }, [item, updateItem, toast]);

  if (!item || !context) {
    return null;
  }

  const isContainer = ['folder', 'list', 'inventory', 'space', 'saved-items'].includes(item.type);
  const canNavigate = context.items.length > 1;

  const handleOpenItem = () => {
    onSetView(item);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "flex flex-col p-0 gap-0 bg-background/80 backdrop-blur-lg border-border/50",
        responsive.isMobile
          ? "w-screen h-screen max-w-none rounded-none"
          : "max-w-6xl w-full h-[90vh]"
      )}>
        <div className={cn(
          "flex items-center justify-between border-b flex-shrink-0",
          responsive.isMobile 
            ? "p-2 h-14 gap-2"
            : "p-3 h-16"
        )}>
            <div className='flex items-center gap-2 min-w-0'>
                 <DialogTitle className="text-lg font-semibold truncate" title={item.title}>
                    {item.title}
                </DialogTitle>
                {item.ratings && (
                    <Popover>
                        <PopoverTrigger asChild>
                             <div className="flex items-center gap-1 font-bold text-sm text-amber-500 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                <span>{(item.averageRating || 0).toFixed(1)}</span>
                            </div>
                        </PopoverTrigger>
                        <RatingPopoverContent item={item} onUpdateItem={updateItem} />
                    </Popover>
                )}
            </div>
            <div className={cn(
              'flex items-center gap-2 text-sm',
              responsive.isMobile && 'gap-1 text-xs'
            )}>
              {canNavigate && (
                <>
                  <Button 
                    variant="ghost" 
                    size={responsive.isMobile ? "sm" : "icon"} 
                    className={responsive.isMobile ? "h-8 w-8" : "h-9 w-9"} 
                    onClick={() => onNavigate('prev')}
                  >
                    <ChevronLeft className={responsive.isMobile ? "h-4 w-4" : "h-5 w-5"} />
                  </Button>
                  <span className={cn(
                    'font-mono text-muted-foreground',
                    responsive.isMobile && 'text-xs'
                  )}>
                    {context.currentIndex + 1} / {context.items.length}
                  </span>
                  <Button 
                    variant="ghost" 
                    size={responsive.isMobile ? "sm" : "icon"} 
                    className={responsive.isMobile ? "h-8 w-8" : "h-9 w-9"} 
                    onClick={() => onNavigate('next')}
                  >
                    <ChevronRight className={responsive.isMobile ? "h-4 w-4" : "h-5 w-5"} />
                  </Button>
                </>
              )}
              {isContainer && (
                <Button 
                  variant="outline" 
                  size={responsive.isMobile ? "sm" : "default"}
                  onClick={handleOpenItem}
                >
                  <FolderOpen className={cn(
                    "mr-2 h-4 w-4",
                    responsive.isMobile && "mr-1"
                  )} /> 
                  {!responsive.isMobile && "Aç"}
                </Button>
              )}
            </div>
        </div>
        <div className='flex-1 min-h-0 bg-background/50 overflow-hidden h-full'>
          <Canvas
            items={isContainer ? (item.children || []) : [item]}
            allItems={isContainer ? (item.children || []) : context.items}
            activeView={item}
            onSetView={(viewItem) => {
              onSetView(viewItem);
              onOpenChange(false);
            }}
            onUpdateItem={updateItem}
            deleteItem={() => {}}
            copyItem={() => {}}
            setHoveredItemId={() => {}}
            hoveredItemId={null}
            selectedItemIds={[]}
            onItemClick={() => {}}
            isLoading={false}
            onLoadComplete={() => {}}
            onShare={onShare}
            onShowInfo={() => {}}
            onNewItemInPlayer={() => {}}
            onPreviewItem={() => {}}
            activeViewId={item.id}
            username={""}
            isBeingDraggedOver={false}
            focusedItemId={null}
            onFocusCleared={() => {}}
            onAddItem={() => {}}
            widgetTemplates={{}}
            onSaveItem={onSaveItem}
            gridSize={item.layoutMode === 'presentation' ? 800 : 320}
            layoutMode={item.layoutMode || 'grid'}
            isPreviewMode={false}
          />
        </div>
         <div className={cn(
          "bg-background border-t",
          responsive.isMobile ? "p-0" : "p-0"
        )}>
            <Tabs defaultValue="description" className="w-full">
                <TabsList className={cn(
                  "px-2 border-b w-full justify-start rounded-none bg-transparent",
                  responsive.isMobile && "overflow-x-auto gap-2"
                )}>
                    <TabsTrigger 
                      value="description"
                      className={responsive.isMobile ? "text-xs gap-1" : ""}
                    >
                      <Info className={cn(
                        "h-4 w-4",
                        !responsive.isMobile && "mr-2"
                      )} /> 
                      {!responsive.isMobile && "Açıklamalar"}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="comments"
                      className={responsive.isMobile ? "text-xs gap-1" : ""}
                    >
                      <MessageSquare className={cn(
                        "h-4 w-4",
                        !responsive.isMobile && "mr-2"
                      )} /> 
                      {!responsive.isMobile && "Yorumlar"}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics"
                      className={responsive.isMobile ? "text-xs gap-1" : ""}
                    >
                      <BarChart className={cn(
                        "h-4 w-4",
                        !responsive.isMobile && "mr-2"
                      )} /> 
                      {!responsive.isMobile && "Analizler"}
                    </TabsTrigger>
                </TabsList>
                <TabsContent 
                  value="description" 
                  className={cn(
                    "overflow-auto",
                    responsive.isMobile 
                      ? "p-2 h-20"
                      : "p-4 h-24"
                  )}
                >
                    <p className={cn(
                      "text-muted-foreground",
                      responsive.isMobile ? "text-xs" : "text-sm"
                    )}>
                      {item.content || 'Bu öğe için bir açıklama yok.'}
                    </p>
                </TabsContent>
                <TabsContent 
                  value="comments" 
                  className={cn(
                    "overflow-auto",
                    responsive.isMobile 
                      ? "p-2 h-20"
                      : "p-4 h-24"
                  )}
                >
                    <p className={cn(
                      "text-muted-foreground",
                      responsive.isMobile ? "text-xs" : "text-sm"
                    )}>
                      Yorum özelliği yakında eklenecektir.
                    </p>
                </TabsContent>
                <TabsContent 
                  value="analytics" 
                  className={cn(
                    "overflow-auto",
                    responsive.isMobile 
                      ? "p-2 h-20"
                      : "p-4 h-24"
                  )}
                >
                    <p className={cn(
                      "text-muted-foreground",
                      responsive.isMobile ? "text-xs" : "text-sm"
                    )}>
                      Analiz özelliği yakında eklenecektir.
                    </p>
                </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    