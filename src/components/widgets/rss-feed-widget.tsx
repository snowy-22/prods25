// src/components/widgets/rss-feed-widget.tsx

'use client';

import { Rss, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// This is a mock. In a real app, you'd use a backend or a CORS proxy to fetch and parse the RSS feed.
const mockFeed = {
    title: 'Teknoloji Haberleri',
    items: [
        { title: 'Yeni Nesil Yapay Zeka Modelleri Tanıtıldı', link: '#', pubDate: '2 saat önce', description: 'Yapay zeka dünyasında bugün büyük bir gün. Yeni modeller, önceki nesillere göre %40 daha verimli çalışıyor.' },
        { title: 'Kuantum Bilgisayarlarda Devrim Gibi Gelişme', link: '#', pubDate: '5 saat önce', description: 'Bilim insanları, kuantum bitlerinin kararlılığını on kat artıran yeni bir yöntem keşfetti.' },
        { title: 'Katlanabilir Ekranlı Telefonların Geleceği', link: '#', pubDate: 'dün', description: 'Pazar analistleri, 2026 yılına kadar her üç telefondan birinin katlanabilir olacağını öngörüyor.' },
        { title: 'Web 3.0 Nedir ve Hayatımızı Nasıl Değiştirecek?', link: '#', pubDate: '2 gün önce', description: 'Merkeziyetsiz internetin temelleri atılıyor. İşte bilmeniz gereken her şey.' },
    ]
}

export default function RssFeedWidget({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const [feedUrl, setFeedUrl] = useState('');
  const [feed, setFeed] = useState<any>(mockFeed);

  const handleFetchFeed = () => {
      // In a real app, you would fetch and parse feedUrl here
      alert(`Şu an için sadece örnek veriler gösterilmektedir. Gerçek veri çekme özelliği eklenecektir.`);
  }

  return (
    <div className="flex h-full w-full flex-col bg-card">
       {size !== 'small' && (
           <div className="p-2 border-b flex items-center gap-2">
                <Input 
                    placeholder="RSS akış URL'si..."
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    className="h-9"
                />
                <Button onClick={handleFetchFeed} size="icon" className="h-9 w-9 flex-shrink-0">
                    <Rss className="h-4 w-4" />
                </Button>
           </div>
       )}
       <ScrollArea className="flex-1">
            <div className={cn(
                "p-2 space-y-2",
                size === 'large' ? "p-6 space-y-4" : size === 'small' ? "p-1 space-y-1" : ""
            )}>
                <h3 className={cn(
                    "font-semibold px-1",
                    size === 'large' ? "text-xl mb-4" : "text-sm"
                )}>{feed.title}</h3>
                {feed.items.map((item: any) => (
                    <a key={item.link || item.title} href={item.link} target="_blank" rel="noopener noreferrer" className={cn(
                        "block p-2 rounded-md hover:bg-muted group transition-colors",
                        size === 'large' ? "p-4" : size === 'small' ? "p-1" : ""
                    )}>
                        <p className={cn(
                            "font-medium group-hover:text-primary",
                            size === 'large' ? "text-lg" : "text-sm truncate"
                        )}>{item.title}</p>
                        {size === 'large' && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                            </p>
                        )}
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-muted-foreground">{item.pubDate}</p>
                             <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </div>
                    </a>
                ))}
            </div>
       </ScrollArea>
    </div>
  );
}
