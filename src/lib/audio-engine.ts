/**
 * Audio Engine - Web Audio API based audio processing system
 * Features: Microphone test, Speaker test, EQ, Mixer, Live Analysis
 */

export interface AudioSource {
  id: string;
  name: string;
  type: 'microphone' | 'speaker' | 'tab' | 'youtube' | 'media-element' | 'stream';
  stream?: MediaStream;
  element?: HTMLMediaElement;
  level: number;
  muted: boolean;
  solo: boolean;
  analysis?: AudioAnalysisData;
}

export interface AudioAnalysisData {
  average: number;
  peak: number;
  bass: number;
  mid: number;
  treble: number;
  spectrum: Uint8Array;
  waveform: Uint8Array;
  dominantColor?: { r: number; g: number; b: number };
}

export interface EQBand {
  frequency: number;
  gain: number; // -20 to +20
  type: BiquadFilterType;
}

export interface EQPreset {
  name: string;
  bands: { low: number; mid: number; high: number };
}

export const EQ_PRESETS: EQPreset[] = [
  { name: 'Flat', bands: { low: 0, mid: 0, high: 0 } },
  { name: 'Bass Boost', bands: { low: 6, mid: 0, high: -2 } },
  { name: 'Treble Boost', bands: { low: -2, mid: 0, high: 6 } },
  { name: 'Vocal', bands: { low: -4, mid: 6, high: 2 } },
  { name: 'Dance', bands: { low: 8, mid: -2, high: 4 } },
  { name: 'Rock', bands: { low: 4, mid: 2, high: 6 } },
  { name: 'Soft', bands: { low: 2, mid: 0, high: -4 } },
];

/**
 * Main Audio Control Center
 */
