'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  QrCode, Smartphone, Monitor, Link2, Copy, Check, 
  Wifi, WifiOff, Camera, RefreshCw, Trash2, 
  Tablet, Laptop, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRemoteSync, RemoteSession } from '@/hooks/use-remote-sync';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface SessionSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Device icon helper
function DeviceIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'mobile':
      return <Smartphone className={className} />;
    case 'tablet':
      return <Tablet className={className} />;
    case 'desktop':
      return <Monitor className={className} />;
    default:
      return <Laptop className={className} />;
  }
}

export function SessionSyncDialog({ open, onOpenChange }: SessionSyncDialogProps) {
  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');
  const [joinCode, setJoinCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  
  const { toast } = useToast();
  
  const {
    session,
    sessionCode,
    connectedDevices,
    isConnecting,
    error,
    isHost,
    isConnected,
    deviceCount,
    createSession,
    joinSession,
    disconnect,
  } = useRemoteSync({
    onDeviceConnected: (device) => {
      toast({
        title: 'Cihaz Bağlandı',
        description: `${device.device_name || 'Bilinmeyen Cihaz'} oturuma katıldı`,
      });
    },
    onDeviceDisconnected: () => {
      toast({
        title: 'Cihaz Ayrıldı',
        description: 'Bir cihaz oturumdan ayrıldı',
        variant: 'destructive',
      });
    },
  });
  
  // Generate QR code when session is created
  useEffect(() => {
    if (sessionCode && isHost) {
      const url = `${window.location.origin}/remote?code=${sessionCode}`;
      QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#0f172a',
        },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    } else {
      setQrDataUrl(null);
    }
  }, [sessionCode, isHost]);
  
  // Handle create session
  const handleCreateSession = async () => {
    const newSession = await createSession();
    if (newSession) {
      toast({
        title: 'Oturum Oluşturuldu',
        description: `Kod: ${newSession.session_code}`,
      });
    }
  };
  
  // Handle join session
  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      toast({
        title: 'Hata',
        description: 'Lütfen oturum kodunu girin',
        variant: 'destructive',
      });
      return;
    }
    
    const joined = await joinSession(joinCode.trim());
    if (joined) {
      toast({
        title: 'Oturuma Katıldınız',
        description: 'Artık uzaktan kontrol edebilirsiniz',
      });
      onOpenChange(false);
    }
  };
  
  // Handle disconnect
  const handleDisconnect = async () => {
    await disconnect();
    toast({
      title: 'Bağlantı Kesildi',
      description: 'Oturumdan çıkıldı',
    });
  };
  
  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (sessionCode) {
      await navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      toast({
        title: 'Kopyalandı',
        description: 'Oturum kodu panoya kopyalandı',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (sessionCode) {
      const url = `${window.location.origin}/remote?code=${sessionCode}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link Kopyalandı',
        description: 'Uzaktan kumanda linki panoya kopyalandı',
      });
    }
  };
  
  // Camera QR scanner
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef) {
        videoRef.srcObject = stream;
        videoRef.play();
        setCameraActive(true);
        
        // Simple QR detection using canvas sampling
        // In production, use a library like @zxing/library
        const checkQR = () => {
          if (!cameraActive || !videoRef) return;
          
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.videoWidth;
          canvas.height = videoRef.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(videoRef, 0, 0);
            // QR detection would happen here with a proper library
          }
          
          if (cameraActive) {
            requestAnimationFrame(checkQR);
          }
        };
        
        setTimeout(checkQR, 1000);
      }
    } catch (err) {
      toast({
        title: 'Kamera Hatası',
        description: 'Kameraya erişilemedi',
        variant: 'destructive',
      });
    }
  }, [videoRef, cameraActive, toast]);
  
  const stopCamera = useCallback(() => {
    if (videoRef?.srcObject) {
      const stream = videoRef.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.srcObject = null;
    }
    setCameraActive(false);
  }, [videoRef]);
  
  // Cleanup camera on unmount or close
  useEffect(() => {
    return () => {
      if (cameraActive) {
        stopCamera();
      }
    };
  }, [cameraActive, stopCamera]);
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && cameraActive) {
        stopCamera();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-yellow-500" />
            Oturumu Senkronize Et
          </DialogTitle>
          <DialogDescription>
            Mobil cihazınızdan masaüstünü kontrol edin veya tam tersi. QR kod tarayın veya kod girin.
          </DialogDescription>
        </DialogHeader>
        
        {/* Connection Status */}
        {isConnected && (
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-emerald-400">
                {isHost ? 'Oturum Aktif' : 'Bağlı'}
              </span>
              {sessionCode && (
                <Badge variant="outline" className="text-xs">
                  {sessionCode}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {deviceCount} cihaz
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={handleDisconnect}
              >
                <WifiOff className="h-3 w-3 mr-1" />
                Kes
              </Button>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        
        {!isConnected ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'host' | 'join')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="host" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Oturum Aç
              </TabsTrigger>
              <TabsTrigger value="join" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Katıl
              </TabsTrigger>
            </TabsList>
            
            {/* Host Tab - Create Session */}
            <TabsContent value="host" className="space-y-4 mt-4">
              <p className="text-sm text-slate-400">
                Bu cihazı ana cihaz olarak ayarlayın. Diğer cihazlar bu cihazı kontrol edebilir.
              </p>
              
              <Button
                className="w-full"
                onClick={handleCreateSession}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4 mr-2" />
                    Yeni Oturum Oluştur
                  </>
                )}
              </Button>
            </TabsContent>
            
            {/* Join Tab - Join Session */}
            <TabsContent value="join" className="space-y-4 mt-4">
              <p className="text-sm text-slate-400">
                QR kod tarayın veya oturum kodunu girin.
              </p>
              
              {/* Camera Scanner */}
              <div className="space-y-2">
                <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                  {cameraActive ? (
                    <video
                      ref={setVideoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      autoPlay
                      muted
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Camera className="h-8 w-8 text-slate-600" />
                      <span className="text-xs text-slate-500">QR Tarayıcı</span>
                    </div>
                  )}
                  
                  {/* Camera overlay */}
                  {cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-yellow-500/50 rounded-lg" />
                    </div>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={cameraActive ? stopCamera : startCamera}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {cameraActive ? 'Kamerayı Kapat' : 'QR Kod Tara'}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-slate-500">veya</span>
                <Separator className="flex-1" />
              </div>
              
              {/* Manual Code Entry */}
              <div className="space-y-2">
                <Label htmlFor="join-code">Oturum Kodu</Label>
                <div className="flex gap-2">
                  <Input
                    id="join-code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABCD1234"
                    maxLength={8}
                    className="font-mono text-center text-lg tracking-widest uppercase"
                  />
                  <Button onClick={handleJoinSession} disabled={isConnecting || !joinCode.trim()}>
                    {isConnecting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Katıl'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : isHost ? (
          /* Host View - Show QR and Code */
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Diğer cihazlardan bu kodu taratın veya girin:
            </p>
            
            {/* QR Code */}
            {qrDataUrl && (
              <div className="flex justify-center">
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}
            
            {/* Session Code */}
            <div className="flex items-center justify-center gap-2 p-4 bg-slate-900 rounded-lg border border-slate-700">
              <span className="font-mono text-2xl tracking-widest text-yellow-500">
                {sessionCode}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopyCode}
                className="h-8 w-8"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Copy Link Button */}
            <Button variant="outline" className="w-full" onClick={handleCopyLink}>
              <Link2 className="h-4 w-4 mr-2" />
              Bağlantı Linkini Kopyala
            </Button>
            
            {/* Connected Devices */}
            {connectedDevices.length > 0 && (
              <div className="space-y-2">
                <Label>Bağlı Cihazlar ({connectedDevices.length})</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {connectedDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <DeviceIcon type={device.device_type} className="h-4 w-4 text-slate-400" />
                        <span className="text-sm">{device.device_name || 'Bilinmeyen Cihaz'}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {device.device_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Client View - Connected */
          <div className="space-y-4">
            <div className="text-center py-8">
              <Wifi className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Bağlandınız!</h3>
              <p className="text-sm text-slate-400">
                Artık Akıllı Kumanda ile uzaktan kontrol edebilirsiniz.
              </p>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Kumandayı Aç
            </Button>
          </div>
        )}
        
        <DialogFooter className="text-xs text-slate-500">
          <p>
            Oturum 24 saat sonra veya 5 dakika hareketsizlik sonrası kapanır.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
