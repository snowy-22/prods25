
'use client';
import React, { useEffect, useState } from 'react';
import { Package, AlertCircle, RotateCw, Loader2 } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        ar?: boolean;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'interaction' | 'manual';
      };
    }
  }
}

interface ModelViewerProps {
  src: string;
  alt?: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  autoRotate?: boolean;
  cameraControls?: boolean;
  shadowIntensity?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Enhanced Model Viewer Component
 * Supports GLB, GLTF, OBJ formats using @google/model-viewer
 * Provides loading states, error handling, and fallback UI
 */
const ModelViewer = React.forwardRef<HTMLElement, ModelViewerProps>(
  ({ 
    src, 
    alt = '3D Model', 
    poster,
    className = '',
    style,
    autoRotate = true,
    cameraControls = true,
    shadowIntensity = '1',
    onLoad,
    onError 
  }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isModuleLoaded, setIsModuleLoaded] = useState(false);

    useEffect(() => {
      // Dynamically import @google/model-viewer
      const loadModule = async () => {
        try {
          await import('@google/model-viewer');
          setIsModuleLoaded(true);
        } catch (err) {
          console.error('Failed to load model-viewer module:', err);
          setHasError(true);
          setErrorMessage('3D görüntüleyici yüklenemedi');
          setIsLoading(false);
          onError?.(new Error('Failed to load model-viewer module'));
        }
      };
      loadModule();
    }, [onError]);

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLElement;
      const errorDetail = (target as any).errorDetail || 'Bilinmeyen hata';
      console.error('Model loading error:', errorDetail);
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(`Model yüklenemedi: ${errorDetail}`);
      onError?.(new Error(errorDetail));
    };

    // Validate URL
    const isValidUrl = src && (
      src.startsWith('http://') || 
      src.startsWith('https://') || 
      src.startsWith('blob:') ||
      src.startsWith('data:') ||
      src.startsWith('/')
    );

    if (!isValidUrl) {
      return (
        <div className={`flex items-center justify-center bg-muted/50 rounded-lg ${className}`} style={style}>
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Geçersiz model URL'i</p>
          </div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className={`flex items-center justify-center bg-destructive/10 rounded-lg ${className}`} style={style}>
          <div className="text-center p-4 max-w-xs">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive font-medium">3D Model Yüklenemedi</p>
            <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                setIsModuleLoaded(false);
                import('@google/model-viewer').then(() => setIsModuleLoaded(true));
              }}
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <RotateCw className="h-3 w-3" />
              Tekrar Dene
            </button>
          </div>
        </div>
      );
    }

    if (!isModuleLoaded) {
      return (
        <div className={`flex items-center justify-center bg-muted/50 rounded-lg ${className}`} style={style}>
          <div className="text-center p-4">
            <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">3D Görüntüleyici yükleniyor...</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`} style={style}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
            <div className="text-center">
              <Package className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">Model yükleniyor...</p>
            </div>
          </div>
        )}
        {React.createElement('model-viewer', {
          ref,
          src,
          alt,
          poster,
          'auto-rotate': autoRotate,
          'camera-controls': cameraControls,
          'shadow-intensity': shadowIntensity,
          'environment-image': 'neutral',
          loading: 'lazy',
          reveal: 'auto',
          style: { width: '100%', height: '100%', ...style },
          onLoad: handleLoad,
          onError: handleError,
        })}
      </div>
    );
  }
);

ModelViewer.displayName = 'ModelViewer';

export default ModelViewer;

// Re-export for convenience
export { ModelViewer };
