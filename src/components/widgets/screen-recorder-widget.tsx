"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Square, Download, Play, Pause, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ScreenRecorderWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

export default function ScreenRecorderWidget({ size = 'medium' }: ScreenRecorderWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true
      });

      streamRef.current = stream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: 'Kayıt Başladı',
        description: 'Ekran kaydı başlatıldı.',
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: 'Hata',
        description: 'Ekran kaydı başlatılamadı.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      toast({
        title: 'Kayıt Duraklatıldı',
      });
    }
  }, [toast]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: 'Kayıt Devam Ediyor',
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast({
        title: 'Kayıt Durduruldu',
        description: 'Video hazır.',
      });
    }
  }, [toast]);

  const downloadVideo = useCallback(() => {
    if (!recordedVideo) return;
    
    const link = document.createElement('a');
    link.download = `screen-recording-${Date.now()}.webm`;
    link.href = recordedVideo;
    link.click();
    
    toast({
      title: 'İndirildi',
      description: 'Video indirildi.',
    });
  }, [recordedVideo, toast]);

  const deleteVideo = useCallback(() => {
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
      setRecordedVideo(null);
      setRecordingTime(0);
    }
  }, [recordedVideo]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSmall = size === 'small';
  const isMedium = size === 'medium';
  const isLarge = size === 'large';

  return (
    <Card className={cn(
      "w-full h-full flex flex-col items-center justify-center gap-3 p-4",
      isSmall && "gap-2 p-2",
      isLarge && "gap-4 p-6"
    )}>
      {recordedVideo ? (
        <div className="relative w-full h-full flex flex-col gap-2">
          <div className="flex-1 relative overflow-hidden rounded border bg-black">
            <video 
              src={recordedVideo} 
              controls 
              className="w-full h-full"
            />
          </div>
          
          <div className={cn(
            "flex gap-2 justify-center flex-wrap",
            isSmall && "gap-1"
          )}>
            <Button
              variant="outline"
              size={isSmall ? "sm" : "default"}
              onClick={downloadVideo}
              className={cn(isSmall && "h-7 px-2 text-xs")}
            >
              <Download className={cn("h-4 w-4", !isSmall && "mr-2")} />
              {!isSmall && "İndir"}
            </Button>
            
            <Button
              variant="outline"
              size={isSmall ? "sm" : "default"}
              onClick={deleteVideo}
              className={cn(isSmall && "h-7 px-2 text-xs")}
            >
              <Trash2 className={cn("h-4 w-4", !isSmall && "mr-2")} />
              {!isSmall && "Sil"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          {isRecording ? (
            <>
              <div className={cn(
                "flex items-center gap-2 text-destructive font-mono",
                isSmall && "text-sm",
                isLarge && "text-lg"
              )}>
                <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
                <span>{formatTime(recordingTime)}</span>
              </div>
              
              <div className={cn(
                "flex gap-2",
                isSmall && "gap-1"
              )}>
                {isPaused ? (
                  <Button
                    onClick={resumeRecording}
                    size={isSmall ? "sm" : isLarge ? "lg" : "default"}
                    variant="outline"
                    className={cn(isSmall && "h-8 px-3 text-xs")}
                  >
                    <Play className={cn("h-4 w-4", !isSmall && "mr-2")} />
                    {!isSmall && "Devam"}
                  </Button>
                ) : (
                  <Button
                    onClick={pauseRecording}
                    size={isSmall ? "sm" : isLarge ? "lg" : "default"}
                    variant="outline"
                    className={cn(isSmall && "h-8 px-3 text-xs")}
                  >
                    <Pause className={cn("h-4 w-4", !isSmall && "mr-2")} />
                    {!isSmall && "Duraklat"}
                  </Button>
                )}
                
                <Button
                  onClick={stopRecording}
                  size={isSmall ? "sm" : isLarge ? "lg" : "default"}
                  variant="destructive"
                  className={cn(isSmall && "h-8 px-3 text-xs")}
                >
                  <Square className={cn("h-4 w-4", !isSmall && "mr-2")} />
                  {!isSmall && "Durdur"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Video className={cn(
                "text-muted-foreground",
                isSmall && "h-8 w-8",
                isMedium && "h-12 w-12",
                isLarge && "h-16 w-16"
              )} />
              
              <Button
                onClick={startRecording}
                size={isSmall ? "sm" : isLarge ? "lg" : "default"}
                className={cn(isSmall && "h-8 px-3 text-xs")}
              >
                <Video className={cn("h-4 w-4", !isSmall && "mr-2")} />
                Kayda Başla
              </Button>
              
              {!isSmall && (
                <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                  Ekran, sekme veya pencere kaydedin
                </p>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
