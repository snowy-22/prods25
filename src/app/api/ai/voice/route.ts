/**
 * AI Voice/Speech API Route
 * Text-to-Speech ve Speech-to-Text için endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOpenAI } from '@ai-sdk/openai';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Get OpenAI client
function getOpenAI() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Text-to-Speech
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
    const { action, text, audio, options = {} } = body;
    
    if (action === 'tts') {
      return handleTTS(text, options);
    } else if (action === 'stt') {
      return handleSTT(audio, options);
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "tts" or "stt"' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Voice API error:', error);
    return NextResponse.json(
      { error: error.message || 'Voice processing failed' },
      { status: 500 }
    );
  }
}

// Text-to-Speech using OpenAI
async function handleTTS(text: string, options: any) {
  if (!text) {
    return NextResponse.json(
      { error: 'Text is required for TTS' },
      { status: 400 }
    );
  }
  
  // Check for OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: Return instructions for client-side TTS
    return NextResponse.json({
      fallback: true,
      message: 'Use browser TTS',
      text,
    });
  }
  
  try {
    // Use OpenAI TTS API directly
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4096), // Max 4096 chars
        voice: options.voice || 'alloy', // alloy, echo, fable, onyx, nova, shimmer
        speed: options.speed || 1.0,
        response_format: 'mp3',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`TTS API failed: ${response.statusText}`);
    }
    
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({
      audio: `data:audio/mp3;base64,${base64Audio}`,
      format: 'mp3',
      duration: null, // OpenAI doesn't return duration
    });
    
  } catch (error: any) {
    // Fallback to browser TTS
    return NextResponse.json({
      fallback: true,
      message: 'Use browser TTS',
      text,
      error: error.message,
    });
  }
}

// Speech-to-Text using OpenAI Whisper
async function handleSTT(audio: string, options: any) {
  if (!audio) {
    return NextResponse.json(
      { error: 'Audio is required for STT' },
      { status: 400 }
    );
  }
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      fallback: true,
      message: 'Use browser STT (Web Speech API)',
    });
  }
  
  try {
    // Convert base64 to blob
    const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    // Create form data
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', options.language || 'tr');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`STT API failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      transcript: result.text,
      language: options.language || 'tr',
      confidence: 0.95, // Whisper doesn't return confidence
    });
    
  } catch (error: any) {
    return NextResponse.json({
      fallback: true,
      message: 'Use browser STT (Web Speech API)',
      error: error.message,
    });
  }
}
