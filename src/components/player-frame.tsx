
"use client";

import React, { CSSProperties, useEffect, useState, memo, useRef, Suspense, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { ContentItem } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Settings, Wand2, Share2, Eye, Trash2, FolderOpen, ThumbsUp, MessageCircle, Save, Star, TrendingUp, BookOpen, GanttChart, BrainCircuit, Waves, Thermometer, BatteryCharging, Ruler, Scale, Lock, Unlock, ExternalLink, Bookmark, Palette, Type, Maximize2, Minimize2, Square, Circle, Layers, MoreHorizontal, Play, Puzzle, List, Folder, Upload, Camera } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuShortcut, ContextMenuTrigger, ContextMenuSeparator } from './ui/context-menu';
import { getIconByName, IconName, metricIcons } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RatingPopoverContent } from './secondary-sidebar';
import { useAppStore } from '@/lib/store';


declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': any;
        }
    }
}


const MetricDisplay = ({ metricKey, value }: { metricKey: string, value: any }) => {
    if (value === null || value === undefined || value === '') return null;
    
    if (metricKey === 'letterGrade') {
        const Icon = (metricIcons.letterGrade as any)[value as keyof typeof metricIcons.letterGrade] || metricIcons.default;
        return (
            <div className="flex items-center gap-1 font-bold text-sm text-amber-500" title={`Harf Notu: ${value}`}>
                 <Icon className="h-4 w-4 text-purple-400" />
            </div>
        )
    }

    const Icon = (metricIcons as any)[metricKey as keyof typeof metricIcons] || metricIcons.default;

    if (metricKey === 'averageRating' || metricKey === 'myRating' || metricKey === 'fiveStarRating') {
        return (
            <div className="flex items-center gap-1 font-bold text-sm text-amber-500" title={`Puan: ${value}`}>
                <Icon className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span>{Number(value).toFixed(1)}</span>
            </div>
        );
    }
    
    if (typeof value === 'boolean') {
        value = value ? 'Evet' : 'Hayır';
    }

    return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground" title={`${metricKey}: ${value}`}>
            <Icon className="h-4 w-4" />
            <span className="font-mono text-xs">{value}</span>
        </div>
    );
};

