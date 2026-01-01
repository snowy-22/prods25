

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Copy, Code, FileJson, Link as LinkIcon, Twitter, Linkedin, Facebook, MessageSquare, Send, Globe, Users, Lock, KeyRound, Settings } from 'lucide-react';
import { ContentItem, SharingSettings } from '@/lib/initial-content';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { FaInstagram, FaWhatsapp, FaSnapchat } from 'react-icons/fa6';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';


interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItem | null;
  onUpdateItem: (itemId: string, updates: Partial<ContentItem>) => void;
}

const SocialPreviewCard = ({ item, description }: { item: ContentItem, description: string }) => {
    if (!item) return null;

    const domain = item.url ? new URL(item.url).hostname : 'tv25.app';

    return (
        <Card className="w-full overflow-hidden border">
            {item.thumbnail_url && (
                <div className="aspect-video relative w-full bg-muted">
                    <Image src={item.thumbnail_url} alt={item.title || 'Preview'} layout="fill" objectFit="cover" />
                </div>
            )}
            <div className="p-3 bg-card">
                <p className="text-xs text-muted-foreground uppercase">{domain}</p>
                <h4 className="font-semibold truncate">{item.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>
        </Card>
    )
}


export default function ShareDialog({ isOpen, onOpenChange, item, onUpdateItem }: ShareDialogProps) {
  const { toast } = useToast();
  const [jsonString, setJsonString] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [sharingSettings, setSharingSettings] = useState<SharingSettings>({
    isPublic: false,
    privacy: 'private',
    canShare: false,
    canCopy: false,
    canEdit: false,
    canBeSaved: false,
  });

  useEffect(() => {
    if (item && typeof window !== 'undefined') {
      setJsonString(JSON.stringify(item, null, 2));
      const url = new URL(window.location.href);
      url.pathname = `/shared/${item.id}`;
      const itemUrl = url.toString();
      setShareUrl(itemUrl);
      setEmbedCode(`<iframe src="${itemUrl}" width="800" height="600" frameborder="0" allowfullscreen></iframe>`);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(itemUrl)}&size=150x150`);
      setSharingSettings(item.sharing || { isPublic: false, privacy: 'private', canShare: false, canCopy: false });
      setEditableDescription(item.content || item.title || '');
    } else {
      setJsonString('');
      setShareUrl('');
      setEmbedCode('');
      setQrCodeUrl('');
      setEditableDescription('');
    }
  }, [item]);

  const handleUpdateSettings = (updates: Partial<SharingSettings>) => {
    if(!item) return;
    const newSettings = { ...sharingSettings, ...updates };
    setSharingSettings(newSettings);
    onUpdateItem(item.id, { sharing: newSettings });
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: `${type} Kopyalandı!`,
        description: `Kod panoya başarıyla kopyalandı.`,
    });
  }
  
  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'instagram' | 'snapchat') => {
      const text = encodeURIComponent(editableDescription);
      const url = encodeURIComponent(shareUrl);
      let shareLink = '';

      switch(platform) {
          case 'twitter':
              shareLink = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
              break;
          case 'facebook':
              shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
              break;
          case 'linkedin':
              shareLink = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
              break;
          case 'whatsapp':
              shareLink = `https://api.whatsapp.com/send?text=${text}%20${url}`;
              break;
          case 'instagram':
              toast({ title: 'Instagram\'da Paylaş', description: 'Bu özelliği mobil cihazınızda kullanın.' });
              return;
           case 'snapchat':
              shareLink = `https://www.snapchat.com/scan?attachmentUrl=${url}&scanFrom=BUTTON`;
              break;
      }
      window.open(shareLink, '_blank', 'noopener,noreferrer');
  }

  const handlePublish = () => {
    if (!item) return;
    const newIsPublic = !item.isPublic;
    onUpdateItem(item.id, { isPublic: newIsPublic, sharing: { ...sharingSettings, isPublic: newIsPublic, privacy: newIsPublic ? 'public' : 'private' } });
    toast({
        title: !newIsPublic ? 'Yayın Kaldırıldı' : 'Ağda Yayınlandı!',
        description: `"${item.title}" artık ${!newIsPublic ? 'özel' : 'herkese açık keşfette'}.`
    });
  }

  const isUserFolder = item?.id === 'welcome-folder';
  const itemTitle = item?.title || 'İçerik';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal>
      <DialogContent className="sm:max-w-2xl z-[100]">
        <DialogHeader>
          <DialogTitle>Paylaş: {itemTitle}</DialogTitle>
          <DialogDescription>
            Bu içeriği dışa aktarın, gömün veya başkalarıyla paylaşın.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="share" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="share"><LinkIcon className="mr-2 h-4 w-4"/>Paylaş</TabsTrigger>
                <TabsTrigger value="embed"><Code className="mr-2 h-4 w-4"/>Göm</TabsTrigger>
                <TabsTrigger value="json"><FileJson className="mr-2 h-4 w-4"/>JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="share" className="mt-6">
                 <div className="space-y-6">
                    {item && <SocialPreviewCard item={item} description={editableDescription} />}
                     <div className="space-y-2">
                        <Label htmlFor="share-description">Paylaşım Metni</Label>
                        <Textarea 
                            id="share-description"
                            value={editableDescription}
                            onChange={(e) => setEditableDescription(e.target.value)}
                            placeholder="Paylaşım için bir açıklama yazın..."
                            rows={3}
                        />
                    </div>
                    <div className='flex gap-4'>
                        <div className='w-40 h-40 flex-shrink-0'>
                            {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={160} height={160} className='rounded-lg' />}
                        </div>
                        <div className='flex flex-col gap-4 flex-grow'>
                            {!isUserFolder && (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={handlePublish} className="w-full">
                                    <Globe className="mr-2 h-4 w-4" />
                                    {item?.isPublic ? 'Yayından Kaldır' : 'Ağda Yayınla'}
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Gizlilik Ayarları</h4>
                                                <p className="text-sm text-muted-foreground">Bu içeriği kimlerin görebileceğini seçin.</p>
                                            </div>
                                            <RadioGroup value={sharingSettings.privacy} onValueChange={(value) => handleUpdateSettings({ privacy: value as SharingSettings['privacy'] })}>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="public" id="public" />
                                                    <Label htmlFor="public" className='flex items-center gap-2'><Globe className='h-4 w-4'/> Herkese Açık</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="invited" id="invited" />
                                                    <Label htmlFor="invited" className='flex items-center gap-2'><Users className='h-4 w-4'/> Sadece Davetliler</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="password" id="password" />
                                                    <Label htmlFor="password" className='flex items-center gap-2'><KeyRound className='h-4 w-4'/> Şifre Korumalı</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="private" id="private" />
                                                    <Label htmlFor="private" className='flex items-center gap-2'><Lock className='h-4 w-4'/> Kapalı (Sadece Ben)</Label>
                                                </div>
                                            </RadioGroup>
                                            <Separator />
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">İzinler</h4>
                                                <p className="text-sm text-muted-foreground">Görüntüleyenlerin neler yapabileceğini seçin.</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="can-edit" className="flex flex-col gap-1 pr-4">
                                                    <span>Düzenlenebilir</span>
                                                    <span className="text-xs font-normal text-muted-foreground">Başkaları bu listeyi düzenleyebilir.</span>
                                                </Label>
                                                <Switch id="can-edit" checked={sharingSettings.canEdit} onCheckedChange={(checked) => handleUpdateSettings({ canEdit: checked })} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="can-copy" className="flex flex-col gap-1 pr-4">
                                                    <span>Kopyalanabilir</span>
                                                    <span className="text-xs font-normal text-muted-foreground">Başkaları bu listeyi kendi kitaplığına kopyalayabilir.</span>
                                                </Label>
                                                <Switch id="can-copy" checked={sharingSettings.canCopy} onCheckedChange={(checked) => handleUpdateSettings({ canCopy: checked })} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="can-be-saved" className="flex flex-col gap-1 pr-4">
                                                    <span>Kaydedilebilir</span>
                                                    <span className="text-xs font-normal text-muted-foreground">Başkaları bu listeyi kendi koleksiyonlarına kaydedebilir.</span>
                                                </Label>
                                                <Switch id="can-be-saved" checked={sharingSettings.canBeSaved} onCheckedChange={(checked) => handleUpdateSettings({ canBeSaved: checked })} />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            )}
                            <div className='flex items-center gap-2'>
                            <Input value={shareUrl} readOnly />
                            <Button size="icon" onClick={() => copyToClipboard(shareUrl, 'URL')}><Copy className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Sosyal Medyada Paylaş</h4>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleSocialShare('twitter')}><Twitter className="h-5 w-5 text-[#1DA1F2]"/></Button>
                            <Button variant="outline" size="icon" onClick={() => handleSocialShare('facebook')}><Facebook className="h-5 w-5 text-[#1877F2]"/></Button>
                            <Button variant="outline" size="icon" onClick={() => handleSocialShare('linkedin')}><Linkedin className="h-5 w-5 text-[#0A66C2]"/></Button>
                            <Button variant="outline" size="icon" onClick={() => handleSocialShare('whatsapp')}><FaWhatsapp className="h-5 w-5 text-[#25D366]"/></Button>
                            <Button variant="outline" size="icon" onClick={() => handleSocialShare('instagram')}><FaInstagram className="h-5 w-5" style={{ color: '#E4405F' }}/></Button>
                            <Button variant="outline" size="icon" onClick={() => handleSocialShare('snapchat')}><FaSnapchat className="h-5 w-5 text-[#FFFC00]"/></Button>
                        </div>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="embed" className="mt-6 space-y-4">
                 <Label htmlFor="embed-code">HTML Gömme Kodu</Label>
                 <div className="relative">
                    <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto max-h-40">
                        <code>{embedCode}</code>
                    </pre>
                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8" onClick={() => copyToClipboard(embedCode, 'Gömme Kodu')}>
                        <Copy className='h-4 w-4'/>
                    </Button>
                </div>
            </TabsContent>
            <TabsContent value="json" className="mt-6 space-y-4">
                <Label htmlFor="json-code">JSON Verisi</Label>
                <div className="relative">
                    <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto max-h-60">
                        <code>{jsonString}</code>
                    </pre>
                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8" onClick={() => copyToClipboard(jsonString, 'JSON')}>
                        <Copy className='h-4 w-4'/>
                    </Button>
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
