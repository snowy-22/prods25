'use server';

/**
 * Unified AI Service (Gateway + Supabase)
 * - Wraps Vercel AI Gateway models
 * - Persists conversations/messages to Supabase
 * - Provides streaming and non-streaming helpers
 */

import { streamText } from 'ai';
import { getGatewayModel, selectBestModel, GatewayModel } from './ai-gateway';
import { AIConversationService } from './ai-conversation-service';

const conversationService = new AIConversationService();

export type PriorityMode = 'speed' | 'quality' | 'cost';

export interface SendAIMessageOptions {
  userId: string;
  message: string;
  conversationId?: string;
  priority?: PriorityMode;
  streaming?: boolean;
  requiresVision?: boolean;
  contextItems?: any[];
}

export interface SendVisionMessageOptions extends SendAIMessageOptions {
  imageUrl: string;
}

export async function sendAIMessageViaGateway(options: SendAIMessageOptions) {
  const {
    userId,
    message,
    conversationId,
    priority = 'speed',
    streaming = true,
    requiresVision = false,
    contextItems,
  } = options;

  const conversationIdOrNew = conversationId || `conv-${Date.now()}-${userId.slice(0, 6)}`;

  if (!conversationId) {
    await conversationService.createConversation(
      userId,
      conversationIdOrNew,
      message.slice(0, 50) + (message.length > 50 ? '…' : ''),
      contextItems
    );
  }

  const history = await conversationService.loadConversationHistory(conversationIdOrNew);
  const userSequence = history.length;

  await conversationService.saveMessage(
    userId,
    conversationIdOrNew,
    'user',
    message,
    userSequence
  );

  const selectedModelId: GatewayModel = selectBestModel({ priority, requiresVision });
  const model = getGatewayModel(selectedModelId);

  const result = await streamText({
    model,
    prompt: message,
  });

  let fullText = '';
  if (!streaming) {
    for await (const part of result.textStream) {
      fullText += part;
    }
  }

  if (!streaming) {
    await conversationService.saveMessage(
      userId,
      conversationIdOrNew,
      'assistant',
      fullText,
      userSequence + 1
    );
  }

  return {
    conversationId: conversationIdOrNew,
    selectedModel: selectedModelId,
    text: streaming ? undefined : fullText,
    textStream: result.textStream,
  };
}

export async function sendVisionMessageViaGateway(options: SendVisionMessageOptions) {
  const { imageUrl, message } = options;
  const payload = `${message}\n\nImage: ${imageUrl}`;
  return sendAIMessageViaGateway({ ...options, message: payload, requiresVision: true });
}
