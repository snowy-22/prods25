/**
 * Unified File Handler System v2
 * Supports: Image, Video, Audio, PDF, Office docs (Word/Excel/PPT), 3D models
 * Features: Paste, Drag-drop, File input, URL parsing, Google Drive links, Viewers
 */

export type SupportedFileType = 
  | 'image' | 'video' | 'audio' | 'pdf'
  | 'excel' | 'word' | 'powerpoint'
  | 'text' | 'markdown' | '3d-model'
  | 'archive' | 'unknown';

export type ViewerType = 'pdf' | 'word' | 'excel' | 'powerpoint' | '3d' | 'image' | 'video' | 'audio' | 'text' | null;

export interface FileItem {
  id: string;
  name: string;
  type: SupportedFileType;
  mimeType: string;
  size: number;
  blob?: Blob;
  url?: string;
  dataUrl?: string;
  createdAt: number;
  metadata?: {
    duration?: number; // video, audio
    width?: number; height?: number; // image
    pages?: number; // pdf, document
  };
}

export interface FileHandlerConfig {
  maxSize?: number; // bytes, default 100MB
  maxFiles?: number; // default unlimited
  acceptTypes?: SupportedFileType[];
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  useCompression?: boolean; // images
  useWorker?: boolean; // offload processing
}

// MIME type mapping
const MIME_TYPES: Record<string, SupportedFileType> = {
  // Images
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'image/svg+xml': 'image',
  'image/bmp': 'image',
  
  // Video
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  
  // Audio
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/webm': 'audio',
  'audio/ogg': 'audio',
  
  // PDF
  'application/pdf': 'pdf',
  
  // Microsoft Office
  'application/vnd.ms-excel': 'excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  'application/msword': 'word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  'application/vnd.ms-powerpoint': 'powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'powerpoint',
  
  // Text
  'text/plain': 'text',
  'text/markdown': 'markdown',
  'text/csv': 'excel',
  'text/html': 'text',
  
  // 3D Models
  'model/gltf-binary': '3d-model',
  'model/gltf+json': '3d-model',
  'model/obj': '3d-model',
  'model/fbx': '3d-model',
  
  // Archive
  'application/zip': 'archive',
  'application/x-rar-compressed': 'archive',
  'application/x-7z-compressed': 'archive',
};

export class FileHandler {
  private config: Required<FileHandlerConfig>;

