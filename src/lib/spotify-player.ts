/**
 * Spotify Player Utilities
 * Spotify URL parsing, embed generation, ve metadata extraction
 */

/**
 * Spotify URL types
 */
export type SpotifyType = 'track' | 'playlist' | 'album' | 'artist' | 'podcast' | 'episode';

/**
 * Extract Spotify ID from URL
 * Supports:
 * - https://open.spotify.com/track/11dFghVXANMlKmJXsNCQvb
 * - spotify:track:11dFghVXANMlKmJXsNCQvb
 * - playlist, album, artist, podcast, episode
 */
export function extractSpotifyInfo(
  url: string
): { id: string; type: SpotifyType } | null {
  if (!url) return null;

  try {
    // Handle Spotify URI (spotify:track:ID)
    const uriMatch = url.match(/^spotify:(\w+):([a-zA-Z0-9]+)$/);
    if (uriMatch) {
      const type = uriMatch[1] as SpotifyType;
      const id = uriMatch[2];
      if (['track', 'playlist', 'album', 'artist', 'podcast', 'episode'].includes(type)) {
        return { id, type };
      }
    }

    // Handle open.spotify.com URLs
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract type and ID: /track/ID or /playlist/ID, etc.
    const match = pathname.match(/\/(\w+)\/([a-zA-Z0-9]+)$/);
    if (match) {
      const type = match[1] as SpotifyType;
      const id = match[2];
      if (['track', 'playlist', 'album', 'artist', 'podcast', 'episode'].includes(type)) {
        return { id, type };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if URL is a valid Spotify URL
 */
export function isSpotifyUrl(url: string): boolean {
  return !!extractSpotifyInfo(url);
}

/**
 * Generate Spotify embed iframe HTML
 * Uses Spotify's official embed widget
 */
export function createSpotifyEmbedIframe(
  spotifyId: string,
  type: SpotifyType,
  width: number = 560,
  height: number = 315,
  options?: {
    showArtist?: boolean;
    showCover?: boolean;
    darkTheme?: boolean;
  }
): string {
  const {
    showArtist = true,
    showCover = true,
    darkTheme = false,
  } = options || {};

  // Spotify embed URL pattern
  const embedUrl = `https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator`;

  const iframeBgColor = darkTheme ? '191414' : 'ffffff';
  const iframeText = darkTheme ? 'ffffff' : '000000';

  // Responsive iframe for Spotify embeds
  const calculatedHeight = calculateSpotifyHeight(type, width);

  return `
<div style="border-radius: 12px; overflow: hidden; margin: 0; padding: 0;">
  <iframe
    src="${embedUrl}"
    width="${width}"
    height="${calculatedHeight}"
    frameBorder="0"
    allowFullScreen=""
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    loading="lazy"
    style="border-radius: 12px; overflow: hidden; margin: 0; padding: 0; background-color: #${iframeBgColor}; color: #${iframeText};"
    title="Spotify Embed"
  ></iframe>
</div>
  `.trim();
}

/**
 * Calculate Spotify embed height based on type and width
 * Spotify embeds have different aspect ratios
 */
export function calculateSpotifyHeight(
  type: SpotifyType,
  width: number
): number {
  // Spotify embed height mapping
  const heightMap: Record<SpotifyType, number> = {
    track: 152,      // Track embed is compact
    playlist: 380,   // Playlist is taller
    album: 380,      // Album similar to playlist
    artist: 380,     // Artist similar to playlist
    podcast: 152,    // Podcast is compact like track
    episode: 152,    // Episode is compact like track
  };

  return heightMap[type] || 152;
}

/**
 * Get Spotify embed dimensions
 * Returns responsive dimensions with proper aspect ratio
 */
export function getSpotifyEmbedSize(
  type: SpotifyType,
  baseWidth: number = 560
): { width: number; height: number } {
  const height = calculateSpotifyHeight(type, baseWidth);
  return { width: baseWidth, height };
}

/**
 * Generate Spotify player HTML
 * Simple player with link to Spotify
 */
export function createSpotifyPlayerHTML(
  spotifyId: string,
  type: SpotifyType,
  title: string = '',
  artist: string = '',
  imageUrl: string = '',
  width: number = 560,
  height: number = 315
): string {
  const spotifyUrl = `https://open.spotify.com/${type}/${spotifyId}`;
  const bgColor = '#1DB954'; // Spotify green

  return `
<div style="
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  border-radius: 12px;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
">
  ${imageUrl ? `
  <img
    src="${imageUrl}"
    alt="${title || type}"
    style="
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    "
  />
  ` : ''}
  
  <div style="flex: 1; min-width: 0;">
    <div style="
      color: #1DB954;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    ">
      SPOTIFY ${type.toUpperCase()}
    </div>
    
    ${title ? `
    <div style="
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    ">
      ${title}
    </div>
    ` : ''}
    
    ${artist ? `
    <div style="
      font-size: 12px;
      color: #b3b3b3;
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    ">
      ${artist}
    </div>
    ` : ''}
    
    <a
      href="${spotifyUrl}"
      target="_blank"
      rel="noopener noreferrer"
      style="
        display: inline-block;
        padding: 6px 16px;
        background-color: #1DB954;
        color: white;
        text-decoration: none;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        transition: background-color 0.3s ease;
      "
      onmouseover="this.style.backgroundColor='#1ed760'"
      onmouseout="this.style.backgroundColor='#1DB954'"
    >
      Play on Spotify
    </a>
  </div>
</div>
  `.trim();
}

/**
 * Fetch Spotify track metadata from API
 * Requires Spotify API credentials
 */
export async function getSpotifyMetadata(
  spotifyId: string,
  type: SpotifyType,
  accessToken: string
): Promise<{
  title: string;
  artist: string;
  imageUrl: string;
  duration?: number;
} | null> {
  try {
    const endpoint = `https://api.spotify.com/v1/${type}s/${spotifyId}`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Map different types to common fields
    if (type === 'track') {
      return {
        title: data.name,
        artist: data.artists?.[0]?.name || '',
        imageUrl: data.album?.images?.[0]?.url || '',
        duration: data.duration_ms,
      };
    }

    if (type === 'playlist') {
      return {
        title: data.name,
        artist: data.owner?.display_name || 'Spotify',
        imageUrl: data.images?.[0]?.url || '',
      };
    }

    if (type === 'album') {
      return {
        title: data.name,
        artist: data.artists?.[0]?.name || '',
        imageUrl: data.images?.[0]?.url || '',
      };
    }

    if (type === 'artist') {
      return {
        title: data.name,
        artist: 'Artist',
        imageUrl: data.images?.[0]?.url || '',
      };
    }

    if (type === 'podcast') {
      return {
        title: data.name,
        artist: data.publisher || 'Spotify',
        imageUrl: data.images?.[0]?.url || '',
      };
    }

    if (type === 'episode') {
      return {
        title: data.name,
        artist: data.show?.name || 'Podcast',
        imageUrl: data.images?.[0]?.url || data.show?.images?.[0]?.url || '',
        duration: data.duration_ms,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Spotify metadata:', error);
    return null;
  }
}

/**
 * Generate Spotify share link
 */
export function generateSpotifyShareLink(
  spotifyId: string,
  type: SpotifyType
): string {
  return `https://open.spotify.com/${type}/${spotifyId}`;
}

/**
 * Generate Spotify URI
 */
export function generateSpotifyUri(spotifyId: string, type: SpotifyType): string {
  return `spotify:${type}:${spotifyId}`;
}

/**
 * Get Spotify icon as data URI
 */
export function getSpotifyIconDataUri(): string {
  // Spotify logo SVG as data URI (green circle with Spotify text)
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 168 168'%3E%3Ccircle cx='84' cy='84' r='84' fill='%231DB954'/%3E%3Cpath d='M60.4 103.8c-8.5-10-20.2-21.8-20.2-21.8-15.7-11.6-37.1-13-37.1-13' stroke='white' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E`;
}
