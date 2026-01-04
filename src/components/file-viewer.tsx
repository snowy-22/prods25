/**
 * Universal File Viewer Component
 * Auto-detects file type and renders appropriate viewer
 * Supports: Images, Videos, Audio, PDF, Office docs, 3D models, Text
 */

'use client';

import React, { Suspense } from 'react';
import { FileQuestion, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileHandler, ViewerType } from '@/lib/file-handler';
import { PDFViewer } from './viewers/pdf-viewer';
import { WordViewer, ExcelViewer, PowerPointViewer } from './viewers/office-viewer';
import { Model3DViewer } from './viewers/model-3d-viewer';

interface FileViewerProps {
  file: File | Blob | string;
  title?: string;
  className?: string;
  viewerType?: ViewerType;
  onProgress?: (percent: number) => void;
  onError?: (message: string) => void;
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  );
}

/**
 * Image Viewer Component
 */
function ImageViewerComponent({ file, title, className }: FileViewerProps) {
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      if (typeof file === 'string') {
        setImageUrl(file);
      } else if (file instanceof File || file instanceof Blob) {
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to load image');
    }
  }, [file]);

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className={cn('flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden', className)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title || 'Image'}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading image...
        </div>
      )}
    </div>
  );
}

/**
 * Video Viewer Component
 */
function VideoViewerComponent({ file, title, className }: FileViewerProps) {
  const [videoUrl, setVideoUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (typeof file === 'string') {
      setVideoUrl(file);
    } else if (file instanceof File || file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className={cn('rounded-lg overflow-hidden bg-black', className)}>
      {videoUrl ? (
        <video
          controls
          autoPlay
          className="w-full h-full"
          title={title || 'Video'}
        >
          <source src={videoUrl} />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading video...
        </div>
      )}
    </div>
  );
}

/**
 * Audio Viewer Component
 */
function AudioViewerComponent({ file, title, className }: FileViewerProps) {
  const [audioUrl, setAudioUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (typeof file === 'string') {
      setAudioUrl(file);
    } else if (file instanceof File || file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className={cn('flex flex-col gap-4 p-4 bg-muted/20 rounded-lg', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium truncate">{title || 'Audio File'}</p>
        </div>
      </div>
      {audioUrl ? (
        <audio
          controls
          autoPlay
          className="w-full"
          controlsList="nodownload"
        >
          <source src={audioUrl} />
          Your browser does not support the audio tag.
        </audio>
      ) : (
        <div className="flex items-center justify-center p-4 text-muted-foreground">
          Loading audio...
        </div>
      )}
    </div>
  );
}

/**
 * Text Viewer Component
 */
function TextViewerComponent({ file, title, className }: FileViewerProps) {
  const [content, setContent] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadText = async () => {
      try {
        let text = '';
        if (typeof file === 'string') {
          const response = await fetch(file);
          text = await response.text();
        } else if (file instanceof Blob) {
          text = await (file as any).text();
        }
        setContent(text);
      } catch (err) {
        setError('Failed to load text file');
      }
    };

    loadText();
  }, [file]);

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className={cn('flex flex-col h-full bg-muted/20 rounded-lg overflow-hidden', className)}>
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm">
        <p className="text-sm font-medium">{title || 'Text File'}</p>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {content ? (
          <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words max-w-full">
            {content}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Error Display Component
 */
function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      <p className="text-sm text-destructive">{error}</p>
    </div>
  );
}

/**
 * Unsupported File Viewer
 */
function UnsupportedViewer({ file, title }: FileViewerProps) {
  const fileName = typeof file === 'string' ? file : (file as File).name || title || 'File';

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg bg-muted/20 border border-muted">
      <FileQuestion className="h-8 w-8 text-muted-foreground" />
      <div className="text-center">
        <p className="font-medium text-sm">{fileName}</p>
        <p className="text-xs text-muted-foreground mt-1">
          File type not supported for preview. Download to view.
        </p>
      </div>
    </div>
  );
}

/**
 * Main File Viewer Component
 * Auto-detects file type and renders appropriate viewer
 */
export function FileViewer({
  file,
  title,
  className,
  viewerType: initialViewerType,
  onProgress,
  onError,
}: FileViewerProps) {
  const [viewerType, setViewerType] = React.useState<ViewerType | null>(initialViewerType || null);

  React.useEffect(() => {
    if (!initialViewerType && (file instanceof File || file instanceof Blob)) {
      const mimeType = (file as File).type || '';
      const detected = FileHandler.getViewerType(mimeType);
      setViewerType(detected);
    }
  }, [file, initialViewerType]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {viewerType === 'image' && (
        <ImageViewerComponent file={file} title={title} className={className} />
      )}
      {viewerType === 'video' && (
        <VideoViewerComponent file={file} title={title} className={className} />
      )}
      {viewerType === 'audio' && (
        <AudioViewerComponent file={file} title={title} className={className} />
      )}
      {viewerType === 'pdf' && (
        <PDFViewer file={file} title={title} className={className} />
      )}
      {viewerType === 'word' && (
        <WordViewer file={file} type="word" title={title} className={cn('h-[600px]', className)} />
      )}
      {viewerType === 'excel' && (
        <ExcelViewer file={file} type="excel" title={title} className={cn('h-[600px]', className)} />
      )}
      {viewerType === 'powerpoint' && (
        <PowerPointViewer file={file} type="powerpoint" title={title} className={cn('h-[600px]', className)} />
      )}
      {viewerType === '3d' && (
        <Model3DViewer file={file} title={title} className={className} onProgress={onProgress} onError={onError} />
      )}
      {viewerType === 'text' && (
        <TextViewerComponent file={file} title={title} className={className} />
      )}
      {!viewerType && <UnsupportedViewer file={file} title={title} />}
    </Suspense>
  );
}

export default FileViewer;
