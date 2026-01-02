/**
 * Quick Spotify Item Creator
 * Spotify URL'lerini hızlıca canvas'a eklemek için yardımcı fonksiyon
 */

import { ContentItem } from './initial-content';
import { extractSpotifyInfo, isSpotifyUrl } from './spotify-player';

/**
 * Spotify URL'den ContentItem oluştur
 */
export function createSpotifyItem(url: string, options?: {
  title?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}): ContentItem | null {
  if (!isSpotifyUrl(url)) {
    console.error('Invalid Spotify URL:', url);
    return null;
  }

  const spotifyInfo = extractSpotifyInfo(url);
  if (!spotifyInfo) {
    console.error('Could not extract Spotify info from URL:', url);
    return null;
  }

  const { id, type } = spotifyInfo;
  const now = new Date().toISOString();

  // Spotify embed boyutları (type'a göre)
  const heightMap = {
    track: 152,
    playlist: 380,
    album: 380,
    artist: 380,
    podcast: 152,
    episode: 152,
  };

  const defaultHeight = heightMap[type] || 152;
  const defaultWidth = 560;

  const item: ContentItem = {
    id: `spotify-${type}-${id}-${Date.now()}`,
    type: 'website', // Spotify items are embedded websites
    title: options?.title || `Spotify ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    url,
    icon: 'music',
    createdAt: now,
    updatedAt: now,
    parentId: null,
    isDeletable: true,
    x: options?.x ?? 100,
    y: options?.y ?? 100,
    width: options?.width ?? defaultWidth,
    height: options?.height ?? defaultHeight,
    metadata: {
      spotifyId: id,
      spotifyType: type,
      platform: 'spotify',
    },
    styles: {
      backgroundColor: '#191414', // Spotify dark
      borderColor: '#1DB954', // Spotify green
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
    },
  };

  return item;
}

/**
 * Badway grubu albümleri
 */
export const BADWAY_ALBUMS = {
  // Örnek Badway albümleri (gerçek Spotify ID'leri ile değiştirin)
  // Not: Bunlar placeholder'dır, gerçek Badway albüm URL'lerini kullanın
  album1: 'https://open.spotify.com/album/BADWAY_ALBUM_ID_1',
  album2: 'https://open.spotify.com/album/BADWAY_ALBUM_ID_2',
};

/**
 * Popüler müzik örnekleri
 */
export const EXAMPLE_SPOTIFY_ITEMS = [
  {
    name: 'Spotify Track',
    url: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp', // Example track
  },
  {
    name: 'Spotify Playlist',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX4UtSsGT1Sbe', // Top 50 Global
  },
  {
    name: 'Spotify Album',
    url: 'https://open.spotify.com/album/6pwuKxMUkNg673KETsXPUV', // Example album
  },
];

/**
 * Canvas'a Spotify item ekle (localStorage yöntemi)
 * Browser console'da kullanım:
 * 
 * import { addSpotifyToCanvas } from '@/lib/quick-spotify-add';
 * addSpotifyToCanvas('https://open.spotify.com/album/YOUR_ALBUM_ID');
 */
export function addSpotifyToCanvas(url: string, options?: {
  title?: string;
  x?: number;
  y?: number;
}): void {
  const item = createSpotifyItem(url, options);
  if (!item) {
    console.error('Failed to create Spotify item');
    return;
  }

  // Get current tabs from localStorage
  const storageKey = 'tv25-storage';
  const storedData = localStorage.getItem(storageKey);
  
  if (!storedData) {
    console.error('No canvas data found in localStorage');
    return;
  }

  try {
    const data = JSON.parse(storedData);
    const state = data.state;

    if (!state.tabs || !Array.isArray(state.tabs)) {
      console.error('Invalid tabs data');
      return;
    }

    // Find active tab
    const activeTabId = state.activeTabId;
    const activeTab = state.tabs.find((t: any) => t.id === activeTabId);

    if (!activeTab) {
      console.error('Active tab not found');
      return;
    }

    // Add item to active tab's children
    if (!activeTab.children) {
      activeTab.children = [];
    }

    activeTab.children.push(item);

    // Update localStorage
    localStorage.setItem(storageKey, JSON.stringify(data));

    console.log('✅ Spotify item added to canvas:', item.title);
    console.log('🔄 Please refresh the page to see changes');

  } catch (error) {
    console.error('Error adding Spotify item:', error);
  }
}

/**
 * Badway albümünü ekle
 * Browser console'da kullanım:
 * 
 * import { addBadwayAlbum } from '@/lib/quick-spotify-add';
 * addBadwayAlbum('https://open.spotify.com/album/REAL_BADWAY_ALBUM_ID');
 */
export function addBadwayAlbum(url: string): void {
  addSpotifyToCanvas(url, {
    title: 'Badway Album',
    x: 150,
    y: 150,
  });
}
