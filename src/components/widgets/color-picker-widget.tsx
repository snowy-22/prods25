"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Pipette, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ColorPickerWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function ColorPickerWidget({ size = 'medium' }: ColorPickerWidgetProps) {
  const [color, setColor] = useState('#3b82f6');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const hexToHsl = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const rgb = hexToRgb(color);
  const hsl = hexToHsl(color);

  const copyColor = useCallback((format: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Kopyalandı',
      description: `${format} formatında kopyalandı.`,
    });
  }, [toast]);

  const pickColor = useCallback(async () => {
    if (!('EyeDropper' in window)) {
      toast({
        title: 'Desteklenmiyor',
        description: 'Tarayıcınız renk seçiciyi desteklemiyor.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      setColor(result.sRGBHex);
      
      toast({
        title: 'Renk Seçildi',
        description: result.sRGBHex,
      });
    } catch (error) {
      // User cancelled
    }
  }, [toast]);

  return (
    <Card className={cn(
      "w-full h-full flex flex-col gap-4 p-4 overflow-auto",
      isSmall && "gap-2 p-2",
      isLarge && "gap-6 p-6"
    )}>
      <div 
        className={cn(
          "rounded-lg border-2 border-border shadow-inner transition-colors",
          isSmall && "h-16",
          !isSmall && !isLarge && "h-24",
          isLarge && "h-32"
        )}
        style={{ backgroundColor: color }}
      />

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className={cn("text-xs mb-1 block", isSmall && "text-[10px]")}>Renk</Label>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={cn("h-10 cursor-pointer", isSmall && "h-8")}
            />
          </div>
          
          {'EyeDropper' in window && (
            <div>
              <Label className={cn("text-xs mb-1 block opacity-0", isSmall && "text-[10px]")}>.</Label>
              <Button
                onClick={pickColor}
                variant="outline"
                size="icon"
                className={cn(isSmall && "h-8 w-8")}
                title="Ekrandan renk seç"
              >
                <Pipette className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {!isSmall && (
          <Tabs defaultValue="hex" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="hex" className="text-xs">HEX</TabsTrigger>
              <TabsTrigger value="rgb" className="text-xs">RGB</TabsTrigger>
              <TabsTrigger value="hsl" className="text-xs">HSL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hex" className="space-y-2 mt-3">
              <div className="flex gap-2">
                <Input
                  value={color.toUpperCase()}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
                <Button
                  onClick={() => copyColor('HEX', color.toUpperCase())}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="rgb" className="space-y-2 mt-3">
              {rgb && (
                <div className="flex gap-2">
                  <Input
                    value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                    readOnly
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    onClick={() => copyColor('RGB', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="hsl" className="space-y-2 mt-3">
              {hsl && (
                <div className="flex gap-2">
                  <Input
                    value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                    readOnly
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    onClick={() => copyColor('HSL', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {isSmall && rgb && (
          <Button
            onClick={() => copyColor('HEX', color.toUpperCase())}
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs font-mono"
          >
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {color.toUpperCase()}
          </Button>
        )}
      </div>
    </Card>
  );
}
