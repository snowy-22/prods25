/**
 * API Clients
 * Kullanıcının kendi API key'leri ile entegrasyon istemcileri
 */

import { apiVaultManager } from './vault-manager';
import { ApiProvider, DecryptedApiKey } from './types';

// Base API Client
export class BaseApiClient {
  protected userId: string;
  protected provider: ApiProvider;
  protected key: DecryptedApiKey | null = null;
  
  constructor(userId: string, provider: ApiProvider) {
    this.userId = userId;
    this.provider = provider;
  }
  
  async initialize(): Promise<boolean> {
    this.key = await apiVaultManager.getApiKeyByProvider(this.userId, this.provider);
    return this.key !== null;
  }
  
  protected async logUsage(endpoint: string, method: string, statusCode: number, responseTime: number) {
    if (this.key) {
      await apiVaultManager.logUsage(
        this.userId,
        this.key.id,
        this.provider,
        endpoint,
        method,
        statusCode,
        responseTime
      );
    }
  }
  
  protected get credentials(): Record<string, string> {
    if (!this.key) throw new Error('Client not initialized');
    return this.key.credentials;
  }
}

// ==========================================
// SMART HOME CLIENTS
// ==========================================

export class PhilipsHueClient extends BaseApiClient {
  constructor(userId: string) {
    super(userId, 'philips_hue');
  }
  
  private get baseUrl(): string {
    const { bridgeIp } = this.credentials;
    return `https://${bridgeIp}/api/${this.credentials.username}`;
  }
  
  async getLights(): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/lights`);
      const data = await response.json();
      await this.logUsage('/lights', 'GET', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/lights', 'GET', 500, performance.now() - start);
      throw error;
    }
  }
  
  async setLightState(lightId: string, state: { on?: boolean; bri?: number; hue?: number; sat?: number }): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/lights/${lightId}/state`, {
        method: 'PUT',
        body: JSON.stringify(state),
      });
      const data = await response.json();
      await this.logUsage(`/lights/${lightId}/state`, 'PUT', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(`/lights/${lightId}/state`, 'PUT', 500, performance.now() - start);
      throw error;
    }
  }
  
  async getScenes(): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/scenes`);
      const data = await response.json();
      await this.logUsage('/scenes', 'GET', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/scenes', 'GET', 500, performance.now() - start);
      throw error;
    }
  }
  
  async activateScene(sceneId: string, groupId: string = '0'): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/action`, {
        method: 'PUT',
        body: JSON.stringify({ scene: sceneId }),
      });
      const data = await response.json();
      await this.logUsage(`/groups/${groupId}/action`, 'PUT', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(`/groups/${groupId}/action`, 'PUT', 500, performance.now() - start);
      throw error;
    }
  }
}

export class SmartThingsClient extends BaseApiClient {
  private baseUrl = 'https://api.smartthings.com/v1';
  
  constructor(userId: string) {
    super(userId, 'smartthings');
  }
  
  private get headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.credentials.accessToken}`,
      'Content-Type': 'application/json',
    };
  }
  
  async getDevices(): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/devices`, { headers: this.headers });
      const data = await response.json();
      await this.logUsage('/devices', 'GET', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/devices', 'GET', 500, performance.now() - start);
      throw error;
    }
  }
  
  async getDeviceStatus(deviceId: string): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/devices/${deviceId}/status`, { headers: this.headers });
      const data = await response.json();
      await this.logUsage(`/devices/${deviceId}/status`, 'GET', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(`/devices/${deviceId}/status`, 'GET', 500, performance.now() - start);
      throw error;
    }
  }
  
  async executeCommand(deviceId: string, capability: string, command: string, args?: any[]): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/devices/${deviceId}/commands`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          commands: [{ capability, command, arguments: args || [] }],
        }),
      });
      const data = await response.json();
      await this.logUsage(`/devices/${deviceId}/commands`, 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(`/devices/${deviceId}/commands`, 'POST', 500, performance.now() - start);
      throw error;
    }
  }
  
  async getScenes(): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/scenes`, { headers: this.headers });
      const data = await response.json();
      await this.logUsage('/scenes', 'GET', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/scenes', 'GET', 500, performance.now() - start);
      throw error;
    }
  }
  
  async executeScene(sceneId: string): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/scenes/${sceneId}/execute`, {
        method: 'POST',
        headers: this.headers,
      });
      const data = await response.json();
      await this.logUsage(`/scenes/${sceneId}/execute`, 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(`/scenes/${sceneId}/execute`, 'POST', 500, performance.now() - start);
      throw error;
    }
  }
}

export class HomeAssistantClient extends BaseApiClient {
  constructor(userId: string) {
    super(userId, 'home_assistant');
  }
  
  private get baseUrl(): string {
    return this.credentials.url;
  }
  
