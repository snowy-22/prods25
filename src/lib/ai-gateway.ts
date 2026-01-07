/**
 * Vercel AI Gateway Configuration
 * Unified API to multiple AI providers with monitoring, load-balancing, and fallbacks
 */

'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Vercel AI Gateway base URL
const AI_GATEWAY_URL = 'https://gateway.ai.cloudflare.com/v1';

// Initialize providers through AI Gateway
export const openaiGateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: `${AI_GATEWAY_URL}/openai`,
  compatibility: 'strict',
});

export const anthropicGateway = createAnthropic({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: `${AI_GATEWAY_URL}/anthropic`,
});

export const googleGateway = createGoogleGenerativeAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: `${AI_GATEWAY_URL}/google`,
});

// Default model configurations
export const gatewayModels = {
  // OpenAI
  'gpt-4-turbo': openaiGateway('gpt-4-turbo-preview'),
  'gpt-4': openaiGateway('gpt-4'),
  'gpt-3.5-turbo': openaiGateway('gpt-3.5-turbo'),
  
  // Anthropic
  'claude-3-opus': anthropicGateway('claude-3-opus-20240229'),
  'claude-3-sonnet': anthropicGateway('claude-3-sonnet-20240229'),
  'claude-3-haiku': anthropicGateway('claude-3-haiku-20240307'),
  
  // Google
  'gemini-pro': googleGateway('models/gemini-pro'),
  'gemini-1.5-pro': googleGateway('models/gemini-1.5-pro'),
  'gemini-1.5-flash': googleGateway('models/gemini-1.5-flash'),
} as const;

export type GatewayModel = keyof typeof gatewayModels;

/**
 * Get model from gateway
 * Provides unified access to all AI providers through Vercel AI Gateway
 */
export function getGatewayModel(modelId: GatewayModel) {
  return gatewayModels[modelId];
}

/**
 * Auto-select best model based on task requirements
 */
export function selectBestModel(params: {
  priority: 'speed' | 'quality' | 'cost';
  maxTokens?: number;
  requiresVision?: boolean;
}): GatewayModel {
  const { priority, requiresVision } = params;
  
  if (requiresVision) {
    return priority === 'speed' ? 'gemini-1.5-flash' : 'gpt-4-turbo';
  }
  
  switch (priority) {
    case 'speed':
      return 'gemini-1.5-flash'; // Fastest
    case 'cost':
      return 'gpt-3.5-turbo'; // Most economical
    case 'quality':
      return 'claude-3-opus'; // Highest quality
    default:
      return 'gemini-1.5-flash'; // Default balanced choice
  }
}

/**
 * Provider health check and fallback logic
 */
export async function getModelWithFallback(
  preferredModel: GatewayModel,
  fallbackModels: GatewayModel[] = ['gemini-1.5-flash', 'gpt-3.5-turbo', 'claude-3-haiku']
): Promise<GatewayModel> {
  // In production, you would check provider health here
  // For now, return preferred model (Gateway handles fallbacks internally)
  return preferredModel;
}
