/**
 * AI Vision API Route
 * Görüntü analizi için endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
// generateText is the default export from 'ai' package
const { generateText } = require('ai');

export const runtime = 'nodejs';
export const maxDuration = 60;

// Vision model selection
function getVisionModel(provider: string = 'openai') {
  switch (provider) {
    case 'google': {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      return google('gemini-1.5-flash');
    }
    case 'openai':
    default: {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai('gpt-4o');
    }
  }
}

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
    const { image, prompt, options = {} } = body;
    
    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }
    
    // Prepare image data
    let imageUrl: string;
    if (image.startsWith('http://') || image.startsWith('https://')) {
      imageUrl = image;
    } else if (image.startsWith('data:')) {
      imageUrl = image;
    } else {
      // Assume base64
      imageUrl = `data:image/jpeg;base64,${image}`;
    }
    
    const systemPrompt = `You are a helpful AI vision assistant. Analyze images accurately and provide detailed, useful responses.
When analyzing images:
- Be specific about what you observe
- If there's text, transcribe it accurately
- Describe spatial relationships and colors
- Note any important details the user might care about
Respond in the same language as the user's prompt.`;

    // Use Vercel AI SDK
    const model = getVisionModel(options.provider || 'openai');
    
    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt || 'What do you see in this image? Describe it in detail.',
            },
            {
              type: 'image',
              image: imageUrl,
            },
          ],
        },
      ],
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
    });
    
    // Extract result
    const analysisResult = result.text || '';
    
    // Parse for structured data if applicable
    let extractedData: any = null;
    
    // Check if response contains structured data
    if (prompt?.toLowerCase().includes('extract') || 
        prompt?.toLowerCase().includes('ocr') ||
        prompt?.toLowerCase().includes('text')) {
      extractedData = {
        text: analysisResult,
        confidence: 0.9, // Placeholder
      };
    }
    
    // Log usage (async)
    logVisionUsage(supabase, user.id, prompt, analysisResult).catch(console.error);
    
    return NextResponse.json({
      result: analysisResult,
      analysisType: options.analysisType || 'describe',
      extractedData,
      confidence: 0.9,
      metadata: {
        model: options.provider === 'google' ? 'gemini-1.5-flash' : 'gpt-4o',
        processingTime: Date.now(),
      },
    });
    
  } catch (error: any) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: error.message || 'Vision analysis failed' },
      { status: 500 }
    );
  }
}

async function logVisionUsage(
  supabase: any,
  userId: string,
  prompt: string,
  result: string
) {
  try {
    await supabase
      .from('ai_messages')
      .insert({
        user_id: userId,
        conversation_id: `vision-${Date.now()}`,
        role: 'user',
        content: `[Vision] ${prompt || 'Image analysis'}`,
        sequence_number: 0,
        metadata: { type: 'vision' },
      });
  } catch (error) {
    console.error('Failed to log vision usage:', error);
  }
}
