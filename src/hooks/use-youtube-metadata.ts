import { useState, useCallback } from 'react';
import { fetchOembedMetadata } from '@/lib/oembed-helpers';
import { ContentItem } from '@/lib/initial-content';
import { useAppStore } from '@/lib/store';
import { useToast } from './use-toast';

export function useYoutubeMetadata() {
  const { toast } = useToast();
  const { youtubeApiKey, youtubeMetadataEnabled } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(
    async (url: string): Promise<Partial<ContentItem> | null> => {
      if (!youtubeMetadataEnabled) {
        console.log('YouTube metadata disabled');
        return null;
      }

      if (!youtubeApiKey) {
        toast({
          title: 'API Anahtarı Gerekli',
          description: 'YouTube metadata çekmek için lütfen Ayarlar > API Anahtarları bölümünde YouTube API anahtarınızı girin.',
          variant: 'destructive'
        });
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const metadata = await fetchOembedMetadata(url, youtubeApiKey);
        
        if ('error' in metadata) {
          setError((metadata as any).error);
          return null;
        }

        return metadata;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        setError(errorMessage);
        console.error('Failed to fetch YouTube metadata:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [youtubeApiKey, youtubeMetadataEnabled, toast]
  );

  return { fetchMetadata, isLoading, error };
}
