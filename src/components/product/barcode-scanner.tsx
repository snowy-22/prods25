'use client';

import React, { useRef, useState } from 'react';
import { X, Camera, Loader, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanned: (barcode: string, data?: any) => void;
  onManualEntry?: (barcode: string) => void;
}

/**
 * BarcodeScanner - Barkod Tarayıcı Bileşeni
 * Supports: Camera scanning, manual entry, auto-lookup
 */
export function BarcodeScanner({ isOpen, onClose, onScanned, onManualEntry }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [lastScannedTime, setLastScannedTime] = useState(0);

  // Initialize camera
  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        startBarcodeDetection();
      }
    } catch (err) {
      setError('Kamera erişimi reddedildi. Lütfen izinleri kontrol edin.');
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  // Barcode detection loop
  const startBarcodeDetection = () => {
    const detectBarcode = async () => {
      if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        // Use Barcode Detection API (if available)
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e'],
          });

          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue;
            const now = Date.now();
            // Prevent duplicate scans within 1 second
            if (now - lastScannedTime > 1000) {
              setLastScannedTime(now);
              stopCamera();
              handleBarcodeScanned(barcode);
            }
          }
        }
      } catch (err) {
        console.log('Barcode detection error:', err);
      }

      requestAnimationFrame(detectBarcode);
    };

    detectBarcode();
  };

  // Handle barcode scan
  const handleBarcodeScanned = async (barcode: string) => {
    setIsScanning(true);
    try {
      // Call API to lookup barcode
      const response = await fetch('/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      });

      const result = await response.json();
      onScanned(barcode, result);
    } catch (err) {
      console.error('Barcode lookup error:', err);
      onScanned(barcode);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle manual entry
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;

    setIsScanning(true);
    try {
      const response = await fetch('/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: manualBarcode }),
      });

      const result = await response.json();
      onScanned(manualBarcode, result);
      setManualBarcode('');
      onClose();
    } catch (err) {
      console.error('Barcode lookup error:', err);
      onScanned(manualBarcode);
      setManualBarcode('');
      onClose();
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 flex items-center justify-between border-b border-orange-800">
          <h2 className="text-xl font-bold">Barkod Tara</h2>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 hover:bg-orange-600 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Camera View */}
          {!isCameraActive && !error && (
            <button
              onClick={startCamera}
              disabled={isScanning}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-shadow font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={20} />
              Kamera Başlat
            </button>
          )}

          {isCameraActive && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-80 bg-black rounded-lg object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanner Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-orange-500 rounded-lg opacity-70"></div>
              </div>

              {/* Scanning Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <Loader size={16} className="animate-spin" />
                Taranıyor...
              </div>

              {/* Stop Button */}
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-red-900">{error}</p>
                <p className="text-xs text-red-700 mt-1">Lütfen aşağıdan manuel olarak girin</p>
              </div>
            </div>
          )}

          {/* Manual Entry */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Barkodu Manuel Girin
              </label>
              <input
                type="text"
                placeholder="Barkod numarası"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition font-mono text-lg tracking-wider text-center"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!manualBarcode.trim() || isScanning}
              className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isScanning && <Loader size={16} className="animate-spin" />}
              {isScanning ? 'Aranıyor...' : 'Kontrol Et'}
            </button>
          </form>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">İpucu:</p>
            <ul className="text-xs space-y-1">
              <li>• Kamera ışığı açık ortamda en iyi çalışır</li>
              <li>• Barkodu çerçeve içinde tutun</li>
              <li>• 13 veya 8 rakamlı EAN barkodları desteklenir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScanner;
