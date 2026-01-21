/**
 * MCP Events SSE Endpoint
 * Server-Sent Events for real-time MCP updates
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Connection store for SSE clients
const connections = new Map<string, {
  controller: ReadableStreamDefaultController;
  userId: string | null;
  connectedAt: Date;
}>();

// Cleanup stale connections every 5 minutes
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 30 * 60 * 1000; // 30 minutes
  
  connections.forEach((conn, id) => {
    if (now - conn.connectedAt.getTime() > staleThreshold) {
      try {
        conn.controller.close();
      } catch {}
      connections.delete(id);
    }
  });
}, 5 * 60 * 1000);

export async function GET(request: NextRequest) {
  // Check authentication (optional for MCP)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const connectionId = `conn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  const stream = new ReadableStream({
    start(controller) {
      // Store connection
      connections.set(connectionId, {
        controller,
        userId: user?.id || null,
        connectedAt: new Date(),
      });
      
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({
        connectionId,
        serverTime: new Date().toISOString(),
        userId: user?.id || null,
      })}\n\n`));
      
      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          clearInterval(heartbeat);
          connections.delete(connectionId);
        }
      }, 30000);
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        connections.delete(connectionId);
        try {
          controller.close();
        } catch {}
      });
    },
    
    cancel() {
      connections.delete(connectionId);
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// POST - Broadcast event to all connections
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { event, data, targetUserId } = await request.json();
    
    if (!event) {
      return Response.json({ error: 'Event name required' }, { status: 400 });
    }
    
    const encoder = new TextEncoder();
    const message = encoder.encode(`event: ${event}\ndata: ${JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      sender: user.id,
    })}\n\n`);
    
    let sentCount = 0;
    
    connections.forEach((conn, id) => {
      // If targetUserId specified, only send to that user
      if (targetUserId && conn.userId !== targetUserId) {
        return;
      }
      
      try {
        conn.controller.enqueue(message);
        sentCount++;
      } catch {
        connections.delete(id);
      }
    });
    
    return Response.json({
      success: true,
      event,
      sentTo: sentCount,
      totalConnections: connections.size,
    });
    
  } catch (error: any) {
    console.error('MCP events POST error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Helper to broadcast MCP events programmatically
export function broadcastMCPEvent(event: string, data: any, targetUserId?: string) {
  const encoder = new TextEncoder();
  const message = encoder.encode(`event: ${event}\ndata: ${JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
  })}\n\n`);
  
  connections.forEach((conn, id) => {
    if (targetUserId && conn.userId !== targetUserId) {
      return;
    }
    
    try {
      conn.controller.enqueue(message);
    } catch {
      connections.delete(id);
    }
  });
}

// Event types for MCP
export interface MCPEventTypes {
  // Tool events
  'tool:start': { toolName: string; params: any };
  'tool:complete': { toolName: string; result: any; duration: number };
  'tool:error': { toolName: string; error: string };
  
  // Resource events
  'resource:updated': { resourceUri: string; changes: any };
  'resource:deleted': { resourceUri: string };
  
  // Canvas events
  'canvas:item-added': { itemId: string; itemType: string };
  'canvas:item-removed': { itemId: string };
  'canvas:item-updated': { itemId: string; changes: any };
  
  // AI events
  'ai:response': { conversationId: string; content: string };
  'ai:thinking': { conversationId: string };
  'ai:error': { conversationId: string; error: string };
}
