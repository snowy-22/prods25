
"use client";

import { ContentItem } from "@/lib/initial-content";
import Image from "next/image";
import { Globe, FileText, Music, Box } from "lucide-react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import MiniGridPreview from "../mini-grid-preview";
import ModelViewer from "../model-viewer";

interface WebsitePreviewProps {
  item: ContentItem;
  onLoad?: () => void;
  onClick?: (item: ContentItem, event: React.MouseEvent) => void;
  onSetView?: (item: ContentItem) => void;
  onAddItem?: (itemData: any, parentId: string | null) => void;
  allItems?: ContentItem[];
  size?: 'small' | 'medium' | 'large';
  isSuspended?: boolean;
}

function WebsitePreviewComponent({ item, onLoad, onClick, onSetView, onAddItem, allItems, size = 'medium', isSuspended = false }: WebsitePreviewProps) {
  const { url, title, type, children } = item;
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const hostParent = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
    return 'localhost';
  }, []);

  const getEmbedForUrl = useCallback((rawUrl: string) => {
    const u = rawUrl || '';
    // YouTube - autoplay açık, sesli başlasın
    if (u.includes('youtube.com') || u.includes('youtu.be')) {
      const videoId = u.includes('watch?v=')
        ? new URL(u).searchParams.get('v')
        : u.split('/').pop()?.split('?')[0];
      if (videoId) {
        return {
          src: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1&enablejsapi=1`,
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
        };
      }
    }

    // Twitch (requires parent param)
    if (u.includes('twitch.tv')) {
      const match = u.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
      const channel = match?.[1];
      if (channel) {
        return {
          src: `https://player.twitch.tv/?channel=${channel}&parent=${hostParent}&autoplay=true&muted=true`,
          allow: 'autoplay; fullscreen; picture-in-picture'
        };
      }
    }

    // Kick (best-effort embed)
    if (u.includes('kick.com')) {
      const match = u.match(/kick\.com\/([a-zA-Z0-9_]+)/);
      const channel = match?.[1];
      if (channel) {
        return {
          src: `https://player.kick.com/${channel}?autoplay=true&muted=true`,
          allow: 'autoplay; fullscreen; picture-in-picture'
        };
      }
    }

    // Facebook video
    if (u.includes('facebook.com')) {
      return {
        src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&autoplay=1`,
        allow: 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen'
      };
    }

    // Instagram post/video (autoplay may be restricted by provider)
    if (u.includes('instagram.com')) {
      const idMatch = u.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
      const shortcode = idMatch?.[1];
      if (shortcode) {
        return {
          src: `https://www.instagram.com/p/${shortcode}/embed/`,
          allow: 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen'
        };
      }
      return { src: u, allow: 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen' };
    }

    // Spotify (autoplay is typically blocked; embed provided for consistency)
    if (u.includes('open.spotify.com')) {
      // Track embed
      const trackMatch = u.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
      if (trackMatch?.[1]) {
        return {
          src: `https://open.spotify.com/embed/track/${trackMatch[1]}?utm_source=generator`,
          allow: 'autoplay; clipboard-write; encrypted-media'
        };
      }
      // Playlist embed
      const playlistMatch = u.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/);
      if (playlistMatch?.[1]) {
        return {
          src: `https://open.spotify.com/embed/playlist/${playlistMatch[1]}?utm_source=generator`,
          allow: 'autoplay; clipboard-write; encrypted-media'
        };
      }
    }

    // Default: return the original URL
    return { src: u, allow: 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen' };
  }, [hostParent]);

  useEffect(() => {
    if (!url || item.html || ['folder', 'list', 'inventory', 'space', 'devices', 'saved-items', 'awards-folder', 'spaces-folder', 'devices-folder', 'root'].includes(type)) {
      onLoad?.();
    }
  }, [url, type, item.html, onLoad]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(item, e);
    } else if (onSetView && ['folder', 'list', 'inventory', 'space'].includes(type)) {
      onSetView(item);
    }
  };

  // If tab is suspended, show placeholder
  if (isSuspended) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20 relative overflow-hidden">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover opacity-60" />
        ) : item.coverImage ? (
          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Globe className="h-12 w-12 opacity-40" />
            <span className="text-sm font-medium">{item.title}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
          <div className="bg-background/90 backdrop-blur-md px-4 py-2 rounded-lg border shadow-lg text-sm font-medium">
            ⏸️ Sekme Askıda
          </div>
        </div>
      </div>
    );
  }

  // For oEmbed HTML content (e.g. YouTube, Tidal)
  if (item.html) {
      return (
        <div className="w-full h-full bg-card relative group cursor-pointer flex items-center justify-center overflow-hidden" onClick={handleContainerClick}>
             <div 
                className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                dangerouslySetInnerHTML={{ __html: item.html }} 
             />
        </div>
      );
  }

  // For non-iframe types like folder/list, or websites without a URL
  if (!url || ['folder', 'list', 'inventory', 'space', 'devices', 'saved-items', 'awards-folder', 'spaces-folder', 'devices-folder', 'root'].includes(type)) {
    return (
      <div className="w-full h-full bg-card group cursor-pointer" onClick={handleContainerClick}>
        <MiniGridPreview item={{ ...item, children: children || [] }} onLoad={onLoad ?? (() => {})} maxItems={size === 'large' ? 16 : size === 'medium' ? 9 : 4} />
      </div>
    );
  }

  // For image type
  if (type === 'image') {
    return (
      <div className="relative w-full h-full bg-muted overflow-hidden group cursor-pointer" onClick={handleContainerClick}>
        <img 
          src={url} 
          alt={title || 'Image'} 
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          onLoad={onLoad}
          onError={() => onLoad?.()}
        />
      </div>
    );
  }

  // For video type (simple handling, assuming URL is embeddable or direct)
  if (type === 'video') {
    const embed = getEmbedForUrl(url);
    return (
      <div className="w-full h-full bg-black relative group cursor-pointer" onClick={handleContainerClick}>
        {url.match(/\.(mp4|webm|ogg)$/i) ? (
            <video 
                src={url} 
                controls 
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                onLoadedData={() => onLoad?.()}
            />
        ) : (
            <iframe
                src={embed.src}
                title={title || 'Video Content'}
                width="100%"
                height="100%"
                className="border-0 w-full h-full"
                allow={embed.allow}
                allowFullScreen
                loading="eager"
                onLoad={() => onLoad?.()}
            />
        )}
      </div>
    );
  }

  // For audio type - autoplay ile çalsın
  if (type === 'audio' || url.match(/\.(mp3|wav|ogg)$/i)) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-card p-4 gap-4 cursor-pointer" onClick={handleContainerClick}>
        <Music className="h-12 w-12 text-primary animate-pulse" />
        <div className="text-sm font-medium truncate w-full text-center">{title}</div>
        <audio src={url} controls className="w-full" onLoadedData={() => onLoad?.()} />
      </div>
    );
  }

  // For 3D type
  if (type === '3dplayer' || url.match(/\.(obj|gltf|glb)$/i)) {
    return (
      <div className="w-full h-full bg-muted relative cursor-pointer" onClick={handleContainerClick}>
        <ModelViewer 
            src={url} 
            alt={title} 
            auto-rotate 
            camera-controls 
            style={{ width: '100%', height: '100%' }}
            onLoad={() => onLoad?.()}
        />
      </div>
    );
  }

  // For PDF and Office types
  if (type === 'pdf' || url.match(/\.pdf$/i) || type === 'file' && url.match(/\.(docx|pptx|xlsx|xls|doc|ppt)$/i)) {
    let finalUrl = url;
    if (url.match(/\.(docx|pptx|xlsx|xls|doc|ppt)$/i)) {
        finalUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    return (
      <div className="w-full h-full bg-white relative cursor-pointer" onClick={handleContainerClick}>
        <iframe
          src={finalUrl}
          title={title || 'Document Content'}
          className="border-0 w-full h-full"
          onLoad={() => onLoad?.()}
        />
      </div>
    );
  }

  // For iframe-based content (default)
  const websiteEmbed = getEmbedForUrl(url);
  return (
    <div className="flex flex-col h-full w-full bg-muted group cursor-pointer" onClick={handleContainerClick}>
        <div className="relative flex-1 w-full h-full">
            {isIframeLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}
            <iframe
                src={websiteEmbed.src}
                title={title || 'Website Content'}
                width="100%"
                height="100%"
                className="border-0 w-full h-full"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                allow={websiteEmbed.allow}
                loading="lazy"
                onLoad={() => {
                    setIsIframeLoading(false);
                    onLoad?.();
                }}
            />
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 p-2 bg-card border-t">
            <Globe className="h-4 w-4 text-muted-foreground"/>
            <p className="text-xs text-muted-foreground truncate flex-1">{url}</p>
        </div>
    </div>
  );
}

export default React.memo(WebsitePreviewComponent, (prev, next) => {
  // Prevent re-render (and iframe reload) on style-only changes
  return (
    prev.item.id === next.item.id &&
    prev.item.url === next.item.url &&
    prev.item.html === next.item.html &&
    prev.item.type === next.item.type
  );
});
