'use client';

import { FolderOpen, ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, Share2, Save, Star, Info, BarChart, MessageSquare, Pencil, Trash2 } from 'lucide-react';
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
import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';

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
  const [commentText, setCommentText] = useState('');
  const [analysisTitle, setAnalysisTitle] = useState('');
  const [analysisContent, setAnalysisContent] = useState('');
  const [analysisType, setAnalysisType] = useState<'observation' | 'insight' | 'warning' | 'suggestion'>('insight');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);

  useEffect(() => {
    setCommentText('');
    setAnalysisTitle('');
    setAnalysisContent('');
    setAnalysisType('insight');
    // Reset like state on item change
    setIsLiked(false);
    setLikesCount(0);
  }, [item?.id]);

  const handleToggleLike = useCallback(async () => {
    if (!item) return;
    try {
      setIsSyncing(true);
      setSyncError(null);
      
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
      setSyncError('Beğeni eklenemedi');
      // Toggle locally anyway
      setIsLiked(!isLiked);
      setLikesCount(l => isLiked ? l - 1 : l + 1);
    } finally {
      setIsSyncing(false);
    }
  }, [item, toast]);
  
  
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

  const handleAddComment = useCallback(() => {
    if (!item || !commentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      userId: 'guest',
      userName: 'Misafir',
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    const updatedComments = [...(item.comments || []), newComment];
    updateItem(item.id, { comments: updatedComments, commentCount: (item.commentCount || 0) + 1 });
    setCommentText('');
    toast({ title: 'Yorum eklendi' });
  }, [commentText, item, toast, updateItem]);

  const handleAddAnalysis = useCallback(() => {
    if (!item || !analysisTitle.trim() || !analysisContent.trim()) return;
    const newAnalysis = {
      id: `a-${Date.now()}`,
      userId: 'guest',
      title: analysisTitle.trim(),
      content: analysisContent.trim(),
      type: analysisType,
      createdAt: new Date().toISOString(),
    };
    const updatedAnalyses = [...(item.analyses || []), newAnalysis];
    updateItem(item.id, { analyses: updatedAnalyses });
    setAnalysisTitle('');
    setAnalysisContent('');
    toast({ title: 'Analiz eklendi' });
  }, [analysisContent, analysisTitle, analysisType, item, toast, updateItem]);

  const handleEditComment = useCallback(async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      setIsSyncing(true);
      const { updateComment } = await import('@/lib/supabase-sync');
      await updateComment(commentId, editingCommentText.trim());
      
      // Update local state
      const updatedComments = comments.map(c => 
        c.id === commentId ? { ...c, content: editingCommentText.trim(), updated_at: new Date().toISOString() } : c
      );
      setComments(updatedComments);
      setEditingCommentId(null);
      setEditingCommentText('');
      toast({ title: 'Yorum güncellendi' });
    } catch (error) {
      console.warn('Failed to edit comment:', error);
      toast({ title: 'Yorum güncellenemedi', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  }, [editingCommentText, comments, toast]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    
    try {
      setIsSyncing(true);
      const { deleteComment } = await import('@/lib/supabase-sync');
      await deleteComment(commentId);
      
      // Update local state
      const updatedComments = comments.filter(c => c.id !== commentId);
      setComments(updatedComments);
      toast({ title: 'Yorum silindi' });
    } catch (error) {
      console.warn('Failed to delete comment:', error);
      toast({ title: 'Yorum silinemedi', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  }, [comments, toast]);

  if (!item || !context) {
    return null;
  }

  const isContainer = ['folder', 'list', 'inventory', 'space', 'saved-items'].includes(item.type);
  const canNavigate = context.items.length > 1;

  const handleOpenItem = () => {
    onSetView(item);
    onOpenChange(false);
  }

  // Sync comments/analyses to Supabase on change
  useEffect(() => {
    if (!item) return;
    
    const syncData = async () => {
      try {
        setIsSyncing(true);
        setSyncError(null);
        
        // Load comments/analyses/likes from Supabase
        const { loadComments, loadAnalyses, getLikesCount } = await import('@/lib/supabase-sync');
        const supabase = await import('@/lib/supabase/client').then(m => m.createClient());
        
        const [dbComments, dbAnalyses, likesCount] = await Promise.all([
          loadComments(item.id),
          loadAnalyses(item.id),
          getLikesCount(item.id),
        ]);
        
        // Load current user's like status
        const { data: { user } } = await supabase.auth.getUser();
        let userLiked = false;
        if (user) {
          const { data: likeData } = await supabase
            .from('item_likes')
            .select('id')
            .eq('item_id', item.id)
            .eq('user_id', user.id)
            .maybeSingle();
          userLiked = !!likeData;
        }
        
        // Update like state
        setLikesCount(likesCount);
        setIsLiked(userLiked);
        
        // Update local state with DB data
        if (dbComments && dbComments.length > 0) {
          setComments(dbComments.map((c: any) => ({
            id: c.id,
            itemId: c.item_id,
            userId: c.user_id,
            userName: c.user_name,
            content: c.content,
            createdAt: c.created_at,
            likes: c.likes || 0,
          })));
        }
        
        if (dbAnalyses && dbAnalyses.length > 0) {
          setAnalyses(dbAnalyses.map((a: any) => ({
            id: a.id,
            itemId: a.item_id,
            userId: a.user_id,
            userName: a.user_name,
            type: a.type,
            title: a.title,
            content: a.content,
            createdAt: a.created_at,
          })));
        }
        
        setIsSyncing(false);
      } catch (error) {
        // Fail silently - use local state
        console.warn('Sync failed:', error);
        setIsSyncing(false);
      }
    };
    
    const timer = setTimeout(syncData, 500);
    return () => clearTimeout(timer);
  }, [item?.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "flex flex-col p-0 gap-0 border-border/50 overflow-hidden",
          responsive.isMobile
            ? "w-screen h-screen max-w-none rounded-none"
            : "max-w-6xl w-full h-[90vh]"
        )}
        style={{
          backgroundColor: item.backgroundColor || 'hsl(var(--background) / 0.9)',
          backgroundImage: item.backgroundImage ? `url('${item.backgroundImage}')` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Backdrop overlay for text readability */}
        {item.backgroundImage && <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />}
        <div className="relative z-10 flex flex-col h-full">
        <div className={cn(
          "flex items-center justify-between border-b flex-shrink-0 bg-background/95 backdrop-blur-sm",
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
              <Button 
                variant={isLiked ? "default" : "ghost"}
                size={responsive.isMobile ? "sm" : "icon"}
                className={cn(
                  responsive.isMobile ? "h-8 w-8" : "h-9 w-9",
                  isLiked && "bg-red-500 hover:bg-red-600"
                )}
                onClick={handleToggleLike}
                disabled={isSyncing}
                title={`${likesCount} beğeni`}
              >
                <ThumbsUp className={cn(
                  responsive.isMobile ? "h-4 w-4" : "h-5 w-5",
                  isLiked && "fill-current"
                )} />
              </Button>
              {likesCount > 0 && (
                <span className="text-xs font-medium text-foreground">
                  {likesCount}
                </span>
              )}
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
                    <div className="space-y-3">
                      {comments.length === 0 ? (
                        <p className={cn(
                          "text-muted-foreground",
                          responsive.isMobile ? "text-xs" : "text-sm"
                        )}>
                          Henüz yorum yok.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {comments.map((c) => (
                            <div key={c.id} className="rounded-md border bg-muted/40 p-2">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="font-medium text-foreground">{c.userName || 'Kullanıcı'}</span>
                                <div className="flex gap-1">
                                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                                  {/* Only show edit/delete buttons for comment owner */}
                                  {user?.id === c.user_id && (
                                    <div className="flex gap-0.5">
                                      <button
                                        onClick={() => {
                                          setEditingCommentId(c.id);
                                          setEditingCommentText(c.content);
                                        }}
                                        className="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                                        title="Yorumu düzenle"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(c.id)}
                                        className="p-0.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                                        title="Yorumu sil"
                                        disabled={isSyncing}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {editingCommentId === c.id ? (
                                <div className="space-y-2 mt-2">
                                  <Textarea
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    placeholder="Yorum metni..."
                                    className="text-xs"
                                  />
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentText('');
                                      }}
                                      className="text-xs"
                                    >
                                      İptal
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditComment(c.id)}
                                      disabled={!editingCommentText.trim() || isSyncing}
                                      className="text-xs"
                                    >
                                      Kaydet
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{c.content}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Yorum ekleyin..."
                          className={responsive.isMobile ? "text-xs" : "text-sm"}
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                            Yorum Ekle
                          </Button>
                        </div>
                      </div>
                    </div>
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
                    <div className="space-y-3">
                      {analyses.length === 0 ? (
                        <p className={cn(
                          "text-muted-foreground",
                          responsive.isMobile ? "text-xs" : "text-sm"
                        )}>
                          Henüz analiz eklenmedi.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {analyses.map((a) => (
                            <div key={a.id} className="rounded-md border bg-muted/40 p-2">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="font-medium text-foreground">{a.title}</span>
                                <span>{new Date(a.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-[11px] uppercase text-muted-foreground mt-1 tracking-wide">{a.type}</p>
                              <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={analysisTitle}
                            onChange={(e) => setAnalysisTitle(e.target.value)}
                            placeholder="Başlık"
                            className={responsive.isMobile ? "text-xs" : "text-sm"}
                          />
                          <select
                            value={analysisType}
                            onChange={(e) => {
                              const validTypes = ['observation', 'insight', 'warning', 'suggestion'];
                              const val = e.target.value;
                              if (validTypes.includes(val)) {
                                setAnalysisType(val as 'observation' | 'insight' | 'warning' | 'suggestion');
                              }
                            }}
                            className={cn(
                              "border border-input bg-background rounded-md px-3 py-2",
                              responsive.isMobile ? "text-xs" : "text-sm"
                            )}
                          >
                            <option value="observation">Gözlem</option>
                            <option value="insight">İçgörü</option>
                            <option value="warning">Uyarı</option>
                            <option value="suggestion">Öneri</option>
                          </select>
                        </div>
                        <Textarea
                          value={analysisContent}
                          onChange={(e) => setAnalysisContent(e.target.value)}
                          placeholder="Analiz içeriği"
                          rows={3}
                          className={responsive.isMobile ? "text-xs" : "text-sm"}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={handleAddAnalysis}
                            disabled={!analysisTitle.trim() || !analysisContent.trim()}
                          >
                            Analiz Ekle
                          </Button>
                        </div>
                      </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
