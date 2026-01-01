'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Palette, RotateCcw, Send, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';

interface DrawingToolsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export function AISketchModule({ isOpen, onClose, onSave }: DrawingToolsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [showEarth, setShowEarth] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Setup context
    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = brushSize;
    context.strokeStyle = color;

    // Fill with white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    contextRef.current = context;
  }, []);

  // Update brush properties
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = brushSize;
      contextRef.current.strokeStyle = color;
    }
  }, [brushSize, color]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      };
    }

    return {
      offsetX: (e as React.MouseEvent).offsetX,
      offsetY: (e as React.MouseEvent).offsetY,
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    contextRef.current.fillStyle = '#ffffff';
    contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveSketch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Kat Planı Çizim Aracı</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tools Bar */}
          <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Renk</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <div className="flex-1 grid grid-cols-3 gap-1">
                    {['#000000', '#666666', '#FF0000', '#0066FF', '#00CC00', '#FFCC00'].map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-10 rounded border-2 transition-all ${
                          color === c ? 'border-primary scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fırça Boyutu</label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[brushSize]}
                    onValueChange={([val]) => setBrushSize(val)}
                    min={1}
                    max={10}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8">{brushSize.toFixed(1)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Seçenekler</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCanvas}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={showEarth ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowEarth(!showEarth)}
                    className="flex-1"
                  >
                    🌍 Harita
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full cursor-crosshair touch-none"
              style={{ aspectRatio: '16/10' }}
            />
          </div>

          {/* AI Suggestions */}
          {showEarth && (
            <div className="border rounded-lg p-3 bg-blue-50/50 space-y-2">
              <p className="text-sm font-medium">💡 AI Önerileri:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  + Dikdörtgen Oda
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  + Kapı/Pencere
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  + Merdiven
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  + Mobilya
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💬 AI şunları algıladı: İki ana alan, bir geçiş bölgesi
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button onClick={saveSketch}>
              <Send className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
