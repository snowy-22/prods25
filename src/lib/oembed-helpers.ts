import type { ContentItem } from "./initial-content";

export async function fetchOembedMetadata(url: string, userApiKey?: string): Promise<Partial<ContentItem> | {error: string, isInvalid: boolean, title: string, url: string}> {
    // Check if it's a YouTube URL
    const youtubeId = extractYoutubeId(url);
    if (youtubeId) {
        return fetchYoutubeMetadata(url, youtubeId, userApiKey);
    }

    // Check if it's a Google Drive URL
    if (url.includes('drive.google.com')) {
        const driveId = extractDriveId(url);
        if (driveId) {
            return {
                title: "Google Drive Dosyası",
                url: `https://drive.google.com/file/d/${driveId}/preview`,
                type: 'website',
                isInvalid: false
            };
        }
    }

    // Check if it's a GitHub URL
    if (url.includes('github.com')) {
        const githubInfo = extractGithubInfo(url);
        if (githubInfo) {
            return {
                title: `${githubInfo.owner}/${githubInfo.repo}`,
                url: url,
                type: 'website',
                icon: 'github' as any,
                isInvalid: false
            };
        }
    }

    // Check if it's a Tidal URL
    if (url.includes('tidal.com')) {
        return fetchTidalMetadata(url);
    }

    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;

    try {
        const response = await fetch(oembedUrl);
        // noembed.com usually returns a JSON with an "error" field for failures,
        // but we check the status code as a fallback.
        if (!response.ok) {
            const fallbackTitle = url.split('/').filter(Boolean).pop() || url;
            return { title: fallbackTitle, url, isInvalid: true, error: `HTTP error! status: ${response.status}` };
        }
        
        const data = await response.json();

        if (data.error) {
            const fallbackTitle = url.split('/').filter(Boolean).pop() || url;
            return { title: fallbackTitle, url, isInvalid: true, error: data.error };
        }
        
        // Mark as valid if no error
        return { ...data, isInvalid: false };

    } catch (e: any) {
        console.error("Failed to fetch oEmbed data", e);
        const fallbackTitle = url.split('/').filter(Boolean).pop() || url;
        return { title: fallbackTitle, url, isInvalid: true, error: e.message || "Bilinmeyen ağ hatası" };
    }
}

function extractYoutubeId(url: string): string | null {
    // YouTube Shorts URL pattern: /shorts/VIDEO_ID
    const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
        return shortsMatch[1];
    }
    
    // Standard YouTube URL patterns
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

function extractDriveId(url: string): string | null {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

function extractGithubInfo(url: string): { owner: string, repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
    }
    return null;
}

async function fetchTidalMetadata(url: string): Promise<Partial<ContentItem>> {
    const oembedUrl = `https://oembed.tidal.com/v1/oembed?url=${encodeURIComponent(url)}`;
    try {
        const response = await fetch(oembedUrl);
        if (!response.ok) {
             const fallbackTitle = url.split('/').filter(Boolean).pop() || url;
             return { title: fallbackTitle, url, isInvalid: true, error: `Tidal oEmbed error: ${response.status}` };
        }
        const data = await response.json();
        return {
            title: data.title,
            url: url,
            type: 'audio',
            thumbnail_url: data.thumbnail_url,
            provider_name: 'Tidal',
            isInvalid: false,
            html: data.html,
            icon: 'music' as any
        };
    } catch (e: any) {
        console.error("Failed to fetch Tidal oEmbed data", e);
        const fallbackTitle = url.split('/').filter(Boolean).pop() || url;
        return { title: fallbackTitle, url, isInvalid: true, error: e.message };
    }
}

async function fetchYoutubeMetadata(url: string, videoId: string, userApiKey?: string): Promise<Partial<ContentItem>> {
    // Use user's API key if provided, otherwise fall back to environment variable
    const apiKey = userApiKey || (typeof window !== 'undefined' ? undefined : process.env.NEXT_PUBLIC_YOUTUBE_API_KEY);
    
    try {
        // 1. Fetch from OEmbed for basic info
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const oembedResponse = await fetch(oembedUrl);
        const oembedData = oembedResponse.ok ? await oembedResponse.json() : {};

        // 2. Fetch from YouTube Data API v3 for detailed stats and metadata
        let dataApiData: any = {};
        let contentDetails: any = {};
        let statistics: any = {};
        
        if (apiKey) {
            // Request multiple parts for comprehensive metadata
            const dataApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,statistics,contentDetails`;
            const dataApiResponse = await fetch(dataApiUrl);
            
            if (dataApiResponse.ok) {
                const json = await dataApiResponse.json();
                if (json.items && json.items.length > 0) {
                    dataApiData = json.items[0];
                    statistics = dataApiData.statistics || {};
                    contentDetails = dataApiData.contentDetails || {};
                }
            } else {
                console.warn('YouTube Data API request failed:', await dataApiResponse.text());
            }
        }

        const snippet = dataApiData.snippet || {};
        
        return {
            videoId,
            title: snippet.title || oembedData.title || "YouTube Video",
            author_name: snippet.channelTitle || oembedData.author_name || "Bilinmeyen Kanal",
            channelId: snippet.channelId,
            channelTitle: snippet.channelTitle,
            thumbnail_url: snippet.thumbnails?.maxres?.url || 
                          snippet.thumbnails?.high?.url || 
                          oembedData.thumbnail_url || 
                          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            published_at: snippet.publishedAt,
            content: snippet.description, // Video description
            
            // Statistics
            viewCount: statistics.viewCount ? parseInt(statistics.viewCount) : undefined,
            likeCount: statistics.likeCount ? parseInt(statistics.likeCount) : undefined,
            dislikeCount: statistics.dislikeCount ? parseInt(statistics.dislikeCount) : undefined,
            favoriteCount: statistics.favoriteCount ? parseInt(statistics.favoriteCount) : undefined,
            commentCount: statistics.commentCount ? parseInt(statistics.commentCount) : undefined,
            
            // Content Details
            duration: contentDetails.duration, // ISO 8601 format (e.g., "PT4M13S")
            dimension: contentDetails.dimension as '2d' | '3d' | undefined,
            definition: contentDetails.definition as 'hd' | 'sd' | undefined,
            caption: contentDetails.caption === 'true',
            licensedContent: contentDetails.licensedContent,
            projection: contentDetails.projection as 'rectangular' | '360' | undefined,
            
            // Snippet Details
            categoryId: snippet.categoryId,
            tags: snippet.tags || [],
            
            type: 'video',
            provider_name: 'YouTube',
            isInvalid: false,
            url: url,
            html: oembedData.html
        };
    } catch (error) {
        console.error("Error fetching YouTube metadata:", error);
        return {
            videoId,
            title: "YouTube Video",
            url: url,
            type: 'video',
            provider_name: 'YouTube',
            isInvalid: true
        };
    }
}
