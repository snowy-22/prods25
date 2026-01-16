'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Radio, Users, Settings, Share2, Eye, Lock, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface StreamSharerProps {
  className?: string;
}

export function StreamSharer({ className }: StreamSharerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [streamUrl] = useState('https://canvas.local/stream/live-session');
  const [viewers, setViewers] = useState(0);
  const [shareMode, setShareMode] = useState<'public' | 'private' | 'link'>('link');
  
  const { toast } = useToast();
  const { 
    presentations,
    currentPresentationId,
    scenes,
    currentSceneId,
    broadcastSessions,
    startBroadcastSession,
    endBroadcastSession,
  } = useAppStore();

  const handleStartStream = async () => {
    try {
      if (!currentPresentationId) {
        toast({
          title: 'Hata',
          description: 'Lütfen önce bir sunum seçin',
          variant: 'destructive'
        });
        return;
      }

      const presentation = presentations.find(p => p.id === currentPresentationId);
      if (!presentation) {
        toast({
          title: 'Hata',
          description: 'Lütfen önce bir sunum seçin',
          variant: 'destructive'
        });
        return;
      }

      // Start broadcast session
      const session = await startBroadcastSession(
        currentPresentationId,
        {
          platform: 'custom',
          resolution: '1080p',
          bitrate: 6000,
          fps: 30,
          audioEnabled: true,
          recordStream: true,
          saveReplay: true
        }
      );

      setIsBroadcasting(true);
      setViewers(1); // Start with host as viewer
      
      toast({
        title: 'Yayın Başladı',
        description: `Sunumunuz şimdi yayında: ${presentation.title}`
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Yayın başlatılamadı',
        variant: 'destructive'
      });
    }
  };

  const handleStopStream = async () => {
    try {
      const session = broadcastSessions.find(s => s.status === 'live');
      if (session) {
        await endBroadcastSession(session.id);
      }
      
      setIsBroadcasting(false);
      setViewers(0);
      
      toast({
        title: 'Yayın Sona Erdi',
        description: 'Sunumunuz artık yayında değil'
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Yayın durdurulurken hata oluştu',
        variant: 'destructive'
      });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(streamUrl);
    toast({
      title: 'Kopyalandı',
      description: 'Yayın linki panoya kopyalandı'
    });
  };

  return (
    <>
      {/* Stream Sharer Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9 relative", className)}
        onClick={() => setIsOpen(true)}
        title="Yayın Paylaştırıcı (Stream Sharer)"
      >
        <Radio className="h-4 w-4" />
        {isBroadcasting && (
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>

      {/* Stream Sharer Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500" />
              Yayın Paylaştırıcı
            </DialogTitle>
            <DialogDescription>
              Sunumunuzu canlı yayında izleyicilerinizle paylaşın
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="broadcast" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="broadcast">Yayın</TabsTrigger>
              <TabsTrigger value="share">Paylaş</TabsTrigger>
              <TabsTrigger value="settings">Ayarlar</TabsTrigger>
            </TabsList>

            {/* Broadcast Tab */}
            <TabsContent value="broadcast" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Broadcast Status */}
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  isBroadcasting 
                    ? "bg-red-950/30 border-red-500/50" 
                    : "bg-slate-900/50 border-slate-700"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        isBroadcasting ? "text-red-400" : "text-slate-300"
                      )}>
                        {isBroadcasting ? '🔴 Canlı Yayında' : '⚫ Yayında Değil'}
                      </p>
                      {isBroadcasting && (
                        <p className="text-xs text-slate-400 mt-1">
                          {viewers} {viewers === 1 ? 'izleyici' : 'izleyici'}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant="outline"
                      className={isBroadcasting ? "bg-red-500/10 text-red-400" : "bg-slate-700/50 text-slate-400"}
                    >
                      {isBroadcasting ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>

                {/* Current Presentation */}
                {currentPresentationId && presentations.find(p => p.id === currentPresentationId) && (
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Mevcut Sunum</p>
                    <p className="text-sm font-medium text-white">
                      {presentations.find(p => p.id === currentPresentationId)?.title || 'Bilinmeyen Sunum'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {scenes.filter(s => s.presentation_id === currentPresentationId).length} sahne
                    </p>
                  </div>
                )}

                {/* Broadcast Controls */}
                <div className="flex gap-2">
                  {!isBroadcasting ? (
                    <Button
                      onClick={handleStartStream}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      <Radio className="h-4 w-4 mr-2" />
                      Yayını Başlat
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopStream}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Radio className="h-4 w-4 mr-2" />
                      Yayını Durdur
                    </Button>
                  )}
                </div>

                {/* Viewer Count */}
                {isBroadcasting && (
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-slate-300">
                        Canlı İzleyici: <span className="font-semibold text-blue-400">{viewers}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Share Tab */}
            <TabsContent value="share" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Share Mode Selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">Paylaşım Modu</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['public', 'private', 'link'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setShareMode(mode as any)}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all text-sm font-medium",
                          shareMode === mode
                            ? "bg-blue-500/20 border-blue-500 text-blue-400"
                            : "bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600"
                        )}
                      >
                        {mode === 'public' && <><Globe className="h-4 w-4 mx-auto mb-1" /> Herkese Açık</>}
                        {mode === 'private' && <><Lock className="h-4 w-4 mx-auto mb-1" /> Özel</>}
                        {mode === 'link' && <><Share2 className="h-4 w-4 mx-auto mb-1" /> Link</>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Share Link */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">Yayın Linki</p>
                  <div className="flex gap-2">
                    <Input
                      value={streamUrl}
                      readOnly
                      className="bg-slate-900/50 border-slate-700 text-slate-300"
                    />
                    <Button
                      size="sm"
                      onClick={copyShareLink}
                      variant="outline"
                      className="px-3"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-center">
                  <div className="w-32 h-32 bg-slate-800 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-xs text-slate-500">QR Kod</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    İzleyiciler QR kodu tarayarak yayına katılabilirler
                  </p>
                </div>

                {/* Social Share */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">Sosyal Ağlarda Paylaş</p>
                  <div className="grid grid-cols-4 gap-2">
                    {['Twitter', 'Facebook', 'LinkedIn', 'Telegram'].map((platform) => (
                      <Button
                        key={platform}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => toast({ title: `${platform}'de paylaşıldı` })}
                      >
                        {platform}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Stream Quality */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">Yayın Kalitesi</p>
                  <select className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200">
                    <option>Otomatik</option>
                    <option>1080p 60fps</option>
                    <option>1080p 30fps</option>
                    <option>720p 60fps</option>
                    <option>720p 30fps</option>
                    <option>480p 30fps</option>
                  </select>
                </div>

                {/* Recording Settings */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-300">Yayını Kaydet</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-300">Chat Etkinleştir</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-300">Yorumları Göster</span>
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
