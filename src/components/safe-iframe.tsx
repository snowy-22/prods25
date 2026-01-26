'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, AlertTriangle, RefreshCw, Globe, Lock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Sites known to block iframe embedding
const BLOCKED_SITES = [
  'grafana.com',
  'khanacademy.org',
  'tradingview.com',
  'dribbble.com',
  'linkedin.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'pinterest.com',
  'reddit.com',
  'tiktok.com',
  'docs.google.com',
  'sheets.google.com',
  'slides.google.com',
];

// Check if URL is from a blocked site
function isBlockedSite(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BLOCKED_SITES.some(site => hostname.includes(site));
  } catch {
    return false;
  }
}

// Get preview image URL (using various services)
function getPreviewImageUrl(url: string): string | null {
  try {
    const encodedUrl = encodeURIComponent(url);
    // Use screenshot services for preview
    // Option 1: urlbox.io (requires API key)
    // Option 2: screenshot.screenshotapi.net
    // Option 3: Local placeholder
    return `https://image.thum.io/get/width/600/crop/400/${url}`;
  } catch {
    return null;
  }
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Get favicon URL
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return '';
  }
}

export interface SafeIframeProps {
  src: string;
  title?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  allowFullScreen?: boolean;
  loading?: 'lazy' | 'eager';
  sandbox?: string;
  allow?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onLoad?: () => void;
  onError?: () => void;
  fallbackMode?: 'preview' | 'card' | 'minimal';
}

type IframeStatus = 'loading' | 'loaded' | 'blocked' | 'error';

export const SafeIframe: React.FC<SafeIframeProps> = ({
  src,
  title = 'Embedded content',
  className,
  width = '100%',
  height = '100%',
  allowFullScreen = true,
  loading = 'lazy',
  sandbox,
  allow,
  referrerPolicy = 'no-referrer-when-downgrade',
  onLoad,
  onError,
  fallbackMode = 'preview',
}) => {
  const [status, setStatus] = useState<IframeStatus>('loading');
  const [showPreview, setShowPreview] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const domain = extractDomain(src);
  const isKnownBlocked = isBlockedSite(src);
  const previewImageUrl = getPreviewImageUrl(src);
  
  // Check if iframe loaded successfully
  const checkIframeStatus = useCallback(() => {
    if (iframeRef.current) {
      try {
        // Try to access iframe content - will throw if blocked by X-Frame-Options
        const doc = iframeRef.current.contentDocument;
        const win = iframeRef.current.contentWindow;
        
        // If we can access the document and it has content, it loaded
        if (doc && doc.body) {
          setStatus('loaded');
          onLoad?.();
        }
      } catch (e) {
        // Cross-origin error means iframe loaded but we can't access it
        // This is expected for external sites
        setStatus('loaded');
        onLoad?.();
      }
    }
  }, [onLoad]);
  
  // Handle iframe load event
  const handleLoad = useCallback(() => {
    clearTimeout(timeoutRef.current);
    checkIframeStatus();
  }, [checkIframeStatus]);
  
  // Handle iframe error event
  const handleError = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setStatus('error');
    onError?.();
  }, [onError]);
  
  // Retry loading
  const handleRetry = useCallback(() => {
    setStatus('loading');
    setRetryCount(prev => prev + 1);
  }, []);
  
  // Open in new tab
  const handleOpenExternal = useCallback(() => {
    window.open(src, '_blank', 'noopener,noreferrer');
  }, [src]);
  
  // Effect: Check for known blocked sites immediately
  useEffect(() => {
    if (isKnownBlocked) {
      setStatus('blocked');
      return;
    }
    
    // Set timeout for loading
    timeoutRef.current = setTimeout(() => {
      if (status === 'loading') {
        // If still loading after timeout, assume blocked
        setStatus('blocked');
      }
    }, 5000);
    
    return () => clearTimeout(timeoutRef.current);
  }, [isKnownBlocked, status, retryCount]);
  
  // Render blocked/error fallback
  const renderFallback = () => {
    if (fallbackMode === 'minimal') {
      return (
        <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenExternal}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {domain}'da aç
          </Button>
        </div>
      );
    }
    
    if (fallbackMode === 'card') {
      return (
        <Card className={cn("overflow-hidden h-full", className)}>
          <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {status === 'blocked' ? (
                <Lock className="w-6 h-6 text-muted-foreground" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {status === 'blocked' 
                  ? 'Bu site iframe yerleştirmeyi engelliyor'
                  : 'İçerik yüklenemedi'
                }
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleOpenExternal}
                className="gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Siteyi Aç
              </Button>
              {status === 'error' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tekrar Dene
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Default: Preview mode with screenshot
    return (
      <div 
        className={cn(
          "relative h-full rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50",
          className
        )}
      >
        {/* Preview image or placeholder */}
        <div className="absolute inset-0">
          {previewImageUrl && !showPreview ? (
            <motion.img
              src={previewImageUrl}
              alt={title}
              className="w-full h-full object-cover object-top opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              onError={() => setShowPreview(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="relative flex flex-col items-center justify-center h-full p-6 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 rounded-2xl bg-muted/80 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg"
          >
            {status === 'blocked' ? (
              <Lock className="w-7 h-7 text-muted-foreground" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-yellow-500" />
            )}
          </motion.div>
          
          {/* Title and domain */}
          <h3 className="font-semibold text-base mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
            <img 
              src={getFaviconUrl(src)} 
              alt="" 
              className="w-4 h-4 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {domain}
          </p>
          
          {/* Status message */}
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            {status === 'blocked' 
              ? 'Bu web sitesi güvenlik nedeniyle iframe içinde görüntülenemiyor.'
              : 'İçerik yüklenirken bir hata oluştu. Lütfen yeni sekmede açmayı deneyin.'
            }
          </p>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleOpenExternal}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Yeni Sekmede Aç
            </Button>
            {status === 'error' && (
              <Button
                variant="outline"
                onClick={handleRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tekrar Dene
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // If blocked or error, show fallback
  if (status === 'blocked' || status === 'error') {
    return renderFallback();
  }
  
  // Show iframe with loading overlay
  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      {/* Loading overlay */}
      <AnimatePresence>
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80 backdrop-blur-sm rounded-lg"
          >
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-6 h-6 text-primary" />
              </motion.div>
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
              <p className="text-xs text-muted-foreground/70">{domain}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Iframe */}
      <iframe
        ref={iframeRef}
        key={retryCount}
        src={src}
        title={title}
        width="100%"
        height="100%"
        allowFullScreen={allowFullScreen}
        loading={loading}
        sandbox={sandbox}
        allow={allow}
        referrerPolicy={referrerPolicy}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "border-0 rounded-lg transition-opacity",
          status === 'loading' ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
};

// Wrapper component for player frames that may be blocked
export const SafePlayerFrame: React.FC<{
  url: string;
  title: string;
  type?: 'video' | 'website' | 'image';
  className?: string;
  aspectRatio?: string;
}> = ({ url, title, type = 'website', className, aspectRatio = '16/9' }) => {
  return (
    <div 
      className={cn("rounded-lg overflow-hidden bg-muted", className)}
      style={{ aspectRatio }}
    >
      <SafeIframe
        src={url}
        title={title}
        fallbackMode={type === 'video' ? 'card' : 'preview'}
        className="w-full h-full"
      />
    </div>
  );
};

export default SafeIframe;
