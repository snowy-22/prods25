'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Camera, Send } from 'lucide-react';

export function FloorPlanCamera({
  isOpen,
  onClose,
  onCapture,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const startCamera = async () => {
      try {
        setIsLoading(true);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Wait for video to be ready
          await new Promise(resolve => {
            videoRef.current!.onloadedmetadata = resolve;
          });
        }
      } catch (error) {
        console.error('Kamera erişimi hatası:', error);
        alert('Kamera erişimine izin verin lütfen.');
      } finally {
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    context.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    setPhoto(dataUrl);

    // Stop the video stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const usePhoto = () => {
    if (photo) {
      onCapture(photo);
      handleClose();
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setPhoto(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kat Planı Fotoğrafı</DialogTitle>
        </DialogHeader>

        {!photo ? (
          <div className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <p className="mb-2">Kamera başlatılıyor...</p>
                </div>
              </div>
            )}

            {!isLoading && stream && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-black"
                  style={{ aspectRatio: '4/3' }}
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}

            {!isLoading && stream && (
              <Button
                onClick={capturePhoto}
                size="lg"
                className="w-full"
              >
                <Camera className="h-5 w-5 mr-2" />
                Fotoğraf Çek
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <img
              src={photo}
              alt="Çekilen fotoğraf"
              className="w-full rounded-lg"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPhoto(null);
                  // Restart camera
                  const startCamera = async () => {
                    try {
                      const mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' },
                        audio: false,
                      });
                      setStream(mediaStream);
                      if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                      }
                    } catch (error) {
                      console.error('Kamera hatası:', error);
                    }
                  };
                  startCamera();
                }}
                className="flex-1"
              >
                Yeniden Çek
              </Button>
              <Button onClick={usePhoto} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Kullan
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
