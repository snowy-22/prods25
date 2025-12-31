"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Download, Scissors, CheckCircle2, Copy, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ScreenshotWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function ScreenshotWidget({ size = 'medium' }: ScreenshotWidgetProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const captureScreen = useCallback(async () => {
    try {
      setIsCapturing(true);
      
      // Use Screen Capture API
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { mediaSource: 'screen' }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas and capture frame
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0);
      
      // Stop the stream
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      
      // Get image data
      const imageData = canvas.toDataURL('image/png');
      setScreenshot(imageData);
      
      toast({
        title: 'Ekran Görüntüsü Alındı',
        description: 'Görüntü başarıyla yakalandı.',
      });
    } catch (error) {
      console.error('Screenshot error:', error);
      toast({
        title: 'Hata',
        description: 'Ekran görüntüsü alınamadı.',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  }, [toast]);

  const downloadScreenshot = useCallback(() => {
    if (!screenshot) return;
    
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = screenshot;
    link.click();
    
    toast({
      title: 'İndirildi',
      description: 'Ekran görüntüsü indirildi.',
    });
  }, [screenshot, toast]);

  const copyToClipboard = useCallback(async () => {
    if (!screenshot) return;
    
    try {
      const blob = await fetch(screenshot).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      toast({
        title: 'Kopyalandı',
        description: 'Panoya kopyalandı.',
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: 'Hata',
        description: 'Panoya kopyalanamadı.',
        variant: 'destructive',
      });
    }
  }, [screenshot, toast]);

  const clearScreenshot = useCallback(() => {
    setScreenshot(null);
  }, []);

  const isSmall = size === 'small';
  const isMedium = size === 'medium';
  const isLarge = size === 'large';

  return (
    <Card className={cn(
      "w-full h-full flex flex-col items-center justify-center gap-3 p-4",
      isSmall && "gap-2 p-2",
      isLarge && "gap-4 p-6"
    )}>
      <canvas ref={canvasRef} className="hidden" />
      
      {screenshot ? (
        <div className="relative w-full h-full flex flex-col gap-2">
          <div className="flex-1 relative overflow-hidden rounded border">
            <img 
              src={screenshot} 
              alt="Screenshot" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className={cn(
            "flex gap-2 justify-center flex-wrap",
            isSmall && "gap-1"
          )}>
            <Button
              variant="outline"
              size={isSmall ? "sm" : "default"}
              onClick={downloadScreenshot}
              className={cn(isSmall && "h-7 px-2 text-xs")}
            >
              <Download className={cn("h-4 w-4", !isSmall && "mr-2")} />
              {!isSmall && "İndir"}
            </Button>
            
            <Button
              variant="outline"
              size={isSmall ? "sm" : "default"}
              onClick={copyToClipboard}
              className={cn(isSmall && "h-7 px-2 text-xs")}
            >
              <Copy className={cn("h-4 w-4", !isSmall && "mr-2")} />
              {!isSmall && "Kopyala"}
            </Button>
            
            <Button
              variant="outline"
              size={isSmall ? "sm" : "default"}
              onClick={clearScreenshot}
              className={cn(isSmall && "h-7 px-2 text-xs")}
            >
              <X className={cn("h-4 w-4", !isSmall && "mr-2")} />
              {!isSmall && "Temizle"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Camera className={cn(
            "text-muted-foreground",
            isSmall && "h-8 w-8",
            isMedium && "h-12 w-12",
            isLarge && "h-16 w-16"
          )} />
          
          <Button
            onClick={captureScreen}
            disabled={isCapturing}
            size={isSmall ? "sm" : isLarge ? "lg" : "default"}
            className={cn(isSmall && "h-8 px-3 text-xs")}
          >
            <Camera className={cn("h-4 w-4", !isSmall && "mr-2")} />
            {isCapturing ? 'Yakalanıyor...' : 'Ekran Görüntüsü Al'}
          </Button>
          
          {!isSmall && (
            <p className="text-xs text-muted-foreground text-center max-w-[250px]">
              Ekran, sekme veya pencere görüntüsü yakalayın
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
