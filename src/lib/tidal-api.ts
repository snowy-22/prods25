
export interface TidalTrack {
    id: number;
    title: string;
    duration: number;
    replayGain: number;
    peak: number;
    allowStreaming: boolean;
    streamReady: boolean;
    streamStartDate: string;
    premiumStreamingOnly: boolean;
    trackNumber: number;
    volumeNumber: number;
    version: any;
    popularity: number;
    copyright: string;
    url: string;
    isrc: string;
    editable: boolean;
    explicit: boolean;
    audioQuality: string;
    audioModes: string[];
    artist: {
        id: number;
        name: string;
        type: string;
    };
    album: {
        id: number;
        title: string;
        cover: string;
        videoCover: any;
    };
}

export interface TidalAlbum {
    id: number;
    title: string;
    duration: number;
    streamReady: boolean;
    streamStartDate: string;
    allowStreaming: boolean;
    premiumStreamingOnly: boolean;
    numberOfTracks: number;
    numberOfVideos: number;
    numberOfVolumes: number;
    releaseDate: string;
    copyright: string;
    type: string;
    version: any;
    url: string;
    cover: string;
    videoCover: any;
    explicit: boolean;
    upc: string;
    popularity: number;
    audioQuality: string;
    audioModes: string[];
    artist: {
        id: number;
        name: string;
        type: string;
    };
}

// Note: Tidal API requires an access token. 
// This is a basic structure for interacting with the API if a token is available.
// For public data without a user token, oEmbed is the preferred method (implemented in oembed-helpers.ts).

const TIDAL_API_BASE = 'https://api.tidal.com/v1';

export class TidalApi {
    private token: string;
    private countryCode: string;

    constructor(token: string, countryCode: string = 'US') {
        this.token = token;
        this.countryCode = countryCode;
    }

    private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
        const url = new URL(`${TIDAL_API_BASE}${endpoint}`);
        url.searchParams.append('countryCode', this.countryCode);
        Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Tidal API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getTrack(trackId: string): Promise<TidalTrack> {
        return this.fetch<TidalTrack>(`/tracks/${trackId}`);
    }

    async getAlbum(albumId: string): Promise<TidalAlbum> {
        return this.fetch<TidalAlbum>(`/albums/${albumId}`);
    }

    async search(query: string, type: 'tracks' | 'albums' | 'artists' | 'playlists' = 'tracks', limit: number = 10): Promise<any> {
        return this.fetch(`/search/${type}`, { query, limit: limit.toString() });
    }

    async getUserPlaylists(userId: string): Promise<any> {
        return this.fetch(`/users/${userId}/playlists`);
    }
}

// Helper to generate embed URL
export function getTidalEmbedUrl(type: 'track' | 'album' | 'playlist' | 'video', id: string): string {
    return `https://embed.tidal.com/${type}s/${id}`;
}

// Helper to extract ID from URL
export function extractTidalIdFromUrl(url: string): { type: 'track' | 'album' | 'playlist' | 'video', id: string } | null {
    const match = url.match(/tidal\.com\/browse\/(track|album|playlist|video)\/([a-zA-Z0-9-]+)/);
    if (match) {
        return {
            type: match[1] as any,
            id: match[2]
        };
    }
    return null;
}