  private get headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.credentials.accessToken}`,
      'Content-Type': 'application/json',
    };
  }
  
  async getStates(): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/states`, { headers: this.headers });
      const data = await response.json();
      await this.logUsage('/api/states', 'GET', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/api/states', 'GET', 500, performance.now() - start);
      throw error;
    }
  }
  
  async getEntityState(entityId: string): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/states/${entityId}`, { headers: this.headers });
      const data = await response.json();
      await this.logUsage(`/api/states/${entityId}`, 'GET', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(`/api/states/${entityId}`, 'GET', 500, performance.now() - start);
      throw error;
    }
  }
  
  async callService(domain: string, service: string, serviceData?: any): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(serviceData || {}),
      });
      const data = await response.json();
      await this.logUsage(`/api/services/${domain}/${service}`, 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(`/api/services/${domain}/${service}`, 'POST', 500, performance.now() - start);
      throw error;
    }
  }
}

// ==========================================
// MEDIA CLIENTS
// ==========================================

export class YouTubeDataClient extends BaseApiClient {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  
  constructor(userId: string) {
    super(userId, 'youtube_data');
  }
  
  private async request(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const start = performance.now();
    const queryParams = new URLSearchParams({
      ...params,
      key: this.credentials.apiKey,
    });
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`);
      const data = await response.json();
      await this.logUsage(endpoint, 'GET', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(endpoint, 'GET', 500, performance.now() - start);
      throw error;
    }
  }
  
  async searchVideos(query: string, maxResults: number = 10): Promise<any> {
    return this.request('/search', {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(maxResults),
    });
  }
  
  // Get authenticated user's channel info
  async getChannel(parts: string = 'snippet,statistics'): Promise<any> {
    return this.request('/channels', {
      part: parts,
      mine: 'true',
    });
  }
  
  async getVideoDetails(videoId: string): Promise<any> {
    return this.request('/videos', {
      part: 'snippet,contentDetails,statistics',
      id: videoId,
    });
  }
  
  async getChannelDetails(channelId: string): Promise<any> {
    return this.request('/channels', {
      part: 'snippet,statistics,contentDetails',
      id: channelId,
    });
  }
  
  async getPlaylistItems(playlistId: string, maxResults: number = 50): Promise<any> {
    return this.request('/playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: String(maxResults),
    });
  }
  
  async getVideoComments(videoId: string, maxResults: number = 20): Promise<any> {
    return this.request('/commentThreads', {
      part: 'snippet,replies',
      videoId,
      maxResults: String(maxResults),
    });
  }
  
  async getTrendingVideos(regionCode: string = 'TR', maxResults: number = 10): Promise<any> {
    return this.request('/videos', {
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular',
      regionCode,
      maxResults: String(maxResults),
    });
  }
}

export class YouTubeAnalyticsClient extends BaseApiClient {
  private baseUrl = 'https://youtubeanalytics.googleapis.com/v2';
  private tokenUrl = 'https://oauth2.googleapis.com/token';
  private accessToken: string | null = null;
  
  constructor(userId: string) {
    super(userId, 'youtube_analytics');
  }
  
  private async refreshAccessToken(): Promise<string> {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        refresh_token: this.credentials.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken || '';
  }
  
  private async request(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }
    
    const start = performance.now();
    const queryParams = new URLSearchParams(params);
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });
      
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.request(endpoint, params);
      }
      
      const data = await response.json();
      await this.logUsage(endpoint, 'GET', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(endpoint, 'GET', 500, performance.now() - start);
      throw error;
    }
  }
  
  async getChannelAnalytics(startDate: string, endDate: string, metrics: string[] = ['views', 'estimatedMinutesWatched', 'averageViewDuration', 'subscribersGained']): Promise<any> {
    return this.request('/reports', {
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: metrics.join(','),
    });
  }
  
  async getVideoAnalytics(videoId: string, startDate: string, endDate: string): Promise<any> {
    return this.request('/reports', {
      ids: 'channel==MINE',
      filters: `video==${videoId}`,
      startDate,
      endDate,
      metrics: 'views,estimatedMinutesWatched,averageViewDuration,likes,dislikes,comments',
    });
  }
  
  async getDemographics(startDate: string, endDate: string): Promise<any> {
    return this.request('/reports', {
      ids: 'channel==MINE',
      startDate,
      endDate,
      dimensions: 'ageGroup,gender',
      metrics: 'viewerPercentage',
    });
  }
  
  async getGeographicData(startDate: string, endDate: string): Promise<any> {
    return this.request('/reports', {
      ids: 'channel==MINE',
      startDate,
      endDate,
      dimensions: 'country',
      metrics: 'views,estimatedMinutesWatched',
      sort: '-views',
    });
  }
}

// ==========================================
// AI CLIENTS
// ==========================================

