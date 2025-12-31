
'use client';

import { ContentItem, ReadingStatus } from '@/lib/initial-content';
import Image from 'next/image';
import { Button } from '../ui/button';
import { BookOpen, Check, Clock, Bookmark } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

interface BookCardWidgetProps {
  item: ContentItem;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
}

export default function BookCardWidget({ item, onUpdateItem }: BookCardWidgetProps) {
  const { title, author_name, thumbnail_url, readingStatus = 'to-read' } = item;

  const handleStatusChange = (newStatus: ReadingStatus) => {
    onUpdateItem(item.id, { readingStatus: newStatus });
  };

  const statusInfo = {
    'to-read': { icon: <Bookmark className="h-4 w-4" />, text: 'Okunacak' },
    'reading': { icon: <BookOpen className="h-4 w-4" />, text: 'Okunuyor' },
    'read': { icon: <Check className="h-4 w-4" />, text: 'Okundu' },
  };

  const CurrentStatusIcon = statusInfo[readingStatus].icon;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-card">
      <div className="relative w-32 h-48 rounded-md overflow-hidden shadow-lg mb-4">
        {thumbnail_url ? (
          <Image src={thumbnail_url} alt={`Cover of ${title}`} layout="fill" objectFit="cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-center text-xs p-2">{title}</div>
        )}
      </div>
      <h3 className="font-bold text-center text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground text-center mb-3">{author_name}</p>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            {CurrentStatusIcon}
            <span className="ml-2">{statusInfo[readingStatus].text}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleStatusChange('to-read')}>
            <Bookmark className="mr-2 h-4 w-4" />
            Okunacak
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('reading')}>
            <BookOpen className="mr-2 h-4 w-4" />
            Okunuyor
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('read')}>
            <Check className="mr-2 h-4 w-4" />
            Okundu
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