  constructor(config: FileHandlerConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100 * 1024 * 1024, // 100MB
      maxFiles: config.maxFiles ?? Infinity,
      acceptTypes: config.acceptTypes ?? [],
      onProgress: config.onProgress ?? (() => {}),
      onError: config.onError ?? (() => {}),
      useCompression: config.useCompression ?? true,
      useWorker: config.useWorker ?? true,
    };
  }

  /**
   * Determine file type from MIME type or extension
   */
  private getFileType(mimeType: string, fileName: string): SupportedFileType {
    // Try MIME type first
    if (MIME_TYPES[mimeType]) {
      return MIME_TYPES[mimeType];
    }

    // Try file extension
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const extMap: Record<string, SupportedFileType> = {
      // Images
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image',
      // Video
      mp4: 'video', webm: 'video', mov: 'video', avi: 'video', mkv: 'video',
      // Audio
      mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio', flac: 'audio',
      // PDF
      pdf: 'pdf',
      // Office
      xls: 'excel', xlsx: 'excel', csv: 'excel',
      doc: 'word', docx: 'word',
      ppt: 'powerpoint', pptx: 'powerpoint',
      // Text
      txt: 'text', md: 'markdown',
      // 3D
      glb: '3d-model', gltf: '3d-model', obj: '3d-model', fbx: '3d-model',
      // Archive
      zip: 'archive', rar: 'archive', '7z': 'archive',
    };

    return extMap[ext] || 'unknown';
  }

  /**
   * Process files from various sources
   */
  async processFiles(files: File[] | Blob[], source: 'input' | 'paste' | 'drag'): Promise<FileItem[]> {
    const results: FileItem[] = [];

    for (const file of files) {
      try {
        // Size check
        if (file.size > this.config.maxSize) {
          this.config.onError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
          continue;
        }

        // Get file type
        const fileName = 'name' in file ? file.name : `blob-${Date.now()}`;
        const mimeType = file.type || 'application/octet-stream';
        const type = this.getFileType(mimeType, fileName);

        // Filter by accepted types
        if (this.config.acceptTypes.length > 0 && !this.config.acceptTypes.includes(type)) {
          this.config.onError(`File type not accepted: ${type}`);
          continue;
        }

        // Create FileItem
        const fileItem: FileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: fileName,
          type,
          mimeType,
          size: file.size,
          blob: file as Blob,
          createdAt: Date.now(),
        };

        // Generate URL
        fileItem.url = URL.createObjectURL(fileItem.blob);

        // Process based on type
        switch (type) {
          case 'image':
            await this.processImage(fileItem);
            break;
          case 'video':
            await this.processVideo(fileItem);
            break;
          case 'audio':
            await this.processAudio(fileItem);
            break;
          case 'pdf':
          case 'word':
          case 'excel':
          case 'powerpoint':
            await this.processDocument(fileItem);
            break;
          case '3d-model':
            await this.process3DModel(fileItem);
            break;
        }

        results.push(fileItem);
        this.config.onProgress((results.length / files.length) * 100);
      } catch (error) {
        this.config.onError(`Failed to process file: ${error}`);
      }
    }

    return results;
  }

  /**
   * Process image: generate thumbnail, compress if needed
   */
  private async processImage(fileItem: FileItem): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        fileItem.metadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };

        // Generate low-quality thumbnail for caching
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight);
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          fileItem.dataUrl = canvas.toDataURL('image/webp', 0.6);
        }

        resolve();
      };
      img.onerror = () => resolve();
      img.src = fileItem.url!;
    });
  }

  /**
   * Process video: extract duration, generate thumbnail
   */
  private async processVideo(fileItem: FileItem): Promise<void> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        fileItem.metadata = {
          duration: Math.round(video.duration),
          width: video.videoWidth,
          height: video.videoHeight,
        };

        // Extract thumbnail
        video.currentTime = Math.min(1, video.duration * 0.25);
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          fileItem.dataUrl = canvas.toDataURL('image/webp', 0.6);
        }
        video.src = '';
        resolve();
      };
      video.onerror = () => resolve();
      video.src = fileItem.url!;
    });
  }

  /**
   * Process audio: extract duration
   */
  private async processAudio(fileItem: FileItem): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        fileItem.metadata = {
          duration: Math.round(audio.duration),
        };
        resolve();
      };
      audio.onerror = () => resolve();
      audio.src = fileItem.url!;
    });
  }

  /**
   * Process documents: store metadata only (actual rendering by players)
   */
  private async processDocument(fileItem: FileItem): Promise<void> {
    // For PDF, we'll count pages in the PDF viewer
    // For Office docs, we'll handle in respective viewers
    return Promise.resolve();
  }

  /**
   * Process 3D models: validate format
   */
  private async process3DModel(fileItem: FileItem): Promise<void> {
    // Validation and preprocessing would go here
    return Promise.resolve();
  }

  /**
   * Handle paste events (supports images and files from clipboard)
   */
  static async handlePaste(e: ClipboardEvent, config?: FileHandlerConfig): Promise<FileItem[]> {
    const handler = new FileHandler(config);
    const items = e.clipboardData?.items || [];
    const files: Blob[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      } else if (item.kind === 'string' && item.type === 'text/html') {
        // Extract image URLs from HTML
        item.getAsString((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          doc.querySelectorAll('img').forEach((img) => {
            const src = img.src;
            if (src) {
              // This would be handled separately as URL
            }
          });
        });
      }
    }

    return handler.processFiles(files, 'paste');
  }

  /**
   * Handle drop events
   */
  static async handleDrop(e: DragEvent, config?: FileHandlerConfig): Promise<FileItem[]> {
    const handler = new FileHandler(config);
    const files = Array.from(e.dataTransfer?.files || []);
    return handler.processFiles(files, 'drag');
  }

  /**
   * Handle file input
   */
  static async handleInput(input: HTMLInputElement, config?: FileHandlerConfig): Promise<FileItem[]> {
    const handler = new FileHandler(config);
    const files = Array.from(input.files || []);
    return handler.processFiles(files, 'input');
  }

  /**
   * Parse Google Drive link and return usable URL
   */
  static parseGoogleDriveLink(url: string): { fileId: string; viewMode: 'preview' | 'edit' } | null {
    const patterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/,
      /docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/,
      /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          fileId: match[1],
          viewMode: url.includes('edit') ? 'edit' : 'preview',
        };
      }
    }

    return null;
  }

  /**
   * Get preview URL for Google Drive file (requires auth)
   */
  static getGoogleDrivePreviewUrl(fileId: string, viewMode: 'preview' | 'edit' = 'preview'): string {
    if (viewMode === 'edit') {
      return `https://docs.google.com/document/d/${fileId}/edit`;
    }
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  /**
   * Clean up resources
   */
  static cleanup(fileItem: FileItem): void {
    if (fileItem.url) {
      URL.revokeObjectURL(fileItem.url);
    }
  }

  /**
   * Get appropriate viewer type for a file
   */
  static getViewerType(mimeType: string): ViewerType {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessing')) return 'word';
    if (mimeType.includes('sheet') || mimeType.includes('officedocument.spreadsheet')) return 'excel';
    if (mimeType.includes('presentation') || mimeType.includes('officedocument.presentation')) return 'powerpoint';
    if (mimeType.includes('model-gltf') || mimeType.includes('model/gltf') || mimeType.includes('.glb')) return '3d';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) return 'text';
    return null;
  }

  /**
   * Get enhanced preview URL for Google Drive files
   */
  static getGoogleDrivePreviewUrl(fileId: string, viewMode: 'preview' | 'edit' = 'preview', apiKey?: string): string {
    if (viewMode === 'edit') {
      return `https://docs.google.com/document/d/${fileId}/edit`;
    }
    const apiKeyParam = apiKey ? `&key=${apiKey}` : '';
    return `https://docs.google.com/gview?url=https://www.googleapis.com/drive/v3/files/${fileId}?alt=media${apiKeyParam}&embedded=true`;
  }

  /**
   * Parse Google Drive link and extract file ID
   */
  static parseGoogleDriveLink(url: string): { fileId: string; viewMode: 'preview' | 'edit' } | null {
    try {
      const patterns = [
        /drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/,
        /docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/,
        /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
        /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9-_]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          const viewMode = url.includes('/edit') ? 'edit' : 'preview';
          return { fileId: match[1], viewMode };
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Hooks for React components
 */
export function useFileHandler(config?: FileHandlerConfig) {
  const handlePaste = async (e: ClipboardEvent) => {
    return FileHandler.handlePaste(e, config);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return FileHandler.handleDrop(e, config);
  };

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    return FileHandler.handleInput(e.currentTarget, config);
  };

  const cleanup = (fileItem: FileItem) => {
    FileHandler.cleanup(fileItem);
  };

  return { handlePaste, handleDrop, handleInput, cleanup };
}
