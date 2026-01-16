// YouTube API helper functions
import axios from 'axios';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface YouTubeSearchFilters {
  type?: 'video' | 'channel' | 'playlist';
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
  maxResults?: number;
}

export async function searchYouTube(
  apiKey: string,
  query: string,
  filters: YouTubeSearchFilters = {}
): Promise<YouTubeVideo[]> {
  const params: any = {
    key: apiKey,
    q: query,
    part: 'snippet',
    type: filters.type || 'video',
    order: filters.order || 'relevance',
    maxResults: filters.maxResults || 12,
  };
  const res = await axios.get('https://www.googleapis.com/youtube/v3/search', { params });
  const items = res.data.items || [];
  return items.map((item: any) => ({
    id: item.id.videoId || item.id.channelId || item.id.playlistId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }));
}

export async function getVideoDetails(apiKey: string, videoId: string): Promise<YouTubeVideo | null> {
  const params = {
    key: apiKey,
    id: videoId,
    part: 'snippet,statistics',
  };
  const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', { params });
  const item = res.data.items?.[0];
  if (!item) return null;
  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    viewCount: Number(item.statistics?.viewCount || 0),
    likeCount: Number(item.statistics?.likeCount || 0),
    commentCount: Number(item.statistics?.commentCount || 0),
  };
}
