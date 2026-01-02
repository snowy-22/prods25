

'use client';

import React, { useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import {
  ChevronLeft, ChevronRight, PanelTop, Grid, Folder, ThumbsUp, MessageCircle, Share2, Save, Star, Settings, MoreHorizontal
} from 'lucide-react';
import { ContentItem } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { getIconByName, IconName } from '@/lib/icons';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RatingPopoverContent } from './secondary-sidebar';
import { useToast } from '@/hooks/use-toast';

type HeaderInfoProps = {
    allItems?: ContentItem[];
    activeView?: ContentItem | null;
    onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
    onNavigateHistory: (direction: 'forward' | 'back') => void;
    onNavigateSibling: (direction: 'next-sibling' | 'prev-sibling') => void;
    username: string;
    onNavigateToRoot: () => void;
    onShare: (item: ContentItem) => void;
    onSaveItem: (item: ContentItem) => void;
    canNavigateBack?: boolean;
    canNavigateForward?: boolean;
    onNavigateBack?: () => void;
    onNavigateForward?: () => void;
};

const HeaderInfoComponent = ({ 
    allItems = [],
    activeView, 
    onUpdateItem,
    onNavigateHistory,
    onNavigateSibling,
    username,
    onNavigateToRoot,
    onShare,
    onSaveItem,
    canNavigateBack = false,
    canNavigateForward = false,
    onNavigateBack,
    onNavigateForward,
}: HeaderInfoProps) => {
    
    const { toast } = useToast();
    
    const userProfileItem = useMemo(() => allItems.find(item => item.id === 'user-profile'), [allItems]);

    const { canGoBack, canGoForward, canGoPrevSibling, canGoNextSibling } = useMemo(() => {
        if (!activeView) return { canGoBack: false, canGoForward: false, canGoPrevSibling: false, canGoNextSibling: false };
        if (activeView.id === 'root') return { canGoBack: false, canGoForward: false, canGoPrevSibling: false, canGoNextSibling: false };

        const parent = allItems.find(i => i.children?.some(c => c.id === activeView.id));
        const siblings = parent ? parent.children : allItems.filter(i => !i.parentId);
        const currentIndex = siblings?.findIndex(s => s.id === activeView?.id) ?? -1;

        return {
            canGoBack: !!parent,
            canGoForward: false, 
            canGoPrevSibling: currentIndex > 0,
            canGoNextSibling: siblings ? currentIndex < siblings.length - 1 : false
        };
    }, [activeView, allItems]);
    
    const ownerName = activeView?.author_name || username;
    const isContainer = activeView && ['folder', 'list', 'inventory', 'space', 'saved-items', 'root'].includes(activeView.type);
    const isOwnedRootView = activeView?.id === 'root';
    
    const itemToInteract = isOwnedRootView ? userProfileItem : activeView;
    
    const ActiveIcon = useMemo(() => {
        if (!activeView) return Folder;
        return getIconByName(activeView.icon as IconName | undefined) || Folder;
    }, [activeView]);


    const toggleLayoutMode = useCallback(() => {
        if (!activeView || !isContainer) return;
        const currentMode = activeView.layoutMode || 'grid';
        const newMode = currentMode === 'grid' ? 'studio' : 'grid';
        onUpdateItem(activeView.id, { layoutMode: newMode });
    }, [activeView, isContainer, onUpdateItem]);

    const handleLike = useCallback((e: React.MouseEvent) => {
        if (!itemToInteract) return;
        e.stopPropagation();
        const newIsLiked = !itemToInteract.isLiked;
        const newLikeCount = (itemToInteract.likeCount || 0) + (newIsLiked ? 1 : -1);
        onUpdateItem(itemToInteract.id, { isLiked: newIsLiked, likeCount: newLikeCount < 0 ? 0 : newLikeCount });
    }, [itemToInteract, onUpdateItem]);

    const handleComment = useCallback((e: React.MouseEvent) => {
        if (!itemToInteract) return;
        e.stopPropagation();
        onUpdateItem(itemToInteract.id, { commentCount: (itemToInteract.commentCount || 0) + 1 });
        toast({ title: 'Yorum paneli açılıyor...' });
    }, [itemToInteract, onUpdateItem, toast]);
    
    const handleShowInfo = useCallback((e: React.MouseEvent) => {
         toast({ title: 'Ayarlar paneli açılıyor...' });
    }, [toast]);

    const handleShareCallback = useCallback(() => {
        if (activeView) {
            onShare(activeView);
        }
    }, [activeView, onShare]);

    const handleSaveItemCallback = useCallback(() => {
        if (activeView) {
            onSaveItem(activeView);
        }
    }, [activeView, onSaveItem]);


    if (!activeView) return null;

    return (
        <div className='flex items-center min-w-0 flex-1 h-full gap-2'>
            {/* Navigation Buttons - Moved from header-controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-8 w-8",
                        canNavigateBack ? "text-green-500 hover:bg-green-500/10" : "text-muted-foreground/50"
                    )}
                    disabled={!canNavigateBack} 
                    onClick={onNavigateBack}
                    title="Geri"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-8 w-8",
                        canNavigateForward ? "text-green-500 hover:bg-green-500/10" : "text-muted-foreground/50"
                    )}
                    disabled={!canNavigateForward} 
                    onClick={onNavigateForward}
                    title="İleri"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Home Button */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={onNavigateToRoot}
                    title="Ana Sayfa"
                >
                    <PanelTop className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2 truncate">
                 <Button variant="ghost" className="font-semibold text-muted-foreground truncate max-w-[100px] sm:max-w-[200px] p-1 h-auto text-sm sm:text-base" onClick={onNavigateToRoot}>
                    {ownerName}
                </Button>
                {!isOwnedRootView && (
                    <>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="text-foreground font-bold truncate flex items-center gap-2 text-sm sm:text-base">
                            {activeView.thumbnail_url ? (
                                <div className="relative h-5 w-5 rounded-sm overflow-hidden flex-shrink-0">
                                    <Image 
                                        src={activeView.thumbnail_url} 
                                        alt={activeView.title} 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <ActiveIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="truncate">{activeView?.title}</span>
                        </div>
                    </>
                )}
                 {itemToInteract && isContainer && (
                    <div className="flex items-center gap-1 sm:gap-2 text-sm ml-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 px-1 sm:px-2 flex items-center gap-1">
                                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400 fill-amber-400" />
                                    <span className="font-bold text-xs sm:text-sm">{(itemToInteract.averageRating || 0).toFixed(1)}</span>
                                </Button>
                            </PopoverTrigger>
                           <RatingPopoverContent item={itemToInteract} onUpdateItem={onUpdateItem} />
                        </Popover>
                        
                        <div className="hidden sm:flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" onClick={handleLike}>
                                <ThumbsUp className={cn("h-4 w-4", itemToInteract.isLiked && "fill-primary text-primary")} />
                                {(itemToInteract.likeCount || 0) > 0 && <span className="text-xs">{itemToInteract.likeCount}</span>}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" onClick={handleComment}>
                                <MessageCircle className="h-4 w-4"/>
                                {(itemToInteract.commentCount || 0) > 0 && <span className="text-xs">{itemToInteract.commentCount}</span>}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShareCallback}><Share2 className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveItemCallback}><Save className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShowInfo}><Settings className="h-4 w-4"/></Button>
                        </div>

                        {/* Mobile Interaction Menu */}
                        <div className="sm:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={handleLike}>
                                        <ThumbsUp className={cn("mr-2 h-4 w-4", itemToInteract.isLiked && "fill-primary text-primary")} />
                                        <span>Beğen ({(itemToInteract.likeCount || 0)})</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleComment}>
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        <span>Yorum Yap ({(itemToInteract.commentCount || 0)})</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleShareCallback}>
                                        <Share2 className="mr-2 h-4 w-4" />
                                        <span>Paylaş</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleSaveItemCallback}>
                                        <Save className="mr-2 h-4 w-4" />
                                        <span>Kaydet</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleShowInfo}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Ayarlar</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(HeaderInfoComponent);

    