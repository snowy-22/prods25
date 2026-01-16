
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { File, Folder, Settings, Layout, Palette, Sparkles, Frame, Search, Bot, Camera, Mic, Loader2, ListMusic, Globe, History, Upload, Lock, Unlock, Send, Import, ArrowLeft, ArrowRight, RefreshCw, X, Plus } from 'lucide-react';
import { ContentItem, ItemType, widgetTemplates } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { analyzeItem } from '@/ai/flows/analyze-item-flow';
import { type Message } from '@/ai/flows/assistant-schema';
import { useDebounce } from 'react-use';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ItemAnalysisOutput } from '@/ai/flows/analyze-item-schema';
import { getIconByName, IconName } from '@/lib/icons';
import { SearchPanelState } from '@/lib/store';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UnifiedGridPreview from '@/components/unified-grid-preview';
import { MultiSourceSearchDialog } from '@/components/multi-source-search-dialog';

type SearchableItem = {
  id: string;
  type: 'content' | 'menu' | 'setting' | 'ai-result' | 'widget' | 'history' | 'prompt';
  title: string;
  icon: React.ReactNode;
  action?: () => void;
  category: string;
  description?: string;
  itemData?: any;
};

interface GlobalSearchProps {
  panelState: SearchPanelState;
  onStateChange: (newState: Partial<SearchPanelState>) => void;
  allItems: ContentItem[];
  setActiveView: (item: ContentItem) => void;
  setOpenAccordions: (accordions: string[]) => void;
  toggleAiChatPanel: () => void;
  onAddWidget: (widget: any) => void;
  onAddItem: (itemData: Partial<ContentItem> & { type: ItemType }, parentId: string | null) => void;
  activeViewId: string | null;
  onAddFolderWithItems: (folderName: string, items: { type: ItemType; url: string }[], parentId: string | null) => void;
}

// Helper to recursively get all content items
const flattenContent = (items: ContentItem[]): ContentItem[] => {
  return items.flatMap(item => (item.children ? [item, ...flattenContent(item.children)] : [item]));
};

// Helper to get random items from an array
const getRandomItems = <T,>(arr: T[], num: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};


