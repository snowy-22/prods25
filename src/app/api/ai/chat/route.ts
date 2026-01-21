/**
 * AI Chat API Route
 * Genkit AI ile entegre chat endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { askAi } from '@/ai/flows/assistant-flow';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { message, conversationId, systemPrompt, history = [] } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Format history for Genkit
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      content: [{ text: msg.content }],
    }));
    
    // Add current message
    formattedHistory.push({
      role: 'user',
      content: [{ text: message }],
    });
    
    // Call Genkit AI flow
    const result = await askAi({ 
      history: formattedHistory,
    });
    
    // Parse result
    let response = '';
    let toolCalls = undefined;
    let toolResults = undefined;
    
    if (typeof result === 'string') {
      response = result;
    } else if (result && typeof result === 'object') {
      response = (result as any).response || (result as any).text || JSON.stringify(result);
      toolCalls = (result as any).toolCalls;
      toolResults = (result as any).toolResults;
    }
    
    // Generate or use conversation ID
    const newConversationId = conversationId || `conv-${Date.now()}-${user.id.slice(0, 8)}`;
    
    // Save to Supabase (async, don't wait)
    saveConversation(supabase, user.id, newConversationId, message, response).catch(console.error);
    
    return NextResponse.json({
      response,
      conversationId: newConversationId,
      toolCalls,
      toolResults,
    });
    
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'AI request failed' },
      { status: 500 }
    );
  }
}

async function saveConversation(
  supabase: any,
  userId: string,
  conversationId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('conversation_id', conversationId)
      .single();
    
    if (!existing) {
      // Create conversation
      await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
          is_archived: false,
          is_pinned: false,
        });
    }
    
    // Get message count for sequence
    const { count } = await supabase
      .from('ai_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);
    
    const sequenceNumber = (count || 0);
    
    // Save user message
    await supabase
      .from('ai_messages')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
        sequence_number: sequenceNumber,
      });
    
    // Save assistant message
    await supabase
      .from('ai_messages')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantResponse,
        sequence_number: sequenceNumber + 1,
      });
      
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}
