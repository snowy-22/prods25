'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, UploadCloud, TestTube2, Save, Settings, History, Trash2, Gamepad2, Home, Music, Users, ExternalLink, Keyboard, FolderSync, RotateCcw, Trash, Bell, MessageSquare, Heart, Search, ThumbsUp, GitBranch, Lightbulb } from 'lucide-react';
import { Input } from './ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { ContentItem } from '@/lib/initial-content';
import { getIconByName } from '@/lib/icons';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from './ui/label';
import { Switch } from './ui/switch';


interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClearHistory: () => void;
  initialTab?: 'integrations' | 'history' | 'shortcuts' | 'trash' | 'notifications';
  allItems: ContentItem[];
  onRestoreItem: (item: ContentItem) => void;
  onPermanentlyDeleteItem: (item: ContentItem) => void;
  onEmptyTrash: () => void;
  sessionId: string;
  onResetData?: () => void;
}

type ShortcutAction = 'toggleUI' | 'toggleFullscreen' | 'openSearch' | 'openSettings' | 'openShortcuts';

type Shortcut = {
  action: ShortcutAction;
  name: string;
  defaultShortcut: string;
  customShortcut?: string;
};

const initialShortcuts: Shortcut[] = [
  { action: 'toggleUI', name: 'Arayüzü Gizle/Göster', defaultShortcut: 'Ctrl + H' },
  { action: 'toggleFullscreen', name: 'Tam Ekran', defaultShortcut: 'F11' },
  { action: 'openSearch', name: 'Arama Penceresini Aç', defaultShortcut: 'Ctrl + K' },
  { action: 'openSettings', name: 'Ayarları Aç', defaultShortcut: 'Ctrl + ,' },
  { action: 'openShortcuts', name: 'Kısayolları Görüntüle', defaultShortcut: 'Ctrl + Shift + -' },
];


const ServiceTab = ({ serviceName, serviceIcon, serviceDescription, children }: { serviceName: string, serviceIcon: React.ReactNode, serviceDescription: string, children: React.ReactNode }) => {
    return (
        <div className='p-4 rounded-lg'>
            <div className='flex items-start gap-4 mb-4'>
                {serviceIcon}
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold'>{serviceName} Entegrasyonu</h3>
                  <p className='text-sm text-muted-foreground'>{serviceDescription}</p>
                </div>
            </div>
            {children}
        </div>
    )
}

