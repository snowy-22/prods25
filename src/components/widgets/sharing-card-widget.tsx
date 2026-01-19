"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ExternalLink, 
  Link2, 
  Globe, 
  FolderPlus, 
  Copy, 
  Share2, 
  MoreHorizontal,
  Play,
  Bookmark,
  Trash2,
  Edit,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContentItem } from "@/lib/initial-content";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface UrlMetadata {
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  siteName?: string;
  type?: 'website' | 'article' | 'video' | 'image' | 'audio';
  author?: string;
  publishedDate?: string;
  error?: string;
}

export interface SharingCardWidgetProps {
  item: ContentItem;
  metadata?: UrlMetadata;
  isLoading?: boolean;
  showIframe?: boolean;
  size?: 'small' | 'medium' | 'large';
  onConvertToFolder?: () => void;
  onOpenExternal?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export function SharingCardWidget({
  item,
  metadata,
  isLoading = false,
  showIframe = false,
  size = 'medium',
  onConvertToFolder,
  onOpenExternal,
  onCopy,
  onShare,
  onEdit,
  onDelete,
  onRefresh,
  className
}: SharingCardWidgetProps) {
  const url = item.url || (item.content as string) || '';

  const sizeClasses = {
    small: 'max-w-[200px]',
    medium: 'max-w-[320px]',
    large: 'max-w-[480px]'
  };

  const imageHeights = {
    small: 'h-24',
    medium: 'h-36',
    large: 'h-48'
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Kopyalandı",
      description: "URL panoya kopyalandı."
    });
    onCopy?.();
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onOpenExternal?.();
  };

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", sizeClasses[size], className)}>
        <div className={cn("w-full bg-muted", imageHeights[size])}>
          <Skeleton className="w-full h-full" />
        </div>
        <CardContent className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "group overflow-hidden transition-all hover:shadow-lg",
      sizeClasses[size],
      className
    )}>
      {/* Preview Image */}
      {metadata?.image ? (
        <div className={cn("relative w-full bg-muted overflow-hidden", imageHeights[size])}>
          <img
            src={metadata.image}
            alt={metadata.title || 'Preview'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleOpenExternal}
                className="h-8"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Aç
              </Button>
              {showIframe && (
                <Button size="sm" variant="secondary" className="h-8">
                  <Play className="h-4 w-4 mr-1" />
                  Oynat
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(
          "w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center",
          imageHeights[size]
        )}>
          <Globe className="h-12 w-12 text-muted-foreground/50" />
        </div>
      )}

      <CardContent className="p-3 space-y-2">
        {/* Site Info */}
        <div className="flex items-center gap-2">
          {metadata?.favicon ? (
            <img
              src={metadata.favicon}
              alt=""
              className="w-4 h-4 rounded-sm"
              loading="lazy"
            />
          ) : (
            <Globe className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {metadata?.siteName || new URL(url).hostname}
          </span>
          {metadata?.type && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
              {metadata.type}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          "font-medium leading-tight line-clamp-2",
          size === 'small' ? 'text-sm' : 'text-base'
        )}>
          {metadata?.title || item.title || 'Untitled'}
        </h3>

        {/* Description */}
        {metadata?.description && size !== 'small' && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {metadata.description}
          </p>
        )}

        {/* URL */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link2 className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{url}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopyUrl}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleOpenExternal}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onShare}>
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onConvertToFolder}>
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onConvertToFolder}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Klasöre Dönüştür
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// URL Metadata Fetcher Hook
export function useUrlMetadata(url: string) {
  const [metadata, setMetadata] = React.useState<UrlMetadata | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!url) return;

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // API endpoint üzerinden metadata çek
        const response = await fetch(`/api/url-metadata?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
          throw new Error('Metadata alınamadı');
        }

        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        // Fallback: basit metadata
        setMetadata({
          url,
          title: new URL(url).hostname,
          siteName: new URL(url).hostname,
          type: 'website'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  return { metadata, isLoading, error, refetch: () => {} };
}

export default SharingCardWidget;