const ItemStyleSettings = ({ item, onUpdateItem }: { item: ContentItem, onUpdateItem: (id: string, updates: Partial<ContentItem>) => void }) => {
    const styles = item.styles || {};
    
    return (
        <div className="p-0 w-72 bg-card/80 backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-transparent h-10">
                    <TabsTrigger value="general" className="text-[10px] uppercase font-bold">Genel</TabsTrigger>
                    <TabsTrigger value="frame" className="text-[10px] uppercase font-bold">Çerçeve</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="p-4 space-y-4 mt-0">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold flex items-center gap-2">
                            <Palette className="h-3 w-3" /> Görünüm
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn("h-8 text-[10px]", styles.borderRadius === '0px' && "bg-primary text-primary-foreground")}
                                onClick={() => onUpdateItem(item.id, { styles: { ...styles, borderRadius: '0px' } })}
                            >
                                <Square className="h-3 w-3 mr-1" /> Keskin
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn("h-8 text-[10px]", styles.borderRadius === '12px' && "bg-primary text-primary-foreground")}
                                onClick={() => onUpdateItem(item.id, { styles: { ...styles, borderRadius: '12px' } })}
                            >
                                <Circle className="h-3 w-3 mr-1" /> Oval
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold flex items-center gap-2">
                            <Layers className="h-3 w-3" /> Saydamlık
                        </Label>
                        <Slider 
                            value={[parseFloat(styles.opacity as string || '1') * 100]} 
                            max={100} 
                            step={1} 
                            onValueChange={([v]) => onUpdateItem(item.id, { styles: { ...styles, opacity: (v / 100).toString() } })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold flex items-center gap-2">
                            <Type className="h-3 w-3" /> Yazı Boyutu
                        </Label>
                        <Slider 
                            value={[parseInt(styles.fontSize as string || '14')]} 
                            min={8}
                            max={24} 
                            step={1} 
                            onValueChange={([v]) => onUpdateItem(item.id, { styles: { ...styles, fontSize: `${v}px` } })}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="frame" className="p-4 space-y-4 mt-0">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold">Çerçeve Efekti</Label>
                        <div className="grid grid-cols-2 gap-1">
                            {['none', 'glowing', 'neon', 'pulsing', 'patterned', 'braided'].map((effect) => (
                                <Button 
                                    key={effect}
                                    variant="outline" 
                                    size="sm" 
                                    className={cn("h-7 text-[9px] px-1", item.frameEffect === effect && "bg-primary text-primary-foreground")}
                                    onClick={() => onUpdateItem(item.id, { frameEffect: effect as any })}
                                >
                                    {effect === 'none' ? 'Yok' : effect.charAt(0).toUpperCase() + effect.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">İmleç ve Etkileşim</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">Renk</span>
                            <input
                                type="color"
                                value={(item as any).interactionColor || '#60a5fa'}
                                onChange={(e) => onUpdateItem(item.id, { interactionColor: e.target.value })}
                                className="h-6 w-14 rounded cursor-pointer bg-transparent"
                            />
                            <span className="text-[10px] text-muted-foreground">Kalınlık</span>
                            <Slider
                                className="flex-1"
                                value={[ (item as any).interactionWidth ?? 2 ]}
                                min={1}
                                max={8}
                                step={1}
                                onValueChange={([v]) => onUpdateItem(item.id, { interactionWidth: v })}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-muted-foreground">Parıltı</span>
                            <Slider
                                className="flex-1"
                                value={[ Math.round(((item as any).interactionGlow ?? 0.3) * 100) ]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={([v]) => onUpdateItem(item.id, { interactionGlow: v / 100 })}
                            />
                            <span className="text-[10px] text-muted-foreground w-10 text-right">{Math.round(((item as any).interactionGlow ?? 0.3) * 100)}%</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">Çerçeve Rengi</Label>
                        <div className="flex gap-2 items-center">
                            <input 
                                type="color" 
                                value={item.frameColor || '#3b82f6'} 
                                onChange={(e) => onUpdateItem(item.id, { frameColor: e.target.value })}
                                className="h-6 w-full rounded cursor-pointer bg-transparent"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-8 text-[10px] text-muted-foreground hover:text-foreground"
                            onClick={() => onUpdateItem(item.id, { 
                                styles: {}, 
                                frameEffect: 'none', 
                                frameColor: undefined, 
                                frameWidth: undefined, 
                                frameStyle: 'solid' 
                            })}
                        >
                            Varsayılana Sıfırla
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold">Kalınlık ({item.frameWidth || 1}px)</Label>
                        <Slider 
                            value={[item.frameWidth || 1]} 
                            onValueChange={([v]) => onUpdateItem(item.id, { frameWidth: v })} 
                            min={0} max={10} step={1} 
                        />
                    </div>
                </TabsContent>
            </Tabs>

            <div className="p-2 border-t bg-muted/30">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full h-7 text-[9px] justify-center"
                    onClick={() => onUpdateItem(item.id, { styles: {}, frameEffect: 'none', frameColor: undefined, frameWidth: undefined, frameStyle: 'solid' })}
                >
                    Tüm Stilleri Sıfırla
                </Button>
            </div>
        </div>
    );
};


type PlayerFrameProps = {
  item: ContentItem;
  children: React.ReactNode;
  globalStyles?: CSSProperties;
  onSetView?: (item: ContentItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onCopyItem: (itemId: string) => void;
  layoutMode: 'grid' | 'free' | 'sectional' | 'studio';
  isSelected: boolean;
  isFocused?: boolean;
  onFocusCleared?: () => void;
  isPlayerHeaderVisible: boolean;
  isPlayerSettingsVisible: boolean;
  isMaxMode?: boolean;
  isGridLocked?: boolean;
  onLoad: () => void;
  onShare: (item: ContentItem) => void;
  onShowInfo: (item: ContentItem) => void;
  onNewItemInPlayer: (playerId: string, url?: string) => void;
  onPreviewItem: (item: ContentItem) => void;
  onOpenInNewTab?: (item: ContentItem) => void;
  isEditMode?: boolean;
  onItemClick: (item: ContentItem, event: React.MouseEvent | React.TouchEvent) => void;
  username?: string;
  onSaveItem: (item: ContentItem) => void;
  isDragging?: boolean;
  isResizing?: boolean;
  activeAnimation?: string | null;
  allItems?: ContentItem[];
  onMouseDown?: (e: React.MouseEvent) => void;
    isInteractive?: boolean;
};

const PlayerFrameComponent = ({ 
    item, 
    children,
    globalStyles, 
    onSetView, 
    onUpdateItem, 
    onDeleteItem, 
    onCopyItem, 
    layoutMode, 
    isSelected, 
    isFocused, 
    onFocusCleared, 
    isPlayerHeaderVisible, 
    isPlayerSettingsVisible, 
    isMaxMode, 
    isGridLocked, 
    onLoad, 
    onShare, 
    onShowInfo, 
    onNewItemInPlayer, 
    onPreviewItem,    onOpenInNewTab,    isEditMode, 
    onItemClick, 
    username,
    onSaveItem,
    isDragging,
    isResizing,
    activeAnimation,
    allItems = [],
    isInteractive = true,
}: PlayerFrameProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const resizeOverlayRef = useRef<HTMLDivElement>(null);
    const quickAddInputRef = useRef<HTMLInputElement>(null);
    const [isLocallyResizing, setIsLocallyResizing] = useState(false);
    const [pointerPos, setPointerPos] = useState({ x: 0.5, y: 0.5 });
    const pointerFrameEnabled = (item as any).pointerFrameEnabled ?? (globalStyles as any)?.pointerFrameEnabled ?? false;
    const audioTrackerEnabled = (item as any).audioTrackerEnabled ?? (globalStyles as any)?.audioTrackerEnabled ?? false;
    const virtualizerMode = (item as any).virtualizerMode ?? (globalStyles as any)?.virtualizerMode ?? false;
    const visualizerMode = (item as any).visualizerMode ?? (globalStyles as any)?.visualizerMode ?? 'off';
        const interactionColor = (item as any).interactionColor || (globalStyles as any)?.interactionColor || '#7dd3fc';
        const interactionWidth = (item as any).interactionWidth ?? (globalStyles as any)?.interactionWidth ?? 2;
        const interactionGlow = (item as any).interactionGlow ?? (globalStyles as any)?.interactionGlow ?? 0.45;
        const glowDistance = 18 + interactionGlow * 20;
        const interactionOpacity = (isSelected || isDragging || isResizing || isLocallyResizing) ? 0.55 : 0.22;
        const interactionStyle = {
                '--interaction-color': interactionColor,
                '--interaction-width': `${interactionWidth}px`,
                '--interaction-glow': interactionGlow,
        } as React.CSSProperties;
        const handlePointerMove = useCallback((e: React.MouseEvent) => {
            if (!pointerFrameEnabled || !ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setPointerPos({ x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) });
        }, [pointerFrameEnabled]);

        const audioHighlight = audioTrackerEnabled && (item.type === 'audio' || item.type === 'video');
        const shouldShowVisualizer = visualizerMode && visualizerMode !== 'off';
  const { toast } = useToast();
  const openInNewTab = useAppStore(s => s.openInNewTab);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;
    
    const timer = setTimeout(() => {
        onLoad();
    }, 100);

    return () => clearTimeout(timer);
  }, [item.id, onLoad]);

  const handlePlayerNav = (direction: 'next' | 'prev') => {
      if (!item.children || item.children.length === 0) return;
      const currentIndex = item.playerIndex || 0;
      const totalItems = item.children.length;
      let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      
      if (newIndex >= totalItems) newIndex = 0;
      if (newIndex < 0) newIndex = totalItems - 1;
      
      onUpdateItem(item.id, { playerIndex: newIndex });
  }

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateItem(item.id, { isLiked: !item.isLiked, likeCount: (item.likeCount || 0) + (item.isLiked ? -1 : 1) });
  }, [item.id, item.isLiked, item.likeCount, onUpdateItem]);

  const handleComment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: 'Yorum paneli açılıyor...' });
    onUpdateItem(item.id, { commentCount: (item.commentCount || 0) + 1 });
  },[item.id, item.commentCount, onUpdateItem, toast]);


  const isContainer = ['folder', 'list', 'player', 'inventory', 'space', 'devices', 'calendar', 'saved-items', 'awards-folder', 'spaces-folder', 'devices-folder', 'root', 'trash-folder'].includes(item.type);
  const Icon = getIconByName(item.icon as IconName | undefined);

  const handleHeaderClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onItemClick(item, e);
  };

  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isContainer && onSetView) onSetView(item);
  };
  
  const getMetricValue = (metricKey: string) => {
    if ((item as any)[metricKey] !== undefined) {
      return (item as any)[metricKey];
    }
    if (item.metrics && item.metrics.hasOwnProperty(metricKey)) {
        return item.metrics[metricKey];
    }
    return null;
  };
  
  const showHoverItems = !isDragging && !isResizing;

  const effectiveFrameEffect = (item.frameEffect && item.frameEffect !== 'none') ? item.frameEffect : (globalStyles as any)?.frameEffect;
  const frameEffectClass = effectiveFrameEffect && effectiveFrameEffect !== 'none' ? `frame-effect-${effectiveFrameEffect}` : '';
  
  const frameStyles = {
      '--frame-color': item.frameColor || (globalStyles as any)?.frameColor,
      '--frame-width': `${item.frameWidth || (globalStyles as any)?.frameWidth || 2}px`,
      '--frame-style': item.frameStyle || (globalStyles as any)?.frameStyle || 'solid',
  } as React.CSSProperties;

  // Resize handlers - grid-aligned with flow layout and wrapping
  const GRID_SIZE = 160; // Base grid unit (pixels)
  const MIN_SPAN = 1; // Minimum grid span
  const MAX_SPAN = 4; // Maximum grid span (prevents nonsensical sizes)
  
  const handleResizeStart = (position: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLocallyResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const cardRect = ref.current?.getBoundingClientRect();
    if (!cardRect) return;

    // Current grid spans
    const currentSpanCol = item.gridSpanCol || 1;
    const currentSpanRow = item.gridSpanRow || 1;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newSpanCol = currentSpanCol;
      let newSpanRow = currentSpanRow;

      // Handle horizontal resize (snap to grid)
      if (['e', 'ne', 'se'].includes(position)) {
        newSpanCol = Math.max(MIN_SPAN, Math.round((cardRect.width + deltaX) / GRID_SIZE));
      } else if (['w', 'nw', 'sw'].includes(position)) {
        newSpanCol = Math.max(MIN_SPAN, Math.round((cardRect.width - deltaX) / GRID_SIZE));
      }

      // Handle vertical resize (snap to grid)
      if (['s', 'se', 'sw'].includes(position)) {
        newSpanRow = Math.max(MIN_SPAN, Math.round((cardRect.height + deltaY) / GRID_SIZE));
      } else if (['n', 'ne', 'nw'].includes(position)) {
        newSpanRow = Math.max(MIN_SPAN, Math.round((cardRect.height - deltaY) / GRID_SIZE));
      }

      // Clamp to max
      newSpanCol = Math.min(newSpanCol, MAX_SPAN);
      newSpanRow = Math.min(newSpanRow, MAX_SPAN);

      // Update item with grid spans (enables flow layout and wrapping)
      onUpdateItem(item.id, {
        gridSpanCol: newSpanCol,
        gridSpanRow: newSpanRow,
        // Keep CSS Grid positioning for auto flow/wrap
        styles: {
          ...item.styles,
          // Remove absolute positioning - use grid layout
          position: undefined,
          left: undefined,
          top: undefined,
          width: undefined,
          height: undefined,
        }
      });
    };

    const handleMouseUp = () => {
      setIsLocallyResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-full transition-all duration-300 group/player min-h-[160px] max-h-[600px]", 
        isSelected && "selection-frame",
        frameEffectClass
        )}
      onClick={(e) => onItemClick(item, e)}
            onMouseMove={pointerFrameEnabled ? handlePointerMove : undefined}
      style={frameStyles}
      data-anim={item.animation || (activeAnimation !== 'wave' ? activeAnimation : null)}
    >
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Card
                    className={cn("relative w-full h-full overflow-hidden flex flex-col glass-effect", frameEffectClass)}
                    style={{ 
                        ...globalStyles, 
                        ...item.styles, 
                        borderRadius: globalStyles?.borderRadius,
                        borderColor: item.frameColor || (globalStyles as any)?.frameColor,
                        borderWidth: (item.frameWidth || (globalStyles as any)?.frameWidth) ? `${item.frameWidth || (globalStyles as any)?.frameWidth}px` : undefined,
                        borderStyle: item.frameStyle || (globalStyles as any)?.frameStyle,
                        ...frameStyles,
                        minHeight: '160px',
                        maxHeight: '600px'
                    }}
                >
                                        {isPlayerHeaderVisible && (
                                            <div 
                                                className={cn(
                                                        "flex items-center justify-between bg-card-foreground/5 px-2 h-8 text-xs font-semibold text-foreground flex-shrink-0 relative gap-2",
                                                )}
                                                onClick={handleHeaderClick}
                                                onDoubleClick={handleHeaderDoubleClick}
                                            >
                          <div className='flex items-center gap-2 truncate min-w-0'>
                            <div className='flex items-center justify-center h-5 w-5 text-muted-foreground font-mono text-xs flex-shrink-0'>{item.hierarchyId}</div>
                            <div className={cn('flex items-center justify-center h-5 w-5 text-muted-foreground flex-shrink-0', item.isInvalid && 'text-destructive' )}>
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
                                Icon && <Icon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="relative flex items-center gap-1.5 min-w-0">
                                <div className={cn('flex flex-col truncate transition-opacity', showHoverItems && 'group-hover/player:opacity-0')}>
                                    <span className="truncate">{item.title}</span>
                                    {item.author_name && <span className="text-[9px] text-muted-foreground truncate leading-none">{item.author_name}</span>}
                                </div>
                                 <div className={cn("absolute inset-0 flex items-center justify-start gap-1.5 transition-opacity overflow-visible", showHoverItems ? "opacity-0 group-hover/player:opacity-100" : "opacity-0")}>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => e.stopPropagation()}>
                                                <Star className="h-4 w-4 text-amber-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <RatingPopoverContent item={item} onUpdateItem={onUpdateItem} />
                                      </Popover>
                                      <div className="flex items-center gap-0.5 text-sm">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleLike}>
                                            <ThumbsUp className={cn("h-4 w-4", item.isLiked && "fill-primary text-primary")} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleComment}>
                                            <MessageCircle className="h-4 w-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onShare(item) }}><Share2 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onSaveItem(item) }}><Save className="h-4 w-4" /></Button>
                                      </div>
                                  </div>
                            </div>
                          </div>

                          <div className='flex items-center gap-1.5 ml-auto'>
                              {layoutMode === 'free' && isInteractive && (
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 handle-drag"
                                      title="Taşı"
                                      onClick={(e) => e.stopPropagation()}
                                  >
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              )}
                              {(item.url?.includes('youtube.com') || item.url?.includes('youtu.be')) && item.viewCount && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mr-2">
                                      <Eye className="h-3 w-3" />
                                      <span>{item.viewCount > 1000000 ? `${(item.viewCount / 1000000).toFixed(1)}M` : item.viewCount > 1000 ? `${(item.viewCount / 1000).toFixed(1)}K` : item.viewCount}</span>
                                  </div>
                              )}
                              {item.type === 'player' && item.children && item.children.length > 1 && (
                                  <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); handlePlayerNav('prev');}}><ChevronLeft className="h-4 w-4" /></Button>
                                      <span className="text-xs font-mono text-muted-foreground">{ (item.playerIndex || 0) + 1 } / { item.children.length }</span>
                                      <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); handlePlayerNav('next');}}><ChevronRight className="h-4 w-4" /></Button>
                                  </div>
                              )}
                             
                                <div className={cn("flex items-center gap-1.5", !showHoverItems && 'opacity-0')}>
                                    {(item.visibleMetrics || []).map(metricKey => {
                                        const value = getMetricValue(metricKey);
                                        if (value !== null && metricKey !== 'myRating' && metricKey !== 'averageRating') {
                                          return <MetricDisplay key={metricKey} metricKey={metricKey} value={value} />;
                                        }
                                        return null;
                                    })}
                                </div>
                              
                              {isPlayerSettingsVisible && (
                                <div className='flex items-center'>
                                     <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); onPreviewItem(item); }}><Eye className="h-4 w-4" /></Button>
                                     {onOpenInNewTab && (
                                        <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); onOpenInNewTab(item); }}>
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                     )}
                                     <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { 
                                         e.stopPropagation(); 
                                         window.open(`/popout?itemId=${item.id}&layoutMode=presentation`, 'popout-' + item.id, 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
                                     }}><Maximize2 className="h-4 w-4" /></Button>
                                     <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); if (isContainer && onSetView) onSetView(item); }}><FolderOpen className="h-4 w-4" /></Button>
                                     
                                     <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); onShowInfo(item); }}><Settings className="h-4 w-4" /></Button>
                                     
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => e.stopPropagation()}>
                                                <Palette className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 border-none bg-transparent shadow-none" side="bottom" align="end">
                                            <ItemStyleSettings item={item} onUpdateItem={onUpdateItem} />
                                        </PopoverContent>
                                     </Popover>

                                     <Button variant="ghost" size="icon" className='h-6 w-6' onClick={(e) => { e.stopPropagation(); onSaveItem(item); }}>
                                        <Bookmark className={cn("h-4 w-4", item.parentId === 'saved-items' && "fill-primary text-primary")} />
                                     </Button>
                                </div>
                              )}
                          </div>
                      </div>
                    )}
                    <div className={cn(
                        "flex-1 w-full relative aspect-video",
                        isMaxMode && "flex items-center justify-center bg-black"
                    )}>
                                                {isInteractive && (
                                                        <div
                                                            className={cn(
                                                                "absolute inset-0 pointer-events-none",
                                                                audioHighlight && "audio-tracker",
                                                                virtualizerMode && "virtualizer-hue"
                                                            )}
                                                            style={{
                                                                borderRadius: globalStyles?.borderRadius,
                                                                boxShadow: `0 0 0 calc(var(--interaction-width, 2px)) ${interactionColor}55, 0 0 ${glowDistance}px ${interactionColor}33`,
                                                                border: `var(--interaction-width, 2px) ${pointerFrameEnabled ? 'solid' : 'dashed'} ${interactionColor}aa`,
                                                                opacity: audioHighlight ? Math.max(interactionOpacity, 0.65) : interactionOpacity,
                                                                mixBlendMode: 'screen',
                                                                transition: 'opacity 150ms ease, background 200ms ease',
                                                                ...interactionStyle,
                                                                ...(pointerFrameEnabled ? {
                                                                    '--pointer-x': `${pointerPos.x * 100}%`,
                                                                    '--pointer-y': `${pointerPos.y * 100}%`,
                                                                    background: `radial-gradient(circle at var(--pointer-x) var(--pointer-y), ${interactionColor}40, transparent 50%)`,
                                                                } : {}),
                                                            }}
                                                        >
                                                            {shouldShowVisualizer && (
                                                                <div className="visualizer-overlay" data-mode={visualizerMode}>
                                                                    {visualizerMode === 'circular' ? (
                                                                        <span className="visualizer-ring" />
                                                                    ) : (
                                                                        Array.from({ length: 8 }).map((_, i) => (
                                                                            <span key={`visualizer-${item.id}-${i}`} style={{ animationDelay: `${i * 80}ms` }} />
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                )}
                        <div className="absolute inset-0">
                            {children}
                        </div>
                        {item.type === 'player' && isInteractive && onNewItemInPlayer && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md border px-3 py-1.5 rounded-full shadow-lg">
                                    <input
                                        type="text"
                                        placeholder="URL ekle"
                                        className="h-8 w-44 rounded-md bg-transparent px-2 text-xs border border-border/60 focus:outline-none"
                                        ref={quickAddInputRef}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const value = (e.target as HTMLInputElement).value.trim();
                                                if (value) {
                                                    onNewItemInPlayer(item.id, value);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 px-3 text-[11px]"
                                        onClick={() => {
                                            const input = quickAddInputRef.current;
                                            if (input && input.value.trim()) {
                                                onNewItemInPlayer(item.id, input.value.trim());
                                                input.value = '';
                                            }
                                        }}
                                    >
                                        Ekle
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md border px-2 py-1 rounded-full text-[11px] shadow">
                                    {[{ icon: Play, label: 'Oynatıcı' }, { icon: Puzzle, label: 'Araç' }, { icon: List, label: 'Liste' }, { icon: Folder, label: 'Klasör' }, { icon: Upload, label: 'Yükle' }, { icon: Camera, label: 'Tarama' }].map(({ icon: IconComp, label }) => (
                                        <Button
                                            key={label}
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 gap-1 text-[11px]"
                                            onClick={() => {
                                                const url = window.prompt(`${label} için URL ekleyin`);
                                                if (url) {
                                                    onNewItemInPlayer(item.id, url);
                                                }
                                            }}
                                        >
                                            <IconComp className="h-4 w-4" />
                                            {label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Overlay only appears during actual resizing - doesn't interfere with iframes */}
                        {isLocallyResizing && <div ref={resizeOverlayRef} className="absolute inset-0 z-40 bg-transparent cursor-default pointer-events-auto" />}
                        {isSelected && isInteractive && (
                            <div className="absolute inset-0 z-30 pointer-events-none">
                                {/* Corner handles */}
                                <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/80 bg-primary/90 shadow-lg cursor-nwse-resize pointer-events-auto ring-2 ring-primary/50" onMouseDown={handleResizeStart('nw')} title="NW" />
                                <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/80 bg-primary/90 shadow-lg cursor-nesw-resize pointer-events-auto ring-2 ring-primary/50" onMouseDown={handleResizeStart('ne')} title="NE" />
                                <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full border border-white/80 bg-primary/90 shadow-lg cursor-nesw-resize pointer-events-auto ring-2 ring-primary/50" onMouseDown={handleResizeStart('sw')} title="SW" />
                                <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full border border-white/80 bg-primary/90 shadow-lg cursor-nwse-resize pointer-events-auto ring-2 ring-primary/50" onMouseDown={handleResizeStart('se')} title="SE" />

                                {/* Edge handles */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-2 rounded-full bg-primary/85 shadow pointer-events-auto cursor-ns-resize ring-1 ring-white/60" onMouseDown={handleResizeStart('n')} title="N" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-2 rounded-full bg-primary/85 shadow pointer-events-auto cursor-ns-resize ring-1 ring-white/60" onMouseDown={handleResizeStart('s')} title="S" />
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-4 rounded-full bg-primary/85 shadow pointer-events-auto cursor-ew-resize ring-1 ring-white/60" onMouseDown={handleResizeStart('w')} title="W" />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-4 rounded-full bg-primary/85 shadow pointer-events-auto cursor-ew-resize ring-1 ring-white/60" onMouseDown={handleResizeStart('e')} title="E" />
                            </div>
                        )}
                    </div>
                </Card>
            </ContextMenuTrigger>
        <ContextMenuContent>
           <ContextMenuItem onClick={() => onCopyItem(item.id)}>
                <Wand2 className="mr-2 h-4 w-4" />
                <span>Kopyala</span>
                <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onShowInfo(item)}>
                <Wand2 className="mr-2 h-4 w-4" />
                <span>Bilgi</span>
            </ContextMenuItem>
             <ContextMenuItem onClick={() => onShare(item)}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Paylaş</span>
            </ContextMenuItem>
            {isEditMode && (
                <>
                <ContextMenuSeparator />
                <ContextMenuItem 
                    onClick={() => onDeleteItem(item.id)} 
                    className="text-destructive focus:text-destructive-foreground focus:bg-destructive" 
                    disabled={item.isDeletable === false}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                </ContextMenuItem>
                </>
            )}
        </ContextMenuContent>
    </ContextMenu>
    </div>
  );
};

const PlayerFrame = memo(PlayerFrameComponent);
export default PlayerFrame;
