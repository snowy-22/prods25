
"use client";

import React, { CSSProperties, useEffect, useState, memo, useRef, Suspense, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { ContentItem } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Settings, Wand2, Share2, Eye, Trash2, FolderOpen, ThumbsUp, MessageCircle, Save, Star, TrendingUp, BookOpen, GanttChart, BrainCircuit, Waves, Thermometer, BatteryCharging, Ruler, Scale, Lock, Unlock, ExternalLink, Bookmark, Palette, Type, Maximize2, Minimize2, Square, Circle, Layers, MoreHorizontal, Play, Puzzle, List, Folder, Upload, Camera, Globe } from 'lucide-react';
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
            <div className="flex items-center gap-0.5 font-bold text-[10px] text-amber-500 transition-all hover:scale-105" title={`Harf Notu: ${value}`}>
                 <Icon className="h-3 w-3 text-purple-400" />
            </div>
        )
    }

    const Icon = (metricIcons as any)[metricKey as keyof typeof metricIcons] || metricIcons.default;

    if (metricKey === 'averageRating' || metricKey === 'myRating' || metricKey === 'fiveStarRating' || metricKey === 'tenPointRating') {
        const maxValue = metricKey === 'tenPointRating' ? 10 : 5;
        return (
            <div className="flex items-center gap-0.5 font-bold text-[10px] text-amber-500 transition-all hover:scale-105" title={`Puan: ${value}/${maxValue}`}>
                <Icon className="h-3 w-3 text-amber-400 fill-amber-400" />
                <span className="font-mono">{Number(value).toFixed(1)}</span>
            </div>
        );
    }
    
    if (typeof value === 'boolean') {
        value = value ? 'Evet' : 'Hayır';
    }

    return (
        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground transition-all hover:text-foreground hover:scale-105" title={`${metricKey}: ${value}`}>
            <Icon className="h-3 w-3" />
            <span className="font-mono text-[9px]">{value}</span>
        </div>
    );
};

