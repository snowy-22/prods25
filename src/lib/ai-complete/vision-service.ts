/**
 * Vision AI Service
 * Kamera ve görüntü analizi için AI entegrasyonu
 */

import { 
  VisionAnalysisRequest, 
  VisionAnalysisResult, 
  VisionAnalysisType,
  VisionOptions 
} from './types';

// Camera capture utilities
export interface CameraConfig {
  facingMode: 'user' | 'environment';
  width?: number;
  height?: number;
  aspectRatio?: number;
}

const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  facingMode: 'environment',
  width: 1280,
  height: 720,
};

// Check if camera is supported
export function isCameraSupported(): boolean {
  return typeof navigator !== 'undefined' && 
    'mediaDevices' in navigator && 
    'getUserMedia' in navigator.mediaDevices;
}

// Camera Manager
export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private config: CameraConfig;
  
  constructor(config: Partial<CameraConfig> = {}) {
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };
  }
  
  async start(videoElement: HTMLVideoElement): Promise<void> {
    if (!isCameraSupported()) {
      throw new Error('Camera not supported');
    }
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.config.facingMode,
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          aspectRatio: this.config.aspectRatio,
        },
        audio: false,
      });
      
      videoElement.srcObject = this.stream;
      this.videoElement = videoElement;
      await videoElement.play();
    } catch (error: any) {
      throw new Error(`Failed to access camera: ${error.message}`);
    }
  }
  
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }
  
  switchCamera() {
    this.config.facingMode = this.config.facingMode === 'user' ? 'environment' : 'user';
    if (this.videoElement) {
      this.stop();
      this.start(this.videoElement);
    }
  }
  
  captureFrame(): string | null {
    if (!this.videoElement) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(this.videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }
  
  captureBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.videoElement) {
        resolve(null);
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      
      ctx.drawImage(this.videoElement, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }
  
  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }
}

// Image Processing Utilities
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function resizeImage(
  dataUrl: string, 
  maxWidth: number, 
  maxHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Failed to create canvas context');
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Vision Analysis Prompts
const ANALYSIS_PROMPTS: Record<VisionAnalysisType, string> = {
  describe: `Describe this image in detail. Include:
- What objects, people, or scenes are visible
- Colors, lighting, and composition
- Any text visible in the image
- The overall mood or context`,

  extract_text: `Extract all visible text from this image. 
Format the text exactly as it appears, preserving layout where possible.
If no text is visible, state "No text found in image."`,

  identify_objects: `Identify and list all objects visible in this image.
For each object, provide:
- Object name
- Approximate position (top-left, center, etc.)
- Size relative to the image
- Any notable characteristics`,

  analyze_document: `Analyze this document image:
- Document type (invoice, receipt, form, letter, etc.)
- Extract all key information and data
- Identify any tables or structured data
- Note any signatures or stamps
- Summarize the document's purpose`,

  detect_faces: `Analyze any faces visible in this image:
- Number of people/faces detected
- Approximate age and gender (if discernible)
- Facial expressions/emotions
- Position in the frame
Note: Provide general observations only, do not identify specific individuals.`,

  custom: '', // Will be replaced with user prompt
};

// Vision AI Analysis
export async function analyzeImage(
  request: VisionAnalysisRequest,
  apiEndpoint: string = '/api/ai/vision'
): Promise<VisionAnalysisResult> {
  const { imageData, prompt, analysisType, options } = request;
  
  // Convert image data to base64 if needed
  let base64Image: string;
  if (typeof imageData === 'string') {
    // Already base64 or URL
    if (imageData.startsWith('data:')) {
      base64Image = imageData.split(',')[1];
    } else {
      base64Image = imageData;
    }
  } else {
    base64Image = await blobToBase64(imageData);
  }
  
  // Build prompt
  const systemPrompt = ANALYSIS_PROMPTS[analysisType] || '';
  const finalPrompt = analysisType === 'custom' 
    ? prompt || 'What do you see in this image?'
    : systemPrompt + (prompt ? `\n\nAdditional context: ${prompt}` : '');
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Image,
      prompt: finalPrompt,
      options: {
        maxTokens: options?.maxTokens || 1024,
        temperature: options?.temperature || 0.7,
        detailLevel: options?.detailLevel || 'auto',
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Vision analysis failed: ${response.statusText}`);
  }
  
  return await response.json();
}

// Quick analysis helpers
export async function describeImage(imageData: string | Blob): Promise<string> {
  const result = await analyzeImage({
    imageData,
    analysisType: 'describe',
  });
  return result.result;
}

export async function extractTextFromImage(imageData: string | Blob): Promise<string> {
  const result = await analyzeImage({
    imageData,
    analysisType: 'extract_text',
  });
  return result.extractedData?.text || result.result;
}

export async function identifyObjectsInImage(imageData: string | Blob): Promise<string> {
  const result = await analyzeImage({
    imageData,
    analysisType: 'identify_objects',
  });
  return result.result;
}

// Screen Capture for AI Analysis
export async function captureScreen(): Promise<string | null> {
  if (typeof navigator === 'undefined' || !('mediaDevices' in navigator)) {
    return null;
  }
  
  try {
    const stream = await (navigator.mediaDevices as any).getDisplayMedia({
      video: { displaySurface: 'monitor' }
    });
    
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();
    
    // Wait a frame for video to render
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      return null;
    }
    
    ctx.drawImage(video, 0, 0);
    stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Screen capture failed:', error);
    return null;
  }
}

// Global singleton
let globalCamera: CameraManager | null = null;

export function getCamera(): CameraManager {
  if (!globalCamera) {
    globalCamera = new CameraManager();
  }
  return globalCamera;
}
