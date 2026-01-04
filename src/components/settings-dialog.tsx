'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  KeyRound, Save, TestTube2, Brain, Zap, Cloud, Database, 
  MessageSquare, Music, Globe, Lock, TrendingUp, Settings,
  Youtube, Chrome, Disc, Video, Home, BarChart
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AIProviderConfig } from '@/lib/ai-providers';

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ayarlar ve Entegrasyonlar
          </DialogTitle>
          <DialogDescription>
            AI sağlayıcıları, API anahtarları ve uygulama ayarlarını yönetin
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-1">
              <Music className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Medya</span>
            </TabsTrigger>
            <TabsTrigger value="cloud" className="flex items-center gap-1">
              <Cloud className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bulut</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">İletişim</span>
            </TabsTrigger>
            <TabsTrigger value="iot" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">IoT</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analitik</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 px-1">
            <TabsContent value="ai" className="space-y-4 mt-0">
              <AIProvidersSection />
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-0">
              <MediaApisSection />
            </TabsContent>

            <TabsContent value="cloud" className="space-y-4 mt-0">
              <CloudStorageSection />
            </TabsContent>

            <TabsContent value="communication" className="space-y-4 mt-0">
              <CommunicationSection />
            </TabsContent>

            <TabsContent value="iot" className="space-y-4 mt-0">
              <IoTSection />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-0">
              <AnalyticsSection />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// AI Providers Section Component