const ItemStyleSettings = ({ item, onUpdateItem }: { item: ContentItem, onUpdateItem: (id: string, updates: Partial<ContentItem>) => void }) => {
    const styles = item.styles || {};
    
    return (
        <div className="p-0 w-64 bg-card/90 backdrop-blur-2xl border border-border/60 rounded-xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border/40 bg-transparent h-8">
                    <TabsTrigger value="general" className="text-[9px] uppercase font-bold tracking-wide">Genel</TabsTrigger>
                    <TabsTrigger value="frame" className="text-[9px] uppercase font-bold tracking-wide">Çerçeve</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="p-3 space-y-3 mt-0">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold flex items-center gap-1.5">
                            <Palette className="h-3 w-3" /> Görünüm
                        </Label>
                        <div className="grid grid-cols-2 gap-1.5">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn("h-7 text-[9px] hover:scale-105 transition-all", styles.borderRadius === '0px' && "bg-primary text-primary-foreground")}
                                onClick={() => onUpdateItem(item.id, { styles: { ...styles, borderRadius: '0px' } })}
                            >
                                <Square className="h-3 w-3 mr-1" /> Keskin
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn("h-7 text-[9px] hover:scale-105 transition-all", styles.borderRadius === '12px' && "bg-primary text-primary-foreground")}
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
                        <Label className="text-xs font-bold flex items-center gap-2">
                            <Square className="h-3 w-3" /> En-Boy Oranı
                        </Label>
                        <div className="grid grid-cols-3 gap-1">
                            {[
                                { label: '16:9', value: '16:9' },
                                { label: '1:1', value: '1:1' },
                                { label: 'Otomatik', value: 'auto' }
                            ].map((option) => (
                                <Button 
                                    key={option.value}
                                    variant="outline" 
                                    size="sm" 
                                    className={cn("h-7 text-[9px] px-1", item.playerAspectRatio === option.value && "bg-primary text-primary-foreground")}
                                    onClick={() => onUpdateItem(item.id, { playerAspectRatio: option.value as any })}
                                    title={`En-boy oranı: ${option.label}`}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>

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
                                onChange={(e) => onUpdateItem(item.id, { interactionColor: e.target.value } as any)}
                                className="h-6 w-14 rounded cursor-pointer bg-transparent"
                            />
                            <span className="text-[10px] text-muted-foreground">Kalınlık</span>
                            <Slider
                                className="flex-1"
                                value={[ (item as any).interactionWidth ?? 2 ]}
                                min={1}
                                max={8}
                                step={1}
                                onValueChange={([v]) => onUpdateItem(item.id, { interactionWidth: v } as any)}
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
                                onValueChange={([v]) => onUpdateItem(item.id, { interactionGlow: v / 100 } as any)}
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
  layoutMode: 'grid' | 'canvas';
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
  const setActiveSecondaryPanel = useAppStore(s => s.setActiveSecondaryPanel);
  const setItemToShare = useAppStore(s => s.setItemToShare);
  const setItemToMessage = useAppStore(s => s.setItemToMessage);

  // Determine if save button should be shown
  // Hide save button for personal library and own lists
  // Show save button for external sources (social, messages, profiles, external canvas links)
  const isPersonalLibraryItem = () => {
    // Personal library items: in root or personal folders
    const personalContainers = ['root', 'saved-items', 'awards-folder', 'spaces-folder', 'devices-folder', 'trash-folder'];
    return personalContainers.includes(item.parentId || '') || 
           (item.type === 'list' && !item.metadata?.isExternal) ||
           (item.type === 'player' && item.parentId === 'root');
  };

  const shouldShowSaveButton = !isPersonalLibraryItem();

  // Auto-open source adder for placeholder URL
  useEffect(() => {
    if (item.type === 'player' && item.url === 'ADD_SOURCE_PLACEHOLDER' && onNewItemInPlayer) {
      // Focus the input field
      if (quickAddInputRef.current) {
        quickAddInputRef.current.focus();
      }
    }
  }, [item.id, item.type, item.url, onNewItemInPlayer]);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;
    
    const timer = setTimeout(() => {
        onLoad();
    }, 100);

    return () => clearTimeout(timer);
  }, [item.id, onLoad]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const isContainer = ['folder', 'list', 'player', 'inventory', 'space', 'devices', 'calendar', 'saved-items', 'awards-folder', 'spaces-folder', 'devices-folder', 'root', 'trash-folder'].includes(item.type);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this player is selected or focused
      if (!isSelected && !ref.current?.contains(document.activeElement)) return;

      const isInputFocused = document.activeElement instanceof HTMLInputElement || 
                            document.activeElement instanceof HTMLTextAreaElement;

      switch (e.key) {
        case ' ':
          // Space: Play/Pause
          if (!isInputFocused) {
            e.preventDefault();
            const videoElement = ref.current?.querySelector('video');
            const audioElement = ref.current?.querySelector('audio');
            if (videoElement) {
              videoElement.paused ? videoElement.play() : videoElement.pause();
            } else if (audioElement) {
              audioElement.paused ? audioElement.play() : audioElement.pause();
            }
          }
          break;

        case 'ArrowRight':
          // Arrow Right: Next item (in players with children)
          if (!isInputFocused && item.children && item.children.length > 0) {
            e.preventDefault();
            handlePlayerNav('next');
          }
          break;

        case 'ArrowLeft':
          // Arrow Left: Previous item
          if (!isInputFocused && item.children && item.children.length > 0) {
            e.preventDefault();
            handlePlayerNav('prev');
          }
          break;

        case 'Enter':
          // Enter: Open item (for containers)
          if (!isInputFocused && isContainer && onSetView) {
            e.preventDefault();
            onSetView(item);
          }
          break;

        case 'Escape':
          // Escape: Deselect
          e.preventDefault();
          if (onItemClick) onItemClick(item, e as any);
          break;

        case 'Delete':
          // Delete: Remove item
          if (!isInputFocused && onDeleteItem) {
            e.preventDefault();
            onDeleteItem(item.id);
          }
          break;

        case 's':
        case 'S':
          // Ctrl+S: Save/Share
          if ((e.ctrlKey || e.metaKey) && !isInputFocused) {
            e.preventDefault();
            setItemToShare(item);
          }
          break;

        case 'm':
        case 'M':
          // Ctrl+M: Message
          if ((e.ctrlKey || e.metaKey) && !isInputFocused) {
            e.preventDefault();
            setItemToMessage(item);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, item, onSetView, onDeleteItem, onItemClick, handlePlayerNav, setItemToShare, setItemToMessage]);

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

  // Resize handlers - supports both grid and canvas modes
  const GRID_SIZE = 160; // Base grid unit (pixels)
  const MIN_SPAN = 1; // Minimum grid span
  const MAX_SPAN = 4; // Maximum grid span (prevents nonsensical sizes)
  const MIN_SIZE = 80; // Minimum pixel size for canvas mode (reduced for responsive)
  const MAX_SIZE = 1200; // Maximum pixel size for canvas mode
  const isCanvasMode = layoutMode === 'canvas';
  
    // Deep equality check utility
    function deepEqual(a: any, b: any): boolean {
        if (a === b) return true;
        if (typeof a !== typeof b) return false;
        if (typeof a !== 'object' || a === null || b === null) return false;
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;
        for (const key of aKeys) {
            if (!bKeys.includes(key) || !deepEqual(a[key], b[key])) return false;
        }
        return true;
    }

    const handleResizeStart = (position: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLocallyResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const cardRect = ref.current?.getBoundingClientRect();
    if (!cardRect) return;

    // Get parent container width for responsive sizing
    const parentWidth = ref.current?.parentElement?.clientWidth || 1200;

    // Store initial values
    const initialWidth = cardRect.width;
    const initialHeight = cardRect.height;
    const currentSpanCol = item.gridSpanCol || 1;
    const currentSpanRow = item.gridSpanRow || 1;
    const currentWidth = item.styles?.width ? parseFloat(item.styles.width as string) : initialWidth;
    const currentHeight = item.styles?.height ? parseFloat(item.styles.height as string) : initialHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            if (isCanvasMode) {
                // Canvas mode: Update absolute pixel dimensions in real-time with responsive constraints
                let newWidth = currentWidth;
                let newHeight = currentHeight;
                const responsiveMaxWidth = Math.min(MAX_SIZE, parentWidth * 0.95);
                if (["e", "ne", "se"].includes(position)) {
                    newWidth = currentWidth + deltaX;
                } else if (["w", "nw", "sw"].includes(position)) {
                    newWidth = currentWidth - deltaX;
                }
                if (["s", "se", "sw"].includes(position)) {
                    newHeight = currentHeight + deltaY;
                } else if (["n", "ne", "nw"].includes(position)) {
                    newHeight = currentHeight - deltaY;
                }
                // Clamp width/height to min/max
                newWidth = Math.max(MIN_SIZE, Math.min(responsiveMaxWidth, newWidth));
                newHeight = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newHeight));
                const newStyles = {
                    ...item.styles,
                    width: `${Math.round(newWidth)}px`,
                    height: `${Math.round(newHeight)}px`,
                    position: "absolute",
                };
                if (!deepEqual(item.styles, newStyles)) {
                    onUpdateItem(item.id, { styles: newStyles });
                }
            } else {
                // Grid mode: Update grid spans
                let newSpanCol = currentSpanCol;
                let newSpanRow = currentSpanRow;
                if (['e', 'ne', 'se'].includes(position)) {
                    newSpanCol = Math.max(MIN_SPAN, Math.round((initialWidth + deltaX) / GRID_SIZE));
                } else if (['w', 'nw', 'sw'].includes(position)) {
                    newSpanCol = Math.max(MIN_SPAN, Math.round((initialWidth - deltaX) / GRID_SIZE));
                }
                if (['s', 'se', 'sw'].includes(position)) {
                    newSpanRow = Math.max(MIN_SPAN, Math.round((initialHeight + deltaY) / GRID_SIZE));
                } else if (['n', 'ne', 'nw'].includes(position)) {
                    newSpanRow = Math.max(MIN_SPAN, Math.round((initialHeight - deltaY) / GRID_SIZE));
                }
                newSpanCol = Math.min(newSpanCol, MAX_SPAN);
                newSpanRow = Math.min(newSpanRow, MAX_SPAN);
                const newGrid = { gridSpanCol: newSpanCol, gridSpanRow: newSpanRow };
                const newStyles = {
                    ...item.styles,
                    position: undefined,
                    left: undefined,
                    top: undefined,
                    width: undefined,
                    height: undefined,
                };
                if (item.gridSpanCol !== newSpanCol || item.gridSpanRow !== newSpanRow || !deepEqual(item.styles, newStyles)) {
                    onUpdateItem(item.id, {
                        ...newGrid,
                        styles: newStyles,
                    });
                }
            }
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
        "relative w-full h-full transition-all duration-300 group/player sm:min-h-[140px] md:min-h-[160px] max-h-[800px] sm:max-h-[700px] md:max-h-[600px]", 
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
                        maxHeight: '600px',
                        aspectRatio: item.playerAspectRatio === '16:9' ? '16 / 9' : item.playerAspectRatio === '1:1' ? '1 / 1' : undefined,
                    }}
                >
                                        {isPlayerHeaderVisible && (
                                            <div 
                                                className={cn(
                                                        "flex items-center justify-between px-1.5 h-5 text-xs font-medium text-foreground flex-shrink-0 relative gap-1 transition-all duration-200 hover:shadow-sm backdrop-blur-sm border-b border-border/30",
                                                        item.cellAnimation === 'fade-in' && 'animate-in fade-in duration-500',
                                                        item.cellAnimation === 'slide-up' && 'animate-in slide-in-from-bottom duration-500',
                                                        item.cellAnimation === 'zoom-in' && 'animate-in zoom-in duration-500',
                                                        item.cellAnimation === 'bounce' && 'animate-bounce',
                                                        item.cellAnimation === 'rotate' && 'animate-spin',
                                                )}
                                                style={{
                                                    backgroundColor: item.cellBackgroundColor || 'hsl(var(--card-foreground) / 0.03)',
                                                    background: item.cellBackgroundColor 
                                                      ? item.cellBackgroundColor 
                                                      : 'linear-gradient(to bottom, hsl(var(--card-foreground) / 0.04), hsl(var(--card-foreground) / 0.02))',
                                                }}
                                                onClick={handleHeaderClick}
                                                onDoubleClick={handleHeaderDoubleClick}
                                            >
                          <div className='flex items-center gap-0.5 truncate min-w-0'>
                            <div className='flex items-center justify-center h-3 w-3 text-muted-foreground/70 font-mono text-[8px] flex-shrink-0 hover:text-muted-foreground transition-colors'>{item.hierarchyId}</div>
                            <div className={cn('flex items-center justify-center h-3 w-3 text-muted-foreground/80 flex-shrink-0 transition-colors hover:scale-110', item.isInvalid && 'text-destructive' )}>
                              {item.thumbnail_url ? (
                                <div className="relative h-3 w-3 rounded-sm overflow-hidden">
                                  <Image 
                                    src={item.thumbnail_url} 
                                    alt={item.title} 
                                    fill 
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                Icon && <Icon className="h-3 w-3" />
                              )}
                            </div>
                            <div className="relative flex items-center gap-1 min-w-0">
                                <div 
                                    className={cn('flex flex-col truncate transition-all duration-200', showHoverItems && 'group-hover/player:opacity-0')}
                                    style={{
                                        fontFamily: item.cellTitleFont === 'mono' ? 'monospace' : 
                                                   item.cellTitleFont === 'serif' ? 'serif' : 
                                                   item.cellTitleFont === 'display' ? 'var(--font-display)' : 
                                                   undefined,
                                        fontSize: item.cellTitleSize ? `${item.cellTitleSize}px` : undefined,
                                        color: item.cellTitleColor || undefined,
                                        fontWeight: item.cellTitleBold ? 'bold' : undefined,
                                        fontStyle: item.cellTitleItalic ? 'italic' : undefined,
                                    }}
                                >
                                    <span className="truncate">{item.title}</span>
                                    {item.author_name && <span className="text-[9px] text-muted-foreground truncate leading-none">{item.author_name}</span>}
                                </div>
                                 <div className={cn("absolute inset-0 flex items-center justify-start gap-1 transition-all duration-200 overflow-visible", showHoverItems ? "opacity-0 group-hover/player:opacity-100" : "opacity-0")}>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className='h-5 w-5 hover:scale-110 transition-transform' onClick={(e) => e.stopPropagation()}>
                                                <Star className="h-3.5 w-3.5 text-amber-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <RatingPopoverContent item={item} onUpdateItem={onUpdateItem} />
                                      </Popover>
                                      <div className="flex items-center gap-0.5 text-sm">
                                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:scale-110 transition-transform" onClick={handleLike}>
                                            <ThumbsUp className={cn("h-3.5 w-3.5 transition-colors", item.isLiked && "fill-primary text-primary")} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:scale-110 transition-transform" onClick={handleComment}>
                                            <MessageCircle className="h-3.5 w-3.5"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); onShare(item) }}><Share2 className="h-3.5 w-3.5" /></Button>
                                        {shouldShowSaveButton && <Button variant="ghost" size="icon" className="h-5 w-5 hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); onSaveItem(item) }}><Save className="h-3.5 w-3.5" /></Button>}
                                      </div>
                                  </div>
                            </div>
                          </div>

                          <div className='flex items-center gap-1 ml-auto'>
                              {layoutMode === 'canvas' && isInteractive && (
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 handle-drag cursor-move hover:bg-accent/80 transition-colors"
                                      title="Taşı (Sol Üst Köşeden Sürükle)"
                                      onClick={(e) => e.stopPropagation()}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        // Canvas modunda drag başlatılır
                                      }}
                                  >
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                              )}
                              {(item.url?.includes('youtube.com') || item.url?.includes('youtu.be')) && item.viewCount && (
                                  <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground mr-1 hover:text-foreground transition-colors">
                                      <Eye className="h-3 w-3" />
                                      <span className="font-mono">{item.viewCount > 1000000 ? `${(item.viewCount / 1000000).toFixed(1)}M` : item.viewCount > 1000 ? `${(item.viewCount / 1000).toFixed(1)}K` : item.viewCount}</span>
                                  </div>
                              )}
                              {item.type === 'player' && item.children && item.children.length > 1 && (
                                  <div className="flex items-center gap-0.5 bg-accent/40 rounded-md px-1 py-0.5 hover:bg-accent/60 transition-colors">
                                      <Button variant="ghost" size="icon" className='h-4 w-4 hover:scale-110 transition-transform' onClick={(e) => { e.stopPropagation(); handlePlayerNav('prev');}}><ChevronLeft className="h-3 w-3" /></Button>
                                      <span className="text-[10px] font-mono text-muted-foreground min-w-[32px] text-center">{ (item.playerIndex || 0) + 1 } / { item.children.length }</span>
                                      <Button variant="ghost" size="icon" className='h-4 w-4 hover:scale-110 transition-transform' onClick={(e) => { e.stopPropagation(); handlePlayerNav('next');}}><ChevronRight className="h-3 w-3" /></Button>
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
                                <div className='flex items-center gap-0.5'>
                                     <Button variant="ghost" size="icon" className='h-5 w-5 hover:scale-110 hover:bg-accent/80 transition-all' onClick={(e) => { e.stopPropagation(); onPreviewItem(item); }}><Eye className="h-3.5 w-3.5" /></Button>
                                     {onOpenInNewTab && (
                                        <Button variant="ghost" size="icon" className='h-5 w-5 hover:scale-110 hover:bg-accent/80 transition-all' onClick={(e) => { e.stopPropagation(); onOpenInNewTab(item); }}>
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                     )}
                                     <Button variant="ghost" size="icon" className='h-5 w-5 hover:scale-110 hover:bg-accent/80 transition-all' onClick={(e) => { 
                                         e.stopPropagation(); 
                                         window.open(`/popout?itemId=${item.id}&layoutMode=presentation`, 'popout-' + item.id, 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
                                     }}><Maximize2 className="h-3.5 w-3.5" /></Button>
                                     <Button variant="ghost" size="icon" className='h-5 w-5 hover:scale-110 hover:bg-accent/80 transition-all' onClick={(e) => { e.stopPropagation(); if (isContainer && onSetView) onSetView(item); }}><FolderOpen className="h-3.5 w-3.5" /></Button>
                                     
                                     <Button variant="ghost" size="icon" className='h-5 w-5 hover:scale-110 hover:bg-accent/80 transition-all' onClick={(e) => { e.stopPropagation(); onShowInfo(item); }}><Settings className="h-3.5 w-3.5" /></Button>
                                     
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className='h-5 w-5 hover:scale-110 hover:bg-accent/80 transition-all' onClick={(e) => e.stopPropagation()}>
                                                <Palette className="h-3.5 w-3.5" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 border-none bg-transparent shadow-none" side="bottom" align="end">
                                            <ItemStyleSettings item={item} onUpdateItem={onUpdateItem} />
                                        </PopoverContent>
                                     </Popover>

                                     {shouldShowSaveButton && (
                                       <Button variant="ghost" size="icon" className='h-5 w-5 hover:scale-110 hover:bg-accent/80 transition-all' onClick={(e) => { e.stopPropagation(); onSaveItem(item); }}>
                                          <Bookmark className={cn("h-3.5 w-3.5 transition-colors", item.parentId === 'saved-items' && "fill-primary text-primary")} />
                                       </Button>
                                     )}
                                </div>
                              )}
                          </div>
                      </div>
                    )}
                    <div className={cn(
                        "flex-1 w-full h-full relative",
                        !item.hideBlackBars ? "aspect-video" : "flex items-center justify-center",
                        isMaxMode && "flex items-center justify-center bg-black"
                    )}>
                        {/* Vertical black bars when hideBlackBars is enabled */}
                        {item.hideBlackBars && (
                            <>
                                <div className="absolute left-0 top-0 bottom-0 w-[12.5%] bg-black z-10"></div>
                                <div className="absolute right-0 top-0 bottom-0 w-[12.5%] bg-black z-10"></div>
                            </>
                        )}
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
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                            <div className="w-full h-full">
                                {children}
                            </div>
                        </div>
                        {item.type === 'player' && isInteractive && onNewItemInPlayer && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-1.5 bg-background/70 backdrop-blur-xl border border-border/60 px-2.5 py-1 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-primary/30">
                                    <input
                                        type="text"
                                        placeholder="URL ekle"
                                        className="h-7 w-40 rounded-md bg-transparent px-2 text-xs border border-border/40 focus:outline-none focus:border-primary/50 transition-colors"
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
                                        className="h-7 px-2.5 text-[10px] font-medium hover:scale-105 transition-transform"
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
                                <div className="flex flex-wrap items-center justify-center gap-0.5 bg-background/70 backdrop-blur-xl border border-border/60 px-2 py-1.5 rounded-xl text-[10px] shadow-xl max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg hover:shadow-2xl transition-all duration-300 hover:border-primary/30">
                                    <span className="w-full text-center text-[10px] font-semibold text-muted-foreground mb-0.5 sm:mb-0 sm:w-auto">Oynatıcı Ekle:</span>
                                    {[{ icon: Play, label: 'Oynatıcı' }, { icon: Puzzle, label: 'Araç' }, { icon: List, label: 'Liste' }, { icon: Folder, label: 'Klasör' }, { icon: Upload, label: 'Yükle' }, { icon: Camera, label: 'Tarama' }].map(({ icon: IconComp, label }) => (
                                        <Button
                                            key={label}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-1.5 gap-0.5 text-[10px] hover:bg-primary/20 hover:scale-105 transition-all rounded-lg"
                                            onClick={() => {
                                                const url = window.prompt(`${label} için URL ekleyin`);
                                                if (url) {
                                                    onNewItemInPlayer(item.id, url);
                                                }
                                            }}
                                        >
                                            <IconComp className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="hidden sm:inline">{label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Overlay only appears during actual resizing - doesn't interfere with iframes */}
                        {isLocallyResizing && <div ref={resizeOverlayRef} className="absolute inset-0 z-40 bg-transparent cursor-default pointer-events-auto" />}
                        {(isSelected && isInteractive) && (
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
            <ContextMenuItem onClick={() => {
                setItemToShare(item);
                setActiveSecondaryPanel('social');
                toast({
                    title: "Sosyal Paylaşım",
                    description: `${item.title} sosyal panelde paylaşıma hazır.`
                });
            }}>
                <Globe className="mr-2 h-4 w-4" />
                <span>Sosyalde Paylaş</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setItemToMessage(item);
                setActiveSecondaryPanel('messages');
                toast({
                    title: "Mesajla Gönder",
                    description: `${item.title} mesajlaşma paneline eklendi.`
                });
            }}>
                <MessageCircle className="mr-2 h-4 w-4" />
                <span>Mesajla Gönder</span>
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
