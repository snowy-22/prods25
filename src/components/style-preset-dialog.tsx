/**
 * Style Preset Dialog
 * Link ekleme sırasında stil seçimi için dialog
 */

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  FrameCorners,
  Palette,
  Zap,
  Type,
  Square,
  Circle,
  Plus,
} from 'lucide-react';

export type StylePreset = {
  id: string;
  name: string;
  borderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
  borderRadius: number;
  boxShadow: string;
  padding: number;
  minHeight: number;
  minWidth: number;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    borderStyle: 'none',
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    borderRadius: 0,
    boxShadow: 'none',
    padding: 0,
    minHeight: 0,
    minWidth: 0,
  },
  {
    id: 'card',
    name: 'Kart',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: 16,
    minHeight: 200,
    minWidth: 300,
  },
  {
    id: 'modern',
    name: 'Modern',
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    boxShadow: '0 4px 6px rgba(59,130,246,0.1)',
    padding: 20,
    minHeight: 220,
    minWidth: 320,
  },
  {
    id: 'glassmorphism',
    name: 'Cam Efekti',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(31,38,135,0.37)',
    padding: 24,
    minHeight: 240,
    minWidth: 340,
  },
  {
    id: 'neon',
    name: 'Neon',
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#ec4899',
    backgroundColor: 'rgba(236,72,153,0.05)',
    borderRadius: 8,
    boxShadow: '0 0 20px rgba(236,72,153,0.4)',
    padding: 16,
    minHeight: 200,
    minWidth: 300,
  },
  {
    id: 'dark',
    name: 'Koyu',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    padding: 16,
    minHeight: 200,
    minWidth: 300,
  },
];

interface StylePresetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (preset: StylePreset) => void;
  defaultPreset?: StylePreset;
}

export function StylePresetDialog({
  isOpen,
  onOpenChange,
  onSelect,
  defaultPreset,
}: StylePresetDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<StylePreset>(
    defaultPreset || STYLE_PRESETS[0]
  );
  const [customBorderRadius, setCustomBorderRadius] = useState(
    defaultPreset?.borderRadius || 8
  );
  const [customShadow, setCustomShadow] = useState<'none' | 'soft' | 'medium' | 'heavy'>(
    defaultPreset?.boxShadow && defaultPreset.boxShadow !== 'none' ? 'medium' : 'none'
  );

  const shadowPresets = {
    none: 'none',
    soft: '0 1px 2px rgba(0,0,0,0.05)',
    medium: '0 4px 6px rgba(0,0,0,0.1)',
    heavy: '0 20px 25px rgba(0,0,0,0.15)',
  };

  const handleApplyPreset = () => {
    const finalPreset = {
      ...selectedPreset,
      borderRadius: customBorderRadius,
      boxShadow: shadowPresets[customShadow],
    };
    onSelect(finalPreset);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link Stil Ön Ayarları</DialogTitle>
          <DialogDescription>
            Bağlantı öğesi için bir stil şablonu seçin
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Şablonlar
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Özelleştir
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {STYLE_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={cn(
                    'cursor-pointer rounded-lg p-4 transition-all border-2',
                    selectedPreset.id === preset.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {/* Preview */}
                  <div
                    className="w-full h-32 rounded-lg mb-3 flex items-center justify-center text-xs text-gray-500"
                    style={{
                      border:
                        preset.borderWidth > 0
                          ? `${preset.borderWidth}px ${preset.borderStyle} ${preset.borderColor}`
                          : 'none',
                      backgroundColor: preset.backgroundColor,
                      borderRadius: `${preset.borderRadius}px`,
                      boxShadow: preset.boxShadow,
                      padding: `${preset.padding}px`,
                      minHeight: `${preset.minHeight}px`,
                      minWidth: `${preset.minWidth}px`,
                    }}
                  >
                    Preview
                  </div>
                  <p className="font-medium text-sm">{preset.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {preset.borderWidth > 0 ? `${preset.borderWidth}px ${preset.borderStyle}` : 'No border'}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            {/* Border Radius */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FrameCorners className="h-4 w-4" />
                Köşe Yuvarlaması ({customBorderRadius}px)
              </Label>
              <input
                type="range"
                min="0"
                max="50"
                value={customBorderRadius}
                onChange={(e) => setCustomBorderRadius(Number(e.target.value))}
                className="w-full"
              />
              <div className="grid grid-cols-4 gap-2">
                {[0, 8, 16, 24].map((val) => (
                  <Button
                    key={val}
                    variant={customBorderRadius === val ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCustomBorderRadius(val)}
                  >
                    {val}px
                  </Button>
                ))}
              </div>
            </div>

            {/* Shadow */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Gölge Efekti
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {(['none', 'soft', 'medium', 'heavy'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={customShadow === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCustomShadow(level)}
                    className="capitalize"
                  >
                    {level === 'none' ? 'Yok' : level === 'soft' ? 'Hafif' : level === 'medium' ? 'Orta' : 'Ağır'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Önizleme</Label>
              <div
                className="w-full p-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500"
                style={{
                  borderRadius: `${customBorderRadius}px`,
                  boxShadow: shadowPresets[customShadow],
                  backgroundColor: selectedPreset.backgroundColor,
                  borderColor: selectedPreset.borderColor,
                  border:
                    selectedPreset.borderWidth > 0
                      ? `${selectedPreset.borderWidth}px ${selectedPreset.borderStyle} ${selectedPreset.borderColor}`
                      : '1px solid #e5e7eb',
                }}
              >
                <p className="text-sm">Bu şekilde görünecek</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleApplyPreset}>
            <Plus className="h-4 w-4 mr-2" />
            Stil Uyguıyla Ekle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
