

'use client';

import { ContentItem } from '@/lib/initial-content';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Palette, X, ImageUp, SlidersHorizontal, Sun, Moon, Monitor, Minus, Plus, Wand2, ChevronsDown, ChevronsUp, Save, Trash2, StretchHorizontal, StretchVertical, Minimize, Maximize, ZoomIn, ZoomOut, Ban, Square, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from './ui/label';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useRef, useState, useMemo, useCallback } from 'react';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import WebGLBackground from './webgl-background';

type ThemePreset = {
  name: string;
  primary: string;
  background: string;
  accent: string;
};


const defaultThemePresets: ThemePreset[] = [
  { name: 'Varsayılan', primary: '190 85% 45%', background: '40 50% 98%', accent: '25 95% 55%' },
  { name: 'Okyanus Esintisi', primary: '210 90% 55%', background: '220 60% 99%', accent: '180 75% 50%' },
  { name: 'Gün Batımı', primary: '30 90% 55%', background: '20 50% 97%', accent: '0 85% 60%' },
  { name: 'Neon Gece', primary: '280 80% 65%', background: '225 25% 12%', accent: '330 95% 55%' },
  { name: 'Doğa Yürüyüşü', primary: '120 40% 45%', background: '90 20% 96%', accent: '40 60% 50%' },
];

const webglBackgrounds = [
    { id: 'liquid-gradient', name: 'Sıvı Gradyan' },
    { id: 'digital-particles', name: 'Dijital Parçacıklar' },
    { id: 'cosmic-web', name: 'Kozmik Ağ' },
    { id: 'aurora', name: 'Kutup Işıkları' },
    { id: 'holographic', name: 'Holografik' },
    { id: 'plasma-orb', name: 'Plazma Küresi' },
];

const backgroundColors = [
    { name: 'Mavi', color: '#3b82f6' },
    { name: 'Yeşil', color: '#22c55e' },
    { name: 'Kırmızı', color: '#ef4444' },
    { name: 'Sarı', color: '#eab308' },
    { name: 'Mor', color: '#8b5cf6' },
    { name: 'Pembe', color: '#ec4899' },
];

interface StyleSettingsPanelProps {
  activeView: ContentItem;
  onClose: () => void;
  onUpdate: (updates: Partial<ContentItem>) => void;
  onSyncAll?: () => void;
}

