/**
 * QR Code Components
 * 
 * - QRCodeDisplay: Show QR code for referral
 * - QRCodeScanner: Scan QR codes to extract referral
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ============================================
// QR CODE DISPLAY
// ============================================
interface QRCodeDisplayProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
}

export function QRCodeDisplay({
  value,
  size = 256,
  level = 'M',
  includeMargin = true,
  className
}: QRCodeDisplayProps) {
  return (
    <div className={className}>
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}

// ============================================
// QR CODE SCANNER
// ============================================
interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function QRCodeScanner({ onScan, onError, className }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const codeReader = new BrowserMultiFormatReader();
      readerRef.current = codeReader;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        codeReader.decodeFromVideoElement(
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText();
              onScan(text);
              stopScanning();
            }
            if (err && err.name !== 'NotFoundException') {
              console.error('QR scan error:', err);
            }
          }
        );
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Kamera erişimi reddedildi veya kullanılamıyor';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {!isScanning ? (
          <div className="text-center space-y-4">
            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                📷 Kamerayı başlatmak için tıklayın
              </p>
            </div>
            <Button onClick={startScanning} className="w-full">
              QR Taramayı Başlat
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
              />
              <div className="absolute inset-0 border-4 border-primary/50 rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-primary rounded-lg" />
              </div>
            </div>
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              Taramayı Durdur
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              QR kodu kare içine hizalayın
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            ⚠️ {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// QR CODE SHARE CARD
// ============================================
interface QRCodeShareCardProps {
  referralCode: string;
  username?: string;
  onDownload?: () => void;
  className?: string;
}

export function QRCodeShareCard({
  referralCode,
  username,
  onDownload,
  className
}: QRCodeShareCardProps) {
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${referralCode}`;

  const handleDownload = () => {
    // Convert SVG to canvas and download
    const svg = document.querySelector('#referral-qr-code svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.download = `canvasflow-referral-${referralCode}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
        }
      });
      
      URL.revokeObjectURL(url);
    };

    img.src = url;
    
    if (onDownload) onDownload();
  };

  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="font-bold text-lg">CanvasFlow'a Katıl!</h3>
          {username && (
            <p className="text-sm text-muted-foreground">
              {username} seni davet ediyor
            </p>
          )}
        </div>

        <div id="referral-qr-code" className="flex justify-center bg-white p-4 rounded-lg">
          <QRCodeDisplay value={shareUrl} size={200} />
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm font-mono font-bold">{referralCode}</p>
          <p className="text-xs text-muted-foreground">
            QR kodu tara veya kodu manuel gir
          </p>
        </div>

        <Button onClick={handleDownload} variant="outline" className="w-full">
          📥 QR Kodu İndir
        </Button>
      </CardContent>
    </Card>
  );
}
