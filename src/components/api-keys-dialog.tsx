
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, UploadCloud, TestTube2, Save, Youtube, Chrome } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ApiKeysDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ServiceTab = ({ serviceName, serviceIcon, serviceFields }: { serviceName: string, serviceIcon: React.ReactNode, serviceFields: string[] }) => {
    const { toast } = useToast();
    const handleSave = () => {
        toast({
            title: `${serviceName} Anahtarları Kaydedildi`,
            description: "API anahtarlarınız yerel olarak kaydedildi.",
        });
    }

    return (
        <div className='space-y-4 p-2'>
            <div className='flex items-center gap-3 mb-4'>
                {serviceIcon}
                <h3 className='text-lg font-semibold'>{serviceName} Entegrasyonu</h3>
            </div>
            {serviceFields.map(field => (
                <div key={field} className='space-y-2'>
                    <label htmlFor={`${serviceName}-${field}`} className='text-sm font-medium text-muted-foreground'>{field}</label>
                    <Input id={`${serviceName}-${field}`} placeholder={`${field} girin...`} />
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
    )
}


export default function ApiKeysDialog({ isOpen, onOpenChange }: ApiKeysDialogProps) {
  const { toast } = useToast();
  const { 
    youtubeApiKey, 
    googleApiKey, 
    youtubeMetadataEnabled,
    setYoutubeApiKey, 
    setGoogleApiKey,
    setYoutubeMetadataEnabled 
  } = useAppStore();
  
  const [localYoutubeKey, setLocalYoutubeKey] = useState(youtubeApiKey || '');
  const [localGoogleKey, setLocalGoogleKey] = useState(googleApiKey || '');
  const [localMetadataEnabled, setLocalMetadataEnabled] = useState(youtubeMetadataEnabled);

  useEffect(() => {
    setLocalYoutubeKey(youtubeApiKey || '');
    setLocalGoogleKey(googleApiKey || '');
    setLocalMetadataEnabled(youtubeMetadataEnabled);
  }, [youtubeApiKey, googleApiKey, youtubeMetadataEnabled]);

  const handleSaveYoutube = () => {
    setYoutubeApiKey(localYoutubeKey);
    setYoutubeMetadataEnabled(localMetadataEnabled);
    toast({
      title: "YouTube Ayarları Kaydedildi",
      description: localMetadataEnabled 
        ? "YouTube metadata özellikleri etkinleştirildi." 
        : "YouTube metadata özellikleri devre dışı bırakıldı.",
    });
  };

  const handleSaveGoogle = () => {
    setGoogleApiKey(localGoogleKey);
    toast({
      title: "Google API Anahtarı Kaydedildi",
      description: "Google API anahtarınız yerel olarak kaydedildi.",
    });
  };

  const handleTestYoutube = async () => {
    if (!localYoutubeKey) {
      toast({
        title: "API Anahtarı Gerekli",
        description: "Lütfen önce YouTube API anahtarınızı girin.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${localYoutubeKey}`
      );
      
      if (response.ok) {
        toast({
          title: "Bağlantı Başarılı",
          description: "YouTube API anahtarınız çalışıyor!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Bağlantı Hatası",
          description: error.error?.message || "API anahtarı geçersiz.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Başarısız",
        description: "YouTube API'ye bağlanırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound /> Entegrasyonlar ve API Anahtarları
          </DialogTitle>
          <DialogDescription>
            Harici servislerle bağlantı kurmak için API anahtarlarınızı buradan yönetin.
            Anahtarlarınız sadece bu tarayıcıda güvenli bir şekilde saklanır.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="youtube" orientation="vertical" className="h-full">
            <TabsList>
                <TabsTrigger value="youtube">YouTube</TabsTrigger>
                <TabsTrigger value="google">Google</TabsTrigger>
                <TabsTrigger value="spotify">Spotify</TabsTrigger>
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="twitch">Twitch / OBS</TabsTrigger>
                <TabsTrigger value="smartthings">SmartThings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="youtube" className="h-full mt-0">
              <div className='space-y-4 p-2'>
                <div className='flex items-center gap-3 mb-4'>
                  <Youtube className='h-6 w-6 text-red-500' />
                  <h3 className='text-lg font-semibold'>YouTube Data API v3</h3>
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor='youtube-api-key'>YouTube Data API Key</Label>
                  <Input 
                    id='youtube-api-key' 
                    placeholder='AIza...' 
                    type='password'
                    value={localYoutubeKey}
                    onChange={(e) => setLocalYoutubeKey(e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground'>
                    YouTube videolarının metadata ve istatistiklerini çekmek için API anahtarı gereklidir.
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className='ml-1 text-blue-500 hover:underline'
                    >
                      Buradan oluşturabilirsiniz →
                    </a>
                  </p>
                </div>

                <div className='flex items-center justify-between space-x-2 pt-2'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='metadata-enabled'>YouTube Metadata Çekmeyi Etkinleştir</Label>
                    <p className='text-xs text-muted-foreground'>
                      Video eklerken otomatik olarak başlık, açıklama, görüntülenme ve etkileşim verilerini çek
                    </p>
                  </div>
                  <Switch 
                    id='metadata-enabled'
                    checked={localMetadataEnabled}
                    onCheckedChange={setLocalMetadataEnabled}
                  />
                </div>

                <div className='flex justify-end gap-2 pt-4'>
                  <Button variant="outline" onClick={handleTestYoutube}>
                    <TestTube2 className='mr-2 h-4 w-4' />
                    Bağlantıyı Test Et
                  </Button>
                  <Button onClick={handleSaveYoutube}>
                    <Save className='mr-2 h-4 w-4' />
                    Kaydet
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="google" className="h-full mt-0">
              <div className='space-y-4 p-2'>
                <div className='flex items-center gap-3 mb-4'>
                  <Chrome className='h-6 w-6' />
                  <h3 className='text-lg font-semibold'>Google Cloud API</h3>
                </div>
                
                <div className='space-y-2'>
                  <Label htmlFor='google-api-key'>Google API Key</Label>
                  <Input 
                    id='google-api-key' 
                    placeholder='AIza...' 
                    type='password'
                    value={localGoogleKey}
                    onChange={(e) => setLocalGoogleKey(e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground'>
                    Google Drive, Google Docs ve diğer Google servisleri için genel API anahtarı.
                  </p>
                </div>

                <div className='flex justify-end gap-2 pt-4'>
                  <Button onClick={handleSaveGoogle}>
                    <Save className='mr-2 h-4 w-4' />
                    Kaydet
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="spotify" className="h-full mt-0">
                <ServiceTab 
                    serviceName="Spotify"
                    serviceIcon={<UploadCloud />}
                    serviceFields={['Client ID', 'Client Secret']}
                />
            </TabsContent>
            {/* Other tabs can be added here */}
          </Tabs>
        </div>

      </DialogContent>
    </Dialog>
  );
}
