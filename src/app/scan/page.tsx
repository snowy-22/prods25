
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Image as ImageIcon, X, Loader2, List, MessageSquare, Share2, Check, CheckCheck, Rows, SwitchCamera as CameraReverse } from 'lucide-react';
import Link from 'next/link';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { analyzeItem } from '@/ai/flows/analyze-item-flow';
import { ItemAnalysisOutput } from '@/ai/flows/analyze-item-schema';
import { AppLogo } from '@/components/icons/app-logo';

type CapturedPhoto = {
  id: string;
  dataUrl: string;
  isAnalyzing: boolean;
  analysis?: ItemAnalysisOutput;
};

export default function ScanPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGallery, setShowGallery] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startAnalysis = async (photoId: string, imageDataUrl: string) => {
    try {
        const result = await analyzeItem({ imageUri: imageDataUrl });
        setCapturedPhotos(prev => prev.map(p => 
            p.id === photoId ? { ...p, analysis: result, isAnalyzing: false } : p
        ));
    } catch (e: any) {
        console.error("AI analysis failed:", e);
        setCapturedPhotos(prev => prev.map(p => 
            p.id === photoId ? { ...p, isAnalyzing: false, analysis: undefined } : p
        ));
    }
  };

  const handleCapture = useCallback(() => {
    if (isCapturing || !videoRef.current?.srcObject) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      const newPhoto: CapturedPhoto = {
        id: `photo-${Date.now()}`,
        dataUrl,
        isAnalyzing: true,
      };

      setCapturedPhotos(prev => [newPhoto, ...prev]);
      startAnalysis(newPhoto.id, dataUrl);
    }

    setTimeout(() => setIsCapturing(false), 300); // Short cooldown
  }, [isCapturing]);

  const setupCamera = useCallback(async (mode: 'environment' | 'user') => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ variant: 'destructive', title: 'Kamera Desteklenmiyor', description: 'Tarayıcınız kamera erişimini desteklemiyor.' });
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Kamera erişim hatası:', error);
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Kamera Erişimi Reddedildi', description: 'Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin.' });
      }
  }, [toast]);
  
  useEffect(() => {
    setupCamera(facingMode);
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, setupCamera]);


  const handlePhotoClick = (photo: CapturedPhoto) => {
    if (isMultiSelectMode) {
      const newSelectedIds = new Set(selectedPhotoIds);
      if (newSelectedIds.has(photo.id)) {
        newSelectedIds.delete(photo.id);
      } else {
        newSelectedIds.add(photo.id);
      }
      setSelectedPhotoIds(newSelectedIds);
    } else {
      // In single-select mode, just show the detail view
      const newSelectedIds = new Set([photo.id]);
      setSelectedPhotoIds(newSelectedIds);
    }
  };

  const handleAddToList = () => {
    const itemsToAdd = capturedPhotos
      .filter(p => selectedPhotoIds.has(p.id))
      .map(p => ({
        type: 'scan' as const,
        title: p.analysis?.title || 'Taranan Öğe',
        content: p.analysis?.description,
        thumbnail_url: p.analysis?.imageUrl || p.dataUrl,
        url: p.dataUrl, // url is kept for potential future use but not used in the main list item
      }));

    if (itemsToAdd.length > 0) {
      const event = new CustomEvent('addScannedItems', { detail: { items: itemsToAdd } });
      window.dispatchEvent(event);
      
      toast({
        title: "Listeye Eklendi!",
        description: `${itemsToAdd.length} öğe "Kaydedilenler" listesine başarıyla eklendi.`
      });

      // Clear selection and exit multi-select mode
      setSelectedPhotoIds(new Set());
      setIsMultiSelectMode(false);
    }
  }
  
  const handleToggleMultiSelect = () => {
    if (isMultiSelectMode) {
        setSelectedPhotoIds(new Set());
    }
    setIsMultiSelectMode(!isMultiSelectMode);
  };
  
  const handleToggleCamera = () => {
      // Prevent toggling if camera is not available
      if (!videoRef.current?.srcObject) return;
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }

  const selectedPhoto = capturedPhotos.find(p => selectedPhotoIds.has(p.id));

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <div className="relative flex-1 w-full h-full" onDoubleClick={handleCapture}>
        <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
        {hasCameraPermission === false && (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center">
            <Alert variant="destructive" className="max-w-md bg-black/50 text-white border-red-500/50">
                <Camera className="h-4 w-4" />
                <AlertTitle>Kamera Erişimi Gerekli</AlertTitle>
                <AlertDescription>Bu özelliği kullanmak için lütfen kamera erişimine izin verin.</AlertDescription>
            </Alert>
          </div>
        )}
        {hasCameraPermission !== false && (
          <>
            {isCapturing && <div className="absolute inset-0 bg-white/30 animate-pulse" style={{ animationDuration: '300ms' }} />}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-3/4 h-1/2">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary/80 rounded-tl-2xl animate-pulseGlow" style={{ animationDelay: '0s' }} />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary/80 rounded-tr-2xl animate-pulseGlow" style={{ animationDelay: '0.2s' }} />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary/80 rounded-bl-2xl animate-pulseGlow" style={{ animationDelay: '0.4s' }} />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary/80 rounded-br-2xl animate-pulseGlow" style={{ animationDelay: '0.6s' }}/>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-4">
         <div className="flex justify-between items-end">
            <div className="flex-1">
                {selectedPhotoIds.size > 0 && (
                    <Button onClick={handleAddToList} className="shadow-lg animate-in fade-in zoom-in-95">
                        <List className="mr-2 h-4 w-4" />
                        {selectedPhotoIds.size} Öğeyi Listeye Ekle
                    </Button>
                )}
            </div>

            <div className="flex-1 flex justify-center">
                 <Button
                  size="icon"
                  className="h-16 w-16 rounded-full border-4 border-white bg-transparent hover:bg-white/20"
                  onClick={handleCapture}
                  disabled={isCapturing || hasCameraPermission === false}
                >
                  <Camera className="h-8 w-8 text-white" />
                </Button>
            </div>
            
            <div className="flex-1 flex justify-end items-center gap-2">
                 <Button variant={isMultiSelectMode ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 text-white bg-black/50 hover:bg-white/20 rounded-full" onClick={handleToggleMultiSelect}>
                    <CheckCheck className="h-5 w-5" />
                </Button>
                 <Button variant="ghost" size="icon" className="h-10 w-10 text-white bg-black/50 hover:bg-white/20 rounded-full" onClick={() => setShowGallery(!showGallery)}>
                    <Rows className="h-5 w-5" />
                </Button>
                 <Button variant="ghost" size="icon" className="h-10 w-10 text-white bg-black/50 hover:bg-white/20 rounded-full" onClick={handleToggleCamera}>
                    <CameraReverse className="h-5 w-5" />
                </Button>
                <Button asChild variant="ghost" size="icon" className="h-10 w-10 text-white bg-black/50 hover:bg-white/20 rounded-full">
                    <Link href="/canvas">
                        <X className="h-6 w-6" />
                    </Link>
                </Button>
            </div>
         </div>
        
        {showGallery && (
            <ScrollArea className="w-full">
                <div className="flex items-center gap-3 pb-2">
                    {capturedPhotos.map(photo => (
                    <Card 
                        key={photo.id}
                        onClick={() => handlePhotoClick(photo)}
                        className={cn(
                            "relative h-24 w-24 flex-shrink-0 cursor-pointer overflow-hidden transition-all duration-300 rounded-lg bg-muted",
                            selectedPhotoIds.has(photo.id) ? "border-primary border-2 scale-105" : "border-transparent"
                        )}
                    >
                        <Image src={photo.dataUrl} alt={`Captured ${photo.id}`} layout="fill" objectFit="cover" />
                        {photo.isAnalyzing && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <AppLogo className="h-8 w-8 text-primary"/>
                            </div>
                        )}
                         {isMultiSelectMode && (
                             <div className={cn(
                                "absolute top-1 right-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center",
                                selectedPhotoIds.has(photo.id) ? 'bg-primary' : 'bg-black/50'
                             )}>
                                {selectedPhotoIds.has(photo.id) && <Check className="h-4 w-4 text-white"/>}
                             </div>
                         )}
                    </Card>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        )}
      </div>

      {!isMultiSelectMode && selectedPhotoIds.size === 1 && selectedPhoto && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setSelectedPhotoIds(new Set())}>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-card/90" onClick={e => e.stopPropagation()}>
                <CardContent className="relative w-full p-0">
                    <div className="relative aspect-square w-full">
                        {selectedPhoto.isAnalyzing ? (
                            <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-4 text-center">
                                <AppLogo className="h-16 w-16 text-primary mb-4"/>
                                <p className="font-semibold text-muted-foreground">Analiz ediliyor...</p>
                            </div>
                        ) : (
                            <Image src={selectedPhoto.analysis?.imageUrl || selectedPhoto.dataUrl} alt={selectedPhoto.analysis?.title || 'Seçilen fotoğraf'} layout="fill" objectFit="contain" />
                        )}
                    </div>
                </CardContent>
                <ScrollArea className="max-h-80">
                    <div className="p-4 space-y-3">
                        {selectedPhoto.analysis ? (
                            <>
                                <div>
                                    <h3 className="font-bold text-lg">{selectedPhoto.analysis.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedPhoto.analysis.description}</p>
                                </div>
                                
                                {(selectedPhoto.analysis.category || selectedPhoto.analysis.brand || selectedPhoto.analysis.barcode) && (
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                        {selectedPhoto.analysis.category && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Kategori</p>
                                                <p className="text-sm font-semibold">{selectedPhoto.analysis.category}</p>
                                            </div>
                                        )}
                                        {selectedPhoto.analysis.brand && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Marka</p>
                                                <p className="text-sm font-semibold">{selectedPhoto.analysis.brand}</p>
                                            </div>
                                        )}
                                        {selectedPhoto.analysis.barcode && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-muted-foreground">Barkod</p>
                                                <p className="text-sm font-mono font-semibold">{selectedPhoto.analysis.barcode}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedPhoto.analysis.detectedLabels && selectedPhoto.analysis.detectedLabels.length > 0 && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-2">Algılanan Etiketler</p>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedPhoto.analysis.detectedLabels.map((label, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">{label}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedPhoto.analysis.priceLinks && selectedPhoto.analysis.priceLinks.length > 0 && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-2">Fiyat Bilgileri</p>
                                        <div className="space-y-1">
                                            {selectedPhoto.analysis.priceLinks.map((link, i) => (
                                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" 
                                                   className="flex items-center justify-between p-2 rounded-md bg-muted hover:bg-muted/70 transition-colors">
                                                    <span className="text-sm font-medium">{link.source}</span>
                                                    {link.price && <span className="text-sm text-primary font-bold">{link.price}</span>}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedPhoto.analysis.reviewVideos && selectedPhoto.analysis.reviewVideos.length > 0 && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-2">İnceleme Videoları</p>
                                        <div className="space-y-1">
                                            {selectedPhoto.analysis.reviewVideos.map((video, i) => (
                                                <a key={i} href={video.url} target="_blank" rel="noopener noreferrer" 
                                                   className="block p-2 rounded-md bg-muted hover:bg-muted/70 transition-colors">
                                                    <span className="text-sm">{video.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">Analiz sonucu bekleniyor veya bulunamadı.</p>
                        )}
                    </div>
                </ScrollArea>
            </Card>
        </div>
      )}
    </div>
  );
}
