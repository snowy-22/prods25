"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Home,
  ExternalLink,
  MoreHorizontal,
  X,
  Maximize2,
  Bookmark,
  Copy,
  Settings2,
  Share2,
  Clock,
  MapPin,
  History
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContentItem } from "@/lib/initial-content";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export type StartOption = 'fresh' | 'selected' | 'last-position';

export interface BrowserCardState {
  currentUrl: string;
  homeUrl: string;
  lastPosition?: {
    url: string;
    scrollY: number;
    scrollX: number;
    timestamp: string;
  };
  selectedPosition?: {
    url: string;
    label: string;
    scrollY: number;
    scrollX: number;
  };
  history: string[];
  historyIndex: number;
  settings: {
    startOption: StartOption;
    rememberPosition: boolean;
    showToolbar: boolean;
    allowNavigation: boolean;
    sandbox: string[];
  };
}

export interface BrowserCardWidgetProps {
  item: ContentItem;
  state?: BrowserCardState;
  onStateChange?: (state: BrowserCardState) => void;
  onOpenExternal?: () => void;
  onClose?: () => void;
  isEditable?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  className?: string;
}

export function BrowserCardWidget({
  item,
  state: externalState,
  onStateChange,
  onOpenExternal,
  onClose,
  isEditable = true,
  size = 'medium',
  className
}: BrowserCardWidgetProps) {
  const initialUrl = item.url || (item.content as string) || 'about:blank';
  
  const [state, setState] = React.useState<BrowserCardState>(() => externalState || {
    currentUrl: initialUrl,
    homeUrl: initialUrl,
    history: [initialUrl],
    historyIndex: 0,
    settings: {
      startOption: 'fresh',
      rememberPosition: true,
      showToolbar: true,
      allowNavigation: true,
      sandbox: ['allow-scripts', 'allow-same-origin', 'allow-forms']
    }
  });

  const [urlInput, setUrlInput] = React.useState(state.currentUrl);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Sync external state
  React.useEffect(() => {
    if (externalState) {
      setState(externalState);
    }
  }, [externalState]);

  // Notify state changes
  const updateState = React.useCallback((updates: Partial<BrowserCardState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Navigate to URL
  const navigateTo = React.useCallback((url: string) => {
    if (!url) return;
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setIsLoading(true);
    
    updateState({
      currentUrl: url,
      history: [...state.history.slice(0, state.historyIndex + 1), url],
      historyIndex: state.historyIndex + 1
    });
    
    setUrlInput(url);
  }, [state.history, state.historyIndex, updateState]);

  // Navigation actions
  const goBack = () => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const newUrl = state.history[newIndex];
      updateState({
        currentUrl: newUrl,
        historyIndex: newIndex
      });
      setUrlInput(newUrl);
    }
  };

  const goForward = () => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const newUrl = state.history[newIndex];
      updateState({
        currentUrl: newUrl,
        historyIndex: newIndex
      });
      setUrlInput(newUrl);
    }
  };

  const goHome = () => {
    navigateTo(state.homeUrl);
  };

  const refresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = state.currentUrl;
    }
  };

  // Mark current position
  const markCurrentPosition = () => {
    const label = window.prompt('Bu konum için bir etiket girin:', 'İşaretli Konum');
    if (label) {
      updateState({
        selectedPosition: {
          url: state.currentUrl,
          label,
          scrollY: 0,
          scrollX: 0
        }
      });
      toast({
        title: "Konum İşaretlendi",
        description: `"${label}" olarak kaydedildi.`
      });
    }
  };

  // Start from marked position
  const startFromSelected = () => {
    if (state.selectedPosition) {
      navigateTo(state.selectedPosition.url);
    }
  };

  // Handle URL input
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      navigateTo(urlInput.trim());
    }
  };

  // Copy URL
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(state.currentUrl);
    toast({
      title: "Kopyalandı",
      description: "URL panoya kopyalandı."
    });
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    
    // Save last position if enabled
    if (state.settings.rememberPosition) {
      updateState({
        lastPosition: {
          url: state.currentUrl,
          scrollY: 0,
          scrollX: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const sizeClasses = {
    small: 'h-64',
    medium: 'h-96',
    large: 'h-[500px]',
    fullscreen: 'h-screen'
  };

  const canGoBack = state.historyIndex > 0;
  const canGoForward = state.historyIndex < state.history.length - 1;

  return (
    <Card className={cn("overflow-hidden flex flex-col", className)}>
      {/* Toolbar */}
      {state.settings.showToolbar && (
        <CardHeader className="p-2 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={goBack}
                    disabled={!canGoBack}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Geri</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={goForward}
                    disabled={!canGoForward}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>İleri</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={refresh}
                  >
                    <RotateCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Yenile</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={goHome}
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ana Sayfa</TooltipContent>
              </Tooltip>
            </div>

            {/* URL Bar */}
            <form onSubmit={handleUrlSubmit} className="flex-1 mx-2">
              <div className="relative">
                <Globe className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="h-7 pl-7 pr-2 text-xs"
                  placeholder="URL girin..."
                  disabled={!isEditable || !state.settings.allowNavigation}
                />
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={markCurrentPosition}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Konumu İşaretle</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleCopyUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>URL'yi Kopyala</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={onOpenExternal}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Harici Olarak Aç</TooltipContent>
              </Tooltip>

              {/* Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Başlangıç Ayarları</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={state.settings.startOption === 'fresh'}
                    onCheckedChange={() => updateState({
                      settings: { ...state.settings, startOption: 'fresh' }
                    })}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Sıfırdan Başla
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={state.settings.startOption === 'selected'}
                    onCheckedChange={() => updateState({
                      settings: { ...state.settings, startOption: 'selected' }
                    })}
                    disabled={!state.selectedPosition}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    İşaretli Konumdan Başla
                    {state.selectedPosition && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {state.selectedPosition.label}
                      </Badge>
                    )}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={state.settings.startOption === 'last-position'}
                    onCheckedChange={() => updateState({
                      settings: { ...state.settings, startOption: 'last-position' }
                    })}
                    disabled={!state.lastPosition}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Son Konumdan Devam Et
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuCheckboxItem
                    checked={state.settings.rememberPosition}
                    onCheckedChange={(checked) => updateState({
                      settings: { ...state.settings, rememberPosition: checked }
                    })}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Konumu Hatırla
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuCheckboxItem
                    checked={state.settings.allowNavigation}
                    onCheckedChange={(checked) => updateState({
                      settings: { ...state.settings, allowNavigation: checked }
                    })}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Gezinmeye İzin Ver
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Selected Position Indicator */}
          {state.selectedPosition && (
            <div className="flex items-center gap-2 mt-1 px-1">
              <Badge variant="outline" className="text-[10px] h-5">
                <MapPin className="h-3 w-3 mr-1" />
                {state.selectedPosition.label}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] px-2"
                onClick={startFromSelected}
              >
                Buradan Başla
              </Button>
            </div>
          )}
        </CardHeader>
      )}

      {/* Browser Content */}
      <CardContent className={cn("p-0 relative flex-1", sizeClasses[size])}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="flex flex-col items-center gap-2">
              <RotateCcw className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Yükleniyor...</span>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={state.currentUrl}
          className="w-full h-full border-0"
          sandbox={state.settings.sandbox.join(' ')}
          onLoad={handleIframeLoad}
          onError={() => setIsLoading(false)}
          title={item.title || 'Browser'}
        />
      </CardContent>
    </Card>
  );
}

export default BrowserCardWidget;
