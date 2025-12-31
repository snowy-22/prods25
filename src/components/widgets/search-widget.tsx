"use client";

import React, { useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, Sparkles, Globe, ListMusic, Image as ImageIcon, Film, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

type SearchWidgetProps = {
  item: ContentItem;
  size?: 'small' | 'medium' | 'large';
};

export default function SearchWidget({ item, size = 'medium' }: SearchWidgetProps) {
  const [query, setQuery] = useState('');
  
  const examplePrompts = [
    { text: "Bana uygulamayı gezdir", icon: <Sparkles className="h-4 w-4" />, category: "Örnek" },
    { text: "En popüler 5 filmi listele", icon: <Globe className="h-4 w-4" />, category: "Örnek" },
    { text: "Yeni bir müzik listesi oluştur", icon: <ListMusic className="h-4 w-4" />, category: "Örnek" },
  ];

  const quickActions = [
    { icon: <ImageIcon className="h-4 w-4" />, label: "Görsel Ara", color: "text-blue-500" },
    { icon: <Film className="h-4 w-4" />, label: "Video Ara", color: "text-red-500" },
    { icon: <Folder className="h-4 w-4" />, label: "Dosya Ara", color: "text-yellow-500" },
  ];

  return (
    <Card className={cn(
      "flex flex-col bg-background/95 backdrop-blur-md border overflow-hidden",
      size === 'large' ? "p-6" : size === 'small' ? "p-2" : "p-4"
    )}>
      <div className={cn(
        "flex items-center gap-2 mb-4",
        size === 'small' && "mb-2"
      )}>
        <Search className={cn(
          "text-muted-foreground",
          size === 'large' ? "h-6 w-6" : size === 'small' ? "h-3 w-3" : "h-5 w-5"
        )} />
        <h3 className={cn(
          "font-semibold",
          size === 'large' ? "text-xl" : size === 'small' ? "text-xs" : "text-lg"
        )}>
          {item.title || 'Gelişmiş Arama'}
        </h3>
      </div>

      <div className={cn(
        "flex gap-2 mb-4",
        size === 'small' && "mb-2"
      )}>
        <Input
          placeholder="Bir şey ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "flex-1",
            size === 'small' && "h-7 text-xs"
          )}
        />
        <Button size={size === 'small' ? 'sm' : 'default'} className="gap-2">
          <Sparkles className={size === 'small' ? "h-3 w-3" : "h-4 w-4"} />
          {size !== 'small' && 'AI Ara'}
        </Button>
      </div>

      {item.content && (
        <p className={cn(
          "text-muted-foreground mb-4",
          size === 'large' ? "text-base" : size === 'small' ? "text-[10px]" : "text-sm"
        )}>
          {item.content}
        </p>
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {size === 'large' && (
            <>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                  Örnek Komutlar
                </h4>
                {examplePrompts.map((prompt) => (
                  <Button
                    key={prompt.text}
                    variant="ghost"
                    className="w-full justify-start h-9 text-sm"
                    onClick={() => setQuery(prompt.text)}
                  >
                    {prompt.icon} <span className="ml-2">{prompt.text}</span>
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className={cn(
                  "text-xs font-semibold text-muted-foreground uppercase",
                  size === 'small' && "text-[10px]"
                )}>
                  Hızlı Eylemler
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="flex-col gap-1 h-auto p-3 text-xs"
                    >
                      <div className={action.color}>{action.icon}</div>
                      <span className="font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
