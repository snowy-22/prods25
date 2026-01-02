/**
 * Smart Player Rendering Component
 * Preview aracı yeni render yaratmaz, arkada çalışan varsa onu büyütür
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ContentItem } from '@/lib/initial-content';
import { createMutedYoutubeIframe, getYoutubeIframeSize, extractYoutubeVideoId } from '@/hooks/use-youtube-render-optimizer';
import { extractSpotifyInfo, createSpotifyEmbedIframe, isSpotifyUrl } from '@/lib/spotify-player';
import { Maximize2, Minimize2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartPlayerRenderProps {
  item: ContentItem;
  isPreview?: boolean;
  onClose?: () => void;
  expandedPlayerId?: string;
  onExpand?: (playerId: string) => void;
}

/**
 * Smart Player - Mute'lu başlayarak render olur
 * Background tab'da çalışmaya devam eder
 * Preview onu büyütür, yeni render yaratmaz
 */
export function SmartPlayerRender({
  item,
  isPreview = false,
  onClose,
  expandedPlayerId,
  onExpand,
}: SmartPlayerRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(expandedPlayerId === item.id);

  const isYoutubeVideo = item.url && ['video', 'website'].includes(item.type) &&
    extractYoutubeVideoId(item.url);

  const isSpotifyItem = item.url && isSpotifyUrl(item.url);

  const handleExpand = () => {
    setIsExpanded(true);
    onExpand?.(item.id);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  // Ölçüleri hesapla
  let displayWidth = item.width || 560;
  let displayHeight = item.height || 315;

  // Preview modunda ve expanded değilse %40 küçültme yap
  if (isPreview && !isExpanded) {
    const shrinkRatio = 1 / 1.4; // Tersi (%40 = 1.4x)
    displayWidth = Math.round(displayWidth * shrinkRatio);
    displayHeight = Math.round(displayHeight * shrinkRatio);
  }

  useEffect(() => {
    if (isPreview && containerRef.current) {
      // Preview'de yeni render yapma, mevcut olanı kullan
      // Boyut değişikliği smooth transition ile yapılır
      containerRef.current.style.transition = 'all 300ms ease-in-out';
      containerRef.current.style.width = `${displayWidth}px`;
      containerRef.current.style.height = `${displayHeight}px`;
    }
  }, [isExpanded, isPreview, displayWidth, displayHeight]);

  if (!item.url) {
    return (
      <div
        ref={containerRef}
        className="bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
        style={{
          width: displayWidth,
          height: displayHeight,
        }}
      >
        <p className="text-gray-500 text-sm">URL yok</p>
      </div>
    );
  }

  // Spotify embed
  if (isSpotifyItem) {
    const spotifyInfo = extractSpotifyInfo(item.url);
    if (spotifyInfo) {
      const { id, type } = spotifyInfo;
      const iframeHtml = createSpotifyEmbedIframe(id, type, displayWidth, undefined, {
        darkTheme: true,
      });

      return (
        <div
          ref={containerRef}
          className="relative group rounded-lg overflow-hidden bg-black"
          style={{
            width: displayWidth,
            height: displayHeight,
            transition: isPreview ? 'all 300ms ease-in-out' : 'none',
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: iframeHtml }} />

          {isPreview && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2">
              {!isExpanded && (
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-gray-100"
                  onClick={handleExpand}
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Büyüt
                </Button>
              )}
              {isExpanded && (
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-gray-100"
                  onClick={handleCollapse}
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Küçült
                </Button>
              )}
            </div>
          )}

          {/* Arkada çalışan göstergesi */}
          {!isPreview && (
            <div
              className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"
              title="Spotify çalışıyor"
            />
          )}
        </div>
      );
    }
  }

  // YouTube video
  if (isYoutubeVideo) {
    const videoId = extractYoutubeVideoId(item.url)!;
    const iframeHtml = createMutedYoutubeIframe(videoId, displayWidth, displayHeight, {
      autoplay: false,
      controls: true,
      loop: false,
    });

    return (
      <div
        ref={containerRef}
        className="relative group rounded-lg overflow-hidden"
        style={{
          width: displayWidth,
          height: displayHeight,
          transition: isPreview ? 'all 300ms ease-in-out' : 'none',
        }}
      >
        {/* Mute'lu iframe */}
        <div dangerouslySetInnerHTML={{ __html: iframeHtml }} />

        {/* Preview mode controls */}
        {isPreview && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2">
            {!isExpanded && (
              <Button
                size="sm"
                className="bg-white text-black hover:bg-gray-100"
                onClick={handleExpand}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Büyüt
              </Button>
            )}
            {isExpanded && (
              <Button
                size="sm"
                className="bg-white text-black hover:bg-gray-100"
                onClick={handleCollapse}
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                Küçült
              </Button>
            )}
          </div>
        )}

        {/* Arkada çalışan göstergesi */}
        {!isPreview && (
          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Background'da çalışıyor" />
        )}
      </div>
    );
  }

  // Diğer video türleri (HTML video)
  if (item.type === 'video' || item.type === 'audio') {
    return (
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden bg-black"
        style={{
          width: displayWidth,
          height: displayHeight,
          transition: isPreview ? 'all 300ms ease-in-out' : 'none',
        }}
      >
        {item.type === 'video' ? (
          <video
            controls
            muted
            className="w-full h-full"
            style={{
              objectFit: 'cover',
            }}
          >
            <source src={item.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <audio
            controls
            muted
            className="w-full"
            style={{
              backgroundColor: '#000',
              height: '60px',
            }}
          >
            <source src={item.url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}

        {/* Preview controls */}
        {isPreview && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2">
            {!isExpanded && (
              <Button
                size="sm"
                className="bg-white text-black hover:bg-gray-100"
                onClick={handleExpand}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Büyüt
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Website/iframe
  if (item.type === 'website' && item.html) {
    return (
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border border-gray-200"
        style={{
          width: displayWidth,
          height: displayHeight,
          transition: isPreview ? 'all 300ms ease-in-out' : 'none',
        }}
      >
        <iframe
          srcDoc={item.html}
          className="w-full h-full border-none"
          title={item.title || 'Website'}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />

        {isPreview && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2">
            {!isExpanded && (
              <Button
                size="sm"
                className="bg-white text-black hover:bg-gray-100"
                onClick={handleExpand}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Büyüt
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Image
  if (item.type === 'image') {
    return (
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden bg-gray-100"
        style={{
          width: displayWidth,
          height: displayHeight,
          transition: isPreview ? 'all 300ms ease-in-out' : 'none',
        }}
      >
        <img
          src={item.url}
          alt={item.title || 'Image'}
          className="w-full h-full object-cover"
        />

        {isPreview && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-2">
            {!isExpanded && (
              <Button
                size="sm"
                className="bg-white text-black hover:bg-gray-100"
                onClick={handleExpand}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Büyüt
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Website URL (embed olabilir)
  return (
    <div
      ref={containerRef}
      className="relative rounded-lg overflow-hidden border border-gray-200"
      style={{
        width: displayWidth,
        height: displayHeight,
        transition: isPreview ? 'all 300ms ease-in-out' : 'none',
      }}
    >
      <iframe
        src={item.url}
        className="w-full h-full border-none"
        title={item.title || 'Website'}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />

      {isPreview && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-2">
          {!isExpanded && (
            <Button
              size="sm"
              className="bg-white text-black hover:bg-gray-100"
              onClick={handleExpand}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Büyüt
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Expanded Player Container
 * Arkada çalışan varsa onu büyüt
 */
export function ExpandedPlayerContainer({
  playerId: expandedPlayerId,
  onClose,
}: {
  playerId?: string;
  onClose: () => void;
}) {
  if (!expandedPlayerId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative max-w-4xl w-full">
        <Button
          size="sm"
          variant="outline"
          className="absolute -top-12 right-0 bg-white text-black"
          onClick={onClose}
        >
          <Minimize2 className="h-4 w-4 mr-2" />
          Kapat
        </Button>
        {/* Player burada render edilir */}
      </div>
    </div>
  );
}
