'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Circle, 
  Square, 
  Pause, 
  Play, 
  Download, 
  Trash2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertCircle
} from 'lucide-react';
import { useScreenRecorder } from '@/hooks/use-screen-recorder';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScreenRecorderWidgetProps {
  size?: 'small' | 'medium' | 'large';
  onRecordingComplete?: (blob: Blob) => void;
}

export function ScreenRecorderWidget({ 
  size = 'medium',
  onRecordingComplete 
}: ScreenRecorderWidgetProps) {
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [videoEnabled, setVideoEnabled] = React.useState(true);

  const {
    recordingState,
    recordingTime,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    downloadRecording,
    resetRecording,
    getRecordingBlob,
    hasRecording,
  } = useScreenRecorder({
    audio: audioEnabled,
    video: videoEnabled,
  });

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    await startRecording();
  };

  const handleStop = () => {
    stopRecording();
    
    // Notify parent if callback provided
    setTimeout(() => {
      const blob = getRecordingBlob();
      if (blob && onRecordingComplete) {
        onRecordingComplete(blob);
      }
    }, 500);
  };

  const handleDownload = () => {
    downloadRecording();
  };

  const handleReset = () => {
    resetRecording();
  };

  return (
    <Card className={cn(
      "w-full h-full flex flex-col",
      isSmall && "text-xs",
      isLarge && "text-base"
    )}>
      <CardHeader className={cn(
        "pb-3",
        isSmall && "p-3"
      )}>
        <CardTitle className={cn(
          "flex items-center gap-2",
          isSmall && "text-sm",
          !isSmall && !isLarge && "text-base",
          isLarge && "text-lg"
        )}>
          <Video className={cn(
            isSmall && "h-4 w-4",
            !isSmall && "h-5 w-5"
          )} />
          Ekran Kaydedici
          {recordingState === 'recording' && (
            <Circle className="h-3 w-3 fill-red-500 text-red-500 animate-pulse" />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className={cn(
        "flex-1 flex flex-col gap-3",
        isSmall && "gap-2 p-3 pt-0"
      )}>
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Recording Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={
              recordingState === 'recording' ? 'destructive' :
              recordingState === 'paused' ? 'secondary' :
              recordingState === 'stopped' ? 'outline' :
              'default'
            } className={cn(isSmall && "text-[10px] px-2 py-0")}>
              {recordingState === 'idle' && 'Hazır'}
              {recordingState === 'recording' && 'Kaydediliyor'}
              {recordingState === 'paused' && 'Duraklatıldı'}
              {recordingState === 'stopped' && 'Tamamlandı'}
            </Badge>
          </div>
          
          <div className={cn(
            "font-mono font-bold",
            recordingState === 'recording' && "text-red-500",
            isSmall && "text-xs",
            !isSmall && "text-lg"
          )}>
            {formatTime(recordingTime)}
          </div>
        </div>

        {/* Settings (only when idle) */}
        {recordingState === 'idle' && !hasRecording && (
          <div className="flex gap-2">
            <Button
              variant={videoEnabled ? 'default' : 'outline'}
              size={isSmall ? 'sm' : 'default'}
              onClick={() => setVideoEnabled(!videoEnabled)}
              className="flex-1"
            >
              {videoEnabled ? <Video className="h-4 w-4 mr-1" /> : <VideoOff className="h-4 w-4 mr-1" />}
              {!isSmall && (videoEnabled ? 'Video Açık' : 'Video Kapalı')}
            </Button>
            
            <Button
              variant={audioEnabled ? 'default' : 'outline'}
              size={isSmall ? 'sm' : 'default'}
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="flex-1"
            >
              {audioEnabled ? <Mic className="h-4 w-4 mr-1" /> : <MicOff className="h-4 w-4 mr-1" />}
              {!isSmall && (audioEnabled ? 'Ses Açık' : 'Ses Kapalı')}
            </Button>
          </div>
        )}

        <Separator />

        {/* Control Buttons */}
        <div className="flex gap-2">
          {recordingState === 'idle' && (
            <Button
              onClick={handleStart}
              variant="destructive"
              size={isSmall ? 'sm' : 'default'}
              className="flex-1"
            >
              <Circle className="h-4 w-4 mr-1 fill-current" />
              {!isSmall && 'Kayda Başla'}
            </Button>
          )}

          {recordingState === 'recording' && (
            <>
              <Button
                onClick={pauseRecording}
                variant="secondary"
                size={isSmall ? 'sm' : 'default'}
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-1" />
                {!isSmall && 'Duraklat'}
              </Button>
              
              <Button
                onClick={handleStop}
                variant="outline"
                size={isSmall ? 'sm' : 'default'}
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-1" />
                {!isSmall && 'Durdur'}
              </Button>
            </>
          )}

          {recordingState === 'paused' && (
            <>
              <Button
                onClick={resumeRecording}
                variant="default"
                size={isSmall ? 'sm' : 'default'}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-1" />
                {!isSmall && 'Devam Et'}
              </Button>
              
              <Button
                onClick={handleStop}
                variant="outline"
                size={isSmall ? 'sm' : 'default'}
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-1" />
                {!isSmall && 'Durdur'}
              </Button>
            </>
          )}

          {recordingState === 'stopped' && hasRecording && (
            <>
              <Button
                onClick={handleDownload}
                variant="default"
                size={isSmall ? 'sm' : 'default'}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                {!isSmall && 'İndir'}
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                size={isSmall ? 'sm' : 'default'}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Preview Area */}
        {!isSmall && hasRecording && recordingState === 'stopped' && (
          <div className="flex-1 flex items-center justify-center bg-muted rounded-lg p-4">
            <div className="text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Kayıt tamamlandı</p>
              <p className="text-xs">İndirmek için yukarıdaki butonu kullanın</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ScreenRecorderWidget;
