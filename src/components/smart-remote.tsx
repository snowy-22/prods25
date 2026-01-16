'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Volume2, VolumeX, Settings, RotateCcw, 
  Zap, X, ChevronDown, ChevronUp, Eye, LayoutGrid, Radio,
  Sliders, Wifi, WifiOff, QrCode, Camera, Smartphone, Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { useRemoteSync, RemoteCommand } from '@/hooks/use-remote-sync';
import { SessionSyncDialog } from './session-sync-dialog';
import { useToast } from '@/hooks/use-toast';

interface PlayerInfo {
  id: string;
  type: 'video' | 'audio';
  title: string;
  isMuted: boolean;
  isPlaying: boolean;
  volume: number;
  quality?: string;
  source?: string;
}

interface SmartRemoteProps {
  className?: string;
  onClose?: () => void;
}

const QUALITY_OPTIONS = [
  { label: '144p', value: '144' },
  { label: '240p', value: '240' },
  { label: '360p', value: '360' },
  { label: '480p', value: '480' },
  { label: '720p', value: '720' },
  { label: '1080p', value: '1080' },
  { label: '1440p', value: '1440' },
  { label: '4K', value: '2160' },
];

export function SmartRemote({ className, onClose }: SmartRemoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [masterVolume, setMasterVolume] = useState(100);
  const [selectedQuality, setSelectedQuality] = useState('720');
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopInterval, setLoopInterval] = useState(5);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('player');
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // Store selectors for control center features
  const {
    pointerFrameEnabled,
    audioTrackerEnabled,
    mouseTrackerEnabled,
    virtualizerMode,
    visualizerMode,
    layoutMode,
    gridModeState,
    isUiHidden,
    isSecondLeftSidebarOpen,
    // Actions
    setPointerFrameEnabled,
    setAudioTrackerEnabled,
    setMouseTrackerEnabled,
    setVirtualizerMode,
    setVisualizerMode,
    setLayoutMode,
    setGridColumns,
    setGridModeEnabled,
    setIsUiHidden,
    togglePanel,
  } = useAppStore();

  // Remote sync hook for cross-device control
  const {
    session,
    sessionCode,
    connectedDevices,
    isConnected,
    isHost,
    deviceCount,
    sendCommand,
    updatePlayerState,
    markCommandExecuted,
  } = useRemoteSync({
    onCommand: useCallback((command: RemoteCommand) => {
      // Handle incoming commands from remote devices
      handleRemoteCommand(command);
    }, []),
  });

  // Handle remote commands
  const handleRemoteCommand = useCallback((command: RemoteCommand) => {
    const { command_type, payload, target_player_id } = command;
    
    switch (command_type) {
      case 'play':
        handlePlayPauseAll(true);
        break;
      case 'pause':
        handlePlayPauseAll(false);
        break;
      case 'play_pause':
        if (target_player_id) {
          // Toggle specific player
          const player = document.querySelector(`[data-player-id="${target_player_id}"]`) as HTMLMediaElement;
          if (player) {
            player.paused ? player.play() : player.pause();
          }
        } else {
          // Toggle all
          const anyPlaying = players.some(p => p.isPlaying);
          handlePlayPauseAll(!anyPlaying);
        }
        break;
      case 'volume':
        if (payload.volume !== undefined) {
          handleVolumeChange([payload.volume]);
        }
        break;
      case 'mute':
        handleMuteAll(true);
        break;
      case 'unmute':
        handleMuteAll(false);
        break;
      case 'seek':
        if (payload.time !== undefined) {
          document.querySelectorAll('video, audio').forEach((media: any) => {
            media.currentTime = payload.time;
          });
        }
        break;
      case 'quality':
        if (payload.quality) {
          handleQualityChange(payload.quality);
        }
        break;
      case 'loop':
        setLoopEnabled(payload.enabled ?? !loopEnabled);
        break;
      case 'fullscreen':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
        break;
      case 'layout_change':
        if (payload.mode) {
          setLayoutMode(payload.mode);
        }
        break;
      case 'grid_columns':
        if (payload.columns) {
          setGridColumns(payload.columns);
        }
        break;
      case 'sidebar_toggle':
        togglePanel('isSecondLeftSidebarOpen');
        break;
      case 'ui_toggle':
        setIsUiHidden(!isUiHidden);
        break;
      case 'navigate':
        // Handle tab/view navigation
        if (payload.tabId) {
          // This would need access to tab navigation functions
          console.log('Navigate to:', payload.tabId, payload.viewId);
        }
        break;
      case 'request_state':
        // Send current state to requester
        syncCurrentState();
        break;
    }
    
    // Mark command as executed
    markCommandExecuted(command.id, true);
    
    toast({
      title: 'Uzaktan Komut',
      description: `${command_type} komutu alındı`,
      duration: 2000,
    });
  }, [players, loopEnabled, isUiHidden, setLayoutMode, setGridColumns, togglePanel, setIsUiHidden, markCommandExecuted, toast]);

  // Sync current state to remote devices
  const syncCurrentState = useCallback(async () => {
    if (!isConnected) return;
    
    // Sync player states
    players.forEach(async (player) => {
      await updatePlayerState({
        player_id: player.id,
        player_type: player.source || 'unknown',
        title: player.title,
        is_playing: player.isPlaying,
        is_muted: player.isMuted,
        volume: player.volume,
        quality: player.quality || null,
      });
    });
  }, [isConnected, players, updatePlayerState]);

  // Detect active players on mount and when DOM changes
  useEffect(() => {
    const detectPlayers = () => {
      const detected: PlayerInfo[] = [];
      
      // YouTube iframes
      const youtubeIframes = document.querySelectorAll('iframe[src*="youtube"]');
      youtubeIframes.forEach((iframe, idx) => {
        detected.push({
          id: `youtube-${idx}`,
          type: 'video',
          title: `YouTube Video ${idx + 1}`,
          isMuted: false,
          isPlaying: false,
          volume: 100,
          source: 'youtube',
        });
      });

      // HTML5 video players
      const videos = document.querySelectorAll('video');
      videos.forEach((video, idx) => {
        detected.push({
          id: `video-${idx}`,
          type: 'video',
          title: `Video ${idx + 1}`,
          isMuted: video.muted,
          isPlaying: !video.paused,
          volume: Math.round(video.volume * 100),
          source: 'html5-video',
        });
      });

      // Audio players
      const audios = document.querySelectorAll('audio');
      audios.forEach((audio, idx) => {
        detected.push({
          id: `audio-${idx}`,
          type: 'audio',
          title: `Audio ${idx + 1}`,
          isMuted: audio.muted,
          isPlaying: !audio.paused,
          volume: Math.round(audio.volume * 100),
          source: 'html5-audio',
        });
      });

      setPlayers(detected);
    };

    detectPlayers();
    
    // Listen for DOM changes
    const observer = new MutationObserver(detectPlayers);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const handlePlayPauseAll = (play: boolean) => {
    document.querySelectorAll('video, audio').forEach((media: any) => {
      if (play) {
        media.play().catch(() => {});
      } else {
        media.pause();
      }
    });
  };

  const handleMuteAll = (mute: boolean) => {
    document.querySelectorAll('video, audio').forEach((media: any) => {
      media.muted = mute;
    });
    setPlayers(prev => prev.map(p => ({ ...p, isMuted: mute })));
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0] / 100;
    setMasterVolume(value[0]);
    document.querySelectorAll('video, audio').forEach((media: any) => {
      media.volume = vol;
    });
  };

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    // YouTube player quality change would need API integration
    // This is a placeholder for the control interface
  };

  const handleLoopIntervalChange = (value: string) => {
    const interval = parseInt(value) || 5;
    setLoopInterval(Math.max(1, interval));
  };

  const toggleLoopInterval = () => {
    setLoopEnabled(!loopEnabled);
    if (!loopEnabled) {
      // Start loop interval
      console.log(`Loop interval: ${loopInterval} seconds`);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Smart Remote Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 relative"
        onClick={() => setIsOpen(!isOpen)}
        title="Akıllı Kumanda (Smart Remote)"
      >
        <Zap className="h-4 w-4" />
        {players.length > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </Button>

      {/* Smart Remote Panel */}
      {isOpen && (
        <div className="fixed bottom-[calc(100vh-60px)] right-4 w-96 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold">Akıllı Kumanda & Kontroller</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b border-slate-800 bg-transparent p-0">
              <TabsTrigger value="player" className="rounded-none data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-500">
                <Play className="h-3 w-3 mr-1" />
                Oynatıcı
              </TabsTrigger>
              <TabsTrigger value="sync" className="rounded-none data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 relative">
                <Wifi className="h-3 w-3 mr-1" />
                Senkron
                {isConnected && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="media" className="rounded-none data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
                <Radio className="h-3 w-3 mr-1" />
                Ortam
              </TabsTrigger>
              <TabsTrigger value="display" className="rounded-none data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                <Eye className="h-3 w-3 mr-1" />
                Görünüm
              </TabsTrigger>
              <TabsTrigger value="layout" className="rounded-none data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500">
                <LayoutGrid className="h-3 w-3 mr-1" />
                Düzen
              </TabsTrigger>
            </TabsList>

            {/* Player Tab Content */}
            <TabsContent value="player" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
              <span className="text-xs text-slate-400">
                {players.length} oynatıcı tespit edildi
              </span>
            {players.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Aktif oynatıcı bulunamadı
              </p>
            ) : (
              <>
                {/* Video Controls Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase">
                    Video Kontrolleri
                  </h4>

                  {/* Play/Pause Controls */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={() => handlePlayPauseAll(true)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Tüm Oynat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={() => handlePlayPauseAll(false)}
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Tüm Duraklat
                    </Button>
                  </div>

                  {/* Mute Controls */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={() => handleMuteAll(false)}
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Sesi Aç
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={() => handleMuteAll(true)}
                    >
                      <VolumeX className="h-3 w-3 mr-1" />
                      Sesi Kapat
                    </Button>
                  </div>

                  {/* Master Volume */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">
                      Ana Ses Seviyesi: {masterVolume}%
                    </label>
                    <Slider
                      value={[masterVolume]}
                      onValueChange={handleVolumeChange}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Quality Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">
                      Oynatıcı Kalitesi
                    </label>
                    <select
                      value={selectedQuality}
                      onChange={(e) => handleQualityChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200"
                    >
                      {QUALITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Loop Interval */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={loopEnabled ? 'default' : 'outline'}
                        className="h-8 flex-1"
                        onClick={toggleLoopInterval}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Döngü Aralığı
                      </Button>
                    </div>
                    {loopEnabled && (
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          min="1"
                          max="300"
                          value={loopInterval}
                          onChange={(e) => handleLoopIntervalChange(e.target.value)}
                          placeholder="Saniye"
                          className="h-8 text-xs"
                        />
                        <span className="text-xs text-slate-400">saniye</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Players List */}
                {players.length > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full flex items-center justify-between text-xs font-medium text-slate-300 mb-2"
                    >
                      <span>Aktif Oynatıcılar ({players.length})</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {players.map((player) => (
                          <div
                            key={player.id}
                            className="text-xs p-2 bg-slate-900/50 rounded border border-slate-800"
                          >
                            <p className="text-slate-300 truncate">
                              {player.title}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {player.source} • {player.isPlaying ? 'Oynatılıyor' : 'Durdurulmuş'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            </TabsContent>

            {/* Sync Tab Content */}
            <TabsContent value="sync" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
              <div className="space-y-4">
                {/* Connection Status */}
                <div className={cn(
                  "p-4 rounded-lg border-2 flex items-center gap-3",
                  isConnected 
                    ? "bg-emerald-950/30 border-emerald-500/50" 
                    : "bg-slate-900/50 border-slate-700"
                )}>
                  {isConnected ? (
                    <Wifi className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-slate-400" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      isConnected ? "text-emerald-400" : "text-slate-300"
                    )}>
                      {isConnected 
                        ? isHost ? 'Oturum Aktif (Host)' : 'Bağlandı (İzleyici)'
                        : 'Bağlı Değil'}
                    </p>
                    {session && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kod: <span className="font-mono text-cyan-400">{session.session_code}</span>
                        {' • '}{connectedDevices.length} cihaz
                      </p>
                    )}
                  </div>
                  {isConnected && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      Canlı
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={isConnected ? "outline" : "default"}
                    className="h-10"
                    onClick={() => setIsSyncDialogOpen(true)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {isConnected ? 'Oturumu Yönet' : 'Oturumu Senkronize Et'}
                  </Button>
                  {isConnected && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10"
                      onClick={syncCurrentState}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Durumu Senkronize Et
                    </Button>
                  )}
                </div>

                {/* Connected Devices */}
                {isConnected && connectedDevices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase">
                      Bağlı Cihazlar ({connectedDevices.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {connectedDevices.map((device) => (
                        <div
                          key={device.session_id}
                          className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg border border-slate-800"
                        >
                          {device.device_type === 'mobile' ? (
                            <Smartphone className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Monitor className="h-4 w-4 text-purple-400" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 truncate">
                              {device.device_name || 'Bilinmeyen Cihaz'}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {device.device_type} • {device.is_host ? 'Host' : 'İzleyici'}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px]",
                              device.is_host 
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            )}
                          >
                            {device.is_host ? 'Host' : 'Bağlı'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions when Connected */}
                {isConnected && isHost && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase">
                      Hızlı Komutlar
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => sendCommand({ command_type: 'play', payload: {} })}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Tümünü Oynat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => sendCommand({ command_type: 'pause', payload: {} })}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Tümünü Durdur
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => sendCommand({ command_type: 'mute', payload: { muted: true } })}
                      >
                        <VolumeX className="h-3 w-3 mr-1" />
                        Sesi Kapat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => sendCommand({ command_type: 'mute', payload: { muted: false } })}
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        Sesi Aç
                      </Button>
                    </div>
                  </div>
                )}

                {/* Disconnect Button */}
                {isConnected && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full h-9"
                    onClick={disconnect}
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    Bağlantıyı Kes
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Media Tab Content */}
            <TabsContent value="media" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase">Ortam Kontrolleri</h4>
                
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-xs text-slate-300">Sesli Çerçeve</span>
                  <Switch
                    checked={audioTrackerEnabled}
                    onCheckedChange={setAudioTrackerEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-xs text-slate-300">Fare İzleyici</span>
                  <Switch
                    checked={mouseTrackerEnabled}
                    onCheckedChange={setMouseTrackerEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-xs text-slate-300">Gösterge</span>
                  <Switch
                    checked={virtualizerMode}
                    onCheckedChange={setVirtualizerMode}
                  />
                </div>

                <Separator className="bg-slate-700/30" />

                <div className="space-y-2">
                  <span className="text-xs text-slate-300 block">Görselleştirme Modu</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['off', 'bars', 'wave', 'circular', 'particles'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setVisualizerMode(mode)}
                        className={cn(
                          "px-3 py-2 text-xs rounded transition-all",
                          visualizerMode === mode
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                        )}
                      >
                        {mode === 'off' ? 'Kapalı' : mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Display Tab Content */}
            <TabsContent value="display" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase">Görünüm Kontrolleri</h4>
                
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-xs text-slate-300">UI Gizle</span>
                  <Switch
                    checked={isUiHidden}
                    onCheckedChange={setIsUiHidden}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-xs text-slate-300">Gösterge Paneli</span>
                  <Switch
                    checked={pointerFrameEnabled}
                    onCheckedChange={setPointerFrameEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-xs text-slate-300">Kenar Çubuğu</span>
                  <Switch
                    checked={isSecondLeftSidebarOpen}
                    onCheckedChange={() => togglePanel('isSecondLeftSidebarOpen')}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Layout Tab Content */}
            <TabsContent value="layout" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase">Düzen Kontrolleri</h4>
                
                <div className="space-y-2">
                  <span className="text-xs text-slate-300 block">Düzen Modu</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['grid', 'canvas'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setLayoutMode(mode)}
                        className={cn(
                          "px-3 py-2 text-xs rounded transition-all",
                          layoutMode === mode
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                        )}
                      >
                        {mode === 'grid' ? 'İzgara' : 'Kanvas'}
                      </button>
                    ))}
                  </div>
                </div>

                {gridModeState.enabled && (
                  <>
                    <Separator className="bg-slate-700/30" />
                    
                    <div className="space-y-2">
                      <span className="text-xs text-slate-300 block">Sütun Sayısı</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 3, 4, 5].map((col) => (
                          <button
                            key={col}
                            onClick={() => setGridColumns(col)}
                            className={cn(
                              "px-3 py-2 text-xs rounded transition-all",
                              gridModeState.columns === col
                                ? 'bg-purple-500 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            )}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-xs text-slate-300">İzgara Modu</span>
                      <Switch
                        checked={gridModeState.enabled}
                        onCheckedChange={setGridModeEnabled}
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Session Sync Dialog */}
      <SessionSyncDialog 
        open={isSyncDialogOpen} 
        onOpenChange={setIsSyncDialogOpen}
      />
    </div>
  );
}
