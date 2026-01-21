'use client';

/**
 * YouTube Analytics Dashboard
 * Kullanıcının kendi YouTube kanalı için analitik paneli
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Youtube, Play, Eye, Users, ThumbsUp, MessageSquare,
  Clock, TrendingUp, BarChart3, Calendar, RefreshCw,
  ArrowUp, ArrowDown, Minus, Video, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  useYouTubeData, 
  useYouTubeAnalytics,
  useApiVault
} from '@/lib/api-vault/hooks';
import { cn } from '@/lib/utils';

interface ChannelStats {
  viewCount: number;
  subscriberCount: number;
  videoCount: number;
}

interface VideoStats {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
}

interface AnalyticsData {
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  subscribersGained: number;
  subscribersLost: number;
  likes: number;
  comments: number;
  shares: number;
}

export function YouTubeAnalyticsPanel() {
  const { hasProvider, isUnlocked } = useApiVault();
  const { client: dataClient, isLoading: dataLoading } = useYouTubeData();
  const { client: analyticsClient, isLoading: analyticsLoading } = useYouTubeAnalytics();
  
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [recentVideos, setRecentVideos] = useState<VideoStats[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<'7' | '28' | '90' | '365'>('28');
  const [isLoading, setIsLoading] = useState(false);

  const hasYouTubeData = hasProvider('youtube_data');
  const hasYouTubeAnalytics = hasProvider('youtube_analytics');

  // Format number with Turkish locale
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString('tr-TR');
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate change indicator
  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { icon: ArrowUp, color: 'text-green-500', text: `+${change.toFixed(1)}%` };
    if (change < 0) return { icon: ArrowDown, color: 'text-red-500', text: `${change.toFixed(1)}%` };
    return { icon: Minus, color: 'text-muted-foreground', text: '0%' };
  };

  // Load channel data
  const loadChannelData = useCallback(async () => {
    if (!dataClient) return;
    
    try {
      const response = await dataClient.getChannel('snippet,statistics');
      const channel = response.items?.[0];
      
      if (channel) {
        setChannelStats({
          viewCount: parseInt(channel.statistics.viewCount),
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          videoCount: parseInt(channel.statistics.videoCount)
        });
      }
    } catch (err) {
      console.error('Failed to load channel data:', err);
    }
  }, [dataClient]);

  // Load recent videos
  const loadRecentVideos = useCallback(async () => {
    if (!dataClient) return;
    
    try {
      const searchResult = await dataClient.searchVideos('', 10);
      
      const videoIds = searchResult.items?.map((i: any) => i.id.videoId).join(',');
      if (!videoIds) return;
      
      const videosResult = await dataClient.getVideoDetails(videoIds);
      
      const videos: VideoStats[] = videosResult.items?.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.medium.url,
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics.viewCount || '0'),
        likeCount: parseInt(video.statistics.likeCount || '0'),
        commentCount: parseInt(video.statistics.commentCount || '0'),
        duration: video.contentDetails.duration
      })) || [];
      
      setRecentVideos(videos);
    } catch (err) {
      console.error('Failed to load recent videos:', err);
    }
  }, [dataClient]);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    if (!analyticsClient) return;
    
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      const result = await analyticsClient.getChannelAnalytics(startDate, endDate);
      
      if (result.rows?.[0]) {
        const row = result.rows[0];
        setAnalytics({
          views: row[0] || 0,
          estimatedMinutesWatched: row[1] || 0,
          averageViewDuration: row[2] || 0,
          subscribersGained: row[3] || 0,
          subscribersLost: row[4] || 0,
          likes: row[5] || 0,
          comments: row[6] || 0,
          shares: row[7] || 0
        });
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }, [analyticsClient, dateRange]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadChannelData(),
      loadRecentVideos(),
      loadAnalytics()
    ]);
    setIsLoading(false);
  }, [loadChannelData, loadRecentVideos, loadAnalytics]);

  // Initial load
  useEffect(() => {
    if ((hasYouTubeData || hasYouTubeAnalytics) && isUnlocked) {
      refreshAll();
    }
  }, [hasYouTubeData, hasYouTubeAnalytics, isUnlocked, refreshAll]);

  // Reload analytics when date range changes
  useEffect(() => {
    if (hasYouTubeAnalytics && isUnlocked) {
      loadAnalytics();
    }
  }, [dateRange, hasYouTubeAnalytics, isUnlocked, loadAnalytics]);

  // No YouTube APIs configured
  if (!hasYouTubeData && !hasYouTubeAnalytics) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Youtube className="mx-auto h-12 w-12 mb-4 text-red-500" />
          <h3 className="text-lg font-medium mb-2">YouTube Entegrasyonu</h3>
          <p className="text-muted-foreground mb-4">
            Kanal analizlerinizi görmek için YouTube API anahtarınızı ekleyin
          </p>
          <Button variant="outline">
            YouTube API Ekle
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
            <Youtube className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">YouTube Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Kanal performansınızı takip edin
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-32">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Son 7 gün</SelectItem>
              <SelectItem value="28">Son 28 gün</SelectItem>
              <SelectItem value="90">Son 90 gün</SelectItem>
              <SelectItem value="365">Son 1 yıl</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={refreshAll}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Channel Stats */}
      {channelStats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abone</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(channelStats.subscriberCount)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam İzlenme</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(channelStats.viewCount)}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Video Sayısı</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(channelStats.videoCount)}
                  </p>
                </div>
                <Video className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dönem Performansı</CardTitle>
            <CardDescription>
              Son {dateRange} günlük istatistikler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Eye className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-xl font-bold">{formatNumber(analytics.views)}</p>
                <p className="text-xs text-muted-foreground">İzlenme</p>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-xl font-bold">
                  {Math.round(analytics.estimatedMinutesWatched / 60)}s
                </p>
                <p className="text-xs text-muted-foreground">İzlenme Süresi</p>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <p className="text-xl font-bold text-green-500">
                  +{formatNumber(analytics.subscribersGained - analytics.subscribersLost)}
                </p>
                <p className="text-xs text-muted-foreground">Net Abone</p>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <ThumbsUp className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <p className="text-xl font-bold">{formatNumber(analytics.likes)}</p>
                <p className="text-xs text-muted-foreground">Beğeni</p>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Ortalama İzlenme Süresi</span>
                <span className="font-medium">
                  {formatDuration(Math.round(analytics.averageViewDuration))}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">Paylaşım</span>
                <span className="font-medium">{formatNumber(analytics.shares)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Son Videolar</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {recentVideos.map((video) => (
                <div 
                  key={video.id}
                  className="flex gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(video.viewCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {formatNumber(video.likeCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {formatNumber(video.commentCount)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(video.publishedAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              ))}
              
              {recentVideos.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Video bulunamadı</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
