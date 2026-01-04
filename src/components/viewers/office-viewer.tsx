/**
 * Office Document Viewers
 * Supports Word (.docx), Excel (.xlsx), PowerPoint (.pptx)
 * Uses embedded Google Docs/Sheets/Slides viewers
 */

'use client';

import React, { useEffect, useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfficeViewerProps {
  file: File | Blob | string; // File, Blob, or URL
  type: 'word' | 'excel' | 'powerpoint';
  title?: string;
  className?: string;
}

/**
 * Word Document Viewer using Google Docs Viewer
 */
export function WordViewer({ file, title, className }: OfficeViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof file === 'string') {
      setFileUrl(file);
    } else if (file instanceof File || file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className={cn('flex flex-col h-full bg-muted/20', className)}>
      {/* Header */}
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="text-sm font-semibold">{title || 'Word Document'}</h3>
            <p className="text-xs text-muted-foreground">Using Google Docs Viewer</p>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        {fileUrl ? (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
            className="w-full h-full border-0"
            title={title || 'Word Document'}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading document...
          </div>
        )}
      </div>

      {/* Note */}
      <div className="p-2 border-t bg-background/30 text-xs text-muted-foreground flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>For full editing, open in Google Docs or Microsoft Office</span>
      </div>
    </div>
  );
}

/**
 * Excel Spreadsheet Viewer using Google Sheets Viewer
 */
export function ExcelViewer({ file, title, className }: OfficeViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>('');

  useEffect(() => {
    if (typeof file === 'string') {
      setFileUrl(file);
    } else if (file instanceof File || file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className={cn('flex flex-col h-full bg-muted/20', className)}>
      {/* Header */}
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-500" />
          <div>
            <h3 className="text-sm font-semibold">{title || 'Spreadsheet'}</h3>
            <p className="text-xs text-muted-foreground">Excel/CSV Viewer</p>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        {fileUrl ? (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
            className="w-full h-full border-0"
            title={title || 'Spreadsheet'}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading spreadsheet...
          </div>
        )}
      </div>

      {/* Note */}
      <div className="p-2 border-t bg-background/30 text-xs text-muted-foreground flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>For editing, upload to Google Sheets</span>
      </div>
    </div>
  );
}

/**
 * PowerPoint Presentation Viewer using Google Slides Viewer
 */
export function PowerPointViewer({ file, title, className }: OfficeViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>('');

  useEffect(() => {
    if (typeof file === 'string') {
      setFileUrl(file);
    } else if (file instanceof File || file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className={cn('flex flex-col h-full bg-muted/20', className)}>
      {/* Header */}
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-500" />
          <div>
            <h3 className="text-sm font-semibold">{title || 'Presentation'}</h3>
            <p className="text-xs text-muted-foreground">PowerPoint Viewer</p>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        {fileUrl ? (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
            className="w-full h-full border-0"
            title={title || 'Presentation'}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading presentation...
          </div>
        )}
      </div>

      {/* Note */}
      <div className="p-2 border-t bg-background/30 text-xs text-muted-foreground flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>For editing, upload to Google Slides</span>
      </div>
    </div>
  );
}

/**
 * Universal Office Document Viewer
 * Auto-selects appropriate viewer based on type
 */

export function OfficeViewer({
  file,
  type,
  title,
  className,
}: OfficeViewerProps) {
  switch (type) {
    case 'word':
      return <WordViewer file={file} type="word" title={title} className={className} />;
    case 'excel':
      return <ExcelViewer file={file} type="excel" title={title} className={className} />;
    case 'powerpoint':
      return <PowerPointViewer file={file} type="powerpoint" title={title} className={className} />;
    default:
      return null;
  }
}
export default OfficeViewer;
