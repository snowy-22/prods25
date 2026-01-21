/**
 * Voice AI Service
 * Web Speech API ile sesli giriş ve sesli okuma
 */

import { VoiceInputConfig, VoiceOutputConfig, VoiceTranscript, SpeechSynthesisRequest } from './types';

// Default configurations
const DEFAULT_INPUT_CONFIG: VoiceInputConfig = {
  language: 'tr-TR',
  continuous: true,
  interimResults: true,
  maxAlternatives: 3,
};

const DEFAULT_OUTPUT_CONFIG: VoiceOutputConfig = {
  voice: '',
  pitch: 1,
  rate: 1,
  volume: 1,
  language: 'tr-TR',
};

// Check browser support
export function isVoiceInputSupported(): boolean {
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function isVoiceOutputSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Voice Input Manager
export class VoiceInputManager {
  private recognition: SpeechRecognition | null = null;
  private config: VoiceInputConfig;
  private isListening = false;
  private onResultCallback?: (transcript: VoiceTranscript) => void;
  private onErrorCallback?: (error: string) => void;
  private onStateChangeCallback?: (isListening: boolean) => void;
  private startTime?: number;

  constructor(config: Partial<VoiceInputConfig> = {}) {
    this.config = { ...DEFAULT_INPUT_CONFIG, ...config };
    this.initRecognition();
  }

  private initRecognition() {
    if (!isVoiceInputSupported()) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionClass();
    
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    this.recognition.lang = this.config.language;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript: VoiceTranscript = {
        id: `voice-${Date.now()}`,
        userId: '', // Will be set by caller
        text: result[0].transcript,
        confidence: result[0].confidence,
        language: this.config.language,
        isFinal: result.isFinal,
        alternatives: Array.from({ length: result.length }, (_, i) => result[i])
          .slice(1)
          .map((r: SpeechRecognitionAlternative) => r.transcript),
        timestamp: new Date().toISOString(),
        duration: this.startTime ? Date.now() - this.startTime : undefined,
      };
      
      this.onResultCallback?.(transcript);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      this.onErrorCallback?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStateChangeCallback?.(false);
      
      // Auto-restart if continuous mode
      if (this.config.continuous && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // Ignore - might be already started
        }
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.startTime = Date.now();
      this.onStateChangeCallback?.(true);
    };
  }

  setLanguage(language: string) {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  onResult(callback: (transcript: VoiceTranscript) => void) {
    this.onResultCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  onStateChange(callback: (isListening: boolean) => void) {
    this.onStateChangeCallback = callback;
  }

  start(): boolean {
    if (!this.recognition || this.isListening) return false;
    
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abort() {
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  getIsListening() {
    return this.isListening;
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  destroy() {
    this.abort();
    this.recognition = null;
  }
}

// Voice Output Manager
export class VoiceOutputManager {
  private config: VoiceOutputConfig;
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onEndCallback?: () => void;
  private onErrorCallback?: (error: string) => void;

  constructor(config: Partial<VoiceOutputConfig> = {}) {
    this.config = { ...DEFAULT_OUTPUT_CONFIG, ...config };
    this.loadVoices();
  }

  private loadVoices() {
    if (!isVoiceOutputSupported()) return;

    const loadVoicesHandler = () => {
      this.voices = speechSynthesis.getVoices();
      
      // Auto-select Turkish voice if available
      if (!this.config.voice && this.config.language.startsWith('tr')) {
        const turkishVoice = this.voices.find(v => v.lang.startsWith('tr'));
        if (turkishVoice) {
          this.config.voice = turkishVoice.name;
        }
      }
    };

    if (speechSynthesis.getVoices().length > 0) {
      loadVoicesHandler();
    }
    
    speechSynthesis.onvoiceschanged = loadVoicesHandler;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.startsWith(language.split('-')[0]));
  }

  setVoice(voiceName: string) {
    this.config.voice = voiceName;
  }

  setLanguage(language: string) {
    this.config.language = language;
  }

  setRate(rate: number) {
    this.config.rate = Math.max(0.1, Math.min(10, rate));
  }

  setPitch(pitch: number) {
    this.config.pitch = Math.max(0, Math.min(2, pitch));
  }

  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  onEnd(callback: () => void) {
    this.onEndCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  speak(request: SpeechSynthesisRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!isVoiceOutputSupported()) {
        reject('Speech synthesis not supported');
        return;
      }

      // Cancel any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(request.text);
      
      // Apply settings
      utterance.lang = request.language || this.config.language;
      utterance.pitch = request.pitch ?? this.config.pitch;
      utterance.rate = request.rate ?? this.config.rate;
      utterance.volume = this.config.volume;

      // Find and set voice
      const voiceName = request.voice || this.config.voice;
      if (voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.onEndCallback?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.onErrorCallback?.(event.error);
        reject(event.error);
      };

      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  stop() {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  pause() {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  }

  resume() {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }

  getIsSpeaking() {
    return this.isSpeaking;
  }

  isSupported(): boolean {
    return isVoiceOutputSupported();
  }
}

// Helper: Speak with AI response
export async function speakAIResponse(
  text: string, 
  options?: Partial<VoiceOutputConfig>
): Promise<void> {
  const manager = new VoiceOutputManager(options);
  
  // Wait for voices to load
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await manager.speak({ text });
}

// Helper: Get voice transcript from microphone
export function transcribeFromMicrophone(
  options?: Partial<VoiceInputConfig>
): Promise<VoiceTranscript> {
  return new Promise((resolve, reject) => {
    const manager = new VoiceInputManager({
      ...options,
      continuous: false,
    });

    manager.onResult((transcript) => {
      if (transcript.isFinal) {
        manager.stop();
        resolve(transcript);
      }
    });

    manager.onError((error) => {
      manager.stop();
      reject(error);
    });

    if (!manager.start()) {
      reject('Failed to start voice recognition');
    }

    // Timeout after 30 seconds
    setTimeout(() => {
      manager.stop();
      reject('Voice recognition timeout');
    }, 30000);
  });
}

// Global singleton instances for React hooks
let globalVoiceInput: VoiceInputManager | null = null;
let globalVoiceOutput: VoiceOutputManager | null = null;

export function getVoiceInput(): VoiceInputManager {
  if (!globalVoiceInput) {
    globalVoiceInput = new VoiceInputManager();
  }
  return globalVoiceInput;
}

export function getVoiceOutput(): VoiceOutputManager {
  if (!globalVoiceOutput) {
    globalVoiceOutput = new VoiceOutputManager();
  }
  return globalVoiceOutput;
}

// Web Speech API Type Definitions
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Type augmentation for window
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
