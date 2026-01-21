/**
 * AI React Hooks
 * Voice, Vision, Chat ve AI araçları için React hooks
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  VoiceTranscript, 
  VoiceInputConfig, 
  VoiceOutputConfig,
  VisionAnalysisResult,
  VisionAnalysisType,
  AIMessage,
  AISession,
} from './types';
import { 
  VoiceInputManager, 
  VoiceOutputManager, 
  getVoiceInput, 
  getVoiceOutput 
} from './voice-service';
import { 
  CameraManager, 
  getCamera, 
  analyzeImage,
  isCameraSupported 
} from './vision-service';

// ========================
// Voice Input Hook
// ========================

export interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceInput(config?: Partial<VoiceInputConfig>): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const managerRef = useRef<VoiceInputManager | null>(null);
  
  useEffect(() => {
    managerRef.current = getVoiceInput();
    setIsSupported(managerRef.current.isSupported());
    
    // Setup callbacks
    managerRef.current.onResult((result: VoiceTranscript) => {
      if (result.isFinal) {
        setTranscript(prev => prev + result.text);
        setInterimTranscript('');
      } else {
        setInterimTranscript(result.text);
      }
    });
    
    managerRef.current.onError((err: string) => {
      setError(err);
      setIsListening(false);
    });
    
    managerRef.current.onStateChange((listening: boolean) => {
      setIsListening(listening);
      if (!listening) {
        setInterimTranscript('');
      }
    });
    
    return () => {
      managerRef.current?.stop();
    };
  }, []);
  
  const startListening = useCallback(() => {
    if (!managerRef.current) return;
    
    setError(null);
    managerRef.current.start();
  }, []);
  
  const stopListening = useCallback(() => {
    managerRef.current?.stop();
    setIsListening(false);
    setInterimTranscript('');
  }, []);
  
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);
  
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);
  
  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}

// ========================
// Voice Output Hook
// ========================

export interface UseVoiceOutputReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  isPaused: boolean;
  error: string | null;
  speak: (text: string, config?: Partial<VoiceOutputConfig>) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  getVoices: () => SpeechSynthesisVoice[];
}

export function useVoiceOutput(defaultConfig?: Partial<VoiceOutputConfig>): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const managerRef = useRef<VoiceOutputManager | null>(null);
  
  useEffect(() => {
    managerRef.current = getVoiceOutput();
    setIsSupported(managerRef.current.isSupported());
    
    // Setup callbacks
    managerRef.current.onEnd(() => {
      setIsSpeaking(false);
      setIsPaused(false);
    });
    
    managerRef.current.onError((err: string) => {
      setError(err);
      setIsSpeaking(false);
    });
    
    return () => {
      managerRef.current?.stop();
    };
  }, []);
  
  const speak = useCallback(async (text: string, config?: Partial<VoiceOutputConfig>) => {
    if (!managerRef.current) return;
    
    setError(null);
    setIsSpeaking(true);
    
    try {
      await managerRef.current.speak({
        text,
        voice: config?.voice ?? defaultConfig?.voice,
        language: config?.language ?? defaultConfig?.language,
        pitch: config?.pitch ?? defaultConfig?.pitch,
        rate: config?.rate ?? defaultConfig?.rate,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsSpeaking(false);
    }
  }, [defaultConfig]);
  
  const pause = useCallback(() => {
    managerRef.current?.pause();
    setIsPaused(true);
  }, []);
  
  const resume = useCallback(() => {
    managerRef.current?.resume();
    setIsPaused(false);
  }, []);
  
  const stop = useCallback(() => {
    managerRef.current?.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);
  
  const getVoices = useCallback(() => {
    return managerRef.current?.getVoices() || [];
  }, []);
  
  return {
    isSpeaking,
    isSupported,
    isPaused,
    error,
    speak,
    pause,
    resume,
    stop,
    getVoices,
  };
}

// ========================
// Camera Hook
// ========================

export interface UseCameraReturn {
  isActive: boolean;
  isSupported: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null; // For direct access to the media stream
  start: () => Promise<void>;
  stop: () => void;
  switchCamera: () => void;
  captureFrame: () => string | null;
  captureBlob: () => Promise<Blob | null>;
}

export function useCamera(): UseCameraReturn {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<CameraManager | null>(null);
  
  useEffect(() => {
    setIsSupported(isCameraSupported());
    cameraRef.current = getCamera();
    
    return () => {
      cameraRef.current?.stop();
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);
  
  const start = useCallback(async () => {
    if (!videoRef.current || !cameraRef.current) return;
    
    setError(null);
    
    try {
      await cameraRef.current.start(videoRef.current);
      // Get the stream from the video element
      const mediaStream = videoRef.current.srcObject as MediaStream;
      setStream(mediaStream);
      setIsActive(true);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);
  
  const stop = useCallback(() => {
    cameraRef.current?.stop();
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsActive(false);
  }, [stream]);
  
  const switchCamera = useCallback(() => {
    cameraRef.current?.switchCamera();
  }, []);
  
  const captureFrame = useCallback(() => {
    return cameraRef.current?.captureFrame() || null;
  }, []);
  
  const captureBlob = useCallback(async () => {
    return await cameraRef.current?.captureBlob() || null;
  }, []);
  
  return {
    isActive,
    isSupported,
    error,
    stream,
    videoRef: videoRef as React.RefObject<HTMLVideoElement | null>,
    start,
    stop,
    switchCamera,
    captureFrame,
    captureBlob,
  };
}

// ========================
// Vision Analysis Hook
// ========================

export interface UseVisionReturn {
  isAnalyzing: boolean;
  result: VisionAnalysisResult | null;
  error: string | null;
  analyze: (imageData: string | Blob, type?: VisionAnalysisType, prompt?: string) => Promise<VisionAnalysisResult | null>;
  reset: () => void;
}

export function useVision(): UseVisionReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const analyze = useCallback(async (
    imageData: string | Blob, 
    type: VisionAnalysisType = 'describe',
    prompt?: string
  ): Promise<VisionAnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analysisResult = await analyzeImage({
        imageData,
        analysisType: type,
        prompt,
      });
      
      setResult(analysisResult);
      return analysisResult;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);
  
  return {
    isAnalyzing,
    result,
    error,
    analyze,
    reset,
  };
}

// ========================
// AI Chat Hook
// ========================

export interface UseAIChatOptions {
  conversationId?: string;
  systemPrompt?: string;
  enableVoiceInput?: boolean;
  enableVoiceOutput?: boolean;
  autoSpeak?: boolean;
  autoSaveHistory?: boolean;
  onToolCall?: (tool: string, args: Record<string, unknown>) => void;
}

export interface UseAIChatReturn {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  sendVoiceMessage: () => Promise<void>;
  sendImageMessage: (imageData: string | Blob, prompt?: string) => Promise<void>;
  clearMessages: () => void;
  stopGeneration: () => void;
  voiceInput: UseVoiceInputReturn;
  voiceOutput: UseVoiceOutputReturn;
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(options.conversationId || null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const voiceInput = useVoiceInput({
    language: 'tr-TR',
    continuous: false,
  });
  
  const voiceOutput = useVoiceOutput({
    language: 'tr-TR',
    rate: 1.0,
    pitch: 1.0,
  });
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId,
          systemPrompt: options.systemPrompt,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`AI request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Set conversation ID if new
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Add assistant message
      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        toolCalls: data.toolCalls,
        toolResults: data.toolResults,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak response if enabled
      if (options.autoSpeak && voiceOutput.isSupported) {
        voiceOutput.speak(data.response);
      }
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, options.systemPrompt, options.autoSpeak, voiceOutput]);
  
  const sendVoiceMessage = useCallback(async () => {
    if (!voiceInput.isSupported) {
      setError('Voice input not supported');
      return;
    }
    
    return new Promise<void>((resolve) => {
      voiceInput.resetTranscript();
      voiceInput.startListening();
      
      // Will send message when voice input ends
      const checkInterval = setInterval(() => {
        if (!voiceInput.isListening && voiceInput.transcript) {
          clearInterval(checkInterval);
          sendMessage(voiceInput.transcript);
          resolve();
        }
      }, 100);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        voiceInput.stopListening();
        if (voiceInput.transcript) {
          sendMessage(voiceInput.transcript);
        }
        resolve();
      }, 30000);
    });
  }, [voiceInput, sendMessage]);
  
  const sendImageMessage = useCallback(async (imageData: string | Blob, prompt?: string) => {
    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt || 'Analyze this image',
      timestamp: new Date().toISOString(),
      imageUrl: typeof imageData === 'string' ? imageData : URL.createObjectURL(imageData),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert to base64 if blob
      let base64Image: string;
      if (typeof imageData === 'string') {
        base64Image = imageData;
      } else {
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(imageData);
        });
      }
      
      const response = await fetch('/api/ai/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          prompt: prompt || 'What do you see in this image?',
          conversationId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Vision request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.result || data.response,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (options.autoSpeak && voiceOutput.isSupported) {
        voiceOutput.speak(data.result || data.response);
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, options.autoSpeak, voiceOutput]);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);
  
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);
  
  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    sendVoiceMessage,
    sendImageMessage,
    clearMessages,
    stopGeneration,
    voiceInput,
    voiceOutput,
  };
}

// ========================
// AI Assistant Hook (Unified)
// ========================

export interface UseAIAssistantReturn extends UseAIChatReturn {
  camera: UseCameraReturn;
  vision: UseVisionReturn;
  captureAndAnalyze: (type?: VisionAnalysisType, prompt?: string) => Promise<void>;
  // Convenience aliases
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  speak: (text: string, config?: Partial<VoiceOutputConfig>) => Promise<void>;
  stopSpeaking: () => void;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
  analyzeCurrentFrame: (type?: VisionAnalysisType, prompt?: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
}

export function useAIAssistant(options: UseAIChatOptions = {}): UseAIAssistantReturn {
  const chat = useAIChat(options);
  const camera = useCamera();
  const vision = useVision();
  
  const captureAndAnalyze = useCallback(async (
    type: VisionAnalysisType = 'describe',
    prompt?: string
  ) => {
    const frame = camera.captureFrame();
    if (frame) {
      await chat.sendImageMessage(frame, prompt);
    }
  }, [camera, chat]);
  
  const analyzeCurrentFrame = useCallback(async (
    type: VisionAnalysisType = 'describe',
    prompt?: string
  ) => {
    const frame = camera.captureFrame();
    if (frame) {
      await vision.analyze(frame, type, prompt);
    }
  }, [camera, vision]);
  
  const regenerateLastResponse = useCallback(async () => {
    // Find last user message and resend
    const lastUserMessage = chat.messages.slice().reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      await chat.sendMessage(lastUserMessage.content);
    }
  }, [chat]);
  
  return {
    ...chat,
    camera,
    vision,
    captureAndAnalyze,
    // Convenience aliases from voiceInput
    startVoiceInput: chat.voiceInput.startListening,
    stopVoiceInput: chat.voiceInput.stopListening,
    // Convenience aliases from voiceOutput
    speak: chat.voiceOutput.speak,
    stopSpeaking: chat.voiceOutput.stop,
    // Convenience aliases from camera
    startCamera: camera.start,
    stopCamera: camera.stop,
    switchCamera: camera.switchCamera,
    // Additional
    analyzeCurrentFrame,
    regenerateLastResponse,
  };
}
