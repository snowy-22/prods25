/**
 * AI Conversation Database Service
 * Handles persistence of AI conversations and messages to Supabase
 * Works with existing Genkit AI flows for actual AI processing
 */

import { createClient } from '@/lib/supabase/client';

// Types
export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  context_items?: any[];
  message_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sequence_number: number;
  tool_calls?: any;
  tool_results?: any;
  metadata?: any;
  created_at: string;
}

/**
 * Service for managing AI conversations in database
 */
export class AIConversationService {
  private supabase = createClient();

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    conversationId: string,
    title: string,
    contextItems?: any[]
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_conversations')
        .insert({
          id: conversationId,
          user_id: userId,
          title,
          context_items: contextItems || null,
          message_count: 0,
          is_pinned: false,
          is_archived: false,
        });

      if (error) {
        console.error('Failed to create conversation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Save a message to the database
   */
  async saveMessage(
    userId: string,
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    sequenceNumber: number,
    toolCalls?: any,
    toolResults?: any,
    metadata?: any
  ): Promise<void> {
    try {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Insert message
      const { error: messageError } = await this.supabase
        .from('ai_messages')
        .insert({
          id: messageId,
          conversation_id: conversationId,
          user_id: userId,
          role,
          content,
          sequence_number: sequenceNumber,
          tool_calls: typeof toolCalls === 'string' ? JSON.parse(toolCalls) : toolCalls,
          tool_results: typeof toolResults === 'string' ? JSON.parse(toolResults) : toolResults,
          metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata,
        });

      if (messageError) {
        console.error('Failed to save message:', messageError);
        // Don't throw - message save failure shouldn't block AI processing
        return;
      }

      // Update conversation metadata
      // First get current message count
      const { data: conv } = await this.supabase
        .from('ai_conversations')
        .select('message_count')
        .eq('id', conversationId)
        .single();

      await this.supabase
        .from('ai_conversations')
        .update({
          message_count: (conv?.message_count || 0) + 1,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error saving message:', error);
      // Don't throw - non-blocking
    }
  }

  /**
   * Load conversation history
   */
  async loadConversationHistory(conversationId: string): Promise<Array<{ role: string; content: string }>> {
    try {
      const { data, error } = await this.supabase
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('sequence_number', { ascending: true });

      if (error) {
        console.error('Failed to load conversation history:', error);
        return [];
      }

      return (data || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));
    } catch (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(
    userId: string,
    options?: { includeArchived?: boolean; limit?: number }
  ): Promise<AIConversation[]> {
    try {
      let query = this.supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId);

      if (!options?.includeArchived) {
        query = query.eq('is_archived', false);
      }

      query = query.order('updated_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  /**
   * Delete a conversation (cascades to messages)
   */
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId); // Security: user can only delete own conversations

      if (error) {
        console.error('Failed to delete conversation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Archive/unarchive a conversation
   */
  async archiveConversation(
    userId: string,
    conversationId: string,
    archived: boolean
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_conversations')
        .update({
          is_archived: archived,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to archive conversation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }

  /**
   * Pin/unpin a conversation
   */
  async pinConversation(
    userId: string,
    conversationId: string,
    pinned: boolean
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_conversations')
        .update({
          is_pinned: pinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to pin conversation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error pinning conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation with messages
   */
  async getConversationWithMessages(
    userId: string,
    conversationId: string
  ): Promise<(AIConversation & { messages: AIMessage[] }) | null> {
    try {
      // Get conversation
      const { data: conversation, error: convError } = await this.supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
        console.error('Failed to get conversation:', convError);
        return null;
      }

      // Get messages
      const { data: messages, error: msgError } = await this.supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sequence_number', { ascending: true });

      if (msgError) {
        console.error('Failed to get messages:', msgError);
        return { ...conversation, messages: [] };
      }

      return {
        ...conversation,
        messages: messages || [],
      };
    } catch (error) {
      console.error('Error getting conversation with messages:', error);
      return null;
    }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    userId: string,
    conversationId: string,
    title: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_conversations')
        .update({
          title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to update conversation title:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating conversation title:', error);
      throw error;
    }
  }
}

// Singleton export
export const aiConversationService = new AIConversationService();