export class OpenAIClient extends BaseApiClient {
  private baseUrl = 'https://api.openai.com/v1';
  
  constructor(userId: string) {
    super(userId, 'openai');
  }
  
  private get headers(): HeadersInit {
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (this.credentials.organizationId) {
      headers['OpenAI-Organization'] = this.credentials.organizationId;
    }
    return headers;
  }
  
  async chat(messages: Array<{ role: string; content: string }>, model: string = 'gpt-4o', options?: any): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model,
          messages,
          ...options,
        }),
      });
      const data = await response.json();
      await this.logUsage('/chat/completions', 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/chat/completions', 'POST', 500, performance.now() - start);
      throw error;
    }
  }
  
  async createImage(prompt: string, options?: { model?: string; size?: string; quality?: string; n?: number }): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: options?.model || 'dall-e-3',
          prompt,
          size: options?.size || '1024x1024',
          quality: options?.quality || 'standard',
          n: options?.n || 1,
        }),
      });
      const data = await response.json();
      await this.logUsage('/images/generations', 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/images/generations', 'POST', 500, performance.now() - start);
      throw error;
    }
  }
  
  async transcribe(audioBlob: Blob, options?: { model?: string; language?: string }): Promise<any> {
    const start = performance.now();
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', options?.model || 'whisper-1');
      if (options?.language) formData.append('language', options.language);
      
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.credentials.apiKey}` },
        body: formData,
      });
      const data = await response.json();
      await this.logUsage('/audio/transcriptions', 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/audio/transcriptions', 'POST', 500, performance.now() - start);
      throw error;
    }
  }
  
  async createEmbedding(input: string | string[], model: string = 'text-embedding-3-small'): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ input, model }),
      });
      const data = await response.json();
      await this.logUsage('/embeddings', 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/embeddings', 'POST', 500, performance.now() - start);
      throw error;
    }
  }
}

export class AnthropicClient extends BaseApiClient {
  private baseUrl = 'https://api.anthropic.com/v1';
  
  constructor(userId: string) {
    super(userId, 'anthropic');
  }
  
  private get headers(): HeadersInit {
    return {
      'x-api-key': this.credentials.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };
  }
  
  async chat(messages: Array<{ role: string; content: string }>, model: string = 'claude-3-5-sonnet-20241022', options?: any): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model,
          max_tokens: options?.max_tokens || 4096,
          messages,
          ...options,
        }),
      });
      const data = await response.json();
      await this.logUsage('/messages', 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage('/messages', 'POST', 500, performance.now() - start);
      throw error;
    }
  }
}

export class GoogleAIClient extends BaseApiClient {
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  
  constructor(userId: string) {
    super(userId, 'google_ai');
  }
  
  async generateContent(prompt: string, model: string = 'gemini-1.5-flash'): Promise<any> {
    const start = performance.now();
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.credentials.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      const data = await response.json();
      await this.logUsage(`/models/${model}:generateContent`, 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(`/models/${model}:generateContent`, 'POST', 500, performance.now() - start);
      throw error;
    }
  }
  
  async chat(messages: Array<{ role: string; content: string }>, model: string = 'gemini-1.5-flash'): Promise<any> {
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }],
    }));
    
    const start = performance.now();
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.credentials.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );
      const data = await response.json();
      await this.logUsage(`/models/${model}:generateContent`, 'POST', response.status, performance.now() - start);
      return data;
    } catch (error) {
      await this.logUsage(`/models/${model}:generateContent`, 'POST', 500, performance.now() - start);
      throw error;
    }
  }
}

// ==========================================
// UNIFIED API CLIENT FACTORY
// ==========================================

export type ApiClientType =
  | PhilipsHueClient
  | SmartThingsClient
  | HomeAssistantClient
  | YouTubeDataClient
  | YouTubeAnalyticsClient
  | OpenAIClient
  | AnthropicClient
  | GoogleAIClient;

export async function createApiClient<T extends ApiClientType>(
  userId: string,
  provider: ApiProvider
): Promise<T | null> {
  let client: BaseApiClient;
  
  switch (provider) {
    case 'philips_hue':
      client = new PhilipsHueClient(userId);
      break;
    case 'smartthings':
      client = new SmartThingsClient(userId);
      break;
    case 'home_assistant':
      client = new HomeAssistantClient(userId);
      break;
    case 'youtube_data':
      client = new YouTubeDataClient(userId);
      break;
    case 'youtube_analytics':
      client = new YouTubeAnalyticsClient(userId);
      break;
    case 'openai':
      client = new OpenAIClient(userId);
      break;
    case 'anthropic':
      client = new AnthropicClient(userId);
      break;
    case 'google_ai':
      client = new GoogleAIClient(userId);
      break;
    default:
      return null;
  }
  
  const initialized = await client.initialize();
  return initialized ? (client as T) : null;
}