const ApiKeyForm = ({ fields }: { fields: {id: string, label: string, placeholder: string, helpUrl?: string}[]}) => {
    const { toast } = useToast();
    const handleSave = () => {
        toast({
            title: `Anahtarlar Kaydedildi`,
            description: "API anahtarlarınız yerel olarak kaydedildi.",
        });
    }

    return (
        <div className='space-y-4'>
            {fields.map(field => (
                <div key={field.id} className='space-y-2'>
                    <label htmlFor={field.id} className='text-sm font-medium'>{field.label}</label>
                    <Input id={field.id} placeholder={field.placeholder}/>
                    {field.helpUrl && (
                        <a href={field.helpUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                            API Anahtarını nasıl alacağınızı öğrenin <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                </div>
            ))}
            <div className='flex justify-end gap-2 pt-4'>
                <Button variant="outline">
                    <TestTube2 className='mr-2 h-4 w-4' />
                    Bağlantıyı Test Et
                </Button>
                <Button onClick={handleSave}>
                    <Save className='mr-2 h-4 w-4' />
                    Kaydet
                </Button>
            </div>
        </div>
    );
};


export default function SettingsDialog({ 
    isOpen, 
    onOpenChange, 
    onClearHistory, 
    initialTab = 'integrations',
    allItems,
    onRestoreItem,
    onPermanentlyDeleteItem,
    onEmptyTrash,
    sessionId,
    onResetData,
}: SettingsDialogProps) {
  const { toast } = useToast();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [editingShortcut, setEditingShortcut] = useState<ShortcutAction | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const savedShortcuts = localStorage.getItem('canvas_shortcuts');
    if (savedShortcuts) {
      setShortcuts(JSON.parse(savedShortcuts));
    } else {
      setShortcuts(initialShortcuts);
    }
  }, []);

  const handleSetShortcut = (action: ShortcutAction, keys: string[]) => {
    const shortcutString = keys.join(' + ');
    const updatedShortcuts = shortcuts.map(sc =>
      sc.action === action ? { ...sc, customShortcut: shortcutString } : sc
    );
    setShortcuts(updatedShortcuts);
    localStorage.setItem('canvas_shortcuts', JSON.stringify(updatedShortcuts));
    setEditingShortcut(null);
    setPopoverOpen(false);
  };
  
  const handleKeyDown = (event: KeyboardEvent) => {
    event.preventDefault();
    const keys: string[] = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        keys.push(event.key.toUpperCase());
    }
    if (editingShortcut && keys.length > 1) {
        handleSetShortcut(editingShortcut, keys);
    }
  };

  useEffect(() => {
    if (popoverOpen) {
      window.addEventListener('keydown', handleKeyDown as any);
    } else {
      window.removeEventListener('keydown', handleKeyDown as any);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [popoverOpen, editingShortcut]);
  
  const startEditing = (action: ShortcutAction) => {
    setEditingShortcut(action);
    setPopoverOpen(true);
  };

  const handleResetShortcut = (action: ShortcutAction) => {
     const updatedShortcuts = shortcuts.map(sc =>
      sc.action === action ? { ...sc, customShortcut: undefined } : sc
    );
    setShortcuts(updatedShortcuts);
    localStorage.setItem('canvas_shortcuts', JSON.stringify(updatedShortcuts));
  }


  const handleClearHistory = () => {
      onClearHistory();
      toast({
          title: "Geçmiş Temizlendi",
          description: "Görüntüleme geçmişiniz başarıyla silindi.",
      });
  }
  
  const trashFolder = allItems.find(item => item.id === 'trash-folder');
  const deletedItems = trashFolder?.children || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings /> Ayarlar
            </DialogTitle>
            <DialogDescription>
              Uygulama ayarlarını, entegrasyonları ve geçmiş verilerini yönetin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0">
            <Tabs defaultValue={initialTab} orientation="vertical" className="h-full flex">
              <TabsList className="flex flex-col h-full justify-start">
                  <TabsTrigger value="general">Genel</TabsTrigger>
                  <TabsTrigger value="integrations">Entegrasyonlar</TabsTrigger>
                  <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
                  <TabsTrigger value="history">Geçmiş</TabsTrigger>
                  <TabsTrigger value="shortcuts">Kısayollar</TabsTrigger>
                  <TabsTrigger value="trash">Çöp Kutusu</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="h-full mt-0 flex-1">
                  <ScrollArea className="h-full">
                      <div className="p-4 space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Veri Yönetimi</h3>
                          <p className="text-sm text-muted-foreground">Uygulama verilerini ve yerel depolamayı yönetin.</p>
                          
                          <div className="p-4 border rounded-lg bg-destructive/5 border-destructive/20 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-destructive">Tüm Verileri Sıfırla</h4>
                                <p className="text-sm text-muted-foreground">Tüm yerel verileri siler ve varsayılan içeriği yükler. Bu işlem geri alınamaz.</p>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Sıfırla
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bu işlem tüm yerel verilerinizi silecek ve uygulamayı varsayılan durumuna döndürecektir.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={onResetData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Evet, Sıfırla
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                  </ScrollArea>
              </TabsContent>
              <TabsContent value="integrations" className="h-full mt-0 flex-1">
                  <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                           <ServiceTab serviceName="Google Calendar" serviceIcon={<FolderSync className="text-blue-500" />} serviceDescription="Google Takviminizi tuvalinize ekleyin ve etkinliklerinizi senkronize edin.">
                              <ApiKeyForm fields={[
                                  { id: 'google-cal-api-key', label: 'Google Calendar API Anahtarı', placeholder: 'API Anahtarınızı buraya yapıştırın...' },
                                  { id: 'google-cal-client-id', label: 'Google Cloud Client ID', placeholder: 'Client ID\'nizi buraya yapıştırın...' },
                              ]} />
                          </ServiceTab>
                          <Separator />
                          <ServiceTab serviceName="Google Drive" serviceIcon={<FolderSync className="text-blue-500" />} serviceDescription="Google Drive'dan dosya ve klasörlerinizi canlı olarak tuvalinize ekleyin ve senkronize edin.">
                              <ApiKeyForm fields={[
                                  { id: 'google-drive-api-key', label: 'Google Drive API Anahtarı', placeholder: 'API Anahtarınızı buraya yapıştırın...' },
                                  { id: 'google-client-id', label: 'Google Cloud Client ID', placeholder: 'Client ID\'nizi buraya yapıştırın...' },
                              ]} />
                        </ServiceTab>
                        <Separator />
                          <ServiceTab serviceName="Microsoft OneDrive" serviceIcon={<FolderSync className="text-sky-600" />} serviceDescription="OneDrive dosyalarınıza erişin ve tuvalinize ekleyin.">
                              <ApiKeyForm fields={[
                                  { id: 'onedrive-client-id', label: 'Microsoft Application (client) ID', placeholder: 'Client ID\'nizi buraya yapıştırın...' },
                              ]} />
                        </ServiceTab>
                        <Separator />
                          <ServiceTab serviceName="Dropbox" serviceIcon={<FolderSync className="text-blue-600" />} serviceDescription="Dropbox hesabınızdaki dosyaları ve klasörleri bağlayın.">
                              <ApiKeyForm fields={[
                                  { id: 'dropbox-app-key', label: 'Dropbox App Key', placeholder: 'Uygulama Anahtarınızı buraya yapıştırın...' },
                              ]} />
                        </ServiceTab>
                        <Separator />
                          <ServiceTab serviceName="Apple iCloud" serviceIcon={<FolderSync className="text-gray-500" />} serviceDescription="iCloud Drive dosyalarınıza erişin (ileri düzey kurulum gerektirir).">
                              <ApiKeyForm fields={[
                                  { id: 'icloud-api-token', label: 'iCloud API Token', placeholder: 'API Token\'ınızı buraya yapıştırın...' },
                              ]} />
                        </ServiceTab>
                        <Separator />
                        <ServiceTab serviceName="Steam" serviceIcon={<Gamepad2 />} serviceDescription="Steam profilinizi, oyun kitaplığınızı, galerilerinizi ve ödüllerinizi entegre edin.">
                              <ApiKeyForm fields={[
                                  { id: 'steam-api-key', label: 'Steam Web API Anahtarı', placeholder: 'API Anahtarınızı buraya yapıştırın...', helpUrl: 'https://steamcommunity.com/dev/apikey' },
                                  { id: 'steam-id', label: 'Steam ID', placeholder: 'Sayısal Steam ID veya profil URL adresiniz' }
                              ]} />
                        </ServiceTab>
                        <Separator />
                        <ServiceTab serviceName="Xbox" serviceIcon={<Gamepad2 />} serviceDescription="Xbox profilinizi, oyunlarınızı, başarılarınızı ve ekran görüntülerinizi entegre edin.">
                              <ApiKeyForm fields={[
                                  { id: 'xbox-api-key', label: 'Xbox Live API Anahtarı', placeholder: 'API Anahtarınızı buraya yapıştırın...', helpUrl: 'https://xbl.io' },
                                  { id: 'xbox-gamertag', label: 'Xbox Gamertag', placeholder: 'Xbox oyuncu etiketiniz' }
                              ]} />
                        </ServiceTab>
                        <Separator />
                        <ServiceTab serviceName="Philips Hue" serviceIcon={<Lightbulb className="text-yellow-400"/>} serviceDescription="Philips Hue ışıklarınızı ve sahnelerinizi yönetin.">
                              <ApiKeyForm fields={[
                                  { id: 'hue-bridge-ip', label: 'Hue Bridge IP Adresi', placeholder: 'Örn: 192.168.1.10' },
                                  { id: 'hue-username', label: 'Yetkilendirilmiş Kullanıcı Adı (appkey)', placeholder: 'Bridge tarafından oluşturulan anahtar' },
                              ]} />
                          </ServiceTab>
                          <Separator />
                        <ServiceTab serviceName="Google Home" serviceIcon={<Home />} serviceDescription="Google Home cihazlarınızı ve rutinlerinizi yönetin.">
                              <ApiKeyForm fields={[
                                  { id: 'google-client-id-home', label: 'Google Cloud Client ID', placeholder: 'Client ID' },
                                  { id: 'google-client-secret-home', label: 'Google Cloud Client Secret', placeholder: 'Client Secret' },
                              ]} />
                        </ServiceTab>
                        <Separator />
                          <ServiceTab serviceName="Apple HomeKit" serviceIcon={<Home />} serviceDescription="Apple HomeKit cihazlarınızı kontrol edin ve otomasyonlar oluşturun.">
                              <ApiKeyForm fields={[
                                  { id: 'homekit-setup-code', label: 'HomeKit Kurulum Kodu', placeholder: 'XXX-XX-XXX formatında kurulum kodu' },
                              ]} />
                          </ServiceTab>
                          <Separator />
                          <ServiceTab serviceName="LG ThinQ" serviceIcon={<Home />} serviceDescription="LG akıllı ev aletlerinizi kontrol edin.">
                              <ApiKeyForm fields={[
                                  { id: 'lg-api-key', label: 'LG Developer API Anahtarı', placeholder: 'API Anahtarınızı girin' },
                              ]} />
                          </ServiceTab>
                          <Separator />
                          <ServiceTab serviceName="Tuya Smart" serviceIcon={<Home />} serviceDescription="Tuya tabanlı akıllı cihazlarınızı yönetin.">
                              <ApiKeyForm fields={[
                                  { id: 'tuya-access-id', label: 'Tuya Access ID', placeholder: 'Access ID' },
                                  { id: 'tuya-access-key', label: 'Tuya Access Key', placeholder: 'Access Key' },
                                  { id: 'tuya-user-id', label: 'Uygulama Kullanıcı ID', placeholder: 'Tuya uygulamasındaki kullanıcı ID\'niz' },
                              ]} />
                          </ServiceTab>
                          <Separator />
                          <ServiceTab serviceName="IFTTT" serviceIcon={<Home />} serviceDescription="IFTTT applet'larınızı tetikleyin ve yönetin.">
                              <ApiKeyForm fields={[
                                  { id: 'ifttt-webhook-key', label: 'Webhook Anahtarı', placeholder: 'IFTTT Webhooks servis anahtarınız' },
                              ]} />
                          </ServiceTab>
                          <Separator />
                        <ServiceTab serviceName="Apple Music" serviceIcon={<Music />} serviceDescription="Apple Music çalma listelerinizi, şarkılarınızı ve albümlerinizi entegre edin.">
                              <ApiKeyForm fields={[
                                  { id: 'apple-music-dev-token', label: 'Developer Token', placeholder: 'Apple Developer Token' },
                              ]} />
                        </ServiceTab>
                        <Separator />
                        <ServiceTab serviceName="Spotify" serviceIcon={<Music />} serviceDescription="Spotify çalma listelerinizi, kayıtlı şarkılarınızı ve podcast'lerinizi bağlayın.">
                              <ApiKeyForm fields={[
                                  { id: 'spotify-client-id', label: 'Client ID', placeholder: 'Spotify Client ID' },
                                  { id: 'spotify-client-secret', label: 'Client Secret', placeholder: 'Spotify Client Secret' },
                              ]} />
                        </ServiceTab>
                        <Separator />
                         <ServiceTab serviceName="YouTube" serviceIcon={<Music />} serviceDescription="YouTube aboneliklerinizi, listelerinizi ve videolara erişimi entegre edin.">
                              <ApiKeyForm fields={[
                                  { id: 'youtube-api-key', label: 'YouTube Data API Anahtarı', placeholder: 'API Anahtarınızı girin', helpUrl: 'https://developers.google.com/youtube/v3/getting-started' },
                              ]} />
                        </ServiceTab>
                        <Separator />
                        <ServiceTab serviceName="Meta" serviceIcon={<Users />} serviceDescription="Facebook ve Instagram içeriklerinizi ve sosyal grafiklerinizi bağlayın.">
                              <ApiKeyForm fields={[
                                  { id: 'meta-app-id', label: 'Uygulama ID', placeholder: 'Meta Uygulama ID\'niz' },
                                  { id: 'meta-app-secret', label: 'Uygulama Gizli Anahtarı', placeholder: 'Meta Uygulama Gizli Anahtarınız' },
                              ]} />
                        </ServiceTab>
                      </div>
                  </ScrollArea>
              </TabsContent>
              <TabsContent value="notifications" className="h-full mt-0 p-2 space-y-4">
                  <div className='flex items-center gap-3 mb-4'>
                      <Bell />
                      <h3 className='text-lg font-semibold'>Bildirim Ayarları</h3>
                  </div>
                  <p className='text-sm text-muted-foreground'>Hangi durumlarda bildirim almak istediğinizi seçin.</p>
                  <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="notif-alarms" className="flex flex-col gap-1">
                                  <span>Alarmlar</span>
                                  <span className="text-xs font-normal text-muted-foreground">Takvim ve hatırlatıcı alarmları.</span>
                              </Label>
                              <Switch id="notif-alarms" />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="notif-general" className="flex flex-col gap-1">
                                  <span>Genel Bildirimler</span>
                                  <span className="text-xs font-normal text-muted-foreground">Uygulama güncellemeleri ve sistem mesajları.</span>
                              </Label>
                              <Switch id="notif-general" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="notif-posts" className="flex flex-col gap-1">
                                  <span>Gönderiler</span>
                                  <span className="text-xs font-normal text-muted-foreground">Takip ettiğiniz kişilerin yeni paylaşımları.</span>
                              </Label>
                              <Switch id="notif-posts" defaultChecked />
                          </div>
                           <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="notif-calls" className="flex flex-col gap-1">
                                  <span>Aramalar</span>
                                  <span className="text-xs font-normal text-muted-foreground">Gelen sesli ve görüntülü aramalar.</span>
                              </Label>
                              <Switch id="notif-calls" defaultChecked />
                          </div>
                           <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="notif-messages" className="flex flex-col gap-1">
                                  <span>Mesajlar</span>
                                  <span className="text-xs font-normal text-muted-foreground">Yeni direkt mesajlar.</span>
                              </Label>
                              <Switch id="notif-messages" defaultChecked />
                          </div>
                           <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="notif-likes" className="flex flex-col gap-1">
                                  <span>Beğeniler</span>
                                  <span className="text-xs font-normal text-muted-foreground">Paylaşımlarınıza gelen beğeniler.</span>
                              </Label>
                              <Switch id="notif-likes" />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3">
                              <Label htmlFor="notif-comments" className="flex flex-col gap-1">
                                  <span>Yorumlar</span>
                                  <span className="text-xs font-normal text-muted-foreground">Paylaşımlarınıza gelen yorumlar.</span>
                              </Label>
                              <Switch id="notif-comments" defaultChecked />
                          </div>
                      </div>
                  </ScrollArea>
              </TabsContent>
              <TabsContent value="history" className="h-full mt-0 p-2 space-y-4">
                  <div className='flex items-center gap-3 mb-4'>
                      <History />
                      <h3 className='text-lg font-semibold'>Geçmiş Yönetimi</h3>
                  </div>
                  <div className='p-2 border rounded-md'>
                    <p className='text-sm font-medium'>Geçerli Oturum ID</p>
                    <p className='text-xs text-muted-foreground font-mono mt-1'>{sessionId}</p>
                  </div>
                  <p className='text-sm text-muted-foreground'>Uygulama içi gezinme geçmişinizi yönetin.</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className='mr-2 h-4 w-4' />
                        Tüm Verileri ve Geçmişi Sıfırla
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu işlem geri alınamaz. Tüm listeleriniz, klasörleriniz ve ayarlarınız silinerek uygulama başlangıç durumuna dönecektir.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearHistory}>Sıfırla</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </TabsContent>
               <TabsContent value="shortcuts" className="h-full mt-0 p-2 space-y-4 flex flex-col">
                    <div className='flex-1'>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Eylem</TableHead>
                                <TableHead>Atanan Kısayol</TableHead>
                                <TableHead className="text-right">İşlem</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {shortcuts.map((shortcut) => (
                                <TableRow key={shortcut.action}>
                                <TableCell className="font-medium">{shortcut.name}</TableCell>
                                <TableCell>
                                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    {shortcut.customShortcut || shortcut.defaultShortcut}
                                    </kbd>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {shortcut.customShortcut && (
                                        <Button variant="ghost" size="sm" onClick={() => handleResetShortcut(shortcut.action)}>Sıfırla</Button>
                                    )}
                                    <Popover open={popoverOpen && editingShortcut === shortcut.action} onOpenChange={(open) => { if (!open) { setPopoverOpen(false); setEditingShortcut(null); } }}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => startEditing(shortcut.action)}>Değiştir</Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-4">
                                            <div className="text-center">
                                                <p className="text-sm font-medium">Yeni kısayol tuşlarına basın...</p>
                                                <p className="text-xs text-muted-foreground">(Esc ile iptal)</p>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
              <TabsContent value="trash" className="h-full mt-0 p-2 flex flex-col">
                  <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-3'>
                          <Trash2 />
                          <h3 className='text-lg font-semibold'>Çöp Kutusu</h3>
                      </div>
                      {deletedItems.length > 0 && (
                          <div className='flex items-center gap-2'>
                              <Button variant="ghost" size="sm" onClick={() => deletedItems.forEach(onRestoreItem)}><RotateCcw className='mr-2 h-4 w-4' /> Tümünü Geri Yükle</Button>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm"><Trash className='mr-2 h-4 w-4' />Tümünü Sil</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                      <AlertDialogTitle>Çöp Kutusunu Boşaltmak İstediğinizden Emin misiniz?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Bu işlem geri alınamaz. Tüm silinmiş öğeleriniz kalıcı olarak yok edilecektir.
                                      </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                      <AlertDialogCancel>İptal</AlertDialogCancel>
                                      <AlertDialogAction onClick={onEmptyTrash}>Kalıcı Olarak Sil</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </div>
                      )}
                  </div>
                  <p className='text-sm text-muted-foreground mb-4'>Silinen öğeler burada listelenir. Öğeleri geri yükleyebilir veya kalıcı olarak silebilirsiniz.</p>
                  <ScrollArea className='flex-1'>
                      {deletedItems.length > 0 ? (
                          <div className='space-y-2 pr-4'>
                              {deletedItems.map(item => {
                                  const Icon = (getIconByName((item.icon || item.type) as any) || getIconByName('help-circle' as any)) as any;
                                  return (
                                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group">
                                      <div className='flex items-center gap-3'>
                                          <Icon className="h-5 w-5 text-muted-foreground" />
                                          <span className="text-sm font-medium">{item.title}</span>
                                      </div>
                                      <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                          <Button variant="ghost" size="sm" onClick={() => onRestoreItem(item)}>
                                              <RotateCcw className='mr-2 h-4 w-4' /> Geri Yükle
                                          </Button>
                                          <Button variant="ghost" size="sm" className='text-destructive hover:text-destructive' onClick={() => onPermanentlyDeleteItem(item)}>
                                              <Trash className='mr-2 h-4 w-4' /> Kalıcı Olarak Sil
                                          </Button>
                                      </div>
                                  </div>
                                  )
                              })}
                          </div>
                      ) : (
                          <div className='text-center text-muted-foreground py-10'>Çöp kutunuz boş.</div>
                      )}
                  </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

    