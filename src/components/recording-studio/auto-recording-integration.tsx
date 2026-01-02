'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Recording Studio Auto-Record Integration
 * 
 * Automation Engine ile Screen Recorder'ı otomatik olarak entegre eder.
 * Timeline oynatılırken recording otomatik olarak başlar ve durdurulur.
 */

interface AutoRecordingIntegrationProps {
  isPlaying: boolean;
  isPaused: boolean;
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  autoRecordEnabled: boolean;
  countdownSeconds?: number;
}

export function AutoRecordingIntegration({
  isPlaying,
  isPaused,
  recordingState,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  autoRecordEnabled,
  countdownSeconds = 3,
}: AutoRecordingIntegrationProps) {
  const playStateRef = useRef({ isPlaying: false, isPaused: false, recordingState });
  const recordingStartedRef = useRef(false);

  // Sync playback state
  useEffect(() => {
    playStateRef.current = { isPlaying, isPaused, recordingState };
  }, [isPlaying, isPaused, recordingState]);

  // Auto-record synchronization
  useEffect(() => {
    if (!autoRecordEnabled) return;

    const handleAutoRecord = async () => {
      // Start recording when timeline starts playing
      if (isPlaying && !isPaused && recordingState === 'idle' && !recordingStartedRef.current) {
        recordingStartedRef.current = true;
        try {
          await onStartRecording();
        } catch (error) {
          console.error('Failed to start recording:', error);
          recordingStartedRef.current = false;
        }
      }

      // Pause recording when timeline is paused
      if (isPaused && recordingState === 'recording' && onPauseRecording) {
        onPauseRecording();
      }

      // Resume recording when timeline resumes
      if (isPlaying && !isPaused && recordingState === 'paused' && onResumeRecording) {
        onResumeRecording();
      }

      // Stop recording when timeline stops
      if (!isPlaying && !isPaused && recordingStartedRef.current && recordingState !== 'idle') {
        recordingStartedRef.current = false;
        onStopRecording();
      }
    };

    handleAutoRecord();
  }, [
    isPlaying,
    isPaused,
    recordingState,
    autoRecordEnabled,
    onStartRecording,
    onStopRecording,
    onPauseRecording,
    onResumeRecording,
  ]);

  // Reset recording state when recording stops
  useEffect(() => {
    if (recordingState === 'stopped' || recordingState === 'idle') {
      recordingStartedRef.current = false;
    }
  }, [recordingState]);

  return null; // This is a headless integration component
}

/**
 * Countdown Timer Component
 * Recording başlamadan önce geri sayım gösterir
 */
interface CountdownTimerProps {
  isActive: boolean;
  totalSeconds: number;
  onComplete: () => void;
  position?: 'center' | 'top-right' | 'top-left';
}

export function CountdownTimer({
  isActive,
  totalSeconds,
  onComplete,
  position = 'center',
}: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = React.useState(totalSeconds);

  React.useEffect(() => {
    if (!isActive) {
      setSecondsLeft(totalSeconds);
      return;
    }

    if (secondsLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isActive, secondsLeft, totalSeconds, onComplete]);

  if (!isActive || secondsLeft <= 0) return null;

  const positionClasses = {
    center: 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'fixed top-8 right-8',
    'top-left': 'fixed top-8 left-8',
  };

  return (
    <div className={`${positionClasses[position]} z-50 pointer-events-none`}>
      <div className="flex flex-col items-center gap-4">
        <div className="text-7xl font-bold text-red-500 drop-shadow-lg animate-pulse">
          {secondsLeft}
        </div>
        <div className="text-xl text-white drop-shadow-lg">Kayıt başlıyor...</div>
      </div>
    </div>
  );
}

/**
 * Recording Status Indicator
 * Kayıt durumunu gösterir
 */
interface RecordingStatusIndicatorProps {
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  isPlaying: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function RecordingStatusIndicator({
  recordingState,
  isPlaying,
  position = 'top-right',
}: RecordingStatusIndicatorProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (recordingState === 'idle') return null;

  const statusConfig = {
    recording: { color: 'bg-red-500', label: 'REC', pulse: true },
    paused: { color: 'bg-yellow-500', label: 'PAUSE', pulse: false },
    stopped: { color: 'bg-gray-500', label: 'STOP', pulse: false },
  };

  const config = statusConfig[recordingState];

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm`}>
        <div className={`w-3 h-3 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-bold text-white">{config.label}</span>
      </div>
    </div>
  );
}

export default AutoRecordingIntegration;