function GlobalSearch({
  panelState,
  onStateChange,
  allItems,
  setActiveView,
  setOpenAccordions,
  toggleAiChatPanel,
  onAddWidget,
  onAddItem,
  activeViewId,
  onAddFolderWithItems,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ItemAnalysisOutput | null>(null);
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('search-history', []);
  const [suggestedWidgets, setSuggestedWidgets] = useState<(Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'parentId'>)[]>(() => {
      return getRandomItems(Object.values(widgetTemplates).flat(), 3);
  });
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const placeholder = "Bir komut yaz veya bir şey ara...";

  // Browser state
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [isImportMode, setIsImportMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

    const callAssistant = useCallback(async (history: Message[]) => {
        const response = await fetch('/api/ai/assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history }),
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('Assistant service unavailable');
        }

        const data = await response.json();
        return data.history as Message[];
    }, []);


  const allWidgets = useMemo(() => Object.values(widgetTemplates).flat(), []);
  
  const examplePrompts = useMemo(() => [
    { text: "Bana uygulamayı gezdir", icon: <Sparkles/>, category: "Örnek Komutlar" },
    { text: "En popüler 5 filmi listele", icon: <Globe/>, category: "Örnek Komutlar" },
    { text: "Yeni bir müzik listesi oluştur", icon: <ListMusic/>, category: "Örnek Komutlar" },
  ], []);

    const menuItems: SearchableItem[] = useMemo(() => {
    const createMenuItem = (id: string, title: string, iconName: IconName) => {
        const Icon = getIconByName(iconName);
        return {
            id,
            type: 'menu' as 'menu',
            title,
            icon: Icon ? <Icon className="mr-2 h-4 w-4" /> : null,
            category: 'Menü',
        };
    };

    return [
        createMenuItem('ai-chat', 'Yapay Zeka Asistanı', 'bot'),
        createMenuItem('layout-settings', 'Düzen Ayarları', 'layout'),
        createMenuItem('style-settings', 'Stil Ayarları', 'palette'),
    ];
    }, []);
  
  const filteredContent = useMemo(() => {
    if (!query) return [];
    const flatContent = flattenContent(allItems);
    return flatContent
      .filter(item => (item.title || '').toLowerCase().includes(query.toLowerCase()))
      .map(item => {
          const Icon = getIconByName(item.icon as any);
          return {
            id: item.id,
            type: 'content' as 'content',
            title: item.title,
            icon: Icon ? <Icon className="mr-2 h-4 w-4" /> : null,
            itemData: item,
            category: 'İçerik',
            description: item.url
          }
      });
  }, [query, allItems]);

  const filteredWidgets = useMemo(() => {
    if (!query) return [];
    return allWidgets
        .filter(widget => (widget.title || '').toLowerCase().includes(query.toLowerCase()))
        .map(widget => {
            const Icon = getIconByName(widget.icon as any);
            return {
                id: widget.title,
                type: 'widget' as 'widget',
                title: widget.title,
                icon: Icon ? <Icon className="mr-2 h-4 w-4" /> : null,
                itemData: widget,
                category: 'Araç Takımları'
            }
        });
  }, [query, allWidgets]);
  
  const searchResults = useMemo(() => {
      const results: { [key: string]: SearchableItem[] } = {};
      const all = [...menuItems, ...filteredContent, ...filteredWidgets];
      all.forEach(item => {
          if (!results[item.category]) {
              results[item.category] = [];
          }
          results[item.category].push(item as SearchableItem);
      });
      return results;
  }, [menuItems, filteredContent, filteredWidgets]);


  // useEffect(() => {
  //   if (panelState.isOpen) {
  //       setSuggestedWidgets(getRandomItems(allWidgets, 3));
  //   }
  // }, [panelState.isOpen, allWidgets]);


    const handleAiSearch = async (searchQuery: string) => {
    if (!searchQuery) {
        setBrowserUrl(null);
        setAiResponse(null);
        return;
    }
    setIsAiLoading(true);
    setAiResponse(null);
    setAnalysisResult(null);

    // Set browser URL for web search
    try {
        new URL(searchQuery);
        setBrowserUrl(searchQuery);
    } catch (_) {
        setBrowserUrl(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
    }

    // Get AI summary
    try {
        const prompt = `Kullanıcının şu aramasına yardımcı ol: "${searchQuery}". Olası eylemleri veya ilgili bilgileri kısaca özetle.`;
        const history: Message[] = [{ role: 'user', content: [{ text: prompt }] }];
        const responseHistory = await callAssistant(history);
        const lastMessage = responseHistory[responseHistory.length - 1];
        if (lastMessage && lastMessage.role === 'model' && 'text' in lastMessage.content[0]) {
            setAiResponse(lastMessage.content[0].text);
        }
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("AI search failed:", error);
        }
        setAiResponse("Yapay zeka asistanı şu anda yardımcı olamıyor.");
    } finally {
        setIsAiLoading(false);
    }
  };
  
  const addToHistory = (searchTerm: string) => {
    if(!searchTerm) return;
    const newHistory = [searchTerm, ...searchHistory!.filter(item => item !== searchTerm)].slice(0, 5);
    setSearchHistory(newHistory);
  };
  
  const handleSearchSubmit = () => {
      if (query) {
          addToHistory(query);
          handleAiSearch(query);
      }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Lütfen bir resim dosyası seçin.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const imageUri = e.target?.result as string;
        if (imageUri) {
            setQuery(''); // Clear text query
            setIsAiLoading(true);
            setAiResponse(null);
            setAnalysisResult(null);
            setBrowserUrl(null);
            try {
                const result = await analyzeItem({ imageUri });
                setAnalysisResult(result);
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                  console.error("Image analysis failed:", error);
                }
                setAiResponse("Görüntü analizi başarısız oldu.");
            } finally {
                setIsAiLoading(false);
            }
        }
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
  };
  
  const handleIframeClick = useCallback((event: MouseEvent) => {
      if (isImportMode && event.target) {
          event.preventDefault();
          event.stopPropagation();
          const target = event.target as HTMLElement;
          const link = target.closest('a');
          if (link && link.href) {
              onAddItem({ type: 'website', url: link.href }, activeViewId);
          }
      }
  }, [isImportMode, onAddItem, activeViewId]);

  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file) files.push(file);
        }
    }

    if (files.length > 0) {
        event.preventDefault();
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                let type: ItemType = 'file';
                if (file.type.startsWith('image/')) type = 'image';
                else if (file.type.startsWith('video/')) type = 'video';
                else if (file.type.startsWith('audio/')) type = 'audio' as any;
                else if (file.name.endsWith('.pdf')) type = 'pdf' as any;
                else if (file.name.match(/\.(obj|gltf|glb)$/i)) type = '3dplayer';

                onAddItem({ 
                    type, 
                    title: file.name, 
                    url: content 
                }, activeViewId);
            };
            reader.readAsDataURL(file);
        }
    }
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          iframeDoc.addEventListener('click', handleIframeClick, true);
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("Cannot access iframe content:", e);
        }
      }
    };

    iframe.addEventListener('load', handleLoad);
    
    return () => {
      iframe.removeEventListener('load', handleLoad);
      try {
         const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          iframeDoc.removeEventListener('click', handleIframeClick, true);
        }
      } catch(e) {}
    };
  }, [handleIframeClick]);


    const handleOpenChange = useCallback((open: boolean) => {
            // Avoid redundant state updates that can cause render loops
            if (open !== panelState.isOpen) {
                onStateChange({ isOpen: open });
            }
            if (!open) {
                setQuery('');
                setAiResponse(null);
                setAnalysisResult(null);
                setBrowserUrl(null);
            }
    }, [onStateChange, panelState.isOpen]);

    const suggestionSets = [
        {
            title: "Sanat & Tasarım İlhamı",
            description: "Yaratıcılığınızı ateşleyecek görsel kaynaklar.",
            items: [
                { type: 'website', url: 'https://www.behance.net' },
                { type: 'website', url: 'https://dribbble.com' },
                { type: 'website', url: 'https://www.artstation.com' },
                { type: 'website', url: 'https://www.pinterest.com' },
                { type: 'video', url: 'https://www.youtube.com/watch?v=q6_66a21wz8' }
            ]
        },
        {
            title: "Verimlilik Araçları",
            description: "İş akışınızı hızlandıracak widget ve araçlar.",
            items: [
                { type: 'todolist', title: 'Günlük Görevler' },
                { type: 'notes', title: 'Hızlı Notlar' },
                { type: 'calendar', title: 'Haftalık Plan' },
            ]
        },
         {
            title: "Sakinleştirici Mola",
            description: "Rahatlamak için sakinleştirici müzikler ve görseller.",
            items: [
                { type: 'video', url: 'https://www.youtube.com/watch?v=l_0a8hOcC8c' }, // Lofi
                { type: 'video', url: 'https://www.youtube.com/watch?v=__32aFVvrko' }, // Rain sounds
                { type: 'image', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop' } // Mountain
            ]
        }
    ];
  
  const content = (
    <div className='flex flex-col h-full'>
       <div className='handle p-2 border-b flex items-center gap-1 cursor-grab'>
           <div className='relative flex items-center gap-2 flex-1'>
               <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground'/>
                <Input
                   placeholder={placeholder}
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                   onPaste={handlePaste}
                   className="w-full pl-9 h-9"
                />
           </div>
           <Button variant="ghost" size="icon" className='h-9 w-9' onClick={() => fileInputRef.current?.click()}><Camera className='h-5 w-5'/></Button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
           <Button variant="ghost" size="icon" className='h-9 w-9'><Mic className='h-5 w-5'/></Button>
           <Button variant={panelState.isDraggable ? "secondary" : "ghost"} size="icon" className='h-9 w-9' onClick={() => onStateChange({ isDraggable: !panelState.isDraggable })}>
                {panelState.isDraggable ? <Lock className='h-5 w-5' /> : <Unlock className='h-5 w-5' />}
            </Button>
            <Button variant="ghost" size="icon" className='h-9 w-9' onClick={() => handleOpenChange(false)}><X className='h-5 w-5'/></Button>
       </div>
       <div className='flex-1 flex flex-col min-h-0'>
           {/* 4-Category Multi-Source Search Dialog */}
           <MultiSourceSearchDialog
               query={query}
               onQueryChange={setQuery}
               libraryItems={allItems}
               onSelectLibraryItem={setActiveView}
               socialUsers={[]}
               socialContent={[]}
               onSelectSocialUser={() => {}}
               onSelectSocialContent={() => {}}
               marketplaceListings={[]}
               onSelectMarketplaceListing={() => {}}
               isLoading={false}
           />
            {isAiLoading && (
                <div className='flex items-center justify-center p-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
            )}
            {analysisResult && (
                 <div className="p-4 bg-muted">
                    <h3 className='font-semibold'>{analysisResult.title}</h3>
                    <p className='text-sm text-muted-foreground'>{analysisResult.description}</p>
                </div>
            )}
            {!query && !analysisResult && !isAiLoading && (
                 <ScrollArea className="flex-1 p-2">
                     <div className='p-2 space-y-4'>
                        {searchHistory && searchHistory.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Son Aramalar</h3>
                                {searchHistory.map((term) => (
                                    <Button key={term} variant="ghost" className="w-full justify-start" onClick={() => { setQuery(term); handleAiSearch(term); }}>
                                        <History className="mr-2 h-4 w-4" /> {term}
                                    </Button>
                                ))}
                            </div>
                        )}
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground mb-2">Örnek Komutlar</h3>
                            {examplePrompts.map((prompt) => (
                                <Button key={prompt.text} variant="ghost" className="w-full justify-start" onClick={() => { setQuery(prompt.text); handleAiSearch(prompt.text); }}>
                                    {React.cloneElement(prompt.icon as React.ReactElement, { className: "mr-2 h-4 w-4" } as any)} {prompt.text}
                                </Button>
                            ))}
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground mb-2">Hızlı Erişim Widget'ları</h3>
                            {suggestedWidgets.map((widget) => {
                                const Icon = getIconByName(widget.icon as any);
                                return (
                                <Button key={widget.title} variant="ghost" className="w-full justify-start" onClick={() => { onAddWidget(widget); handleOpenChange(false); }}>
                                    {Icon && <Icon className="mr-2 h-4 w-4"/>} {widget.title}
                                </Button>
                            )})}
                        </div>
                        <div className="pt-4">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Size Özel Öneriler</h3>
                            <div className="space-y-4">
                                {suggestionSets.map(set => (
                                    <Card key={set.title}>
                                        <CardHeader>
                                            <CardTitle className="text-base">{set.title}</CardTitle>
                                            <CardDescription>{set.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="aspect-video bg-muted rounded-md overflow-hidden mb-4">
                                                <UnifiedGridPreview items={set.items} layoutMode="grid" maxItems={9} showTitle />
                                            </div>
                                            <Button className="w-full" onClick={() => { onAddFolderWithItems(set.title, set.items as any, activeViewId); handleOpenChange(false); }}>
                                                <Import className="mr-2 h-4 w-4"/> İçe Aktar
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            )}
            {query && Object.keys(searchResults).length > 0 && !browserUrl &&(
                 <ScrollArea className="flex-1 p-2">
                     <div className='p-2 space-y-4'>
                        {Object.entries(searchResults).map(([category, items]) => (
                            <div key={category}>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2">{category}</h3>
                                {items.map(item => (
                                    <Button 
                                        key={item.id} 
                                        variant="ghost" 
                                        className="w-full justify-start" 
                                        onClick={() => {
                                            if (item.action) {
                                                item.action();
                                            } else if (item.type === 'content' && item.itemData) {
                                                setActiveView(item.itemData);
                                                handleOpenChange(false);
                                            } else if (item.type === 'widget' && item.itemData) {
                                                onAddWidget(item.itemData);
                                                handleOpenChange(false);
                                            } else if (item.type === 'menu') {
                                                if (item.id === 'ai-chat') {
                                                    toggleAiChatPanel();
                                                    handleOpenChange(false);
                                                }
                                            }
                                        }}
                                    >
                                        {item.icon} {item.title}
                                    </Button>
                                ))}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
            {(browserUrl || aiResponse) && (
                 <div className='flex-1 flex flex-col border-t mt-2'>
                    {aiResponse && <div className='p-4 text-sm bg-muted flex-shrink-0'>{aiResponse}</div>}
                    {browserUrl && (
                        <div className='flex-1 relative'>
                             <div className='absolute top-2 right-2 z-10'>
                                <Button variant={isImportMode ? "secondary" : "outline"} size="sm" className='h-8' onClick={() => setIsImportMode(!isImportMode)}>
                                    <Import className="mr-2 h-4 w-4" />
                                    İçe Aktar
                                </Button>
                             </div>
                             <iframe
                                ref={iframeRef}
                                src={browserUrl}
                                className={cn("w-full h-full border-0", isImportMode && "pointer-events-auto cursor-crosshair")}
                                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                            />
                        </div>
                    )}
                </div>
            )}
       </div>
    </div>
  );

  if (!panelState.isOpen) {
    return null;
  }

  if (panelState.isDraggable) {
      return (
          <Rnd
              position={{ x: panelState.x, y: panelState.y }}
              size={{ width: panelState.width, height: panelState.height }}
              minWidth={480}
              minHeight={400}
              bounds="window"
              className="bg-card/80 backdrop-blur-lg border rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden"
              dragHandleClassName="handle"
              onDragStop={(e, d) => onStateChange({ x: d.x, y: d.y })}
              onResizeStop={(e, direction, ref, delta, position) => {
                  onStateChange({
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      ...position,
                  });
              }}
          >
              {content}
          </Rnd>
      )
  }

  return (
    <Dialog open={panelState.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 flex flex-col h-[80vh]">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}
export default React.memo(GlobalSearch);