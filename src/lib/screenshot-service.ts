/**
 * Screenshot Service - Canvas ekran görüntüsü alma
 * 
 * html2canvas ile DOM elementlerini capture eder
 * Watermark ekleme, format dönüşümü destekler
 */

import { WatermarkOptions, DEFAULT_WATERMARK } from './export-manager';

// Screenshot seçenekleri
export interface ScreenshotOptions {
  scale?: number; // Çözünürlük çarpanı (default: 2)
  quality?: number; // JPEG/WebP kalitesi (0-1)
  format?: 'png' | 'jpeg' | 'webp';
  backgroundColor?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  logging?: boolean;
  useCORS?: boolean;
  allowTaint?: boolean;
  ignoreElements?: (element: Element) => boolean;
}

// Screenshot sonucu
export interface ScreenshotResult {
  success: boolean;
  canvas?: HTMLCanvasElement;
  blob?: Blob;
  dataUrl?: string;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * DOM elementinin ekran görüntüsünü al
 */
export async function captureElement(
  element: HTMLElement,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  try {
    // html2canvas'ı dinamik import et (client-side only)
    const html2canvas = (await import('html2canvas')).default;
    
    const {
      scale = 2,
      quality = 0.92,
      format = 'png',
      backgroundColor = '#ffffff',
      logging = false,
      useCORS = true,
      allowTaint = false,
      ignoreElements,
    } = options;

    // Capture options
    const captureOptions: any = {
      scale,
      backgroundColor,
      logging,
      useCORS,
      allowTaint,
      ...(options.width && { width: options.width }),
      ...(options.height && { height: options.height }),
      ...(options.x !== undefined && { x: options.x }),
      ...(options.y !== undefined && { y: options.y }),
      ...(ignoreElements && { ignoreElements }),
    };

    // Capture
    const canvas = await html2canvas(element, captureOptions);

    // Format'a göre blob oluştur
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                     format === 'webp' ? 'image/webp' : 'image/png';
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
        mimeType,
        quality
      );
    });

    const dataUrl = canvas.toDataURL(mimeType, quality);

    return {
      success: true,
      canvas,
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Screenshot failed',
    };
  }
}

/**
 * Element ID ile ekran görüntüsü al
 */
export async function captureById(
  elementId: string,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  const element = document.getElementById(elementId);
  if (!element) {
    return {
      success: false,
      error: `Element not found: ${elementId}`,
    };
  }
  return captureElement(element, options);
}

/**
 * Canvas selector ile ekran görüntüsü al
 */
export async function captureBySelector(
  selector: string,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) {
    return {
      success: false,
      error: `Element not found: ${selector}`,
    };
  }
  return captureElement(element, options);
}

/**
 * Görünür viewport'un ekran görüntüsünü al
 */
export async function captureViewport(
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  return captureElement(document.body, {
    ...options,
    width: window.innerWidth,
    height: window.innerHeight,
    x: window.scrollX,
    y: window.scrollY,
  });
}

/**
 * Canvas'a watermark ekle
 */
export function addWatermarkToCanvas(
  sourceCanvas: HTMLCanvasElement,
  watermark: WatermarkOptions = DEFAULT_WATERMARK
): HTMLCanvasElement {
  if (!watermark.enabled) return sourceCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  // Orijinal görüntüyü çiz
  ctx.drawImage(sourceCanvas, 0, 0);

  // Watermark ayarları
  const padding = watermark.padding || 16;
  const fontSize = watermark.fontSize * 2; // Scale için
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.globalAlpha = watermark.opacity;

  // Watermark boyutlarını hesapla
  const textMetrics = ctx.measureText(watermark.text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;
  const boxPadding = padding;
  const boxWidth = textWidth + boxPadding * 2;
  const boxHeight = textHeight + boxPadding * 1.5;

  // Pozisyon hesapla
  let x: number, y: number;
  
  switch (watermark.position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-right':
      x = canvas.width - boxWidth - padding;
      y = padding;
      break;
    case 'bottom-left':
      x = padding;
      y = canvas.height - boxHeight - padding;
      break;
    case 'center':
      x = (canvas.width - boxWidth) / 2;
      y = (canvas.height - boxHeight) / 2;
      break;
    case 'bottom-right':
    default:
      x = canvas.width - boxWidth - padding;
      y = canvas.height - boxHeight - padding;
  }

  // Arka plan kutusu
  if (watermark.backgroundColor) {
    ctx.fillStyle = watermark.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, 8);
    ctx.fill();
  }

  // Metin
  ctx.fillStyle = watermark.color;
  ctx.textBaseline = 'middle';
  ctx.fillText(watermark.text, x + boxPadding, y + boxHeight / 2);

  ctx.globalAlpha = 1;

  return canvas;
}

/**
 * Ekran görüntüsü al ve watermark ekle
 */
export async function captureWithWatermark(
  element: HTMLElement,
  watermark: WatermarkOptions,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  const result = await captureElement(element, options);
  
  if (!result.success || !result.canvas) {
    return result;
  }

  const watermarkedCanvas = addWatermarkToCanvas(result.canvas, watermark);
  
  const format = options.format || 'png';
  const quality = options.quality || 0.92;
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                   format === 'webp' ? 'image/webp' : 'image/png';

  const blob = await new Promise<Blob>((resolve, reject) => {
    watermarkedCanvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
      mimeType,
      quality
    );
  });

  return {
    success: true,
    canvas: watermarkedCanvas,
    blob,
    dataUrl: watermarkedCanvas.toDataURL(mimeType, quality),
    width: watermarkedCanvas.width,
    height: watermarkedCanvas.height,
  };
}

