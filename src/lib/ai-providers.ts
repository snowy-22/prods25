/**
 * AI Provider Configuration System
 * Supports multiple AI providers with custom endpoints
 */

export type AIProviderType = 
  | 'gemini'           // Google Gemini (default)
  | 'openai'           // OpenAI GPT
  | 'anthropic'        // Claude
  | 'groq'             // Groq (fast inference)
  | 'ollama'           // Local Ollama
  | 'azure-openai'     // Azure OpenAI Service
  | 'cohere'           // Cohere
  | 'huggingface'      // HuggingFace Inference API
  | 'ai-gateway'       // Vercel AI Gateway (unified)
  | 'custom';          // Custom endpoint

export type AIAgentMode = 'auto' | 'manual';

export interface AIProviderConfig {
  id: string;
  type: AIProviderType;
  name: string;
  apiKey?: string;
  endpoint?: string;      // Custom endpoint URL
  model?: string;         // Specific model to use
  maxTokens?: number;
  temperature?: number;
  enabled: boolean;
  isDefault?: boolean;
  metadata?: {
    description?: string;
    pricing?: string;
    rateLimit?: string;
    features?: string[];
  };
}

export interface AIAgentConfig {
  mode: AIAgentMode;
  defaultProvider: string;  // Provider ID
  fallbackProviders: string[]; // Provider IDs in priority order
  autoSelectByCost: boolean;
  autoSelectBySpeed: boolean;
  autoSelectByCapability: boolean;
}

// Default providers with public information
export const DEFAULT_PROVIDERS: Omit<AIProviderConfig, 'id' | 'apiKey'>[] = [
  {
    type: 'ai-gateway',
    name: 'Vercel AI Gateway (Unified)',
    endpoint: 'https://gateway.ai.cloudflare.com/v1',
    model: 'auto', // Auto-selects based on task
    maxTokens: 8192,
    temperature: 0.7,
    enabled: true,
    isDefault: true,
    metadata: {
      description: 'Unified API to multiple AI providers with load balancing and fallbacks',
      pricing: 'Gateway free, provider costs apply',
      rateLimit: 'Based on underlying provider',
      features: ['Multi-Provider', 'Load Balancing', 'Fallbacks', 'Monitoring', 'Cost Tracking']
    }
  },
  {
    type: 'gemini',
    name: 'Google Gemini 1.5 Flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-flash-latest',
    maxTokens: 8192,
    temperature: 0.7,
    enabled: true,
    metadata: {
      description: 'Fast, efficient multimodal AI from Google',
      pricing: '$0.15 per 1M tokens (Free tier: 1500 req/day)',
      rateLimit: '1500 requests/day (free tier)',
      features: ['Text Generation', 'Function Calling', 'Vision', 'Long Context']
    }
  },
  {
    type: 'openai',
    name: 'OpenAI GPT-4o',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: false,
    metadata: {
      description: 'Most capable OpenAI model',
      pricing: '$5.00 per 1M input tokens, $15.00 per 1M output tokens',
      rateLimit: 'Varies by tier',
      features: ['Text Generation', 'Function Calling', 'Vision', 'Code Generation']
    }
  },
  {
    type: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    endpoint: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
    temperature: 0.7,
    enabled: false,
    metadata: {
      description: 'Anthropic\'s most intelligent model',
      pricing: '$3.00 per 1M input tokens, $15.00 per 1M output tokens',
      rateLimit: 'Varies by tier',
      features: ['Text Generation', 'Code Generation', 'Analysis', 'Long Context (200K)']
    }
  },
  {
    type: 'groq',
    name: 'Groq Llama 3.1 70B',
    endpoint: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-70b-versatile',
    maxTokens: 8192,
    temperature: 0.7,
    enabled: false,
    metadata: {
      description: 'Ultra-fast inference with Groq LPU',
      pricing: 'Free tier available',
      rateLimit: '30 requests/minute (free tier)',
      features: ['Text Generation', 'Fast Inference', 'Code Generation']
    }
  },
  {
    type: 'ollama',
    name: 'Ollama Local',
    endpoint: 'http://localhost:11434',
    model: 'llama3.1',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: false,
    metadata: {
      description: 'Run AI models locally on your machine',
      pricing: 'Free (local compute)',
      rateLimit: 'No limits (local)',
      features: ['Privacy', 'Offline', 'Customizable', 'Free']
    }
  },
  {
    type: 'azure-openai',
    name: 'Azure OpenAI',
    endpoint: 'https://{your-resource}.openai.azure.com',
    model: 'gpt-4',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: false,
    metadata: {
      description: 'Enterprise OpenAI via Azure',
      pricing: 'Varies by deployment',
      rateLimit: 'Configurable',
      features: ['Enterprise', 'Data Privacy', 'SLA', 'Compliance']
    }
  }
];

