'use client';

/**
 * Player Settings Panel - Bilgi ve Ayarlar Ayrımı
 * 
 * Task 5: Oynatıcı ayarlarını bilgi ve ayarlar olarak ayır
 * - Bilgi bölümü: Herkes görebilir
 * - Ayarlar bölümü: Sadece düzenleme izni olanlar
 */

import React, { useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Info, 
  Settings, 
  Lock, 
  Unlock,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  User,
  Folder,
  Tag,
  Star,
  MessageCircle,
  Share2,
  Heart,
  BarChart3,
  Palette,
  Layers,
  Frame,
  Type,
  Image as ImageIcon,
  Video,
  Music,
  Globe,
  ExternalLink,
  Copy,
  Download,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PlayerSettingsPanelProps {
  item: ContentItem;
  onUpdateItem: (id: string, updates: Partial<ContentItem>) => void;
  hasEditPermission: boolean;
  isOwner: boolean;
  className?: string;
}

export const PlayerSettingsPanel: React.FC<PlayerSettingsPanelProps> = ({
  item,
  onUpdateItem,
  hasEditPermission,
  isOwner,
  className
}) => {
  const [activeTab, setActiveTab] = useState('info');

  // Bilgi bölümü - herkes görebilir
  const InfoSection = () => (
    <div className="space-y-4 p-4">
      {/* Başlık ve Tür */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {getTypeIcon(item.type)}
          {item.title || 'Başlıksız'}
        </h3>
        <Badge variant="outline" className="text-xs">
          {getTypeLabel(item.type)}
        </Badge>
      </div>

      <Separator />

      {/* Tarih Bilgileri */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Oluşturulma:</span>
          <span className="text-foreground">
            {item.createdAt 
              ? formatDistanceToNow(new Date(item.createdAt), { locale: tr, addSuffix: true })
              : '-'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Güncelleme:</span>
          <span className="text-foreground">
            {item.updatedAt 
              ? formatDistanceToNow(new Date(item.updatedAt), { locale: tr, addSuffix: true })
              : '-'}
          </span>
        </div>
      </div>

      <Separator />

      {/* İstatistikler */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox 
          icon={<Eye className="h-4 w-4" />} 
          label="Görüntüleme" 
          value={item.viewCount || 0} 
        />
        <StatBox 
          icon={<Heart className="h-4 w-4" />} 
          label="Beğeni" 
          value={item.likeCount || 0} 
        />
        <StatBox 
          icon={<MessageCircle className="h-4 w-4" />} 
          label="Yorum" 
          value={item.commentCount || 0} 
        />
        <StatBox 
          icon={<Share2 className="h-4 w-4" />} 
          label="Kaydetme" 
          value={item.saveCount || 0} 
        />
      </div>

      <Separator />

      {/* Etiketler */}
      {item.tags && item.tags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Tag className="h-3 w-3" /> Etiketler
          </Label>
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Puan */}
      {(item.myRating || item.averageRating) && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Star className="h-3 w-3" /> Puan
          </Label>
          <div className="flex items-center gap-2">
            {item.myRating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{item.myRating}/5</span>
                <span className="text-xs text-muted-foreground">(sizin)</span>
              </div>
            )}
            {item.averageRating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-blue-400 text-blue-400" />
                <span className="font-medium">{item.averageRating.toFixed(1)}/5</span>
                <span className="text-xs text-muted-foreground">(ortalama)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Açıklama */}
      {item.content && typeof item.content === 'string' && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Açıklama</Label>
          <p className="text-sm text-foreground">{item.content}</p>
        </div>
      )}
    </div>
  );

  // Ayarlar bölümü - sadece düzenleme izni olanlar
  const SettingsSection = () => (
    <div className="space-y-4 p-4">
      {/* Başlık Düzenleme */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Başlık</Label>
        <Input 
          value={item.title || ''}
          onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
          placeholder="Başlık girin..."
        />
      </div>

      {/* Açıklama Düzenleme */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Açıklama</Label>
        <Textarea 
          value={typeof item.content === 'string' ? item.content : ''}
          onChange={(e) => onUpdateItem(item.id, { content: e.target.value })}
          placeholder="Açıklama ekleyin..."
          rows={3}
        />
      </div>

      <Separator />

      {/* Görünürlük Ayarları */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Eye className="h-3 w-3" /> Görünürlük
        </Label>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Herkese Açık</span>
          </div>
          <Switch 
            checked={item.isPublic ?? false}
            onCheckedChange={(checked) => onUpdateItem(item.id, { isPublic: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Sabitlenmiş</span>
          </div>
          <Switch 
            checked={item.isPinned ?? false}
            onCheckedChange={(checked) => onUpdateItem(item.id, { isPinned: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Gizli</span>
          </div>
          <Switch 
            checked={item.styles?.visibility === 'hidden'}
            onCheckedChange={(checked) => onUpdateItem(item.id, { 
              styles: { ...item.styles, visibility: checked ? 'hidden' : 'visible' } 
            })}
          />
        </div>
      </div>

      <Separator />

      {/* Stil Ayarları */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Palette className="h-3 w-3" /> Stil
        </Label>
        
        <div className="space-y-2">
          <Label className="text-xs">Saydamlık</Label>
          <Slider 
            value={[parseFloat(item.styles?.opacity as string || '1') * 100]}
            max={100}
            step={1}
            onValueChange={([v]) => onUpdateItem(item.id, { 
              styles: { ...item.styles, opacity: (v / 100).toString() } 
            })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Köşe Yuvarlaklığı</Label>
          <Slider 
            value={[parseInt(item.styles?.borderRadius as string || '8')]}
            max={24}
            step={1}
            onValueChange={([v]) => onUpdateItem(item.id, { 
              styles: { ...item.styles, borderRadius: `${v}px` } 
            })}
          />
        </div>
      </div>

      <Separator />

      {/* Tehlikeli İşlemler */}
      {isOwner && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-destructive flex items-center gap-1">
            <Trash2 className="h-3 w-3" /> Tehlikeli Bölge
          </Label>
          <Button variant="destructive" size="sm" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Kalıcı Olarak Sil
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("bg-background border rounded-lg shadow-lg overflow-hidden", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
          <TabsTrigger value="info" className="rounded-none">
            <Info className="h-4 w-4 mr-2" />
            Bilgi
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="rounded-none"
            disabled={!hasEditPermission}
          >
            <Settings className="h-4 w-4 mr-2" />
            Ayarlar
            {!hasEditPermission && <Lock className="h-3 w-3 ml-1 text-muted-foreground" />}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[400px]">
          <TabsContent value="info" className="m-0">
            <InfoSection />
          </TabsContent>
          
          <TabsContent value="settings" className="m-0">
            {hasEditPermission ? (
              <SettingsSection />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Düzenleme İzni Gerekli</h3>
                <p className="text-sm text-muted-foreground">
                  Bu içeriğin ayarlarını değiştirmek için düzenleme izniniz olması gerekiyor.
                </p>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

// Yardımcı bileşenler
const StatBox: React.FC<{ icon: React.ReactNode; label: string; value: number | string }> = ({ 
  icon, label, value 
}) => (
  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
    <div className="text-muted-foreground">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

const getTypeIcon = (type: ContentItem['type']) => {
  switch (type) {
    case 'video':
    case 'player':
      return <Video className="h-5 w-5 text-blue-500" />;
    case 'audio':
      return <Music className="h-5 w-5 text-purple-500" />;
    case 'image':
      return <ImageIcon className="h-5 w-5 text-green-500" />;
    case 'folder':
      return <Folder className="h-5 w-5 text-amber-500" />;
    case 'website':
      return <Globe className="h-5 w-5 text-cyan-500" />;
    default:
      return <Layers className="h-5 w-5 text-gray-500" />;
  }
};

const getTypeLabel = (type: ContentItem['type']) => {
  const labels: Record<string, string> = {
    video: 'Video',
    player: 'Oynatıcı',
    audio: 'Ses',
    image: 'Görsel',
    folder: 'Klasör',
    iframe: 'Web Sayfası',
    widget: 'Widget',
  };
  return labels[type] || type;
};

export default PlayerSettingsPanel;
