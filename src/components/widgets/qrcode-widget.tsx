"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, QrCode, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';

interface QRCodeWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function QRCodeWidget({ size = 'medium' }: QRCodeWidgetProps) {
  const [text, setText] = useState('https://tv25.app');
  const [qrSize, setQrSize] = useState(256);
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const { toast } = useToast();

  const isSmall = size === 'small';
  const isMedium = size === 'medium';
  const isLarge = size === 'large';

  const generateQR = useCallback(async () => {
    try {
      // Use QRCode library dynamically
      const QRCode = (await import('qrcode')).default;
      
      const url = await QRCode.toDataURL(text, {
        width: qrSize,
        color: {
          dark: qrColor,
          light: bgColor,
        },
        margin: 2,
      });
      
      setQrDataUrl(url);
    } catch (error) {
      console.error('QR generation error:', error);
    }
  }, [text, qrSize, qrColor, bgColor]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const downloadQR = useCallback(() => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
    
    toast({
      title: 'İndirildi',
      description: 'QR kod indirildi.',
    });
  }, [qrDataUrl, toast]);

  const copyToClipboard = useCallback(async () => {
    if (!qrDataUrl) return;
    
    try {
      const blob = await fetch(qrDataUrl).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      toast({
        title: 'Kopyalandı',
        description: 'QR kod panoya kopyalandı.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Panoya kopyalanamadı.',
        variant: 'destructive',
      });
    }
  }, [qrDataUrl, toast]);

  return (
    <Card className={cn(
      "w-full h-full flex flex-col gap-4 p-4 overflow-auto",
      isSmall && "gap-2 p-2",
      isLarge && "gap-6 p-6"
    )}>
      <div className="flex-1 flex items-center justify-center">
        {qrDataUrl ? (
          <div className={cn(
            "relative rounded border p-2 bg-white",
            isSmall && "p-1"
          )}>
            <img 
              src={qrDataUrl} 
              alt="QR Code" 
              className={cn(
                "w-auto h-auto max-w-full max-h-full",
                isSmall && "max-w-[100px]",
                isMedium && "max-w-[200px]",
                isLarge && "max-w-[300px]"
              )}
            />
          </div>
        ) : (
          <QrCode className={cn(
            "text-muted-foreground",
            isSmall && "h-12 w-12",
            isMedium && "h-16 w-16",
            isLarge && "h-20 w-20"
          )} />
        )}
      </div>

      <div className={cn(
        "space-y-3",
        isSmall && "space-y-2"
      )}>
        <div className="space-y-1">
          <Label className={cn("text-xs", isSmall && "text-[10px]")}>Metin veya URL</Label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="QR kod için metin girin"
            className={cn(isSmall && "h-7 text-xs")}
          />
        </div>

        {!isSmall && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">QR Rengi</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Arka Plan</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                </div>
              </div>
            </div>

            {isLarge && (
              <div className="space-y-1">
                <Label className="text-xs">Boyut: {qrSize}px</Label>
                <Slider
                  value={[qrSize]}
                  onValueChange={(v) => setQrSize(v[0])}
                  min={128}
                  max={512}
                  step={32}
                />
              </div>
            )}
          </>
        )}

        <div className={cn(
          "flex gap-2",
          isSmall && "gap-1"
        )}>
          <Button
            onClick={downloadQR}
            size={isSmall ? "sm" : "default"}
            className={cn("flex-1", isSmall && "h-7 text-xs")}
          >
            <Download className={cn("h-4 w-4", !isSmall && "mr-2")} />
            {!isSmall && "İndir"}
          </Button>
          
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size={isSmall ? "sm" : "default"}
            className={cn("flex-1", isSmall && "h-7 text-xs")}
          >
            <Copy className={cn("h-4 w-4", !isSmall && "mr-2")} />
            {!isSmall && "Kopyala"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
