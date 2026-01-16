
"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
} from "@/components/ui/select";
import type { AIProviderConfig } from "@/lib/ai-providers";
import { Settings, Brain, Music, Cloud, MessageSquare, Home, BarChart, CreditCard, Save, Database, Zap } from "lucide-react";
import { KeyRound, TrendingUp, TestTube2, Youtube, Chrome, Disc, Video, Globe } from "lucide-react";

// Section components (varsayılan, sade, fonksiyonel)
// ... (AIProvidersSection, MediaApisSection, CloudStorageSection, CommunicationSection, IoTSection, AnalyticsSection, SubscriptionSection, SearchHistorySection)

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Uygulama Ayarları
          </DialogTitle>
          <DialogDescription>
            Tüm sistem ve entegrasyon ayarlarını buradan yönetebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Sol menü: Sekmeler */}
          <div className="flex flex-row md:flex-col gap-2 md:w-48 w-full md:min-w-[160px] border-r border-muted-foreground/10 py-2 md:py-0">
            <button onClick={() => setActiveTab('ai')} className={`settings-tab-btn ${activeTab==='ai' ? 'active' : ''}`}><Brain className="h-4 w-4 mr-2"/>AI</button>
            <button onClick={() => setActiveTab('media')} className={`settings-tab-btn ${activeTab==='media' ? 'active' : ''}`}><Music className="h-4 w-4 mr-2"/>Medya</button>
            <button onClick={() => setActiveTab('cloud')} className={`settings-tab-btn ${activeTab==='cloud' ? 'active' : ''}`}><Cloud className="h-4 w-4 mr-2"/>Bulut</button>
            <button onClick={() => setActiveTab('iot')} className={`settings-tab-btn ${activeTab==='iot' ? 'active' : ''}`}><Home className="h-4 w-4 mr-2"/>Akıllı Ev</button>
            <button onClick={() => setActiveTab('analytics')} className={`settings-tab-btn ${activeTab==='analytics' ? 'active' : ''}`}><BarChart className="h-4 w-4 mr-2"/>Analitik</button>
              {/* <button onClick={() => setActiveTab('communication')} className={`settings-tab-btn ${activeTab==='communication' ? 'active' : ''}`}><MessageSquare className="h-4 w-4 mr-2"/>İletişim</button> */}
              {/* <button onClick={() => setActiveTab('subscription')} className={`settings-tab-btn ${activeTab==='subscription' ? 'active' : ''}`}><CreditCard className="h-4 w-4 mr-2"/>Abonelik</button> */}
          </div>
          {/* Sağ içerik: Aktif sekme */}
          <div className="flex-1 overflow-y-auto px-2 py-1">
            {activeTab === 'ai' && <AIProvidersSection />}
            {activeTab === 'media' && <MediaApisSection />}
            {activeTab === 'cloud' && <CloudStorageSection />}
              {/* {activeTab === 'iot' && <IoTSection />} */}
              {/* {activeTab === 'analytics' && <AnalyticsSection />} */}
              {/* {activeTab === 'communication' && <CommunicationSection />} */}
              {/* {activeTab === 'subscription' && <SubscriptionSection />} */}
            {/* Arama geçmişi sadece bulut sekmesinden sonra gösterilsin */}
              {/* {activeTab === 'cloud' && <div className="mt-4"><SearchHistorySection /></div>} */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// AI Providers Section Component
function AIProvidersSection() {
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
    // Optionally show a UI notification here
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
    // Optionally show a UI notification here
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
    // Optionally show a UI notification here
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
  const { apiKeys, setApiKey } = useAppStore();

  const [dropbox, setDropbox] = useState(apiKeys.dropbox || '');
  const [onedrive, setOnedrive] = useState(apiKeys.onedrive || '');
  const [googleDrive, setGoogleDrive] = useState(apiKeys.googleDrive || '');

  const handleSave = () => {
    setApiKey('cloud', 'dropbox', dropbox);
    setApiKey('cloud', 'onedrive', onedrive);
    setApiKey('cloud', 'googleDrive', googleDrive);
    // Optionally show a UI notification here
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
// Search History Section
function SearchHistorySection() {
  const clearSearchHistory = useAppStore(s => s.clearSearchHistory);
  const searchHistory = useAppStore(s => s.searchHistory);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-500" />
            Arama Geçmişi
          </CardTitle>
          <CardDescription>Son aramalarınızı ve geçmişi yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-2">
            <Button size="sm" variant="destructive" onClick={clearSearchHistory}>
              Geçmişi Temizle
            </Button>
            <span className="text-xs text-gray-400">Tüm arama geçmişini siler</span>
          </div>
          <div className="max-h-40 overflow-y-auto text-xs text-gray-700 bg-white/80 rounded p-2 border border-gray-200">
            {searchHistory.length === 0 ? (
              <span>Hiç arama geçmişi yok.</span>
            ) : (
              <ul>
                {searchHistory.slice(0, 20).map(item => (
                  <li key={item.id} className="py-1 border-b border-gray-100 last:border-b-0 flex justify-between">
                    <span>{item.query}</span>
                    <span className="text-gray-400 ml-2">{new Date(item.createdAt).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Removed duplicate export default SettingsDialog and unreachable code

// IoT Section
function IoTSection() {
  const { apiKeys, setApiKey } = useAppStore();

  const [homeAssistant, setHomeAssistant] = useState(apiKeys.homeAssistant || '');
  const [mqtt, setMqtt] = useState(apiKeys.mqtt || '');
  const [hueApiKey, setHueApiKey] = useState('');

  const handleSave = () => {
    setApiKey('iot', 'homeAssistant', homeAssistant);
    setApiKey('iot', 'mqtt', mqtt);
    setApiKey('iot', 'hueApiKey', hueApiKey);
    // Optionally show a UI notification here
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Philips Hue API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Bridge API Key</Label>
            <Input
              type="password"
              placeholder="Philips Hue Bridge API Key..."
              value={hueApiKey}
              onChange={(e) => setHueApiKey(e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-2">
              <b>Kurulum Kılavuzu:</b><br />
              1. Philips Hue uygulamasında <b>Geliştirici</b> modunu etkinleştirin.<br />
              2. Bridge IP adresinizi bulun ve <code>/api</code> endpointine bir kullanıcı oluşturmak için POST isteği atın.<br />
              3. Oluşan API anahtarını buraya yapıştırın.<br />
              <a href="https://developers.meethue.com/develop/get-started-2/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Resmi Philips Hue API Dokümantasyonu</a>
            </div>
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
  const { apiKeys, setApiKey } = useAppStore();

  const [mixpanel, setMixpanel] = useState(apiKeys.mixpanel || '');
  const [amplitude, setAmplitude] = useState(apiKeys.amplitude || '');
  const [sentry, setSentry] = useState(apiKeys.sentry || '');

  const handleSave = () => {
    setApiKey('analytics', 'mixpanel', mixpanel);
    setApiKey('analytics', 'amplitude', amplitude);
    setApiKey('analytics', 'sentry', sentry);
    // Optionally show a UI notification here
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
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Kaydet
        </Button>
      </div>
    </div>
  );
}
