import type { ContentItem } from "./initial-content";

export async function fetchOembedMetadata(url: string): Promise<Partial<ContentItem> | {error: string, isInvalid: boolean, title: string, url: string}> {
    // Check if it's a YouTube URL
    const youtubeId = extractYoutubeId(url);
    if (youtubeId) {
        return fetchYoutubeMetadata(url, youtubeId);
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

async function fetchYoutubeMetadata(url: string, videoId: string): Promise<Partial<ContentItem>> {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    
    try {
        // 1. Fetch from OEmbed for basic info
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const oembedResponse = await fetch(oembedUrl);
        const oembedData = oembedResponse.ok ? await oembedResponse.json() : {};

        // 2. Fetch from YouTube Data API v3 for detailed stats
        let dataApiData: any = {};
        if (apiKey) {
            const dataApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,statistics`;
            const dataApiResponse = await fetch(dataApiUrl);
            if (dataApiResponse.ok) {
                const json = await dataApiResponse.json();
                if (json.items && json.items.length > 0) {
                    dataApiData = json.items[0];
                }
            }
        }

        return {
            title: dataApiData.snippet?.title || oembedData.title || "YouTube Video",
            author_name: dataApiData.snippet?.channelTitle || oembedData.author_name || "Bilinmeyen Kanal",
            thumbnail_url: dataApiData.snippet?.thumbnails?.maxres?.url || dataApiData.snippet?.thumbnails?.high?.url || oembedData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            published_at: dataApiData.snippet?.publishedAt,
            viewCount: dataApiData.statistics?.viewCount ? parseInt(dataApiData.statistics.viewCount) : undefined,
            likeCount: dataApiData.statistics?.likeCount ? parseInt(dataApiData.statistics.likeCount) : undefined,
            commentCount: dataApiData.statistics?.commentCount ? parseInt(dataApiData.statistics.commentCount) : undefined,
            type: 'video',
            provider_name: 'YouTube',
            isInvalid: false,
            url: url,
            html: oembedData.html
        };
    } catch (error) {
        console.error("Error fetching YouTube metadata:", error);
        return {
            title: "YouTube Video",
            url: url,
            isInvalid: true
        };
    }
}
