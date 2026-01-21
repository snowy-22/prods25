/**
 * API Vault Types
 * Kullanıcı API anahtarları için tip tanımları
 */

export type ApiProvider = 
  // Smart Home
  | 'philips_hue'
  | 'smartthings'
  | 'home_assistant'
  | 'tuya'
  | 'lifx'
  
  // Video & Media
  | 'youtube_data'
  | 'youtube_analytics'
  | 'twitch'
  | 'vimeo'
  | 'spotify'
  | 'soundcloud'
  
  // AI Providers
  | 'openai'
  | 'anthropic'
  | 'google_ai'
  | 'mistral'
  | 'groq'
  | 'together'
  | 'replicate'
  | 'huggingface'
  | 'cohere'
  | 'perplexity'
  
  // Cloud Storage
  | 'google_drive'
  | 'dropbox'
  | 'onedrive'
  | 'box'
  
  // Social & Communication
  | 'discord'
  | 'slack'
  | 'telegram'
  | 'twitter'
  
  // Development & Analytics
  | 'github'
  | 'vercel'
  | 'supabase'
  | 'firebase'
  | 'mixpanel'
  | 'amplitude'
  | 'sentry'
  
  // Other
  | 'custom';

export interface ApiKeyConfig {
  provider: ApiProvider;
  name: string;
  description: string;
  category: 'smart_home' | 'media' | 'ai' | 'cloud' | 'social' | 'dev' | 'other';
  icon: string;
  docsUrl?: string;
  fields: ApiKeyField[];
  testEndpoint?: string;
  rateLimit?: {
    requests: number;
    window: 'second' | 'minute' | 'hour' | 'day';
  };
}

export interface ApiKeyField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'number' | 'select';
  placeholder?: string;
  required: boolean;
  validation?: RegExp;
  helpText?: string;
  options?: { value: string; label: string }[];
}

export interface StoredApiKey {
  id: string;
  userId: string;
  provider: ApiProvider;
  name: string;
  encryptedData: string; // JSON string şifrelenmiş
  iv: string; // Initialization vector
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
  isEnabled: boolean;
  metadata?: Record<string, any>;
}

export interface DecryptedApiKey {
  id: string;
  provider: ApiProvider;
  name: string;
  credentials: Record<string, string>;
  isEnabled: boolean;
}