function AIProvidersSection() {
  const { toast } = useToast();
  const { 
    aiProviders, 
    aiAgentConfig, 
    updateAIProvider, 
    setDefaultAIProvider, 
    updateAIAgentConfig,
    addAIProvider 
  } = useAppStore();

  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    aiProviders.find(p => p.isDefault)?.id || aiProviders[0]?.id || ''
  );

  const selectedProvider = aiProviders.find(p => p.id === selectedProviderId);

  const handleSaveProvider = () => {
    toast({
      title: "AI Ayarları Kaydedildi",
      description: `${selectedProvider?.name} yapılandırması güncellendi.`
    });
  };

  const handleAddCustomProvider = () => {
    const newProvider: AIProviderConfig = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      name: 'Custom AI Provider',
      endpoint: 'https://api.example.com/v1',
      model: 'custom-model',
      enabled: false,
      metadata: {
        description: 'Custom AI endpoint',
        pricing: 'Configure manually'
      }
    };
    addAIProvider(newProvider);
    setSelectedProviderId(newProvider.id);
    toast({
      title: "Özel Sağlayıcı Eklendi",
      description: "Yeni AI sağlayıcısı yapılandırabilirsiniz."
    });
  };

  return (
    <div className="space-y-6">
      {/* Agent Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            AI Ajan Modu
          </CardTitle>
          <CardDescription>
            AI modelinin nasıl seçileceğini belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Otomatik Model Seçimi</Label>
              <p className="text-sm text-muted-foreground">
                AI, göreve göre en uygun modeli otomatik seçsin
              </p>
            </div>
            <Switch
              checked={aiAgentConfig.mode === 'auto'}
              onCheckedChange={(checked) => 
                updateAIAgentConfig({ mode: checked ? 'auto' : 'manual' })
              }
            />
          </div>

          {aiAgentConfig.mode === 'auto' && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-cost"
                    checked={aiAgentConfig.autoSelectByCost}
                    onCheckedChange={(checked) => 
                      updateAIAgentConfig({ autoSelectByCost: checked })
                    }
                  />
                  <Label htmlFor="auto-cost" className="text-sm">
                    Maliyet Önceliği
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-speed"
                    checked={aiAgentConfig.autoSelectBySpeed}
                    onCheckedChange={(checked) => 
                      updateAIAgentConfig({ autoSelectBySpeed: checked })
                    }
                  />
                  <Label htmlFor="auto-speed" className="text-sm">
                    Hız Önceliği
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-capability"
                    checked={aiAgentConfig.autoSelectByCapability}
                    onCheckedChange={(checked) => 
                      updateAIAgentConfig({ autoSelectByCapability: checked })
                    }
                  />
                  <Label htmlFor="auto-capability" className="text-sm">
                    Yetenek Önceliği
                  </Label>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Provider List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Sağlayıcıları
            </div>
            <Button onClick={handleAddCustomProvider} size="sm" variant="outline">
              <KeyRound className="h-4 w-4 mr-2" />
              Özel Ekle
            </Button>
          </CardTitle>
          <CardDescription>
            Kullanmak istediğiniz AI modellerini yapılandırın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
            <SelectTrigger>
              <SelectValue placeholder="AI Sağlayıcı Seçin" />
            </SelectTrigger>
            <SelectContent>
              {aiProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    {provider.name}
                    {provider.isDefault && <Badge variant="secondary" className="text-xs">Varsayılan</Badge>}
                    {provider.enabled && <Badge variant="outline" className="text-xs">Aktif</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProvider && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{selectedProvider.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedProvider.metadata?.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedProvider.enabled}
                    onCheckedChange={(checked) => 
                      updateAIProvider(selectedProvider.id, { enabled: checked })
                    }
                  />
                  <Label className="text-sm">Aktif</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Anahtarı</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="API anahtarınızı girin..."
                    value={selectedProvider.apiKey || ''}
                    onChange={(e) => 
                      updateAIProvider(selectedProvider.id, { apiKey: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint URL</Label>
                    <Input
                      id="endpoint"
                      placeholder="https://api.example.com"
                      value={selectedProvider.endpoint || ''}
                      onChange={(e) => 
                        updateAIProvider(selectedProvider.id, { endpoint: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="model-name"
                      value={selectedProvider.model || ''}
                      onChange={(e) => 
                        updateAIProvider(selectedProvider.id, { model: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      placeholder="4096"
                      value={selectedProvider.maxTokens || ''}
                      onChange={(e) => 
                        updateAIProvider(selectedProvider.id, { maxTokens: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      placeholder="0.7"
                      value={selectedProvider.temperature || ''}
                      onChange={(e) => 
                        updateAIProvider(selectedProvider.id, { temperature: parseFloat(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm text-muted-foreground">
                {selectedProvider.metadata?.pricing && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>{selectedProvider.metadata.pricing}</span>
                  </div>
                )}
                {selectedProvider.metadata?.rateLimit && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>{selectedProvider.metadata.rateLimit}</span>
                  </div>
                )}
                {selectedProvider.metadata?.features && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedProvider.metadata.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDefaultAIProvider(selectedProvider.id)}
                  disabled={selectedProvider.isDefault}
                >
                  {selectedProvider.isDefault ? 'Varsayılan' : 'Varsayılan Yap'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <TestTube2 className="h-4 w-4 mr-2" />
                    Test Et
                  </Button>
                  <Button size="sm" onClick={handleSaveProvider}>
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Media APIs Section
function MediaApisSection() {
  const { toast } = useToast();
  const { 
    youtubeApiKey, 
    googleApiKey, 
    youtubeMetadataEnabled,
    setYoutubeApiKey, 
    setGoogleApiKey, 
    setYoutubeMetadataEnabled,
    apiKeys,
    setApiKey 
  } = useAppStore();

  const [localYoutubeKey, setLocalYoutubeKey] = useState(youtubeApiKey || '');
  const [localGoogleKey, setLocalGoogleKey] = useState(googleApiKey || '');
  const [localSpotify, setLocalSpotify] = useState(apiKeys.spotify || '');
  const [localSoundcloud, setLocalSoundcloud] = useState(apiKeys.soundcloud || '');
  const [localVimeo, setLocalVimeo] = useState(apiKeys.vimeo || '');

  const handleSave = () => {
    setYoutubeApiKey(localYoutubeKey);
    setGoogleApiKey(localGoogleKey);
    setApiKey('media', 'spotify', localSpotify);
    setApiKey('media', 'soundcloud', localSoundcloud);
    setApiKey('media', 'vimeo', localVimeo);
    
    toast({
      title: "Medya API'leri Kaydedildi",
      description: "Tüm medya entegrasyonları güncellendi."
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube API
          </CardTitle>
          <CardDescription>YouTube video metadata ve arama özellikleri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-key">API Anahtarı</Label>
            <Input
              id="youtube-key"
              type="password"
              placeholder="AIzaSy..."
              value={localYoutubeKey}
              onChange={(e) => setLocalYoutubeKey(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Metadata Özelliklerini Etkinleştir</Label>
              <p className="text-sm text-muted-foreground">
                Video başlıkları, süreleri ve thumbnail'leri otomatik yüklensin
              </p>
            </div>
            <Switch
              checked={youtubeMetadataEnabled}
              onCheckedChange={setYoutubeMetadataEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="h-5 w-5" />
            Google API
          </CardTitle>
          <CardDescription>Google servisleri için genel API anahtarı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="google-key">API Anahtarı</Label>
            <Input
              id="google-key"
              type="password"
              placeholder="AIzaSy..."
              value={localGoogleKey}
              onChange={(e) => setLocalGoogleKey(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-green-500" />
            Spotify API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input
              type="password"
              placeholder="Spotify Client ID..."
              value={localSpotify}
              onChange={(e) => setLocalSpotify(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Disc className="h-5 w-5 text-orange-500" />
            SoundCloud API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input
              type="password"
              placeholder="SoundCloud Client ID..."
              value={localSoundcloud}
              onChange={(e) => setLocalSoundcloud(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            Vimeo API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input
              type="password"
              placeholder="Vimeo Access Token..."
              value={localVimeo}
              onChange={(e) => setLocalVimeo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <TestTube2 className="h-4 w-4 mr-2" />
          Bağlantıları Test Et
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Tümünü Kaydet
        </Button>
      </div>
    </div>
  );
}

// Cloud Storage Section
function CloudStorageSection() {
  const { toast } = useToast();
  const { apiKeys, setApiKey } = useAppStore();

  const [dropbox, setDropbox] = useState(apiKeys.dropbox || '');
  const [onedrive, setOnedrive] = useState(apiKeys.onedrive || '');
  const [googleDrive, setGoogleDrive] = useState(apiKeys.googleDrive || '');

  const handleSave = () => {
    setApiKey('cloud', 'dropbox', dropbox);
    setApiKey('cloud', 'onedrive', onedrive);
    setApiKey('cloud', 'googleDrive', googleDrive);
    
    toast({
      title: "Bulut Depolama Kaydedildi",
      description: "Bulut entegrasyonları güncellendi."
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            Dropbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input
              type="password"
              placeholder="Dropbox Access Token..."
              value={dropbox}
              onChange={(e) => setDropbox(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            OneDrive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Client Secret</Label>
            <Input
              type="password"
              placeholder="OneDrive Client Secret..."
              value={onedrive}
              onChange={(e) => setOnedrive(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-yellow-500" />
            Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="Google Drive API Key..."
              value={googleDrive}
              onChange={(e) => setGoogleDrive(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Kaydet
        </Button>
      </div>
    </div>
  );
}

// Communication Section
function CommunicationSection() {
  const { toast } = useToast();
  const { apiKeys, setApiKey } = useAppStore();

  const [slack, setSlack] = useState(apiKeys.slack || '');
  const [discord, setDiscord] = useState(apiKeys.discord || '');
  const [telegram, setTelegram] = useState(apiKeys.telegram || '');

  const handleSave = () => {
    setApiKey('communication', 'slack', slack);
    setApiKey('communication', 'discord', discord);
    setApiKey('communication', 'telegram', telegram);
    
    toast({
      title: "İletişim Entegrasyonları Kaydedildi",
      description: "Mesajlaşma servisleri güncellendi."
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Slack Webhook</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="https://hooks.slack.com/services/..."
            value={slack}
            onChange={(e) => setSlack(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discord Bot Token</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="Discord Bot Token..."
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Bot Token</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="Telegram Bot Token..."
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Kaydet
        </Button>
      </div>
    </div>
  );
}

// IoT Section
function IoTSection() {
  const { toast } = useToast();
  const { apiKeys, setApiKey } = useAppStore();

  const [homeAssistant, setHomeAssistant] = useState(apiKeys.homeAssistant || '');
  const [mqtt, setMqtt] = useState(apiKeys.mqtt || '');

  const handleSave = () => {
    setApiKey('iot', 'homeAssistant', homeAssistant);
    setApiKey('iot', 'mqtt', mqtt);
    
    toast({
      title: "IoT Entegrasyonları Kaydedildi",
      description: "Akıllı ev servisleri güncellendi."
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Home Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Long-Lived Access Token</Label>
            <Input
              type="password"
              placeholder="Home Assistant Token..."
              value={homeAssistant}
              onChange={(e) => setHomeAssistant(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MQTT Broker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Connection String</Label>
            <Input
              type="password"
              placeholder="mqtt://username:password@broker:1883"
              value={mqtt}
              onChange={(e) => setMqtt(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Kaydet
        </Button>
      </div>
    </div>
  );
}

// Analytics Section
function AnalyticsSection() {
  const { toast } = useToast();
  const { apiKeys, setApiKey } = useAppStore();

  const [mixpanel, setMixpanel] = useState(apiKeys.mixpanel || '');
  const [amplitude, setAmplitude] = useState(apiKeys.amplitude || '');
  const [sentry, setSentry] = useState(apiKeys.sentry || '');

  const handleSave = () => {
    setApiKey('analytics', 'mixpanel', mixpanel);
    setApiKey('analytics', 'amplitude', amplitude);
    setApiKey('analytics', 'sentry', sentry);
    
    toast({
      title: "Analitik Servisleri Kaydedildi",
      description: "İzleme ve hata raporlama güncellendi."
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mixpanel</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="Mixpanel Project Token..."
            value={mixpanel}
            onChange={(e) => setMixpanel(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amplitude</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="Amplitude API Key..."
            value={amplitude}
            onChange={(e) => setAmplitude(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sentry</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            placeholder="Sentry DSN..."
            value={sentry}
            onChange={(e) => setSentry(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Kaydet
        </Button>
      </div>
    </div>
  );
}
