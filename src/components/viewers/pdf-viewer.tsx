/**
 * PDF Viewer Component
 * Uses PDF.js for rendering
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PDFViewerProps {
  file: File | Blob | string; // File, Blob, or URL
  title?: string;
  className?: string;
  onPageChange?: (page: number, total: number) => void;
  maxZoom?: number;
  minZoom?: number;
}

// Set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function PDFViewer({ 
  file, 
  title, 
  className,
  onPageChange,
  maxZoom = 300,
  minZoom = 50,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<pdfjs.PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF
  useEffect(() => {
    let isMounted = true;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let data: Uint8Array | string;

        if (typeof file === 'string') {
          // URL
          data = file;
        } else if (file instanceof File || file instanceof Blob) {
          // File or Blob
          const arrayBuffer = await file.slice().arrayBuffer();
          data = new Uint8Array(arrayBuffer);
        } else {
          throw new Error('Invalid file type');
        }

        const pdf = await pdfjs.getDocument({ data }).promise;
        if (isMounted) {
          setPdf(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
          onPageChange?.(1, pdf.numPages);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
    };
  }, [file, onPageChange]);

  // Render page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const canvas = canvasRef.current!;

        const scale = zoom / 100;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: canvas.getContext('2d')!,
          viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        if (isMounted) {
          console.error('Failed to render page:', err);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdf, currentPage, zoom]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-96 bg-destructive/5 rounded-lg', className)}>
        <div className="text-center">
          <p className="text-sm font-medium text-destructive">Failed to load PDF</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-muted/20', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-background/50 backdrop-blur-sm">
        <div className="flex-1">
          {title && <h3 className="text-sm font-semibold truncate">{title}</h3>}
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = Math.min(Math.max(1, parseInt(e.target.value) || 1), totalPages);
              setCurrentPage(page);
              onPageChange?.(page, totalPages);
            }}
            className="w-12 px-2 py-1 text-xs text-center border rounded"
            min="1"
            max={totalPages}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 ml-4 pl-4 border-l">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(Math.max(minZoom, zoom - 10))}
              disabled={zoom <= minZoom}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <span className="text-xs font-medium w-10 text-center">{zoom}%</span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(Math.min(maxZoom, zoom + 10))}
              disabled={zoom >= maxZoom}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Download */}
          {typeof file === 'string' && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 ml-2"
            >
              <a href={file} download={title || 'document.pdf'} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          className="border bg-white shadow-lg max-h-full"
          style={{ maxWidth: '100%' }}
        />
      </div>
    </div>
  );
}

export default PDFViewer;