export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sources: Map<string, {
    source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode;
    fader: GainNode;
    analyser: AnalyserNode;
    stream?: MediaStream;
    element?: HTMLMediaElement;
  }> = new Map();
  
  private masterGain: GainNode | null = null;
  private eqBands: { low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode } | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  
  private isInitialized = false;
  private animationFrameId: number | null = null;
  private analysisCallbacks: Set<(analysis: Map<string, AudioAnalysisData>) => void> = new Set();

  constructor() {
    // Lazy initialization - will be called on first use
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1.0;
      
      // Create EQ bands
      this.eqBands = this.createEQBands();
      
      // Create master analyser
      this.masterAnalyser = this.audioContext.createAnalyser();
      this.masterAnalyser.fftSize = 256;
      
      // Connect chain: EQ -> Master Analyser -> Master Gain -> Destination
      this.eqBands.low.connect(this.eqBands.mid);
      this.eqBands.mid.connect(this.eqBands.high);
      this.eqBands.high.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);
      
      this.isInitialized = true;
      this.startAnalysisLoop();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error);
      return false;
    }
  }

  private createEQBands() {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const low = this.audioContext.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 200;
    low.gain.value = 0;
    
    const mid = this.audioContext.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 1;
    mid.gain.value = 0;
    
    const high = this.audioContext.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 3000;
    high.gain.value = 0;
    
    return { low, mid, high };
  }

  /**
   * Add microphone source
   */
  async addMicrophone(id: string = 'microphone'): Promise<MediaStream | null> {
    await this.initialize();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      this.addStreamSource(id, stream);
      return stream;
    } catch (error) {
      console.error('Failed to access microphone:', error);
      return null;
    }
  }

  /**
   * Add stream source (microphone, tab audio, etc.)
   */
  addStreamSource(id: string, stream: MediaStream): void {
    if (!this.audioContext || !this.eqBands) return;
    
    // Remove existing source with same id
    this.removeSource(id);
    
    const source = this.audioContext.createMediaStreamSource(stream);
    const fader = this.audioContext.createGain();
    const analyser = this.audioContext.createAnalyser();
    
    analyser.fftSize = 256;
    fader.gain.value = 1.0;
    
    source.connect(analyser);
    analyser.connect(fader);
    fader.connect(this.eqBands.low);
    
    this.sources.set(id, { source, fader, analyser, stream });
  }

  /**
   * Add media element source (video/audio elements)
   */
  addMediaElementSource(id: string, element: HTMLMediaElement): void {
    if (!this.audioContext || !this.eqBands) return;
    
    // Remove existing source with same id
    this.removeSource(id);
    
    try {
      const source = this.audioContext.createMediaElementSource(element);
      const fader = this.audioContext.createGain();
      const analyser = this.audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      fader.gain.value = 1.0;
      
      source.connect(analyser);
      analyser.connect(fader);
      fader.connect(this.eqBands.low);
      
      // Also connect to destination directly for playback
      fader.connect(this.audioContext.destination);
      
      this.sources.set(id, { source, fader, analyser, element });
    } catch (error) {
      console.error('Failed to add media element source:', error);
    }
  }

  /**
   * Capture tab audio using getDisplayMedia
   */
  async captureTabAudio(id: string = 'tab-audio'): Promise<MediaStream | null> {
    await this.initialize();
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: false
      });
      
      this.addStreamSource(id, stream);
      return stream;
    } catch (error) {
      console.error('Failed to capture tab audio:', error);
      return null;
    }
  }

  /**
   * Remove a source
   */
  removeSource(id: string): void {
    const source = this.sources.get(id);
    if (source) {
      source.source.disconnect();
      source.fader.disconnect();
      source.analyser.disconnect();
      if (source.stream) {
        source.stream.getTracks().forEach(track => track.stop());
      }
      this.sources.delete(id);
    }
  }

  /**
   * Set source level
   */
  setSourceLevel(id: string, level: number): void {
    const source = this.sources.get(id);
    if (source) {
      source.fader.gain.value = Math.max(0, Math.min(2, level));
    }
  }

  /**
   * Set master level
   */
  setMasterLevel(level: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(2, level));
    }
  }

  /**
   * Set EQ band gain
   */
  setEQGain(band: 'low' | 'mid' | 'high', gain: number): void {
    if (this.eqBands && this.eqBands[band]) {
      this.eqBands[band].gain.value = Math.max(-20, Math.min(20, gain));
    }
  }

  /**
   * Apply EQ preset
   */
  applyEQPreset(preset: EQPreset): void {
    this.setEQGain('low', preset.bands.low);
    this.setEQGain('mid', preset.bands.mid);
    this.setEQGain('high', preset.bands.high);
  }

  /**
   * Get live analysis for a source
   */
  getSourceAnalysis(id: string): AudioAnalysisData | null {
    const source = this.sources.get(id);
    if (!source) return null;
    
    return this.analyzeNode(source.analyser);
  }

  /**
   * Get master analysis
   */
  getMasterAnalysis(): AudioAnalysisData | null {
    if (!this.masterAnalyser) return null;
    return this.analyzeNode(this.masterAnalyser);
  }

  private analyzeNode(analyser: AnalyserNode): AudioAnalysisData {
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const waveformData = new Uint8Array(analyser.frequencyBinCount);
    
    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(waveformData);
    
    // Calculate band levels
    const bassRange = Math.floor(frequencyData.length * 0.1);
    const midRange = Math.floor(frequencyData.length * 0.4);
    
    const bass = frequencyData.slice(0, bassRange).reduce((a, b) => a + b, 0) / bassRange;
    const mid = frequencyData.slice(bassRange, midRange).reduce((a, b) => a + b, 0) / (midRange - bassRange);
    const treble = frequencyData.slice(midRange).reduce((a, b) => a + b, 0) / (frequencyData.length - midRange);
    
    const average = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
    const peak = Math.max(...frequencyData);
    
    // Calculate dominant color based on frequency distribution
    const dominantColor = this.frequencyToColor(bass, mid, treble);
    
    return {
      average,
      peak,
      bass,
      mid,
      treble,
      spectrum: frequencyData,
      waveform: waveformData,
      dominantColor
    };
  }

  /**
   * Convert frequency data to RGB color (for sync frames)
   */
  private frequencyToColor(bass: number, mid: number, treble: number): { r: number; g: number; b: number } {
    // Map frequencies to colors
    // Bass -> Red/Orange, Mid -> Green/Yellow, Treble -> Blue/Purple
    const r = Math.min(255, Math.floor((bass / 255) * 200 + (treble / 255) * 55));
    const g = Math.min(255, Math.floor((mid / 255) * 200 + (bass / 255) * 55));
    const b = Math.min(255, Math.floor((treble / 255) * 200 + (mid / 255) * 55));
    
    return { r, g, b };
  }

  /**
   * Start analysis loop
   */
  private startAnalysisLoop(): void {
    if (this.animationFrameId !== null) return;
    
    const analyze = () => {
      if (this.analysisCallbacks.size > 0) {
        const allAnalysis = new Map<string, AudioAnalysisData>();
        
        this.sources.forEach((_, id) => {
          const analysis = this.getSourceAnalysis(id);
          if (analysis) {
            allAnalysis.set(id, analysis);
          }
        });
        
        // Add master analysis
        const masterAnalysis = this.getMasterAnalysis();
        if (masterAnalysis) {
          allAnalysis.set('master', masterAnalysis);
        }
        
        this.analysisCallbacks.forEach(callback => callback(allAnalysis));
      }
      
      this.animationFrameId = requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  /**
   * Subscribe to analysis updates
   */
  onAnalysis(callback: (analysis: Map<string, AudioAnalysisData>) => void): () => void {
    this.analysisCallbacks.add(callback);
    return () => this.analysisCallbacks.delete(callback);
  }

  /**
   * Play test tone
   */
  playTestTone(frequency: number = 440, duration: number = 1000): void {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);
    
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  /**
   * Get all source IDs
   */
  getSourceIds(): string[] {
    return Array.from(this.sources.keys());
  }

  /**
   * Get all sources with their data as AudioSource format
   */
  getSources(): Map<string, AudioSource> {
    const result = new Map<string, AudioSource>();
    this.sources.forEach((source, id) => {
      const isMuted = this.isSourceMuted(id);
      const isSoloed = this.isSourceSoloed(id);
      const analysis = this.getSourceAnalysis(id);
      
      result.set(id, {
        id,
        name: id, // Use id as name for now
        type: source.stream ? 'microphone' : 'media-element',
        stream: source.stream,
        element: source.element,
        level: source.fader.gain.value,
        muted: isMuted,
        solo: isSoloed,
        analysis: analysis || undefined,
      });
    });
    return result;
  }

  /**
   * Toggle source mute
   */
  toggleSourceMute(id: string): boolean {
    const source = this.sources.get(id);
    if (!source) return false;
    
    const currentGain = source.fader.gain.value;
    if (currentGain > 0) {
      // Store current gain and mute
      (source as any)._storedGain = currentGain;
      source.fader.gain.value = 0;
      return true;
    } else {
      // Restore previous gain
      source.fader.gain.value = (source as any)._storedGain || 1;
      return false;
    }
  }

  /**
   * Toggle source solo
   */
  toggleSourceSolo(id: string): boolean {
    const source = this.sources.get(id);
    if (!source) return false;
    
    const isSoloed = (source as any)._isSoloed || false;
    
    if (!isSoloed) {
      // Solo this source - mute all others
      this.sources.forEach((s, sourceId) => {
        if (sourceId !== id) {
          (s as any)._preSoloGain = s.fader.gain.value;
          s.fader.gain.value = 0;
        }
        (s as any)._isSoloed = sourceId === id;
      });
      return true;
    } else {
      // Unsolo - restore all sources
      this.sources.forEach((s) => {
        if ((s as any)._preSoloGain !== undefined) {
          s.fader.gain.value = (s as any)._preSoloGain;
        }
        (s as any)._isSoloed = false;
      });
      return false;
    }
  }

  /**
   * Check if source is muted
   */
  isSourceMuted(id: string): boolean {
    const source = this.sources.get(id);
    return source ? source.fader.gain.value === 0 : false;
  }

  /**
   * Check if source is soloed
   */
  isSourceSoloed(id: string): boolean {
    const source = this.sources.get(id);
    return source ? (source as any)._isSoloed || false : false;
  }

  /**
   * Stop test tone (for continuous test tones)
   */
  private testOscillator: OscillatorNode | null = null;
  private testGain: GainNode | null = null;

  startTestTone(frequency: number = 440): void {
    if (!this.audioContext) return;
    
    this.stopTestTone();
    
    this.testOscillator = this.audioContext.createOscillator();
    this.testGain = this.audioContext.createGain();
    
    this.testOscillator.frequency.value = frequency;
    this.testOscillator.type = 'sine';
    this.testGain.gain.value = 0.1;
    
    this.testOscillator.connect(this.testGain);
    this.testGain.connect(this.audioContext.destination);
    
    this.testOscillator.start();
  }

  stopTestTone(): void {
    if (this.testOscillator) {
      try {
        this.testOscillator.stop();
        this.testOscillator.disconnect();
      } catch (e) {
        // Already stopped
      }
      this.testOscillator = null;
    }
    if (this.testGain) {
      this.testGain.disconnect();
      this.testGain = null;
    }
  }

  /**
   * Get EQ band values
   */
  getEQValues(): { low: number; mid: number; high: number } {
    if (!this.eqBands) return { low: 0, mid: 0, high: 0 };
    return {
      low: this.eqBands.low.gain.value,
      mid: this.eqBands.mid.gain.value,
      high: this.eqBands.high.gain.value
    };
  }

  /**
   * Get master level
   */
  getMasterLevel(): number {
    return this.masterGain?.gain.value || 1;
  }

  /**
   * Check if initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.sources.forEach((_, id) => this.removeSource(id));
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.isInitialized = false;
  }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}

export default AudioEngine;