// Agent selection algorithms
export function selectBestProvider(
  config: AIAgentConfig,
  providers: AIProviderConfig[],
  context: {
    requiresVision?: boolean;
    requiresFunctionCalling?: boolean;
    budgetConstraint?: number;
    speedPriority?: boolean;
  }
): AIProviderConfig | null {
  if (config.mode === 'manual') {
    return providers.find(p => p.id === config.defaultProvider && p.enabled) || null;
  }

  // Auto selection logic
  const enabledProviders = providers.filter(p => p.enabled);
  
  if (enabledProviders.length === 0) return null;

  // Filter by capabilities
  let candidates = enabledProviders;

  if (context.requiresVision) {
    candidates = candidates.filter(p => 
      p.metadata?.features?.includes('Vision')
    );
  }

  if (context.requiresFunctionCalling) {
    candidates = candidates.filter(p => 
      p.metadata?.features?.includes('Function Calling')
    );
  }

  if (candidates.length === 0) return null;

  // Sort by priority
  if (config.autoSelectBySpeed && context.speedPriority) {
    // Prefer Groq or fast models
    const speedPriority = candidates.sort((a, b) => {
      if (a.type === 'groq') return -1;
      if (b.type === 'groq') return 1;
      return 0;
    });
    return speedPriority[0];
  }

  if (config.autoSelectByCost) {
    // Prefer free or cheap models
    const costPriority = candidates.sort((a, b) => {
      const freeTiers = ['gemini', 'groq', 'ollama'];
      const aIsFree = freeTiers.includes(a.type);
      const bIsFree = freeTiers.includes(b.type);
      if (aIsFree && !bIsFree) return -1;
      if (!aIsFree && bIsFree) return 1;
      return 0;
    });
    return costPriority[0];
  }

  // Default: use configured default or first enabled
  return candidates.find(p => p.id === config.defaultProvider) || candidates[0];
}

// Cost estimation
export function estimateProviderCost(
  providerType: AIProviderType,
  tokensUsed: number
): { usd: number; try: number } {
  const exchangeRate = 34.5; // TRY/USD

  const pricing: Record<AIProviderType, { inputPerMillion: number; outputPerMillion: number }> = {
    gemini: { inputPerMillion: 0.15, outputPerMillion: 0.15 },
    openai: { inputPerMillion: 5.0, outputPerMillion: 15.0 },
    anthropic: { inputPerMillion: 3.0, outputPerMillion: 15.0 },
    groq: { inputPerMillion: 0.0, outputPerMillion: 0.0 }, // Free tier
    ollama: { inputPerMillion: 0.0, outputPerMillion: 0.0 }, // Local
    'azure-openai': { inputPerMillion: 5.0, outputPerMillion: 15.0 },
    cohere: { inputPerMillion: 1.0, outputPerMillion: 2.0 },
    huggingface: { inputPerMillion: 0.0, outputPerMillion: 0.0 }, // Varies
    custom: { inputPerMillion: 0.0, outputPerMillion: 0.0 }
  };

  const rate = pricing[providerType] || pricing.gemini;
  // Assume 50/50 split for estimation
  const avgCostPerMillion = (rate.inputPerMillion + rate.outputPerMillion) / 2;
  const usd = (tokensUsed / 1_000_000) * avgCostPerMillion;
  const tryAmount = usd * exchangeRate;

  return { usd, try: tryAmount };
}
