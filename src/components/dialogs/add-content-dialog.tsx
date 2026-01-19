"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { 
  Folder, 
  FolderPlus, 
  Link2, 
  LinkIcon, 
  Play, 
  Plus, 
  Share2, 
  Upload, 
  X,
  ExternalLink,
  Globe,
  FileVideo,
  FileAudio,
  Image as ImageIcon
} from "lucide-react";
import { ContentItem } from "@/lib/initial-content";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export type AddContentOption = 
  | 'add-here'           // Bu klasöre ekle
  | 'new-folder'         // Yeni klasör olarak ekle
  | 'share-link-here'    // Paylaşım linki olarak buraya ekle
  | 'share-link-folder'; // Paylaşım linki olarak yeni klasöre ekle

export interface AddContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  targetFolderId: string;
  onConfirm: (option: AddContentOption, urls: string[], newFolderName?: string) => void;
  singleUrl?: boolean;
}

// URL'den içerik tipini tespit et
function detectContentType(url: string): 'video' | 'audio' | 'image' | 'website' | 'unknown' {
  const lowerUrl = url.toLowerCase();
  
  // Video platformları
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') ||
      lowerUrl.includes('vimeo.com') || lowerUrl.includes('twitch.tv') ||
      lowerUrl.includes('dailymotion.com') || lowerUrl.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/)) {
    return 'video';
  }
  
  // Ses platformları
  if (lowerUrl.includes('spotify.com') || lowerUrl.includes('soundcloud.com') ||
      lowerUrl.includes('music.apple.com') || lowerUrl.match(/\.(mp3|wav|ogg|flac|aac)(\?|$)/)) {
    return 'audio';
  }
  
  // Görsel dosyaları
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/)) {
    return 'image';
  }
  
  // Web sitesi veya bilinmeyen
  if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
    return 'website';
  }
  
  return 'unknown';
}

// İkon seçici
function getContentIcon(type: ReturnType<typeof detectContentType>) {
  switch (type) {
    case 'video': return FileVideo;
    case 'audio': return FileAudio;
    case 'image': return ImageIcon;
    case 'website': return Globe;
    default: return ExternalLink;
  }
}