export default function StyleSettingsPanel({
  activeView,
  onClose,
  onUpdate,
  onSyncAll,
}: StyleSettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [customThemes, setCustomThemes] = useState<ThemePreset[]>([]);
  const accordionItems = useMemo(() => ['view', 'theme', 'frame', 'background', 'pattern', 'webgl'], []);
  const [openAccordions, setOpenAccordions] = useState<string[]>(accordionItems);
  const scale = activeView.scale || 100;
  const setScale = (newScale: number) => onUpdate({ scale: newScale });
    const coverPreset = (activeView as any)?.coverPreset ?? 'm';
    const coverMaxItems = (activeView as any)?.coverMaxItems ?? 10;
    const coverBlurFallback = (activeView as any)?.coverBlurFallback ?? false;
    const coverBoldTitle = (activeView as any)?.coverBoldTitle ?? false;
    const minimapDefaultOpen = (activeView as any)?.minimapDefaultOpen ?? false;
    const minimapSize = (activeView as any)?.minimapSize ?? 'm';


  const applyTheme = useCallback((preset: ThemePreset) => {
    const root = document.documentElement;
    
    // Set CSS custom properties for color palette
    root.style.setProperty('--primary', preset.primary);
    root.style.setProperty('--accent', preset.accent);
    root.style.setProperty('--background', preset.background);
    
    toast({ title: "Tema Uygulandı", description: `"${preset.name}" paleti başarıyla ayarlandı.` });
  }, [toast]);

  const saveCurrentTheme = () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const newTheme: ThemePreset = {
        name: `Özel Tema ${customThemes.length + 1}`,
        primary: rootStyle.getPropertyValue('--primary-light').trim(),
        background: rootStyle.getPropertyValue('--background-light').trim(),
        accent: rootStyle.getPropertyValue('--accent-light').trim(),
    };
    setCustomThemes([...customThemes, newTheme]);
    toast({ title: 'Tema Kaydedildi!' });
  }

  const deleteCustomTheme = (index: number) => {
    setCustomThemes(customThemes.filter((_, i) => i !== index));
    toast({ title: 'Tema Silindi' });
  };
  
  const generateRandomTheme = () => {
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 40) + 60; // 60-100
    const l = Math.floor(Math.random() * 30) + 40; // 40-70

    const accent_h = (h + 150) % 360;

    const randomPreset: ThemePreset = {
        name: 'Rastgele',
        primary: `${h} ${s}% ${l}%`,
        background: `${h} ${s-40}% 98%`,
        accent: `${accent_h} ${s}% ${l}%`,
    }
    applyTheme(randomPreset);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        onUpdate({ background: { ...activeView.background, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } });
      };
      reader.readAsDataURL(file);
    }
  };

  const ThemeButton = ({ preset }: { preset: ThemePreset }) => (
      <Button variant="outline" className="h-auto p-2 w-full" onClick={() => applyTheme(preset)}>
        <div className='flex items-center gap-2 w-full'>
            <div className='flex -space-x-2'>
                <div className='w-5 h-5 rounded-full border-2 border-card' style={{ backgroundColor: `hsl(${preset.primary})`}}/>
                <div className='w-5 h-5 rounded-full border-2 border-card' style={{ backgroundColor: `hsl(${preset.accent})`}}/>
                <div className='w-5 h-5 rounded-full border-2 border-card' style={{ backgroundColor: `hsl(${preset.background})`}}/>
            </div>
            <span className='flex-1 text-left text-sm'>{preset.name}</span>
        </div>
      </Button>
  );

  const toggleAllAccordions = () => {
    setOpenAccordions(prev => prev.length === accordionItems.length ? [] : accordionItems);
  };

  const handleBackgroundFitChange = (value: 'cover' | 'contain' | 'repeat') => {
      if (value === 'repeat') {
          onUpdate({ background: { ...activeView.background, backgroundSize: 'auto', backgroundRepeat: 'repeat' } });
      } else {
          onUpdate({ background: { ...activeView.background, backgroundSize: value, backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } });
      }
  }

  const getCurrentBackgroundFit = () => {
      if (activeView.background?.backgroundRepeat === 'repeat') return 'repeat';
      if (activeView.background?.backgroundSize === 'contain') return 'contain';
      return 'cover';
  }
  
  const clearBackground = (type: 'image' | 'pattern' | 'webgl') => {
      let update: Partial<ContentItem> = {};
      if (type === 'image') {
          update = { background: { ...activeView.background, backgroundImage: 'none' }};
      } else if (type === 'pattern') {
          update = { pattern: null };
      } else if (type === 'webgl') {
          update = { background: { ...activeView.background, webgl: undefined }};
      }
      onUpdate(update);
  }

  return (
    <div className="w-full h-full bg-card border-l flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal />
                Stil Ayarları
            </h2>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={toggleAllAccordions}>
                {openAccordions.length > 0 ? <ChevronsUp className="h-4 w-4" /> : <ChevronsDown className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4"/></Button>
            </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
            <Accordion type="multiple" value={openAccordions} onValueChange={setOpenAccordions} className="w-full">
                <AccordionItem value="view" className='px-4'>
                    <AccordionTrigger className="py-3 text-sm font-medium"><div className='flex items-center gap-2'><Palette className='h-4 w-4'/> <span>Görünüm</span></div></AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Çerçeve Stili</h4>
                                {onSyncAll && (
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={onSyncAll}>
                                        <Wand2 className="h-3 w-3" /> Tümünü Eşitle
                                    </Button>
                                )}
                            </div>
                            <ToggleGroup 
                                type="single"
                                defaultValue={(activeView.borderRadius ?? 8) > 0 ? 'soft' : 'sharp'}
                                onValueChange={(value) => onUpdate({ borderRadius: value === 'soft' ? 8 : 0 })}
                                className='border rounded-md grid grid-cols-2 flex-1'
                            >
                                <ToggleGroupItem value="soft">Yumuşak Köşeler</ToggleGroupItem>
                                <ToggleGroupItem value="sharp">Düz Köşeler</ToggleGroupItem>
                            </ToggleGroup>
                            <div className='flex items-center'>
                                <Label className='w-40'>Yuvarlaklık ({activeView.borderRadius || 0}px)</Label>
                                <Slider value={[activeView.borderRadius || 0]} onValueChange={(value) => onUpdate({ borderRadius: value[0] })} min={0} max={50} step={1} />
                            </div>
                        </div>
                        <Separator/>
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-muted-foreground">TUVAL BOŞLUKLARI</h4>
                            <div className='flex items-center'><Label className='w-40'>Kenar Boşluğu ({activeView.padding || 16}px)</Label><Slider value={[activeView.padding || 16]} onValueChange={(value) => onUpdate({ padding: value[0] })} min={0} max={128} step={4} /></div>
                            <div className='flex items-center'><Label className='w-40'>Aralık ({activeView.gap || 16}px)</Label><Slider value={[activeView.gap || 16]} onValueChange={(value) => onUpdate({ gap: value[0] })} min={0} max={64} step={2} /></div>
                        </div>
                        <Separator/>
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-muted-foreground">DİĞER AYARLAR</h4>
                            <div className='flex items-center pt-2'>
                                <Label className='w-40'>Ölçek (%{scale})</Label>
                                <div className="flex items-center gap-1 flex-1">
                                    <Button variant='ghost' size="icon" className='h-8 w-8' onClick={() => setScale(Math.max(50, scale - 5))}><ZoomOut className="h-4 w-4" /></Button>
                                    <Slider value={[scale]} onValueChange={(value) => setScale(value[0])} min={50} max={150} step={5} />
                                    <Button variant='ghost' size="icon" className='h-8 w-8' onClick={() => setScale(Math.min(150, scale + 5))}><ZoomIn className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                        <Separator/>
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-muted-foreground">KAPAK & MINI MAP</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                    <Label>Kapak Boyutu (S/M/L/XL)</Label>
                                    <ToggleGroup type="single" value={coverPreset} onValueChange={(val) => val && onUpdate({ coverPreset: val })} className="grid grid-cols-4 gap-1">
                                        <ToggleGroupItem value="s">S</ToggleGroupItem>
                                        <ToggleGroupItem value="m">M</ToggleGroupItem>
                                        <ToggleGroupItem value="l">L</ToggleGroupItem>
                                        <ToggleGroupItem value="xl">XL</ToggleGroupItem>
                                    </ToggleGroup>
                                </div>
                                <div className="space-y-1">
                                    <Label>Kapakta Gösterilecek İçerik Sayısı ({coverMaxItems})</Label>
                                    <Slider value={[coverMaxItems]} min={4} max={10} step={1} onValueChange={([v]) => onUpdate({ coverMaxItems: v })} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Blur Fallback</Label>
                                        <p className="text-xs text-muted-foreground">Kapakta görsel yoksa yumuşak blur arka plan kullan.</p>
                                    </div>
                                    <Switch checked={coverBlurFallback} onCheckedChange={(val) => onUpdate({ coverBlurFallback: val })} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Kalın Klasör Başlığı</Label>
                                        <p className="text-xs text-muted-foreground">Kapak yazısını vurgula.</p>
                                    </div>
                                    <Switch checked={coverBoldTitle} onCheckedChange={(val) => onUpdate({ coverBoldTitle: val })} />
                                </div>
                                <Separator />
                                <div className="space-y-1">
                                    <Label>Mini Map Boyutu</Label>
                                    <ToggleGroup type="single" value={minimapSize} onValueChange={(val) => val && onUpdate({ minimapSize: val })} className="grid grid-cols-4 gap-1">
                                        <ToggleGroupItem value="s">S</ToggleGroupItem>
                                        <ToggleGroupItem value="m">M</ToggleGroupItem>
                                        <ToggleGroupItem value="l">L</ToggleGroupItem>
                                        <ToggleGroupItem value="xl">XL</ToggleGroupItem>
                                    </ToggleGroup>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Mini Map Varsayılan Açık</Label>
                                        <p className="text-xs text-muted-foreground">Bu görünüm açıldığında mini map otomatik açılsın.</p>
                                    </div>
                                    <Switch checked={minimapDefaultOpen} onCheckedChange={(val) => onUpdate({ minimapDefaultOpen: val })} />
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="frame" className='px-4'>
                    <AccordionTrigger className="py-3 text-sm font-medium"><div className='flex items-center gap-2'><Square className='h-4 w-4'/> <span>Çerçeve</span></div></AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Çerçeve Efekti</Label>
                            <ToggleGroup 
                                type="single" 
                                value={activeView.frameEffect || 'none'} 
                                onValueChange={(value) => onUpdate({ frameEffect: value as any })} 
                                className="grid grid-cols-3 gap-2"
                            >
                                <ToggleGroupItem value="none" className="text-xs">Yok</ToggleGroupItem>
                                <ToggleGroupItem value="glowing" className="text-xs">Işıldayan</ToggleGroupItem>
                                <ToggleGroupItem value="neon" className="text-xs">Neon</ToggleGroupItem>
                                <ToggleGroupItem value="pulsing" className="text-xs">Yanma Sönme</ToggleGroupItem>
                                <ToggleGroupItem value="patterned" className="text-xs">Desenli</ToggleGroupItem>
                                <ToggleGroupItem value="braided" className="text-xs">Örgülü</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">İşaretçi Çerçevesi</Label>
                                <Switch 
                                    checked={activeView.pointerFrameEnabled || false}
                                    onCheckedChange={(checked) => onUpdate({ pointerFrameEnabled: checked })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Fare imlecini takip eden dinamik çerçeve</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Ses Takipçisi</Label>
                                <Switch 
                                    checked={activeView.audioTrackerEnabled || false}
                                    onCheckedChange={(checked) => onUpdate({ audioTrackerEnabled: checked })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Ses çalan oynatıcıya otomatik odaklanma</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Virtualizer Modu</Label>
                                <Switch 
                                    checked={activeView.virtualizerMode || false}
                                    onCheckedChange={(checked) => onUpdate({ virtualizerMode: checked })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">🎨 Ses ve ritme göre renk değişimi (Easter Egg)</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Görselleştirici Modu</Label>
                            <ToggleGroup 
                                type="single" 
                                value={activeView.visualizerMode || 'off'} 
                                onValueChange={(value) => onUpdate({ visualizerMode: value as any })} 
                                className="grid grid-cols-3 gap-2"
                            >
                                <ToggleGroupItem value="off" className="text-xs">Kapalı</ToggleGroupItem>
                                <ToggleGroupItem value="bars" className="text-xs">Barlar</ToggleGroupItem>
                                <ToggleGroupItem value="wave" className="text-xs">Dalga</ToggleGroupItem>
                                <ToggleGroupItem value="circular" className="text-xs">Dairesel</ToggleGroupItem>
                                <ToggleGroupItem value="particles" className="text-xs">Parçacık</ToggleGroupItem>
                            </ToggleGroup>
                            <p className="text-xs text-muted-foreground">🎵 Ekolyzer görselleştirmeleri (Easter Egg)</p>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label className="text-xs">Çerçeve Rengi</Label>
                            <div className="flex gap-2 items-center">
                                <div 
                                    className="w-8 h-8 rounded border cursor-pointer flex-shrink-0" 
                                    style={{ backgroundColor: activeView.frameColor || 'hsl(var(--primary))' }}
                                    onClick={() => document.getElementById('frame-color-input')?.click()}
                                />
                                <Input 
                                    id="frame-color-input"
                                    type="color" 
                                    value={activeView.frameColor || '#3b82f6'} 
                                    onChange={(e) => onUpdate({ frameColor: e.target.value })}
                                    className="h-8"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Çerçeve Kalınlığı ({activeView.frameWidth || 1}px)</Label>
                            <Slider 
                                value={[activeView.frameWidth || 1]} 
                                onValueChange={(v) => onUpdate({ frameWidth: v[0] })} 
                                min={0} max={20} step={1} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Çerçeve Stili</Label>
                            <ToggleGroup 
                                type="single" 
                                value={activeView.frameStyle || 'solid'} 
                                onValueChange={(value) => onUpdate({ frameStyle: value as any })} 
                                className="grid grid-cols-2 gap-2"
                            >
                                <ToggleGroupItem value="solid" className="text-xs">Düz</ToggleGroupItem>
                                <ToggleGroupItem value="dashed" className="text-xs">Kesikli</ToggleGroupItem>
                                <ToggleGroupItem value="dotted" className="text-xs">Noktalı</ToggleGroupItem>
                                <ToggleGroupItem value="double" className="text-xs">Çift</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </AccordionContent>
                </AccordionItem>                <AccordionItem value="infobar" className='px-4'>
                    <AccordionTrigger className="py-3 text-sm font-medium"><div className='flex items-center gap-2'><Info className='h-4 w-4'/> <span>Bilgi Çubuğu</span></div></AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Görünüm Modu</Label>
                            <ToggleGroup 
                                type="single" 
                                value={activeView.infoBarSettings?.displayMode || 'visible'} 
                                onValueChange={(value) => onUpdate({ 
                                    infoBarSettings: { ...activeView.infoBarSettings, displayMode: value as any } 
                                })} 
                                className="grid grid-cols-3 gap-2"
                            >
                                <ToggleGroupItem value="hidden" className="text-xs">Gizli</ToggleGroupItem>
                                <ToggleGroupItem value="visible" className="text-xs">Görünür</ToggleGroupItem>
                                <ToggleGroupItem value="on-hover" className="text-xs">Hover</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Gösterilecek Tuşlar</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="show-rating"
                                        checked={(activeView.infoBarSettings?.visibleButtons || []).includes('rating')}
                                        onCheckedChange={(checked) => {
                                            let buttons = [...(activeView.infoBarSettings?.visibleButtons || [])];
                                            if (checked) buttons.push('rating');
                                            else buttons = buttons.filter(b => b !== 'rating');
                                            onUpdate({ infoBarSettings: { ...activeView.infoBarSettings, visibleButtons: buttons } });
                                        }}
                                    />
                                    <Label htmlFor="show-rating" className="text-xs font-normal cursor-pointer">Puan</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="show-priority"
                                        checked={(activeView.infoBarSettings?.visibleButtons || []).includes('priority')}
                                        onCheckedChange={(checked) => {
                                            let buttons = [...(activeView.infoBarSettings?.visibleButtons || [])];
                                            if (checked) buttons.push('priority');
                                            else buttons = buttons.filter(b => b !== 'priority');
                                            onUpdate({ infoBarSettings: { ...activeView.infoBarSettings, visibleButtons: buttons } });
                                        }}
                                    />
                                    <Label htmlFor="show-priority" className="text-xs font-normal cursor-pointer">Öncelik</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="show-metrics"
                                        checked={(activeView.infoBarSettings?.visibleButtons || []).includes('metrics')}
                                        onCheckedChange={(checked) => {
                                            let buttons = [...(activeView.infoBarSettings?.visibleButtons || [])];
                                            if (checked) buttons.push('metrics');
                                            else buttons = buttons.filter(b => b !== 'metrics');
                                            onUpdate({ infoBarSettings: { ...activeView.infoBarSettings, visibleButtons: buttons } });
                                        }}
                                    />
                                    <Label htmlFor="show-metrics" className="text-xs font-normal cursor-pointer">Metrikler</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="show-grade"
                                        checked={(activeView.infoBarSettings?.visibleButtons || []).includes('grade')}
                                        onCheckedChange={(checked) => {
                                            let buttons = [...(activeView.infoBarSettings?.visibleButtons || [])];
                                            if (checked) buttons.push('grade');
                                            else buttons = buttons.filter(b => b !== 'grade');
                                            onUpdate({ infoBarSettings: { ...activeView.infoBarSettings, visibleButtons: buttons } });
                                        }}
                                    />
                                    <Label htmlFor="show-grade" className="text-xs font-normal cursor-pointer">Harf Notu</Label>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>                <AccordionItem value="theme" className='px-4'>
                    <AccordionTrigger className="py-3 text-sm font-medium"><div className='flex items-center gap-2'><Palette className='h-4 w-4'/> <span>Tema</span></div></AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Aydınlık/Karanlık</h4>
                                <div className="flex items-center gap-1 rounded-md border p-1">
                                    <Button variant={theme === 'light' ? 'secondary': 'ghost'} size="icon" className='h-8 w-8 flex-1' onClick={() => setTheme('light')}><Sun className="h-4 w-4" /></Button>
                                    <Button variant={theme === 'dark' ? 'secondary': 'ghost'} size="icon" className='h-8 w-8 flex-1' onClick={() => setTheme('dark')}><Moon className="h-4 w-4" /></Button>
                                    <Button variant={theme === 'system' ? 'secondary': 'ghost'} size="icon" className='h-8 w-8 flex-1' onClick={() => setTheme('system')}><Monitor className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Renk Paletleri</h4>
                                <div className="grid grid-cols-2 gap-2">{defaultThemePresets.map(preset => <ThemeButton key={preset.name} preset={preset} />)}</div>
                            </div>
                            {customThemes.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Kaydedilen Paletler</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {customThemes.map((preset, index) => (
                                            <div key={`${preset.background}-${preset.foreground}-${index}`} className="flex items-center gap-2">
                                                <ThemeButton preset={preset} />
                                                <Button variant="destructive" size="icon" className='h-9 w-9' onClick={() => deleteCustomTheme(index)}>
                                                    <Trash2 className='h-4 w-4'/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className='flex gap-2'>
                                 <Button variant="outline" className="w-full" onClick={saveCurrentTheme}><Save className='mr-2 h-4 w-4'/> Kaydet</Button>
                                 <Button variant="outline" size="icon" className='flex-shrink-0' onClick={generateRandomTheme}><Wand2 className='h-4 w-4'/></Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="background" className='px-4'>
                    <AccordionTrigger className="py-3 text-sm font-medium"><div className='flex items-center gap-2'><ImageUp className='h-4 w-4'/> <span>Arka Plan</span></div></AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Arka Plan Sığdırma</Label>
                             <ToggleGroup type="single" value={getCurrentBackgroundFit()} onValueChange={(value: 'cover' | 'contain' | 'repeat') => value && handleBackgroundFitChange(value)} className="grid grid-cols-3 gap-1">
                                <ToggleGroupItem value="cover" aria-label="Kapla"><StretchVertical className="h-4 w-4 mr-2"/>Kapla</ToggleGroupItem>
                                <ToggleGroupItem value="contain" aria-label="Sığdır"><Minimize className="h-4 w-4 mr-2"/>Sığdır</ToggleGroupItem>
                                <ToggleGroupItem value="repeat" aria-label="Döşe"><Maximize className="h-4 w-4 mr-2"/>Döşe</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        <div className="space-y-2">
                            <Label>Arka Plan Rengi</Label>
                             <div className="grid grid-cols-7 gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8 border-dashed" onClick={() => onUpdate({ background: { ...activeView.background, backgroundColor: 'hsl(var(--background))', backgroundImage: 'none', webgl: undefined }})}>
                                    <Ban className="h-4 w-4" />
                                </Button>
                                {backgroundColors.map(bg => (
                                    <Button key={bg.name} variant="outline" size="icon" className="h-8 w-8" style={{backgroundColor: bg.color}} onClick={() => onUpdate({ background: { ...activeView.background, backgroundColor: bg.color, backgroundImage: 'none', webgl: undefined }})} />
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <div 
                                    className="w-8 h-8 rounded border cursor-pointer flex-shrink-0" 
                                    style={{ backgroundColor: typeof activeView.background?.backgroundColor === 'string' ? activeView.background.backgroundColor : '#ffffff' }}
                                    onClick={() => document.getElementById('bg-color-input')?.click()}
                                />
                                <Input 
                                    id="bg-color-input"
                                    type="color" 
                                    value={typeof activeView.background?.backgroundColor === 'string' ? activeView.background.backgroundColor : '#ffffff'} 
                                    onChange={e => onUpdate({ background: { ...activeView.background, backgroundColor: e.target.value, backgroundImage: 'none', webgl: undefined }})} 
                                    className='h-8' 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Arka Plan Resmi</Label>
                            <div className="flex gap-2">
                                <Input placeholder="Resim URL'si..." onChange={e => onUpdate({ background: { ...activeView.background, backgroundImage: `url(${e.target.value})`, backgroundSize: 'cover', backgroundPosition: 'center', webgl: undefined } })}/>
                                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><ImageUp className='h-4 w-4'/></Button>
                                <input type='file' ref={fileInputRef} onChange={handleImageUpload} className='hidden' accept="image/*" />
                            </div>
                            <ScrollArea className="h-48">
                                <div className="grid grid-cols-3 gap-2 p-1">
                                    <div className='relative aspect-square cursor-pointer group border-2 border-dashed rounded-md flex items-center justify-center' onClick={() => clearBackground('image')}>
                                        <Ban className='h-6 w-6 text-muted-foreground'/>
                                    </div>
                                    {PlaceHolderImages.map(img => (
                                        <div key={img.id} className='relative aspect-square cursor-pointer group' onClick={() => onUpdate({ background: { ...activeView.background, backgroundImage: `url(${img.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', webgl: undefined } })}>
                                            <Image src={img.imageUrl} alt={img.description} layout='fill' objectFit='cover' className='rounded-md' />
                                            <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity' />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="pattern" className='px-4'>
                    <AccordionTrigger className="py-3 text-sm font-medium"><div className='flex items-center gap-2'><SlidersHorizontal className='h-4 w-4'/> <span>Desen</span></div></AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                        <ToggleGroup type="single" value={activeView.pattern || ''} onValueChange={(value) => onUpdate({ pattern: value as any, background: {...activeView.background, webgl: undefined} })} className="grid grid-cols-3 gap-2">
                            <ToggleGroupItem value={''} className="h-16 flex-col gap-1 text-xs"><Ban className='h-5 w-5'/><span>Yok</span></ToggleGroupItem>
                            {['grid', 'dots', 'lined', 'isometric', 'folderName'].map(p => (<ToggleGroupItem key={p} value={p} className="h-16 flex-col gap-1 text-xs"><div className={cn('w-8 h-8 rounded-full border', `pattern-${p}`)} style={{'--pattern-color': 'hsl(var(--foreground))', '--pattern-line-width': '1px', '--pattern-size': '1mm'} as any}/><span>{p.charAt(0).toUpperCase() + p.slice(1)}</span></ToggleGroupItem>))}
                        </ToggleGroup>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="webgl" className='px-4'>
                    <AccordionTrigger className="py-3 text-sm font-medium"><div className='flex items-center gap-2'><Wand2 className='h-4 w-4'/> <span>Dinamik (WebGL)</span></div></AccordionTrigger>
                    <AccordionContent className="pb-4">
                         <ToggleGroup type="single" value={activeView.background?.webgl || ''} onValueChange={(value) => onUpdate({ background: { ...activeView.background, webgl: value }, pattern: null })} className="grid grid-cols-2 gap-2">
                            <ToggleGroupItem value={''} className="h-20 flex-col gap-1 text-xs"><Ban className='h-5 w-5'/><span>Yok</span></ToggleGroupItem>
                            {webglBackgrounds.map(bg => (
                                <ToggleGroupItem key={bg.id} value={bg.id} className="h-20 flex-col gap-1 text-xs relative overflow-hidden">
                                    <WebGLBackground type={bg.id} isPreview />
                                    <span className='z-10 bg-background/50 px-2 py-1 rounded'>{bg.name}</span>
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="folder-backgrounds" className='px-4'>
                    <AccordionTrigger className="py-3 text-sm font-medium">
                        <div className='flex items-center gap-2'><Square className='h-4 w-4'/> <span>Klasör Hücreleri</span></div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Hücre Arka Plan Rengi</Label>
                            <div className="flex gap-2 items-center">
                                <div 
                                    className="w-8 h-8 rounded border cursor-pointer flex-shrink-0" 
                                    style={{ backgroundColor: activeView.cellBackgroundColor || 'transparent' }}
                                    onClick={() => document.getElementById('cell-bg-color-input')?.click()}
                                />
                                <Input 
                                    id="cell-bg-color-input"
                                    type="color" 
                                    value={activeView.cellBackgroundColor || '#ffffff'} 
                                    onChange={(e) => onUpdate({ cellBackgroundColor: e.target.value })}
                                    className="h-8"
                                />
                                <Button variant="ghost" size="icon" onClick={() => onUpdate({ cellBackgroundColor: undefined })}>
                                    <Ban className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-xs">Hücre Animasyonu</Label>
                            <ToggleGroup 
                                type="single" 
                                value={activeView.cellAnimation || 'none'} 
                                onValueChange={(value) => onUpdate({ cellAnimation: value as any })} 
                                className="grid grid-cols-2 gap-2"
                            >
                                <ToggleGroupItem value="none" className="text-xs">Yok</ToggleGroupItem>
                                <ToggleGroupItem value="fade-in" className="text-xs">Belirme</ToggleGroupItem>
                                <ToggleGroupItem value="slide-up" className="text-xs">Yukarı Kayma</ToggleGroupItem>
                                <ToggleGroupItem value="zoom-in" className="text-xs">Yakınlaşma</ToggleGroupItem>
                                <ToggleGroupItem value="bounce" className="text-xs">Zıplama</ToggleGroupItem>
                                <ToggleGroupItem value="rotate" className="text-xs">Dönme</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                            <Label className="text-xs">Başlık Yazı Tipi</Label>
                            <ToggleGroup 
                                type="single" 
                                value={activeView.cellTitleFont || 'default'} 
                                onValueChange={(value) => onUpdate({ cellTitleFont: value as any })} 
                                className="grid grid-cols-2 gap-2"
                            >
                                <ToggleGroupItem value="default" className="text-xs">Varsayılan</ToggleGroupItem>
                                <ToggleGroupItem value="mono" className="text-xs font-mono">Monospace</ToggleGroupItem>
                                <ToggleGroupItem value="serif" className="text-xs font-serif">Serif</ToggleGroupItem>
                                <ToggleGroupItem value="display" className="text-xs">Display</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-xs">Başlık Boyutu ({activeView.cellTitleSize || 14}px)</Label>
                            <Slider 
                                value={[activeView.cellTitleSize || 14]} 
                                onValueChange={(v) => onUpdate({ cellTitleSize: v[0] })} 
                                min={10} max={32} step={1} 
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-xs">Başlık Rengi</Label>
                            <div className="flex gap-2 items-center">
                                <div 
                                    className="w-8 h-8 rounded border cursor-pointer flex-shrink-0" 
                                    style={{ backgroundColor: activeView.cellTitleColor || 'hsl(var(--foreground))' }}
                                    onClick={() => document.getElementById('cell-title-color-input')?.click()}
                                />
                                <Input 
                                    id="cell-title-color-input"
                                    type="color" 
                                    value={activeView.cellTitleColor || '#000000'} 
                                    onChange={(e) => onUpdate({ cellTitleColor: e.target.value })}
                                    className="h-8"
                                />
                                <Button variant="ghost" size="icon" onClick={() => onUpdate({ cellTitleColor: undefined })}>
                                    <Ban className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Başlık Kalın</Label>
                                <Switch 
                                    checked={activeView.cellTitleBold || false}
                                    onCheckedChange={(checked) => onUpdate({ cellTitleBold: checked })}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Başlık İtalik</Label>
                                <Switch 
                                    checked={activeView.cellTitleItalic || false}
                                    onCheckedChange={(checked) => onUpdate({ cellTitleItalic: checked })}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </ScrollArea>
    </div>
  );
}
