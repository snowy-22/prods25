'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Copy, RotateCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GradientGeneratorWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

type GradientType = 'linear' | 'radial' | 'conic';
type GradientDirection = 'to right' | 'to bottom' | 'to bottom right' | 'to top right' | '45deg' | '90deg' | '135deg';

export default function GradientGeneratorWidget({ size = 'medium' }: GradientGeneratorWidgetProps) {
  const [color1, setColor1] = useState('#FF6B6B');
  const [color2, setColor2] = useState('#4ECDC4');
  const [color3, setColor3] = useState('#45B7D1');
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [direction, setDirection] = useState<GradientDirection>('to right');
  const { toast } = useToast();
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const generateGradient = () => {
    let css = '';
    if (gradientType === 'linear') {
      css = `linear-gradient(${direction}, ${color1}, ${color2}, ${color3})`;
    } else if (gradientType === 'radial') {
      css = `radial-gradient(circle, ${color1}, ${color2}, ${color3})`;
    } else {
      css = `conic-gradient(from 0deg, ${color1}, ${color2}, ${color3}, ${color1})`;
    }
    return css;
  };

  const gradientCSS = generateGradient();

  const copyCSS = () => {
    const css = `background: ${gradientCSS};`;
    navigator.clipboard.writeText(css);
    toast({
      title: "Kopyalandı",
      description: "CSS kodu panoya kopyalandı"
    });
  };

  const randomizeColors = () => {
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setColor1(randomColor());
    setColor2(randomColor());
    setColor3(randomColor());
  };

  const downloadGradient = () => {
    const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <${gradientType === 'conic' ? 'linearGradient' : gradientType}Gradient id="grad" ${gradientType === 'linear' ? `x1="0%" y1="0%" x2="100%" y2="100%"` : ''}>
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${color2};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color3};stop-opacity:1" />
        </${gradientType === 'conic' ? 'linearGradient' : gradientType}Gradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad)"/>
    </svg>`;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gradient.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-card",
      isSmall && "p-1",
      !isSmall && !isLarge && "p-2",
      isLarge && "p-4"
    )}>
      {/* Gradient Preview */}
      <div
        className={cn(
          "rounded-lg border-2 border-muted mb-2",
          isSmall && "h-16",
          !isSmall && !isLarge && "h-32",
          isLarge && "h-48"
        )}
        style={{ background: gradientCSS }}
      />

      {/* Controls */}
      <div className={cn(
        "space-y-2 flex-1 overflow-y-auto",
        isSmall && "space-y-1",
        isLarge && "space-y-3"
      )}>
        {/* Gradient Type */}
        <div className={cn(isSmall && "text-xs", !isSmall && !isLarge && "text-sm", isLarge && "text-base")}>
          <label className="font-semibold block mb-1">Tür</label>
          <select 
            value={gradientType}
            onChange={(e) => setGradientType(e.target.value as GradientType)}
            className={cn(
              "w-full p-1 rounded-md border bg-background text-foreground",
              isSmall && "text-xs h-6",
              isLarge && "h-10 text-lg"
            )}
          >
            <option value="linear">Lineer</option>
            <option value="radial">Radial</option>
            <option value="conic">Konik</option>
          </select>
        </div>

        {/* Direction (only for linear) */}
        {gradientType === 'linear' && (
          <div className={cn(isSmall && "text-xs", !isSmall && !isLarge && "text-sm", isLarge && "text-base")}>
            <label className="font-semibold block mb-1">Yön</label>
            <select 
              value={direction}
              onChange={(e) => setDirection(e.target.value as GradientDirection)}
              className={cn(
                "w-full p-1 rounded-md border bg-background text-foreground",
                isSmall && "text-xs h-6",
                isLarge && "h-10 text-lg"
              )}
            >
              <option value="to right">Sağa</option>
              <option value="to bottom">Aşağıya</option>
              <option value="to bottom right">Aşağı-Sağa</option>
              <option value="to top right">Yukarı-Sağa</option>
            </select>
          </div>
        )}

        {/* Colors */}
        {[
          { value: color1, setValue: setColor1, label: 'Renk 1' },
          { value: color2, setValue: setColor2, label: 'Renk 2' },
          { value: color3, setValue: setColor3, label: 'Renk 3' },
        ].map((item) => (
          <div key={item.label} className={cn(isSmall && "text-xs", !isSmall && !isLarge && "text-sm", isLarge && "text-base")}>
            <label className="font-semibold block mb-1">{item.label}</label>
            <div className="flex gap-1">
              <Input
                type="color"
                value={item.value}
                onChange={(e) => item.setValue(e.target.value)}
                className={cn(
                  "h-8",
                  isSmall && "w-8",
                  !isSmall && !isLarge && "h-10 flex-1",
                  isLarge && "h-12 flex-1"
                )}
              />
              <Input
                type="text"
                value={item.value}
                onChange={(e) => item.setValue(e.target.value)}
                className={cn(
                  "font-mono flex-1",
                  isSmall && "text-xs h-8",
                  !isSmall && !isLarge && "h-10",
                  isLarge && "h-12 text-lg"
                )}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className={cn(
        "grid grid-cols-3 gap-1 mt-2",
        isSmall && "gap-0.5",
        !isSmall && !isLarge && "gap-2",
        isLarge && "gap-3"
      )}>
        <Button
          variant="outline"
          onClick={randomizeColors}
          className={cn(isSmall && "h-7 text-xs", isLarge && "h-10 text-lg")}
        >
          <RotateCw className={cn(isSmall && "h-3 w-3 mr-0.5", !isSmall && !isLarge && "h-4 w-4 mr-1", isLarge && "h-5 w-5 mr-2")} />
          {!isSmall && 'Rastgele'}
        </Button>
        <Button
          variant="default"
          onClick={copyCSS}
          className={cn(isSmall && "h-7 text-xs", isLarge && "h-10 text-lg")}
        >
          <Copy className={cn(isSmall && "h-3 w-3 mr-0.5", !isSmall && !isLarge && "h-4 w-4 mr-1", isLarge && "h-5 w-5 mr-2")} />
          {!isSmall && 'Kopyala'}
        </Button>
        <Button
          variant="secondary"
          onClick={downloadGradient}
          className={cn(isSmall && "h-7 text-xs", isLarge && "h-10 text-lg")}
        >
          <Download className={cn(isSmall && "h-3 w-3 mr-0.5", !isSmall && !isLarge && "h-4 w-4 mr-1", isLarge && "h-5 w-5 mr-2")} />
          {!isSmall && 'SVG'}
        </Button>
      </div>
    </div>
  );
}