/**
 * Screenshot'ı dosya olarak indir
 */
export function downloadScreenshot(
  result: ScreenshotResult,
  filename: string = 'screenshot'
): boolean {
  if (!result.success || !result.dataUrl) {
    console.error('No screenshot data to download');
    return false;
  }

  const format = result.dataUrl.includes('image/jpeg') ? 'jpg' :
                 result.dataUrl.includes('image/webp') ? 'webp' : 'png';

  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = result.dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
}

/**
 * Screenshot'ı clipboard'a kopyala
 */
export async function copyScreenshotToClipboard(
  result: ScreenshotResult
): Promise<boolean> {
  if (!result.success || !result.blob) {
    console.error('No screenshot data to copy');
    return false;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [result.blob.type]: result.blob,
      }),
    ]);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Thumbnail oluştur (küçük boyutlu)
 */
export async function createThumbnail(
  element: HTMLElement,
  maxWidth: number = 400,
  maxHeight: number = 300
): Promise<ScreenshotResult> {
  const result = await captureElement(element, { scale: 1 });
  
  if (!result.success || !result.canvas) {
    return result;
  }

  // Boyut hesapla
  const { width, height } = result.canvas;
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  const newWidth = Math.floor(width * ratio);
  const newHeight = Math.floor(height * ratio);

  // Yeni canvas oluştur
  const thumbnail = document.createElement('canvas');
  thumbnail.width = newWidth;
  thumbnail.height = newHeight;
  
  const ctx = thumbnail.getContext('2d');
  if (!ctx) {
    return { success: false, error: 'Failed to create thumbnail context' };
  }

  // Kaliteli resize için
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(result.canvas, 0, 0, newWidth, newHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    thumbnail.toBlob(
      (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
      'image/jpeg',
      0.85
    );
  });

  return {
    success: true,
    canvas: thumbnail,
    blob,
    dataUrl: thumbnail.toDataURL('image/jpeg', 0.85),
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Multiple elements'ı tek görüntüde birleştir
 */
export async function captureMultiple(
  elements: HTMLElement[],
  layout: 'horizontal' | 'vertical' | 'grid' = 'grid',
  gap: number = 16,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  if (elements.length === 0) {
    return { success: false, error: 'No elements to capture' };
  }

  // Her element için screenshot al
  const screenshots = await Promise.all(
    elements.map(el => captureElement(el, { ...options, scale: 1 }))
  );

  const validScreenshots = screenshots.filter(s => s.success && s.canvas);
  if (validScreenshots.length === 0) {
    return { success: false, error: 'No valid screenshots' };
  }

  // Layout hesapla
  let totalWidth = 0;
  let totalHeight = 0;
  let columns = 1;
  
  if (layout === 'horizontal') {
    totalWidth = validScreenshots.reduce((sum, s) => sum + (s.width || 0) + gap, -gap);
    totalHeight = Math.max(...validScreenshots.map(s => s.height || 0));
  } else if (layout === 'vertical') {
    totalWidth = Math.max(...validScreenshots.map(s => s.width || 0));
    totalHeight = validScreenshots.reduce((sum, s) => sum + (s.height || 0) + gap, -gap);
  } else {
    // Grid layout
    columns = Math.ceil(Math.sqrt(validScreenshots.length));
    const rows = Math.ceil(validScreenshots.length / columns);
    const maxItemWidth = Math.max(...validScreenshots.map(s => s.width || 0));
    const maxItemHeight = Math.max(...validScreenshots.map(s => s.height || 0));
    totalWidth = columns * maxItemWidth + (columns - 1) * gap;
    totalHeight = rows * maxItemHeight + (rows - 1) * gap;
  }

  // Combined canvas oluştur
  const combined = document.createElement('canvas');
  combined.width = totalWidth;
  combined.height = totalHeight;
  
  const ctx = combined.getContext('2d');
  if (!ctx) {
    return { success: false, error: 'Failed to create combined canvas' };
  }

  // Arka plan
  ctx.fillStyle = options.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Screenshots'ları yerleştir
  let x = 0, y = 0;
  validScreenshots.forEach((s, i) => {
    if (!s.canvas) return;

    if (layout === 'horizontal') {
      ctx.drawImage(s.canvas, x, 0);
      x += (s.width || 0) + gap;
    } else if (layout === 'vertical') {
      ctx.drawImage(s.canvas, 0, y);
      y += (s.height || 0) + gap;
    } else {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const maxItemWidth = Math.max(...validScreenshots.map(ss => ss.width || 0));
      const maxItemHeight = Math.max(...validScreenshots.map(ss => ss.height || 0));
      ctx.drawImage(s.canvas, col * (maxItemWidth + gap), row * (maxItemHeight + gap));
    }
  });

  const format = options.format || 'png';
  const quality = options.quality || 0.92;
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                   format === 'webp' ? 'image/webp' : 'image/png';

  const blob = await new Promise<Blob>((resolve, reject) => {
    combined.toBlob(
      (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
      mimeType,
      quality
    );
  });

  return {
    success: true,
    canvas: combined,
    blob,
    dataUrl: combined.toDataURL(mimeType, quality),
    width: totalWidth,
    height: totalHeight,
  };
}