export interface ApiKeyUsageLog {
  id: string;
  keyId: string;
  userId: string;
  provider: ApiProvider;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface VaultStats {
  totalKeys: number;
  activeKeys: number;
  enabledKeys: number;
  totalUsage: number;
  usageByProvider: Record<ApiProvider, number>;
  providerBreakdown: Array<{ provider: ApiProvider; count: number }>;
  lastActivity?: string;
}

// Provider Configurations
export const API_PROVIDER_CONFIGS: Record<ApiProvider, ApiKeyConfig> = {
  // Smart Home
  philips_hue: {
    provider: 'philips_hue',
    name: 'Philips Hue',
    description: 'Philips Hue akıllı aydınlatma sistemi',
    category: 'smart_home',
    icon: '💡',
    docsUrl: 'https://developers.meethue.com/',
    fields: [
      { key: 'bridgeIp', label: 'Bridge IP', type: 'text', placeholder: '192.168.1.x', required: true },
      { key: 'username', label: 'API Username', type: 'password', required: true, helpText: 'Bridge\'den alınan kullanıcı adı' },
      { key: 'clientKey', label: 'Client Key', type: 'password', required: false, helpText: 'Entertainment API için' },
    ],
  },
  smartthings: {
    provider: 'smartthings',
    name: 'Samsung SmartThings',
    description: 'Samsung SmartThings akıllı ev platformu',
    category: 'smart_home',
    icon: '🏠',
    docsUrl: 'https://developer-preview.smartthings.com/',
    fields: [
      { key: 'accessToken', label: 'Personal Access Token', type: 'password', required: true },
      { key: 'locationId', label: 'Location ID', type: 'text', required: false },
    ],
  },
  home_assistant: {
    provider: 'home_assistant',
    name: 'Home Assistant',
    description: 'Açık kaynak akıllı ev platformu',
    category: 'smart_home',
    icon: '🏡',
    docsUrl: 'https://developers.home-assistant.io/',
    fields: [
      { key: 'url', label: 'Home Assistant URL', type: 'url', placeholder: 'http://homeassistant.local:8123', required: true },
      { key: 'accessToken', label: 'Long-Lived Access Token', type: 'password', required: true },
    ],
  },
  tuya: {
    provider: 'tuya',
    name: 'Tuya Smart',
    description: 'Tuya IoT platformu',
    category: 'smart_home',
    icon: '🔌',
    docsUrl: 'https://developer.tuya.com/',
    fields: [
      { key: 'accessId', label: 'Access ID', type: 'text', required: true },
      { key: 'accessKey', label: 'Access Key', type: 'password', required: true },
      { key: 'region', label: 'Region', type: 'select', required: true, options: [
        { value: 'eu', label: 'Europe' },
        { value: 'us', label: 'United States' },
        { value: 'cn', label: 'China' },
        { value: 'in', label: 'India' },
      ]},
    ],
  },
  lifx: {
    provider: 'lifx',
    name: 'LIFX',
    description: 'LIFX akıllı LED ampuller',
    category: 'smart_home',
    icon: '💡',
    docsUrl: 'https://api.developer.lifx.com/',
    fields: [
      { key: 'accessToken', label: 'Personal Access Token', type: 'password', required: true },
    ],
  },
  
  // Video & Media
  youtube_data: {
    provider: 'youtube_data',
    name: 'YouTube Data API',
    description: 'YouTube video ve kanal verileri',
    category: 'media',
    icon: '📺',
    docsUrl: 'https://developers.google.com/youtube/v3',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    rateLimit: { requests: 10000, window: 'day' },
  },
  youtube_analytics: {
    provider: 'youtube_analytics',
    name: 'YouTube Analytics API',
    description: 'YouTube kanal analitiği',
    category: 'media',
    icon: '📊',
    docsUrl: 'https://developers.google.com/youtube/analytics',
    fields: [
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ],
  },
  twitch: {
    provider: 'twitch',
    name: 'Twitch API',
    description: 'Twitch yayın ve kullanıcı verileri',
    category: 'media',
    icon: '🎮',
    docsUrl: 'https://dev.twitch.tv/docs/api/',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
  vimeo: {
    provider: 'vimeo',
    name: 'Vimeo API',
    description: 'Vimeo video platformu',
    category: 'media',
    icon: '🎬',
    docsUrl: 'https://developer.vimeo.com/',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  spotify: {
    provider: 'spotify',
    name: 'Spotify API',
    description: 'Spotify müzik verileri',
    category: 'media',
    icon: '🎵',
    docsUrl: 'https://developer.spotify.com/documentation/web-api/',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
  soundcloud: {
    provider: 'soundcloud',
    name: 'SoundCloud API',
    description: 'SoundCloud ses platformu',
    category: 'media',
    icon: '🔊',
    docsUrl: 'https://developers.soundcloud.com/',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
  
  // AI Providers
  openai: {
    provider: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, DALL-E, Whisper API',
    category: 'ai',
    icon: '🤖',
    docsUrl: 'https://platform.openai.com/docs/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' },
      { key: 'organizationId', label: 'Organization ID', type: 'text', required: false },
    ],
    rateLimit: { requests: 60, window: 'minute' },
  },
  anthropic: {
    provider: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude AI modelleri',
    category: 'ai',
    icon: '🧠',
    docsUrl: 'https://docs.anthropic.com/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-ant-...' },
    ],
    rateLimit: { requests: 60, window: 'minute' },
  },
  google_ai: {
    provider: 'google_ai',
    name: 'Google AI (Gemini)',
    description: 'Gemini Pro, Gemini Vision',
    category: 'ai',
    icon: '✨',
    docsUrl: 'https://ai.google.dev/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'AIza...' },
    ],
    rateLimit: { requests: 60, window: 'minute' },
  },
  mistral: {
    provider: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral, Mixtral modelleri',
    category: 'ai',
    icon: '🌪️',
    docsUrl: 'https://docs.mistral.ai/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  groq: {
    provider: 'groq',
    name: 'Groq',
    description: 'Hızlı LLM inference',
    category: 'ai',
    icon: '⚡',
    docsUrl: 'https://console.groq.com/docs/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'gsk_...' },
    ],
  },
  together: {
    provider: 'together',
    name: 'Together AI',
    description: 'Açık kaynak modeller',
    category: 'ai',
    icon: '🤝',
    docsUrl: 'https://docs.together.ai/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  replicate: {
    provider: 'replicate',
    name: 'Replicate',
    description: 'ML model hosting',
    category: 'ai',
    icon: '🔄',
    docsUrl: 'https://replicate.com/docs/',
    fields: [
      { key: 'apiToken', label: 'API Token', type: 'password', required: true, placeholder: 'r8_...' },
    ],
  },
  huggingface: {
    provider: 'huggingface',
    name: 'Hugging Face',
    description: 'Hugging Face Inference API',
    category: 'ai',
    icon: '🤗',
    docsUrl: 'https://huggingface.co/docs/',
    fields: [
      { key: 'apiToken', label: 'API Token', type: 'password', required: true, placeholder: 'hf_...' },
    ],
  },
  cohere: {
    provider: 'cohere',
    name: 'Cohere',
    description: 'Command, Embed modelleri',
    category: 'ai',
    icon: '🔮',
    docsUrl: 'https://docs.cohere.com/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  perplexity: {
    provider: 'perplexity',
    name: 'Perplexity AI',
    description: 'Perplexity arama ve chat',
    category: 'ai',
    icon: '🔍',
    docsUrl: 'https://docs.perplexity.ai/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'pplx-...' },
    ],
  },
  
  // Cloud Storage
  google_drive: {
    provider: 'google_drive',
    name: 'Google Drive',
    description: 'Google Drive dosya yönetimi',
    category: 'cloud',
    icon: '📁',
    docsUrl: 'https://developers.google.com/drive/',
    fields: [
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ],
  },
  dropbox: {
    provider: 'dropbox',
    name: 'Dropbox',
    description: 'Dropbox dosya senkronizasyonu',
    category: 'cloud',
    icon: '📦',
    docsUrl: 'https://www.dropbox.com/developers/',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  onedrive: {
    provider: 'onedrive',
    name: 'OneDrive',
    description: 'Microsoft OneDrive',
    category: 'cloud',
    icon: '☁️',
    docsUrl: 'https://docs.microsoft.com/en-us/onedrive/developer/',
    fields: [
      { key: 'clientId', label: 'Application ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
    ],
  },
  box: {
    provider: 'box',
    name: 'Box',
    description: 'Box bulut depolama',
    category: 'cloud',
    icon: '📥',
    docsUrl: 'https://developer.box.com/',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  
  // Social & Communication
  discord: {
    provider: 'discord',
    name: 'Discord',
    description: 'Discord bot ve webhook',
    category: 'social',
    icon: '💬',
    docsUrl: 'https://discord.com/developers/docs/',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: false },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: false },
    ],
  },
  slack: {
    provider: 'slack',
    name: 'Slack',
    description: 'Slack entegrasyonu',
    category: 'social',
    icon: '💼',
    docsUrl: 'https://api.slack.com/',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: 'xoxb-...' },
      { key: 'signingSecret', label: 'Signing Secret', type: 'password', required: false },
    ],
  },
  telegram: {
    provider: 'telegram',
    name: 'Telegram',
    description: 'Telegram bot API',
    category: 'social',
    icon: '✈️',
    docsUrl: 'https://core.telegram.org/bots/api',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true },
    ],
  },
  twitter: {
    provider: 'twitter',
    name: 'Twitter/X',
    description: 'Twitter API v2',
    category: 'social',
    icon: '🐦',
    docsUrl: 'https://developer.twitter.com/en/docs',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'bearerToken', label: 'Bearer Token', type: 'password', required: true },
    ],
  },
  
  // Development & Analytics
  github: {
    provider: 'github',
    name: 'GitHub',
    description: 'GitHub API erişimi',
    category: 'dev',
    icon: '🐙',
    docsUrl: 'https://docs.github.com/en/rest',
    fields: [
      { key: 'accessToken', label: 'Personal Access Token', type: 'password', required: true, placeholder: 'ghp_...' },
    ],
  },
  vercel: {
    provider: 'vercel',
    name: 'Vercel',
    description: 'Vercel API',
    category: 'dev',
    icon: '▲',
    docsUrl: 'https://vercel.com/docs/rest-api',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  supabase: {
    provider: 'supabase',
    name: 'Supabase',
    description: 'Supabase proje API',
    category: 'dev',
    icon: '⚡',
    docsUrl: 'https://supabase.com/docs/reference',
    fields: [
      { key: 'url', label: 'Project URL', type: 'url', required: true },
      { key: 'anonKey', label: 'Anon Key', type: 'password', required: true },
      { key: 'serviceKey', label: 'Service Role Key', type: 'password', required: false },
    ],
  },
  firebase: {
    provider: 'firebase',
    name: 'Firebase',
    description: 'Firebase proje API',
    category: 'dev',
    icon: '🔥',
    docsUrl: 'https://firebase.google.com/docs/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
    ],
  },
  mixpanel: {
    provider: 'mixpanel',
    name: 'Mixpanel',
    description: 'Mixpanel analitik',
    category: 'dev',
    icon: '📈',
    docsUrl: 'https://developer.mixpanel.com/',
    fields: [
      { key: 'token', label: 'Project Token', type: 'password', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: false },
    ],
  },
  amplitude: {
    provider: 'amplitude',
    name: 'Amplitude',
    description: 'Amplitude analitik',
    category: 'dev',
    icon: '📊',
    docsUrl: 'https://www.docs.developers.amplitude.com/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: false },
    ],
  },
  sentry: {
    provider: 'sentry',
    name: 'Sentry',
    description: 'Sentry hata izleme',
    category: 'dev',
    icon: '🐛',
    docsUrl: 'https://docs.sentry.io/',
    fields: [
      { key: 'dsn', label: 'DSN', type: 'url', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: false },
    ],
  },
  
  // Custom
  custom: {
    provider: 'custom',
    name: 'Özel API',
    description: 'Özel API entegrasyonu',
    category: 'other',
    icon: '🔧',
    fields: [
      { key: 'name', label: 'API Adı', type: 'text', required: true },
      { key: 'baseUrl', label: 'Base URL', type: 'url', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: false },
      { key: 'authHeader', label: 'Auth Header', type: 'text', required: false, placeholder: 'Authorization' },
      { key: 'authPrefix', label: 'Auth Prefix', type: 'text', required: false, placeholder: 'Bearer' },
    ],
  },
};

export const PROVIDER_CATEGORIES = {
  smart_home: { name: 'Akıllı Ev', icon: '🏠', description: 'Akıllı ev cihaz kontrolleri' },
  media: { name: 'Medya & Video', icon: '🎬', description: 'Video, müzik ve medya servisleri' },
  ai: { name: 'Yapay Zeka', icon: '🤖', description: 'AI model sağlayıcıları' },
  cloud: { name: 'Bulut Depolama', icon: '☁️', description: 'Dosya depolama servisleri' },
  social: { name: 'Sosyal & İletişim', icon: '💬', description: 'Sosyal medya ve mesajlaşma' },
  dev: { name: 'Geliştirici', icon: '⚙️', description: 'Geliştirici araçları ve analitik' },
  other: { name: 'Diğer', icon: '📦', description: 'Özel entegrasyonlar' },
};
