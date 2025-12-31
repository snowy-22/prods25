'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Copy, RotateCw } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LoremIpsumGeneratorWidgetProps {
  size?: 'small' | 'medium' | 'large';
}

type LoremType = 'paragraphs' | 'sentences' | 'words';

const loremWords = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
];

export default function LoremIpsumGeneratorWidget({ size = 'medium' }: LoremIpsumGeneratorWidgetProps) {
  const [loremType, setLoremType] = useState<LoremType>('paragraphs');
  const [count, setCount] = useState(3);
  const [generatedText, setGeneratedText] = useState('');
  const { toast } = useToast();
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const generateLoremWord = () => {
    return loremWords[Math.floor(Math.random() * loremWords.length)];
  };

  const generateLoremSentence = () => {
    const wordCount = Math.floor(Math.random() * 10) + 5;
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(generateLoremWord());
    }
    return words[0].charAt(0).toUpperCase() + words[0].slice(1) + ' ' + words.slice(1).join(' ') + '.';
  };

  const generateLoremParagraph = () => {
    const sentenceCount = Math.floor(Math.random() * 5) + 3;
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateLoremSentence());
    }
    return sentences.join(' ');
  };

  const generateLorem = () => {
    let result = '';

    if (loremType === 'words') {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(generateLoremWord());
      }
      result = words.join(' ');
    } else if (loremType === 'sentences') {
      const sentences = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateLoremSentence());
      }
      result = sentences.join(' ');
    } else {
      const paragraphs = [];
      for (let i = 0; i < count; i++) {
        paragraphs.push(generateLoremParagraph());
      }
      result = paragraphs.join('\n\n');
    }

    setGeneratedText(result);
  };

  const copyText = () => {
    navigator.clipboard.writeText(generatedText);
    toast({
      title: "Kopyalandı",
      description: "Lorem ipsum metni panoya kopyalandı"
    });
  };

  return (
    <div className={cn(
      "flex h-full w-full flex-col bg-card",
      isSmall && "p-1",
      !isSmall && !isLarge && "p-2",
      isLarge && "p-4"
    )}>
      {/* Controls */}
      <div className={cn(
        "space-y-2 border-b pb-2",
        isSmall && "space-y-1",
        isLarge && "space-y-3 pb-4"
      )}>
        <div>
          <label className={cn(
            "font-semibold block mb-1",
            isSmall && "text-xs",
            !isSmall && !isLarge && "text-sm",
            isLarge && "text-base"
          )}>
            Tip
          </label>
          <select 
            value={loremType}
            onChange={(e) => setLoremType(e.target.value as LoremType)}
            className={cn(
              "w-full p-1 rounded-md border bg-background text-foreground",
              isSmall && "text-xs h-6",
              !isSmall && !isLarge && "text-sm h-8",
              isLarge && "h-10 text-lg"
            )}
          >
            <option value="words">Kelimeler</option>
            <option value="sentences">Cümleler</option>
            <option value="paragraphs">Paragraflar</option>
          </select>
        </div>

        <div>
          <label className={cn(
            "font-semibold block mb-1",
            isSmall && "text-xs",
            !isSmall && !isLarge && "text-sm",
            isLarge && "text-base"
          )}>
            Sayı: {count}
          </label>
          <input
            type="range"
            min="1"
            max={loremType === 'words' ? 100 : loremType === 'sentences' ? 50 : 10}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className={cn(
              "w-full",
              isSmall && "h-1",
              !isSmall && !isLarge && "h-2",
              isLarge && "h-3"
            )}
          />
        </div>

        <Button
          onClick={generateLorem}
          className={cn(
            "w-full",
            isSmall && "h-7 text-xs",
            !isSmall && !isLarge && "h-9",
            isLarge && "h-11 text-lg"
          )}
        >
          <RotateCw className={cn(
            "mr-1",
            isSmall && "h-3 w-3",
            !isSmall && !isLarge && "h-4 w-4",
            isLarge && "h-5 w-5"
          )} />
          Üret
        </Button>
      </div>

      {/* Generated Text Display */}
      <ScrollArea className="flex-1 my-2">
        <div className={cn(
          "rounded-md bg-muted p-2 min-h-[100px] text-foreground",
          isSmall && "p-1 text-xs min-h-[60px]",
          !isSmall && !isLarge && "p-2 text-sm",
          isLarge && "p-3 text-base min-h-[200px]"
        )}>
          {generatedText || (
            <p className="text-muted-foreground italic text-center py-4">
              {loremType === 'words' 
                ? 'Kelimeler burada görünecek' 
                : loremType === 'sentences'
                ? 'Cümleler burada görünecek'
                : 'Paragraflar burada görünecek'}
            </p>
          )}
          {generatedText && (
            <p className={cn(
              "text-muted-foreground mt-2 border-t pt-2",
              isSmall && "text-[10px]",
              !isSmall && !isLarge && "text-xs",
              isLarge && "text-sm"
            )}>
              {loremType === 'words' 
                ? `${generatedText.split(' ').length} kelime`
                : loremType === 'sentences'
                ? `${generatedText.split('.').length - 1} cümle`
                : `${generatedText.split('\n\n').length} paragraf`}
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Copy Button */}
      <Button
        onClick={copyText}
        disabled={!generatedText}
        className={cn(
          "w-full",
          isSmall && "h-7 text-xs",
          !isSmall && !isLarge && "h-9",
          isLarge && "h-11 text-lg"
        )}
      >
        <Copy className={cn(
          "mr-1",
          isSmall && "h-3 w-3",
          !isSmall && !isLarge && "h-4 w-4",
          isLarge && "h-5 w-5"
        )} />
        Kopyala
      </Button>
    </div>
  );
}