export function AddContentDialog({
  open,
  onOpenChange,
  urls,
  targetFolderId,
  onConfirm,
  singleUrl = false
}: AddContentDialogProps) {
  const [selectedOption, setSelectedOption] = React.useState<AddContentOption>('add-here');
  const [newFolderName, setNewFolderName] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const hasMultipleUrls = urls.length > 1;

  const handleConfirm = async () => {
    if ((selectedOption === 'new-folder' || selectedOption === 'share-link-folder') && !newFolderName.trim()) {
      toast({
        title: "Klasör adı gerekli",
        description: "Lütfen yeni klasör için bir ad girin.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirm(selectedOption, urls, newFolderName.trim() || undefined);
      onOpenChange(false);
      setSelectedOption('add-here');
      setNewFolderName('');
    } catch (error) {
      toast({
        title: "Hata",
        description: "İçerik eklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            İçerik Ekle
          </DialogTitle>
          <DialogDescription>
            {urls.length === 1 
              ? "URL'yi nasıl eklemek istiyorsunuz?" 
              : `${urls.length} URL'yi nasıl eklemek istiyorsunuz?`}
          </DialogDescription>
        </DialogHeader>

        {/* URL Önizleme */}
        <div className="space-y-2 max-h-40 overflow-y-auto bg-muted/50 rounded-lg p-3">
          {urls.slice(0, 5).map((url, index) => {
            const type = detectContentType(url);
            const Icon = getContentIcon(type);
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-foreground">{url}</span>
              </div>
            );
          })}
          {urls.length > 5 && (
            <div className="text-xs text-muted-foreground">
              +{urls.length - 5} daha fazla URL...
            </div>
          )}
        </div>

        {/* Seçenekler */}
        <RadioGroup
          value={selectedOption}
          onValueChange={(v) => setSelectedOption(v as AddContentOption)}
          className="space-y-3"
        >
          {/* Bu klasöre ekle */}
          <div className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
            selectedOption === 'add-here' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
          )}>
            <RadioGroupItem value="add-here" id="add-here" />
            <Label htmlFor="add-here" className="flex items-center gap-2 cursor-pointer flex-1">
              <Play className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">Bu klasöre ekle</div>
                <div className="text-xs text-muted-foreground">Oynatıcı olarak mevcut konuma ekle</div>
              </div>
            </Label>
          </div>

          {/* Yeni klasör olarak ekle */}
          <div className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
            selectedOption === 'new-folder' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
          )}>
            <RadioGroupItem value="new-folder" id="new-folder" />
            <Label htmlFor="new-folder" className="flex items-center gap-2 cursor-pointer flex-1">
              <FolderPlus className="h-4 w-4 text-blue-500" />
              <div>
                <div className="font-medium">Yeni klasör olarak ekle</div>
                <div className="text-xs text-muted-foreground">İçerikleri yeni bir klasörde grupla</div>
              </div>
            </Label>
          </div>

          {/* Paylaşım linki olarak buraya ekle */}
          <div className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
            selectedOption === 'share-link-here' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
          )}>
            <RadioGroupItem value="share-link-here" id="share-link-here" />
            <Label htmlFor="share-link-here" className="flex items-center gap-2 cursor-pointer flex-1">
              <Link2 className="h-4 w-4 text-green-500" />
              <div>
                <div className="font-medium">Paylaşım kartı olarak ekle</div>
                <div className="text-xs text-muted-foreground">Önizleme kartı ile buraya ekle</div>
              </div>
            </Label>
          </div>

          {/* Paylaşım linki olarak yeni klasöre ekle */}
          <div className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
            selectedOption === 'share-link-folder' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
          )}>
            <RadioGroupItem value="share-link-folder" id="share-link-folder" />
            <Label htmlFor="share-link-folder" className="flex items-center gap-2 cursor-pointer flex-1">
              <Share2 className="h-4 w-4 text-purple-500" />
              <div>
                <div className="font-medium">Paylaşım kartları klasörü oluştur</div>
                <div className="text-xs text-muted-foreground">Kartları yeni klasörde grupla</div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {/* Yeni klasör adı girişi */}
        {(selectedOption === 'new-folder' || selectedOption === 'share-link-folder') && (
          <div className="space-y-2">
            <Label htmlFor="folder-name">Klasör Adı</Label>
            <Input
              id="folder-name"
              placeholder="Yeni klasör adı..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? "Ekleniyor..." : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mini inline versiyon - tuval sağ tık için
export function AddContentMiniDialog({
  open,
  onClose,
  position,
  onAddPlayer,
  onAddFolder,
  onAddSharingCard,
  onAddBrowserCard
}: {
  open: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onAddPlayer: () => void;
  onAddFolder: () => void;
  onAddSharingCard: () => void;
  onAddBrowserCard: () => void;
}) {
  const [url, setUrl] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed z-50 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl p-3 min-w-[280px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Oynatıcı Ekle</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <Input
          ref={inputRef}
          placeholder="URL ekle..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url.trim()) {
              onAddPlayer();
              onClose();
            }
            if (e.key === 'Escape') {
              onClose();
            }
          }}
        />
        <Button size="sm" className="h-8" onClick={() => {
          if (url.trim()) onAddPlayer();
          onClose();
        }}>
          Ekle
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Button variant="ghost" size="sm" className="justify-start h-8 text-xs" onClick={() => { onAddPlayer(); onClose(); }}>
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Oynatıcı
        </Button>
        <Button variant="ghost" size="sm" className="justify-start h-8 text-xs" onClick={() => { onAddFolder(); onClose(); }}>
          <Folder className="h-3.5 w-3.5 mr-1.5" />
          Klasör
        </Button>
        <Button variant="ghost" size="sm" className="justify-start h-8 text-xs" onClick={() => { onAddSharingCard(); onClose(); }}>
          <Link2 className="h-3.5 w-3.5 mr-1.5" />
          Paylaşım Kartı
        </Button>
        <Button variant="ghost" size="sm" className="justify-start h-8 text-xs" onClick={() => { onAddBrowserCard(); onClose(); }}>
          <Globe className="h-3.5 w-3.5 mr-1.5" />
          Tarayıcı
        </Button>
      </div>
    </div>
  );
}
