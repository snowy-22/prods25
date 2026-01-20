'use client';

/**
 * Audio Control Widget
 * Complete audio studio with microphone test, speaker test, 
 * EQ, source mixer, and Philips Hue-style color sync
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Volume1,
  Headphones,
  Play,
  Square,
  Settings,
  Sliders,
  Radio,
  Tv,
  Music,
  MonitorSpeaker,
  Activity,
  Waves,
  Palette,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContentItem } from '@/lib/initial-content';
import { getAudioEngine, AudioSource, AudioAnalysisData, EQ_PRESETS } from '@/lib/audio-engine';

interface AudioControlWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
  compact?: boolean;
}

interface SourceDisplayProps {
  source: AudioSource;
  analysis: AudioAnalysisData | null;
  onLevelChange: (level: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onRemove: () => void;
}

// VU Meter component
const VUMeter: React.FC<{ level: number; peak: number }> = ({ level, peak }) => {
  const bars = 20;
  const levelBars = Math.floor(level * bars);
  const peakBar = Math.floor(peak * bars);

  return (
    <div className="flex gap-0.5 h-24 items-end">
      {Array.from({ length: bars }).map((_, i) => {
        const isActive = i < levelBars;
        const isPeak = i === peakBar;
        let color = 'bg-green-500';
        if (i > bars * 0.6) color = 'bg-yellow-500';
        if (i > bars * 0.85) color = 'bg-red-500';
        
        return (
          <div
            key={i}
            className={cn(
              'w-1.5 rounded-sm transition-all duration-75',
              isActive ? color : 'bg-muted/30',
              isPeak && 'ring-1 ring-white'
            )}
            style={{ height: `${(i + 1) * 5}%` }}
          />
        );
      })}
    </div>
  );
};

// Spectrum Analyzer component
const SpectrumAnalyzer: React.FC<{ spectrum: Uint8Array | null; color?: string }> = ({ spectrum, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !spectrum) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = Math.min(64, spectrum.length / 2);
    const barWidth = width / barCount;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      const value = spectrum[i] / 255;
      const barHeight = value * height;
      const hue = color ? undefined : (i / barCount) * 240;
      
      ctx.fillStyle = color || `hsl(${hue}, 80%, 50%)`;
      ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 1,
        barHeight
      );
    }
  }, [spectrum, color]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={64}
      className="w-full h-16 rounded bg-black/20"
    />
  );
};

// Source display component
const SourceDisplay: React.FC<SourceDisplayProps> = ({
  source,
  analysis,
  onLevelChange,
  onMuteToggle,
  onSoloToggle,
  onRemove
}) => {
  const getSourceIcon = () => {
    switch (source.type) {
      case 'microphone': return <Mic className="w-4 h-4" />;
      case 'tab': return <MonitorSpeaker className="w-4 h-4" />;
      case 'media-element': return <Tv className="w-4 h-4" />;
      case 'stream': return <Radio className="w-4 h-4" />;      case 'youtube': return <Tv className="w-4 h-4" />;
      case 'speaker': return <MonitorSpeaker className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'p-3 rounded-lg border bg-card/50',
        source.muted && 'opacity-50',
        source.solo && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-primary/10 text-primary">
          {getSourceIcon()}
        </div>
        <span className="text-sm font-medium flex-1 truncate">{source.name}</span>
        <Badge variant="outline" className="text-xs">
          {source.type}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Mini VU */}
        <div className="flex gap-0.5 h-8">
          {[0, 1, 2, 3, 4].map(i => {
            const threshold = i * 0.2;
            const isActive = (analysis?.average || 0) > threshold;
            return (
              <div
                key={i}
                className={cn(
                  'w-1 rounded-full transition-all',
                  isActive 
                    ? i < 3 ? 'bg-green-500' : i < 4 ? 'bg-yellow-500' : 'bg-red-500'
                    : 'bg-muted/30'
                )}
                style={{ height: `${(i + 1) * 20}%` }}
              />
            );
          })}
        </div>

        {/* Volume Slider */}
        <div className="flex-1">
          <Slider
            value={[source.level * 100]}
            onValueChange={([v]) => onLevelChange(v / 100)}
            max={200}
            step={1}
            className="w-full"
          />
        </div>

        {/* Controls */}
        <div className="flex gap-1">
          <Button
            size="icon"
            variant={source.muted ? 'destructive' : 'ghost'}
            className="h-7 w-7"
            onClick={onMuteToggle}
          >
            {source.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </Button>
          <Button
            size="icon"
            variant={source.solo ? 'default' : 'ghost'}
            className="h-7 w-7"
            onClick={onSoloToggle}
          >
            <Headphones className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export function AudioControlWidget({ item, onUpdate, compact = false }: AudioControlWidgetProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [sources, setSources] = useState<AudioSource[]>([]);
  const [masterLevel, setMasterLevel] = useState(0.8);
  const [masterAnalysis, setMasterAnalysis] = useState<AudioAnalysisData | null>(null);
  const [sourceAnalysis, setSourceAnalysis] = useState<Record<string, AudioAnalysisData>>({});
  const [eqGains, setEqGains] = useState({ low: 0, mid: 0, high: 0 });
  const [selectedPreset, setSelectedPreset] = useState('flat');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [isTestingTone, setIsTestingTone] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(true);
  const [activeTab, setActiveTab] = useState('mixer');
  const audioEngineRef = useRef(getAudioEngine());

  // Initialize audio engine
  const initializeAudio = useCallback(async () => {
    try {
      await audioEngineRef.current.initialize();
      setIsInitialized(true);
      
      // Subscribe to analysis updates
      audioEngineRef.current.onAnalysis((analysisMap) => {
        // Convert Map to Record for state
        const srcAnalysis: Record<string, AudioAnalysisData> = {};
        analysisMap.forEach((analysis, id) => {
          srcAnalysis[id] = analysis;
        });
        setSourceAnalysis(srcAnalysis);
        // Get master analysis if exists
        const masterData = analysisMap.get('master');
        if (masterData) {
          setMasterAnalysis(masterData);
        }
      });
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }, []);

  useEffect(() => {
    initializeAudio();
    return () => {
      // Cleanup
      if (isTestingMic) {
        audioEngineRef.current.removeSource('mic-test');
      }
    };
  }, [initializeAudio]);

  // Sync sources
  useEffect(() => {
    const interval = setInterval(() => {
      const sourcesMap = audioEngineRef.current.getSources();
      setSources(Array.from(sourcesMap.values()));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Add microphone
  const addMicrophone = async () => {
    try {
      await audioEngineRef.current.addMicrophone('mic-main');
      setSources(Array.from(audioEngineRef.current.getSources().values()));
    } catch (error) {
      console.error('Failed to add microphone:', error);
    }
  };

  // Add tab audio
  const addTabAudio = async () => {
    try {
      await audioEngineRef.current.captureTabAudio('tab-audio');
      setSources(Array.from(audioEngineRef.current.getSources().values()));
    } catch (error) {
      console.error('Failed to capture tab audio:', error);
    }
  };

  // Test microphone
  const testMicrophone = async () => {
    if (isTestingMic) {
      audioEngineRef.current.removeSource('mic-test');
      setIsTestingMic(false);
    } else {
      try {
        await audioEngineRef.current.addMicrophone('mic-test');
        setIsTestingMic(true);
      } catch (error) {
        console.error('Microphone test failed:', error);
      }
    }
  };

  // Test speaker
  const testSpeaker = async () => {
    if (isTestingTone) {
      audioEngineRef.current.stopTestTone();
      setIsTestingTone(false);
    } else {
      audioEngineRef.current.playTestTone(440, 2000);
      setIsTestingTone(true);
      setTimeout(() => setIsTestingTone(false), 2000);
    }
  };

  // EQ control
  const handleEQChange = (band: 'low' | 'mid' | 'high', value: number) => {
    const gain = (value - 50) * 0.4; // -20 to +20 dB
    audioEngineRef.current.setEQGain(band, gain);
    setEqGains(prev => ({ ...prev, [band]: gain }));
    setSelectedPreset('custom');
  };

  // Apply preset
  const applyPreset = (presetName: string) => {
    const preset = EQ_PRESETS.find(p => p.name.toLowerCase().replace(' ', '-') === presetName);
    if (preset) {
      audioEngineRef.current.applyEQPreset(preset);
      setEqGains({
        low: preset.bands.low,
        mid: preset.bands.mid,
        high: preset.bands.high
      });
      setSelectedPreset(presetName);
    }
  };

  // Handle source level
  const handleSourceLevel = (sourceId: string, level: number) => {
    audioEngineRef.current.setSourceLevel(sourceId, level);
  };

  // Toggle mute
  const toggleMute = (sourceId: string) => {
    audioEngineRef.current.toggleSourceMute(sourceId);
    setSources(Array.from(audioEngineRef.current.getSources().values()));
  };

  // Toggle solo
  const toggleSolo = (sourceId: string) => {
    audioEngineRef.current.toggleSourceSolo(sourceId);
    setSources(Array.from(audioEngineRef.current.getSources().values()));
  };

  // Remove source
  const removeSource = (sourceId: string) => {
    audioEngineRef.current.removeSource(sourceId);
    setSources(Array.from(audioEngineRef.current.getSources().values()));
  };

  // Handle master level
  const handleMasterLevel = (level: number) => {
    audioEngineRef.current.setMasterLevel(level);
    setMasterLevel(level);
  };

  // Detect YouTube iframes on the page
  const detectYouTubeIframes = useCallback(() => {
    const iframes = document.querySelectorAll('iframe[src*="youtube"]');
    return Array.from(iframes);
  }, []);

  // Add YouTube source
  const addYouTubeSource = async (iframe: HTMLIFrameElement) => {
    try {
      // Note: Cross-origin YouTube iframes cannot be directly captured
      // This would require the video element to be same-origin
      console.log('YouTube iframe detected but cross-origin restrictions apply');
    } catch (error) {
      console.error('Failed to add YouTube source:', error);
    }
  };

  if (compact) {
    return (
      <div className="p-2 rounded-lg bg-card/50 border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Ses Kontrolü</span>
          <div className="flex-1">
            <Slider
              value={[masterLevel * 100]}
              onValueChange={([v]) => handleMasterLevel(v / 100)}
              max={100}
              className="w-full"
            />
          </div>
          <div className="flex gap-0.5 h-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={cn(
                  'w-1 rounded-full',
                  (masterAnalysis?.average || 0) > i * 0.33 ? 'bg-primary' : 'bg-muted/30'
                )}
                style={{ height: `${(i + 1) * 33}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background/95 backdrop-blur rounded-xl border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sliders className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Ses Stüdyosu</h3>
            <p className="text-xs text-muted-foreground">
              {sources.length} kaynak aktif
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showSpectrum ? 'default' : 'outline'}
            onClick={() => setShowSpectrum(!showSpectrum)}
          >
            {showSpectrum ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          {!isInitialized && (
            <Button size="sm" onClick={initializeAudio}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Başlat
            </Button>
          )}
        </div>
      </div>

      {/* Spectrum Analyzer */}
      <AnimatePresence>
        {showSpectrum && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-b bg-black/10"
          >
            <SpectrumAnalyzer spectrum={masterAnalysis?.spectrum || null} />
            {masterAnalysis?.dominantColor && (
              <div className="mt-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/20"
                  style={{
                    backgroundColor: `rgb(${masterAnalysis.dominantColor.r}, ${masterAnalysis.dominantColor.g}, ${masterAnalysis.dominantColor.b})`
                  }}
                />
                <span className="text-xs text-muted-foreground">Baskın Renk</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-4 mt-2">
          <TabsTrigger value="mixer">Mixer</TabsTrigger>
          <TabsTrigger value="eq">Ekolayzer</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Mixer Tab */}
          <TabsContent value="mixer" className="p-4 space-y-4 m-0">
            {/* Add Source Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={addMicrophone}>
                <Mic className="w-4 h-4 mr-1" />
                Mikrofon
              </Button>
              <Button size="sm" variant="outline" onClick={addTabAudio}>
                <MonitorSpeaker className="w-4 h-4 mr-1" />
                Sekme Sesi
              </Button>
            </div>

            {/* Sources List */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {sources.map(source => (
                  <SourceDisplay
                    key={source.id}
                    source={source}
                    analysis={sourceAnalysis[source.id] || null}
                    onLevelChange={(level) => handleSourceLevel(source.id, level)}
                    onMuteToggle={() => toggleMute(source.id)}
                    onSoloToggle={() => toggleSolo(source.id)}
                    onRemove={() => removeSource(source.id)}
                  />
                ))}
              </AnimatePresence>

              {sources.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Henüz ses kaynağı yok</p>
                  <p className="text-xs">Yukarıdaki butonlarla kaynak ekleyin</p>
                </div>
              )}
            </div>

            {/* Master Output */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-primary" />
                  <span className="font-medium">Master Çıkış</span>
                </div>
                <VUMeter 
                  level={masterAnalysis?.average || 0} 
                  peak={masterAnalysis?.peak || 0} 
                />
              </div>
              <Slider
                value={[masterLevel * 100]}
                onValueChange={([v]) => handleMasterLevel(v / 100)}
                max={100}
                className="w-full"
              />
            </div>
          </TabsContent>

          {/* EQ Tab */}
          <TabsContent value="eq" className="p-4 space-y-4 m-0">
            {/* Preset Selector */}
            <div className="space-y-2">
              <Label>Preset</Label>
              <Select value={selectedPreset} onValueChange={applyPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Preset seçin" />
                </SelectTrigger>
                <SelectContent>
                  {EQ_PRESETS.map(preset => (
                    <SelectItem 
                      key={preset.name} 
                      value={preset.name.toLowerCase().replace(' ', '-')}
                    >
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EQ Sliders */}
            <div className="grid grid-cols-3 gap-4">
              {/* Low */}
              <div className="space-y-2 text-center">
                <Label className="text-xs">Bas (200Hz)</Label>
                <div className="h-32 flex justify-center">
                  <Slider
                    value={[(eqGains.low + 20) * 2.5]}
                    onValueChange={([v]) => handleEQChange('low', v)}
                    max={100}
                    orientation="vertical"
                    className="h-full"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {eqGains.low > 0 ? '+' : ''}{eqGains.low.toFixed(1)} dB
                </span>
              </div>

              {/* Mid */}
              <div className="space-y-2 text-center">
                <Label className="text-xs">Orta (1kHz)</Label>
                <div className="h-32 flex justify-center">
                  <Slider
                    value={[(eqGains.mid + 20) * 2.5]}
                    onValueChange={([v]) => handleEQChange('mid', v)}
                    max={100}
                    orientation="vertical"
                    className="h-full"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {eqGains.mid > 0 ? '+' : ''}{eqGains.mid.toFixed(1)} dB
                </span>
              </div>

              {/* High */}
              <div className="space-y-2 text-center">
                <Label className="text-xs">Tiz (3kHz)</Label>
                <div className="h-32 flex justify-center">
                  <Slider
                    value={[(eqGains.high + 20) * 2.5]}
                    onValueChange={([v]) => handleEQChange('high', v)}
                    max={100}
                    orientation="vertical"
                    className="h-full"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {eqGains.high > 0 ? '+' : ''}{eqGains.high.toFixed(1)} dB
                </span>
              </div>
            </div>

            {/* Frequency Response Visual */}
            <div className="p-4 rounded-lg bg-black/10">
              <div className="flex items-end justify-between h-16">
                <div 
                  className="w-1/3 bg-blue-500/50 rounded-t"
                  style={{ height: `${50 + eqGains.low * 2}%` }}
                />
                <div 
                  className="w-1/3 bg-green-500/50 rounded-t"
                  style={{ height: `${50 + eqGains.mid * 2}%` }}
                />
                <div 
                  className="w-1/3 bg-orange-500/50 rounded-t"
                  style={{ height: `${50 + eqGains.high * 2}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>200Hz</span>
                <span>1kHz</span>
                <span>3kHz</span>
              </div>
            </div>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="p-4 space-y-4 m-0">
            {/* Microphone Test */}
            <div className="p-4 rounded-lg border bg-card/50 space-y-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                <span className="font-medium">Mikrofon Testi</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Mikrofonu test edin ve ses seviyesini kontrol edin.
              </p>
              <Button 
                onClick={testMicrophone}
                variant={isTestingMic ? 'destructive' : 'default'}
                className="w-full"
              >
                {isTestingMic ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Testi Durdur
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Mikrofonu Test Et
                  </>
                )}
              </Button>
              {isTestingMic && sourceAnalysis['mic-test'] && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-75"
                      style={{ width: `${(sourceAnalysis['mic-test']?.average || 0) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Speaker Test */}
            <div className="p-4 rounded-lg border bg-card/50 space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                <span className="font-medium">Hoparlör Testi</span>
              </div>
              <p className="text-sm text-muted-foreground">
                440Hz test tonu çalarak hoparlörleri kontrol edin.
              </p>
              <Button 
                onClick={testSpeaker}
                variant={isTestingTone ? 'destructive' : 'default'}
                className="w-full"
              >
                {isTestingTone ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Tonu Durdur
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Test Tonu Çal
                  </>
                )}
              </Button>
              {isTestingTone && (
                <div className="flex items-center gap-2 text-sm">
                  <Waves className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-muted-foreground">440Hz sinüs tonu çalıyor...</span>
                </div>
              )}
            </div>

            {/* System Info */}
            <div className="p-4 rounded-lg border bg-card/50 space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <span className="font-medium">Sistem Bilgisi</span>
              </div>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>• AudioContext: {isInitialized ? 'Aktif ✓' : 'Başlatılmadı'}</p>
                <p>• Sample Rate: {isInitialized ? '48000 Hz' : '-'}</p>
                <p>• Aktif Kaynaklar: {sources.length}</p>
                <p>• Tarayıcı Desteği: Web Audio API ✓</p>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

export default AudioControlWidget;
