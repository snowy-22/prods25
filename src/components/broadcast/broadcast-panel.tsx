'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Radio,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Video,
  Radio as RadioIcon,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  Settings,
  Zap,
  Users,
  MessageCircle,
  Share2,
  StopCircle,
  RotateCcw,
} from 'lucide-react';

type StreamPlatform = 'youtube' | 'twitch' | 'rtmp' | 'custom';
type StreamResolution = '720p' | '1080p' | '2160p';
type StreamFPS = 24 | 30 | 60;

interface BroadcastPanelProps {
  presentationId: string;
  isOpen: boolean;
  onClose: () => void;
  onStartBroadcast?: (config: BroadcastConfig) => void;
  onEndBroadcast?: () => void;
}

interface BroadcastConfig {
  platform: StreamPlatform;
  streamKey: string;
  resolution: StreamResolution;
  bitrate: number; // kbps
  fps: StreamFPS;
  recordingEnabled: boolean;
  audioInput?: string;
}

interface StreamStats {
  isLive: boolean;
  viewers: number;
  peakViewers: number;
  duration: number; // seconds
  uploadSpeed: number; // Mbps
  bandwidth: number; // kbps
}

export const BroadcastPanel: React.FC<BroadcastPanelProps> = ({
  presentationId,
  isOpen,
  onClose,
  onStartBroadcast,
  onEndBroadcast,
}) => {
  const [isLive, setIsLive] = useState(false);
  const [platform, setPlatform] = useState<StreamPlatform>('youtube');
  const [streamKey, setStreamKey] = useState('');
  const [resolution, setResolution] = useState<StreamResolution>('1080p');
  const [bitrate, setBitrate] = useState(5000); // 5 Mbps default
  const [fps, setFps] = useState<StreamFPS>(30);
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [selectedAudio, setSelectedAudio] = useState('default');
  const [copiedKey, setCopiedKey] = useState(false);

  const [stats, setStats] = useState<StreamStats>({
    isLive: false,
    viewers: 0,
    peakViewers: 0,
    duration: 0,
    uploadSpeed: 0,
    bandwidth: 0,
  });

  // Bitrate önerileri
  const getBitrateSuggestion = (): number => {
    const suggestions: Record<StreamResolution, number> = {
      '720p': 4500,
      '1080p': 8000,
      '2160p': 15000,
    };
    return suggestions[resolution];
  };

  // Go Live
  const handleStartBroadcast = async () => {
    if (!streamKey) {
      alert('Lütfen stream anahtarını giriniz');
      return;
    }

    const config: BroadcastConfig = {
      platform,
      streamKey,
      resolution,
      bitrate,
      fps,
      recordingEnabled,
      audioInput: selectedAudio,
    };

    onStartBroadcast?.(config);
    setIsLive(true);

    // Simüle edilmiş istatistikler başlat
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        isLive: true,
        viewers: Math.floor(Math.random() * 100),
        peakViewers: Math.max(prev.peakViewers, Math.floor(Math.random() * 100)),
        duration: prev.duration + 1,
        uploadSpeed: 2.5 + Math.random() * 1.5,
        bandwidth: bitrate,
      }));
    }, 1000);

    // Store interval ID for cleanup
    (window as any).__broadcastInterval = interval;
  };

  // End Broadcast
  const handleEndBroadcast = () => {
    setIsLive(false);
    onEndBroadcast?.();

    if ((window as any).__broadcastInterval) {
      clearInterval((window as any).__broadcastInterval);
    }

    setStats({
      isLive: false,
      viewers: 0,
      peakViewers: stats.peakViewers,
      duration: stats.duration,
      uploadSpeed: 0,
      bandwidth: 0,
    });
  };

  // Copy stream key
  const copyStreamKey = () => {
    navigator.clipboard.writeText(streamKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Canlı Yayın
          </DialogTitle>
          <DialogDescription>
            Sunumunuzu canlı olarak yayınlayın
          </DialogDescription>
        </DialogHeader>

        {isLive ? (
          // Yayın Aktif
          <div className="space-y-4">
            {/* Live Badge */}
            <div className="flex items-center gap-4">
              <Badge className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
                <span className="h-2 w-2 bg-red-200 rounded-full animate-pulse" />
                CANLI
              </Badge>
              <span className="text-sm font-mono">
                {formatDuration(stats.duration)}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded">
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <Users className="h-3 w-3 inline mr-1" />
                  İzleyiciler
                </div>
                <div className="text-2xl font-bold">{stats.viewers}</div>
                <div className="text-xs text-slate-500">
                  En yüksek: {stats.peakViewers}
                </div>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded">
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <Zap className="h-3 w-3 inline mr-1" />
                  Bağlantı
                </div>
                <div className="text-2xl font-bold">
                  {stats.uploadSpeed.toFixed(1)} Mbps
                </div>
                <div className="text-xs text-slate-500">
                  {stats.bandwidth} kbps
                </div>
              </div>
            </div>

            {/* Chat Preview */}
            <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-800 h-32 overflow-y-auto">
              <div className="text-sm text-slate-500">
                <div className="flex gap-2 mb-2">
                  <span className="font-semibold">Kullanıcı</span>
                  <span className="text-slate-500">Harika sunum!</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <span className="font-semibold">Başka Kullanıcı</span>
                  <span className="text-slate-500">Çok etkileyici 👏</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">Başkası</span>
                  <span className="text-slate-500">Teşekkürler!</span>
                </div>
              </div>
            </div>

            {/* End Broadcast Button */}
            <Button
              onClick={handleEndBroadcast}
              variant="destructive"
              className="w-full"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Yayını Sonlandır
            </Button>
          </div>
        ) : (
          // Yayın Ayarları
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup">Kurulum</TabsTrigger>
              <TabsTrigger value="advanced">Gelişmiş</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-4">
              {/* Platform Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Platform</label>
                <RadioGroup value={platform} onValueChange={(val) => setPlatform(val as StreamPlatform)}>
                  <div className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                    <RadioGroupItem value="youtube" id="youtube" />
                    <label htmlFor="youtube" className="flex-1 cursor-pointer">
                      <div className="font-semibold">YouTube Live</div>
                      <div className="text-xs text-slate-500">
                        YouTube Studio entegrasyonu
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                    <RadioGroupItem value="twitch" id="twitch" />
                    <label htmlFor="twitch" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Twitch</div>
                      <div className="text-xs text-slate-500">
                        Twitch OAuth entegrasyonu
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                    <RadioGroupItem value="rtmp" id="rtmp" />
                    <label htmlFor="rtmp" className="flex-1 cursor-pointer">
                      <div className="font-semibold">RTMP / Özel</div>
                      <div className="text-xs text-slate-500">
                        RTMP server adresi
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                    <RadioGroupItem value="custom" id="custom" />
                    <label htmlFor="custom" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Özel</div>
                      <div className="text-xs text-slate-500">
                        Başka bir RTMP provider
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Stream Key */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Stream Anahtarı</label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Stream anahtarınızı yapıştırın"
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyStreamKey}
                    disabled={!streamKey}
                  >
                    {copiedKey ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Stream anahtarınızı {platform === 'youtube' ? 'YouTube Studio' : 'platform ayarları'} ndan alabilirsiniz
                </p>
              </div>

              {/* Resolution */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Çözünürlük</label>
                <Select value={resolution} onValueChange={(val) => setResolution(val as StreamResolution)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p - 16:9 (1280x720)</SelectItem>
                    <SelectItem value="1080p">1080p - 16:9 (1920x1080)</SelectItem>
                    <SelectItem value="2160p">2160p - 16:9 (3840x2160) 4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* FPS */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">FPS (Kare/saniye)</label>
                <Select value={fps.toString()} onValueChange={(val) => setFps(parseInt(val) as StreamFPS)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 FPS (Sinematik)</SelectItem>
                    <SelectItem value="30">30 FPS (Standart)</SelectItem>
                    <SelectItem value="60">60 FPS (Yüksek)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recording */}
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-semibold">Kaydı Kaydet</div>
                  <div className="text-xs text-slate-500">
                    Yayınınızı yeniden oynatmak için kaydedin
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={recordingEnabled}
                  onChange={(e) => setRecordingEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              {/* Bitrate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold">Bitrate</label>
                  <span className="text-sm font-mono">
                    {bitrate} kbps
                  </span>
                </div>
                <Slider
                  min={500}
                  max={50000}
                  step={500}
                  value={[bitrate]}
                  onValueChange={(val) => setBitrate(val[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>500 kbps</span>
                  <span>Önerilen: {getBitrateSuggestion()} kbps</span>
                  <span>50 Mbps</span>
                </div>
              </div>

              {/* Audio Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Ses Girdisi</label>
                <Select value={selectedAudio} onValueChange={setSelectedAudio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Varsayılan Mikrofon</SelectItem>
                    <SelectItem value="system">Sistem Sesi</SelectItem>
                    <SelectItem value="none">Ses Yok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Requirements Alert */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>İnternet Hızı Gereksinimler:</strong>
                  <ul className="text-xs mt-2 space-y-1">
                    <li>• 720p@30fps: en az 3 Mbps</li>
                    <li>• 1080p@30fps: en az 5 Mbps</li>
                    <li>• 1080p@60fps: en az 8 Mbps</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        )}

        {!isLive && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button onClick={handleStartBroadcast}>
              <RadioIcon className="mr-2 h-4 w-4" />
              Yayını Başlat
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
