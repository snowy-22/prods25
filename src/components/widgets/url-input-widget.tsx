// src/components/widgets/url-input-widget.tsx
'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Link as LinkIcon, Play, Plus, FolderPlus } from 'lucide-react';
import { ItemType, ContentItem } from '@/lib/initial-content';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import * as RadixToggleGroup from '@radix-ui/react-toggle-group';


interface UrlInputWidgetProps {
  parentId: string | null;
  activeView?: ContentItem | null;
  onAddItem: (itemData: any, parentId: string | null, index?: number) => Promise<any>;
  onAddFolderWithItems: (folderName: string, items: { type: ItemType; url: string }[], parentId: string | null) => void;
}

export default function UrlInputWidget({ onAddItem, onAddFolderWithItems, parentId, activeView }: UrlInputWidgetProps) {
  const [urls, setUrls] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showStreamConfirm, setShowStreamConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  const [itemType, setItemType] = useState<'website' | 'video'>('website');
  const { toast } = useToast();

  const handleAdd = () => {
    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);
    if (urlList.length === 0) return;

    if (urlList.length > 1) {
        setShowBulkConfirm(true);
    } else {
        processSingleUrl(urlList[0], itemType);
    }
  };

  const processSingleUrl = (url: string, type: 'website' | 'video') => {
    if (type === 'video') {
        const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
        const isTwitch = url.includes('twitch.tv');
        if (isYoutube || isTwitch) {
            setPendingUrl(url);
            setShowStreamConfirm(true);
            return;
        }
    }
    // For website type or non-special video URLs
    onAddItem({ type, url }, parentId);
    toast({ title: 'Öğe Eklendi', description: `1 yeni ${type === 'video' ? 'oynatıcı' : 'kart'} eklendi.` });
    setUrls('');
  }
  
  const handleBulkConfirm = async (asFolder: boolean) => {
    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);
    if (process.env.NODE_ENV === 'development') {
      console.log(`Bulk adding ${urlList.length} URLs, asFolder: ${asFolder}`);
    }
    
    if (asFolder) {
        const folderName = prompt("Yeni klasör için bir isim girin:", "Toplu Eklenenler");
        if (folderName) {
            const itemsToAdd = urlList.map(url => ({ type: itemType, url }));
            await onAddFolderWithItems(folderName, itemsToAdd, parentId);
            toast({ title: 'Klasör Oluşturuldu', description: `${urlList.length} adet yeni öğe "${folderName}" klasörüne eklendi.` });
        }
    } else {
        // Process each URL individually with metadata fetching
        for (let i = 0; i < urlList.length; i++) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Processing URL ${i + 1}/${urlList.length}: ${urlList[i]}`);
            }
            await onAddItem({ type: itemType, url: urlList[i] }, parentId);
        }
        toast({ title: 'Öğeler Eklendi', description: `${urlList.length} adet yeni öğe eklendi.` });
    }

    setUrls('');
    setShowBulkConfirm(false);
  }

  const handleStreamConfirm = (choice: 'stream' | 'chat') => {
    let finalUrl = pendingUrl;
    if (choice === 'chat') {
        try {
            if (pendingUrl.includes('youtube.com/watch?v=')) {
                const videoId = new URL(pendingUrl).searchParams.get('v');
                finalUrl = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`;
            } else if (pendingUrl.includes('twitch.tv/')) {
                const channel = new URL(pendingUrl).pathname.split('/').filter(Boolean).pop();
                finalUrl = `https://www.twitch.tv/embed/${channel}/chat?parent=${window.location.hostname}`;
            }
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.error("URL parsing error for chat embed:", e);
            }
            toast({ variant: 'destructive', title: 'Hata', description: 'Canlı sohbet URL\'si oluşturulamadı.' });
            setShowStreamConfirm(false);
            return;
        }
    }
    onAddItem({ type: 'video', url: finalUrl, title: choice === 'chat' ? 'Sohbet' : undefined }, parentId);
    toast({ title: 'Öğe Eklendi', description: `Yeni bir ${choice === 'chat' ? 'sohbet' : 'yayın'} oynatıcısı eklendi.` });
    
    setShowStreamConfirm(false);
    setPendingUrl('');
    setUrls('');
  }

  return (
    <div className="w-full">
      <div className="flex w-full items-start gap-2">
        <Textarea
          placeholder="Her satıra bir URL yapıştırın..."
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex flex-col gap-2">
           <RadixToggleGroup.Root
                type="single"
                value={itemType}
                onValueChange={(value: 'website' | 'video') => {
                    if (value) setItemType(value);
                }}
                className="flex gap-0 border rounded-md overflow-hidden"
            >
                <ToggleGroupItem value="website" aria-label="Add as Link" className="rounded-none data-[state=on]:bg-primary/20">
                    <LinkIcon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="video" aria-label="Add as Player" className="rounded-none data-[state=on]:bg-primary/20">
                    <Play className="h-4 w-4" />
                </ToggleGroupItem>
           </RadixToggleGroup.Root>
            <Button size="icon" onClick={handleAdd} className="h-full flex-1">
              <Plus className="h-5 w-5" />
            </Button>
        </div>
      </div>

        <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Toplu Ekleme Onayı</AlertDialogTitle>
                    <AlertDialogDescription>
                        {urls.split('\n').map(u => u.trim()).filter(u => u).length} adet yeni öğe eklemek üzeresiniz. Bu öğeleri nasıl eklemek istersiniz?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-start gap-2">
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleBulkConfirm(false)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {activeView?.type === 'list' ? 'Bu Listeye Ekle' : activeView?.type === 'folder' ? 'Bu Klasöre Ekle' : 'Toplu Ekle'}
                    </AlertDialogAction>
                    <AlertDialogAction onClick={() => handleBulkConfirm(true)}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Yeni Klasör Oluştur
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

       <AlertDialog open={showStreamConfirm} onOpenChange={setShowStreamConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Gömme Türünü Seçin</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu içeriğin yayınını mı yoksa sadece canlı sohbetini mi eklemek istersiniz?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => handleStreamConfirm('stream')}>Yayın</AlertDialogAction>
                    <AlertDialogAction onClick={() => handleStreamConfirm('chat')}>Sohbet</AlertDialogAction>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
