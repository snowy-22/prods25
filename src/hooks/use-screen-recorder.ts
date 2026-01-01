'use client';

import { useState, useRef, useCallback } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecorderOptions {
  audio?: boolean;
  video?: boolean;
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export function useScreenRecorder(options: RecorderOptions = {}) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request screen capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: options.video !== false ? true : false,
        audio: false, // Screen audio handled separately
      });

      let finalStream = displayStream;

      // Add system/microphone audio if requested
      if (options.audio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            },
          });

          // Combine video and audio tracks
          const audioTrack = audioStream.getAudioTracks()[0];
          finalStream.addTrack(audioTrack);
        } catch (audioError) {
          console.warn('Could not capture audio:', audioError);
        }
      }

      streamRef.current = finalStream;

      // Determine supported MIME type
      const mimeType = options.mimeType || getSupportedMimeType();

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000,
      });

      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        setRecordingState('stopped');
        
        // Stop all tracks
        finalStream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        stopRecording();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Handle user stopping screen share
      finalStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setError(err.message || 'Failed to start recording');
      setRecordingState('idle');
    }
  }, [options]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [recordingState]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, [recordingState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState !== 'idle' && recordingState !== 'stopped') {
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  const downloadRecording = useCallback((filename?: string) => {
    if (recordedChunks.length === 0) {
      setError('No recording to download');
      return;
    }

    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename || `screen-recording-${Date.now()}.webm`;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }, [recordedChunks]);

  const resetRecording = useCallback(() => {
    setRecordedChunks([]);
    setRecordingTime(0);
    setRecordingState('idle');
    setError(null);
  }, []);

  const getRecordingBlob = useCallback(() => {
    if (recordedChunks.length === 0) return null;
    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    return new Blob(recordedChunks, { type: mimeType });
  }, [recordedChunks]);

  return {
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
    hasRecording: recordedChunks.length > 0,
  };
}

// Helper to get supported MIME type
function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm';
}
