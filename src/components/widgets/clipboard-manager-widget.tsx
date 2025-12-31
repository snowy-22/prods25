'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Copy, Trash2, Clipboard } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
}

interface ClipboardManagerWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function ClipboardManagerWidget({ size = 'medium' }: ClipboardManagerWidgetProps) {
  const [clipboard, setClipboard] = useState<ClipboardItem[]>([]);
  const [maxItems] = useState(20);
  const { toast } = useToast();
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  // Load clipboard from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('clipboard-history');
    if (stored) {
      try {
        const items = JSON.parse(stored);
        setClipboard(items.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load clipboard history:', e);
      }
    }
  }, []);

  // Save to localStorage whenever clipboard changes
  useEffect(() => {
    localStorage.setItem('clipboard-history', JSON.stringify(clipboard));
  }, [clipboard]);

  const addToClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && !clipboard.some(item => item.content === text)) {
        const newItem: ClipboardItem = {
          id: Date.now().toString(),
          content: text,
          timestamp: new Date()
        };
        
        setClipboard(prev => {
          const updated = [newItem, ...prev];
          return updated.slice(0, maxItems);
        });
        
        toast({
          title: "Panoya eklendi",
          description: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        });
      }
    } catch (err) {
      toast({
        title: "Hata",
        description: "Panodan okuma izni yok",
        variant: "destructive"
      });
    }
  };

  const copyItem = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Kopyalandı",
      description: "Metin panoya kopyalandı"
    });
  };

  const deleteItem = (id: string) => {
    setClipboard(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setClipboard([]);
    toast({
      title: "Temizlendi",
      description: "Pano geçmişi temizlendi"
    });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dakika`;
    if (hours < 24) return `${hours} saat`;
    return `${days} gün`;
  };

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-card",
      isSmall && "p-1",
      !isSmall && !isLarge && "p-2",
      isLarge && "p-4"
    )}>
      <div className={cn(
        "border-b flex items-center justify-between",
        isSmall && "p-1 gap-1",
        !isSmall && !isLarge && "p-2 gap-2",
        isLarge && "p-3 gap-3"
      )}>
        <h3 className={cn(
          "font-semibold flex items-center gap-1",
          isSmall && "text-xs",
          !isSmall && !isLarge && "text-sm",
          isLarge && "text-base"
        )}>
          <Clipboard className={cn(isSmall && "h-3 w-3", !isSmall && !isLarge && "h-4 w-4", isLarge && "h-5 w-5")} />
          Pano ({clipboard.length})
        </h3>
        <div className={cn("flex gap-1", isSmall && "gap-0.5")}>
          <Button 
            size="sm" 
            variant="outline"
            onClick={addToClipboard}
            className={cn(isSmall && "h-6 px-1 text-xs", isLarge && "h-10")}
          >
            <Copy className={cn(isSmall && "h-3 w-3", !isSmall && !isLarge && "h-4 w-4", isLarge && "h-5 w-5")} />
          </Button>
          <Button 
            size="sm"
            variant="destructive"
            onClick={clearAll}
            className={cn(isSmall && "h-6 px-1 text-xs", isLarge && "h-10")}
          >
            <Trash2 className={cn(isSmall && "h-3 w-3", !isSmall && !isLarge && "h-4 w-4", isLarge && "h-5 w-5")} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className={cn(
          "space-y-1",
          isSmall && "p-1",
          !isSmall && !isLarge && "p-2",
          isLarge && "p-3 space-y-2"
        )}>
          {clipboard.length === 0 ? (
            <p className={cn(
              "text-muted-foreground text-center py-4",
              isSmall && "text-xs",
              !isSmall && !isLarge && "text-sm",
              isLarge && "text-base py-8"
            )}>
              Pano geçmişi boş
            </p>
          ) : (
            clipboard.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors",
                  isSmall && "p-1",
                  !isSmall && !isLarge && "p-2",
                  isLarge && "p-3"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "truncate font-mono break-all",
                    isSmall && "text-xs",
                    !isSmall && !isLarge && "text-sm",
                    isLarge && "text-base"
                  )}>
                    {item.content}
                  </p>
                  <p className={cn(
                    "text-muted-foreground truncate",
                    isSmall && "text-[10px]",
                    !isSmall && !isLarge && "text-xs",
                    isLarge && "text-sm"
                  )}>
                    {formatTime(item.timestamp)}
                  </p>
                </div>
                <div className={cn(
                  "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                  isSmall && "gap-0.5"
                )}>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyItem(item.content)}
                    className={cn(isSmall && "h-6 w-6", !isSmall && !isLarge && "h-7 w-7", isLarge && "h-9 w-9")}
                  >
                    <Copy className={cn(isSmall && "h-3 w-3", !isSmall && !isLarge && "h-4 w-4", isLarge && "h-5 w-5")} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteItem(item.id)}
                    className={cn(isSmall && "h-6 w-6", !isSmall && !isLarge && "h-7 w-7", isLarge && "h-9 w-9")}
                  >
                    <Trash2 className={cn(
                      "text-destructive",
                      isSmall && "h-3 w-3",
                      !isSmall && !isLarge && "h-4 w-4",
                      isLarge && "h-5 w-5"
                    )} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
