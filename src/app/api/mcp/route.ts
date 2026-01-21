/**
 * MCP API Route
 * Model Context Protocol endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  CanvasFlowMCPServer, 
  createMCPServer, 
  MCPRequest,
  MCP_SERVER_INFO 
} from '@/lib/ai-complete/mcp/server';
import { AI_TOOLS } from '@/lib/ai-complete/tools';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Tool executor - connects MCP tools to app functionality
async function executeToolForMCP(
  toolName: string, 
  params: Record<string, any>
): Promise<any> {
  // This would be connected to actual app functionality
  // For now, return mock responses based on tool type
  
  const tool = AI_TOOLS[toolName];
  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }
  
  // Mock execution based on tool category
  switch (tool.category) {
    case 'canvas':
      return {
        success: true,
        message: `Canvas operation '${toolName}' executed`,
        params,
      };
      
    case 'search':
      return {
        success: true,
        results: [],
        query: params.query,
        message: `Search for '${params.query}' executed`,
      };
      
    case 'media':
      return {
        success: true,
        message: `Media operation '${toolName}' executed`,
        itemId: params.itemId,
      };
      
    case 'widget':
      return {
        success: true,
        message: `Widget '${params.type}' added`,
        widgetId: `widget-${Date.now()}`,
      };
      
    case 'system':
      return {
        success: true,
        message: `System operation '${toolName}' executed`,
      };
      
    case 'communication':
      return {
        success: true,
        message: `Communication operation '${toolName}' executed`,
      };
      
    case 'analysis':
      return {
        success: true,
        message: `Analysis '${toolName}' completed`,
        result: 'Analysis placeholder result',
      };
      
    default:
      return {
        success: true,
        message: `Tool '${toolName}' executed`,
        params,
      };
  }
}

// MCP Server instance (lazy initialization)
let mcpServer: CanvasFlowMCPServer | null = null;

function getMCPServer(): CanvasFlowMCPServer {
  if (!mcpServer) {
    mcpServer = createMCPServer(
      { type: 'http', url: '/api/mcp' },
      executeToolForMCP
    );
  }
  return mcpServer;
}

// GET - Server info
export async function GET(request: NextRequest) {
  return NextResponse.json({
    ...MCP_SERVER_INFO,
    status: 'ready',
    tools: Object.keys(AI_TOOLS).length,
    endpoint: '/api/mcp',
    documentation: 'https://modelcontextprotocol.io',
  });
}

// POST - Handle MCP requests
export async function POST(request: NextRequest) {
  try {
    // Optional: Require authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Allow unauthenticated access for MCP protocol
    // (authentication can be handled via API keys in headers)
    
    const body = await request.json();
    
    // Validate JSON-RPC format
    if (body.jsonrpc !== '2.0' || !body.method) {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: Must be JSON-RPC 2.0 format',
        },
      }, { status: 400 });
    }
    
    const server = getMCPServer();
    const response = await server.handleRequest(body as MCPRequest);
    
    // Log MCP usage (async)
    if (user && body.method === 'tools/call') {
      logMCPUsage(supabase, user.id, body.params?.name, body.params?.arguments).catch(() => {});
    }
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('MCP API error:', error);
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: error.message || 'Internal error',
      },
    }, { status: 500 });
  }
}

async function logMCPUsage(
  supabase: any,
  userId: string,
  toolName: string,
  params: any
) {
  try {
    await supabase
      .from('ai_messages')
      .insert({
        user_id: userId,
        conversation_id: `mcp-${Date.now()}`,
        role: 'tool',
        content: `[MCP] Tool: ${toolName}`,
        sequence_number: 0,
        tool_calls: [{ name: toolName, params }],
        metadata: { type: 'mcp' },
      });
  } catch (error) {
    console.error('Failed to log MCP usage:', error);
  }
}
