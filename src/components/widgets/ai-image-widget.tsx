// src/components/widgets/ai-image-widget.tsx

'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Wand2, Loader2, Download } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Placeholder for a function that would call an AI image generation API
const generateAiImage = async (prompt: string): Promise<string> => {
    // In a real app, this would make an API call.
    // For now, we'll return a placeholder image from Unsplash based on the prompt.
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(`https://source.unsplash.com/512x512/?${encodeURIComponent(prompt)}`);
        }, 1500);
    });
};

interface AiImageWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

// Widget best practice: Always use useWidgetResize and getWidgetSizeConfig defensively for responsive sizing
// Example:
//   const { containerRef, size: calculatedSize } = useWidgetResize();
//   const config = getWidgetSizeConfig(calculatedSize);
//   <div ref={containerRef} className={config.padding}>...</div>
export default function AiImageWidget({ size = 'medium' }: AiImageWidgetProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setImageUrl(null);
    const result = await generateAiImage(prompt);
    setImageUrl(result);
    setIsLoading(false);
  }

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col bg-card',
        isSmall && 'p-2',
        !isSmall && !isLarge && 'p-3',
        isLarge && 'p-4'
      )}
    >
      <div
        className={cn(
          'relative flex-1 overflow-hidden rounded-md bg-muted flex items-center justify-center',
          isSmall && 'min-h-[160px]',
          !isSmall && !isLarge && 'min-h-[220px]',
          isLarge && 'min-h-[300px]'
        )}
      >
        {isLoading && <Loader2 className={cn(
          'animate-spin text-primary',
          isSmall && 'h-8 w-8',
          !isSmall && !isLarge && 'h-10 w-10',
          isLarge && 'h-12 w-12'
        )} />}
        {!isLoading && imageUrl && (
            <Image src={imageUrl} alt={prompt} layout="fill" objectFit="cover" />
        )}
        {!isLoading && !imageUrl && (
             <div className={cn(
              'text-center text-muted-foreground',
              isSmall && 'p-2',
              !isSmall && !isLarge && 'p-4',
              isLarge && 'p-6'
             )}>
                <Wand2 className={cn(
                  'mx-auto mb-2',
                  isSmall && 'h-6 w-6',
                  !isSmall && !isLarge && 'h-10 w-10',
                  isLarge && 'h-12 w-12'
                )} />
                <p className={cn(
                  'text-muted-foreground',
                  isSmall && 'text-xs',
                  !isSmall && !isLarge && 'text-sm',
                  isLarge && 'text-base'
                )}>Bir istem girerek görüntü oluşturun.</p>
            </div>
        )}
        {imageUrl && !isLoading && (
            <div className={cn(
              'absolute top-2 right-2',
              isLarge && 'top-3 right-3'
            )}>
                <Button
                  size="icon"
                  variant="secondary"
                  className={cn(
                    isSmall && 'h-8 w-8',
                    !isSmall && !isLarge && 'h-9 w-9',
                    isLarge && 'h-10 w-10'
                  )}
                  onClick={() => window.open(imageUrl, '_blank')}
                >
                    <Download className={cn(
                      isSmall && 'h-4 w-4',
                      !isSmall && !isLarge && 'h-4 w-4',
                      isLarge && 'h-5 w-5'
                    )}/>
                </Button>
            </div>
        )}
      </div>
      <div className={cn(
        'flex items-center',
        isSmall && 'mt-2 gap-2',
        !isSmall && !isLarge && 'mt-3 gap-3',
        isLarge && 'mt-4 gap-4'
      )}>
        <Input 
            placeholder="Örn: ormanda koşan bir kaplan..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            disabled={isLoading}
            className={cn(
              isSmall && 'h-8 text-xs',
              !isSmall && !isLarge && 'h-10 text-sm',
              isLarge && 'h-12 text-base'
            )}
        />
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !prompt}
          className={cn(
            isSmall && 'h-8 px-2 text-xs',
            !isSmall && !isLarge && 'h-10 px-3 text-sm',
            isLarge && 'h-12 px-4 text-base'
          )}
        >
            {isLoading ? <Loader2 className={cn(
              'animate-spin',
              isSmall && 'h-4 w-4',
              !isSmall && !isLarge && 'h-5 w-5',
              isLarge && 'h-6 w-6'
            )} /> : <Wand2 className={cn(
              isSmall && 'h-4 w-4',
              !isSmall && !isLarge && 'h-5 w-5',
              isLarge && 'h-6 w-6'
            )} />}
        </Button>
      </div>
    </div>
  );
}
