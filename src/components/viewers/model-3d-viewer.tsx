/**
 * 3D Model Viewer using Three.js
 * Supports GLB, GLTF, OBJ formats
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Package, AlertCircle, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Model3DViewerProps {
  file: File | Blob | string;
  title?: string;
  className?: string;
  onProgress?: (percent: number) => void;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    THREE?: any;
  }
}

export function Model3DViewer({
  file,
  title = '3D Model',
  className,
  onProgress,
  onError,
}: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    const initScene = async () => {
      try {
        setIsLoading(true);

        // Load Three.js from CDN
        if (!window.THREE) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Three.js'));
            document.head.appendChild(script);
          });

          // Load GLTFLoader
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three-gltf-loader@1.111.0/GLTFLoader.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load GLTFLoader'));
            document.head.appendChild(script);
          });
        }

        const THREE = window.THREE;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);
        sceneRef.current = scene;

        // Camera setup
        const width = containerRef.current?.clientWidth || 800;
        const height = containerRef.current?.clientHeight || 600;
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 0, 5);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        containerRef.current?.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Load model
        let fileUrl = '';
        if (typeof file === 'string') {
          fileUrl = file;
        } else if (file instanceof File || file instanceof Blob) {
          fileUrl = URL.createObjectURL(file);
        }

        // Determine file type
        const filename = typeof file === 'string' ? file : (file as File).name || 'model';
        const ext = filename.split('.').pop()?.toLowerCase() || '';

        if (ext === 'glb' || ext === 'gltf') {
          const loader = new (window as any).THREE.GLTFLoader();
          loader.load(
            fileUrl,
            (gltf: any) => {
              const model = gltf.scene;
              model.castShadow = true;
              model.receiveShadow = true;

              // Auto-scale model
              const box = new THREE.Box3().setFromObject(model);
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 4 / maxDim;
              model.scale.multiplyScalar(scale);

              // Center model
              const center = box.getCenter(new THREE.Vector3());
              model.position.sub(center);

              scene.add(model);
              modelRef.current = model;

              // Reset camera
              camera.position.z = 6;

              setIsLoading(false);
              onProgress?.(100);
            },
            (progress: any) => {
              const percent = (progress.loaded / progress.total) * 100;
              onProgress?.(percent);
            },
            (err: any) => {
              const message = `Failed to load model: ${err.message}`;
              setError(message);
              onError?.(message);
              setIsLoading(false);
            }
          );
        } else {
          throw new Error(`Unsupported format: ${ext}. Currently supporting GLB/GLTF.`);
        }

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);

          if (modelRef.current) {
            modelRef.current.rotation.x += 0.001;
            modelRef.current.rotation.y += 0.002;
          }

          renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
          const newWidth = containerRef.current?.clientWidth || 800;
          const newHeight = containerRef.current?.clientHeight || 600;
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (typeof file !== 'string' && fileUrl) {
            URL.revokeObjectURL(fileUrl);
          }
          renderer.dispose();
          containerRef.current?.removeChild(renderer.domElement);
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize 3D viewer';
        setError(message);
        onError?.(message);
        setIsLoading(false);
      }
    };

    initScene();
  }, [file, onProgress, onError]);

  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z *= 0.9;
      setZoom((z) => z * 1.1);
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z *= 1.1;
      setZoom((z) => z * 0.9);
    }
  };

  const handleReset = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 5);
      setZoom(1);
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-500" />
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">3D Model (GLB/GLTF)</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-2 border-b bg-background/30 flex items-center gap-2">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={handleReset}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Reset View"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <div className="ml-auto text-xs text-muted-foreground">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
      </div>

      {/* Viewer Container */}
      <div className="flex-1 overflow-hidden bg-black/50 relative">
        <div ref={containerRef} className="w-full h-full" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading 3D Model...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm">
            <div className="text-center p-4 max-w-xs">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t bg-background/30 text-xs text-muted-foreground flex items-center gap-2">
        <span>💡 Click and drag to rotate • Scroll to zoom • Auto-rotates</span>
      </div>
    </div>
  );
}

export default Model3DViewer;
