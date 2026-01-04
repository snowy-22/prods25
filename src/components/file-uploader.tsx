/**
 * Universal File Uploader Component
 * Supports: Paste, Drag-drop, File input
 * Works with all file types: Images, Videos, Documents, 3D models, etc.
 */

'use client';

import React, { useCallback, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileHandler, FileItem, SupportedFileType } from '@/lib/file-handler';

interface FileUploaderProps {
  onFilesSelected: (files: FileItem[]) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
  acceptTypes?: SupportedFileType[];
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
  showPreview?: boolean;
}

export function FileUploader({
  onFilesSelected,
  onError,
  onProgress,
  acceptTypes,
  maxSize = 100 * 1024 * 1024,
  maxFiles = 10,
  multiple = true,
  className,
  children,
  showPreview = true,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<FileItem[]>([]);

  const handler = new FileHandler({
    maxSize,
    maxFiles,
    acceptTypes,
    onProgress,
    onError,
  });

        
  const processFiles = React.useCallback(
    async (files: (File | Blob)[] | FileItem[]) => {
      try {
        // Skip processing if already FileItems
        if (files.length > 0 && 'type' in files[0]) {
          const items = files as FileItem[];
          const combined = multiple ? [...selectedFiles, ...items] : items;
          const limited = combined.slice(0, maxFiles);
          setSelectedFiles(limited);
          onFilesSelected(limited);
          return;
        }

        const processed = await handler.processFiles(files as (File | Blob)[], 'input');
        if (!multiple && processed.length > 0) {
          setSelectedFiles([processed[0]]);
          onFilesSelected([processed[0]]);
        } else {
          const combined = multiple ? [...selectedFiles, ...processed] : processed;
          const limited = combined.slice(0, maxFiles);
          setSelectedFiles(limited);
          onFilesSelected(limited);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process files';
        onError?.(message);
      }
    },
    [handler, multiple, maxFiles, selectedFiles, onFilesSelected, onError]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      e.preventDefault();
      try {
        const files = await FileHandler.handlePaste(e.nativeEvent);
        await processFiles(files);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Paste failed';
        onError?.(message);
      }
    },
    [processFiles, onError]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      try {
        const files = await FileHandler.handleDrop(e.nativeEvent);
        await processFiles(files);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Drop failed';
        onError?.(message);
      }
    },
    [processFiles, onError]
  );

  const handleInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const files = await FileHandler.handleInput(e.currentTarget);
        await processFiles(files);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Input failed';
        onError?.(message);
      }
    },
    [processFiles, onError]
  );

  const removeFile = (id: string) => {
    const updated = selectedFiles.filter(f => f.id !== id);
    setSelectedFiles(updated);
    onFilesSelected(updated);
    
    const removed = selectedFiles.find(f => f.id === id);
    if (removed) {
      FileHandler.cleanup(removed);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onClick={() => inputRef.current?.click()}
      >
        {children ? (
          children
        ) : (
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium text-sm">
              {isDragging ? 'Drop files here' : 'Drag files here or click to select'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports images, videos, documents, 3D models and more
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          onChange={handleInput}
          className="hidden"
          accept={getAcceptString(acceptTypes)}
        />
      </div>

      {/* File List */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </p>
          <div className="space-y-1">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 rounded bg-muted/50 border border-muted"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 rounded hover:bg-muted ml-2 transition-colors"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generate accept string for file input based on types
 */
function getAcceptString(acceptTypes?: SupportedFileType[]): string {
  if (!acceptTypes || acceptTypes.length === 0) {
    return '*/*'; // Accept all
  }

  const mimeTypes: Record<SupportedFileType, string[]> = {
    image: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'],
    video: ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
    audio: ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
    pdf: ['.pdf'],
    excel: ['.xls', '.xlsx', '.csv'],
    word: ['.doc', '.docx'],
    powerpoint: ['.ppt', '.pptx'],
    '3d-model': ['.glb', '.gltf', '.obj', '.fbx'],
    text: ['.txt', '.md', '.json', '.xml', '.html'],
    markdown: ['.md', '.markdown'],
    archive: ['.zip', '.rar', '.7z'],
    unknown: [],
  };

  const extensions = new Set<string>();
  for (const type of acceptTypes) {
    mimeTypes[type]?.forEach(ext => extensions.add(ext));
  }

  return Array.from(extensions).join(',');
}

/**
 * Format bytes to human readable size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default FileUploader;
