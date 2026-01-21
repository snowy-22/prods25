/**
 * Complete AI System Types
 * Voice, Vision, Function Calling, MCP entegrasyon tipleri
 */

// Voice Types
export interface VoiceInputConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface VoiceOutputConfig {
  voice: string;
  pitch: number;
  rate: number;
  volume: number;
  language: string;
}

export interface VoiceTranscript {
  id: string;
  userId: string;
  text: string;
  confidence: number;
  language: string;
  isFinal: boolean;
  alternatives: string[];
  timestamp: string;
  duration?: number;
}

export interface SpeechSynthesisRequest {
  text: string;
  voice?: string;
  language?: string;
  pitch?: number;
  rate?: number;
}

// Vision Types
export interface VisionAnalysisRequest {
  imageData: string | Blob;
  prompt?: string;
  analysisType: VisionAnalysisType;
  options?: VisionOptions;
}

export type VisionAnalysisType = 
  | 'describe'
  | 'extract_text'
  | 'identify_objects'
  | 'analyze_document'
  | 'detect_faces'
  | 'custom';

export interface VisionOptions {
  maxTokens?: number;
  temperature?: number;
  detailLevel?: 'low' | 'high' | 'auto';
}

export interface VisionAnalysisResult {
  id: string;
  userId: string;
  imageUrl?: string;
  analysisType: VisionAnalysisType;
  prompt?: string;
  result: string;
  confidence?: number;
  extractedData?: {
    text?: string;
    objects?: DetectedObject[];
    faces?: DetectedFace[];
    metadata?: Record<string, any>;
  };
  model: string;
  tokensUsed: number;
  timestamp: string;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DetectedFace {
  id: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Record<string, { x: number; y: number }>;
}

// Function Calling / Tool Types
export interface AITool {
  id?: string;
  name: string;
  description: string;
  parameters: AIToolParameter[];
  handler?: (params: Record<string, any>) => Promise<any>;
  category: ToolCategory;
  requiresConfirmation?: boolean;
  rateLimit?: number;
  isEnabled?: boolean;
}

export interface AIToolResult {
  id: string;
  toolId?: string;
  toolName: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  timestamp: string;
}

export interface AIToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[];
  default?: any;
}

export type ToolCategory = 
  | 'canvas'
  | 'search'
  | 'media'
  | 'navigation'
  | 'settings'
  | 'communication'
  | 'data'
  | 'external'
  | 'widget'
  | 'system'
  | 'analysis';

export interface ToolCallRequest {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
  timestamp: string;
}

export interface ToolCallResult {
  id: string;
  toolName: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  timestamp: string;
}

// MCP (Model Context Protocol) Types
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  transport: MCPTransport;
  status: 'connected' | 'disconnected' | 'error';
  capabilities: MCPCapability[];
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}

export type MCPTransport = 
  | { type: 'stdio'; command: string; args?: string[]; env?: Record<string, string> }
  | { type: 'http'; url: string; headers?: Record<string, string> }
  | { type: 'websocket'; url: string };

export type MCPCapability = 
  | 'tools'
  | 'resources'
  | 'prompts'
  | 'logging'
  | 'sampling';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: MCPResource;
  }>;
  isError?: boolean;
}

// AI Assistant Context Types
export interface AIContext {
  userId: string;
  sessionId: string;
  conversationId?: string;
  currentView?: string;
  selectedItems?: string[];
  clipboardContent?: any;
  userPreferences?: UserAIPreferences;
  recentActions?: string[];
  activeTools: string[];
}

export interface UserAIPreferences {
  preferredModel: string;
  preferredVoice: string;
  autoSpeak: boolean;
  voiceInputEnabled: boolean;
  visionEnabled: boolean;
  functionCallingEnabled: boolean;
  mcpServersEnabled: string[];
  language: string;
  responseStyle: 'concise' | 'detailed' | 'balanced';
}

// AI Message Types (Extended)
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  
  // Voice
  voiceInput?: VoiceTranscript;
  voiceOutput?: boolean;
  
  // Vision
  images?: string[];
  imageUrl?: string;
  visionAnalysis?: VisionAnalysisResult;
  
  // Tools
  toolCalls?: ToolCallRequest[];
  toolResults?: ToolCallResult[];
  
  // Metadata
  model?: string;
  tokensUsed?: number;
  latency?: number;
  cost?: number;
}

// ChatMessage alias for backward compatibility
export type ChatMessage = AIMessage;

// Voice State for UI components
export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

// Camera State for UI components
export interface CameraState {
  isActive: boolean;
  stream: MediaStream | null;
  error: string | null;
  isSupported: boolean;
  facingMode: 'user' | 'environment';
}

// AI Session Types
export interface AISession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  messagesCount: number;
  tokensUsed: number;
  toolCallsCount: number;
  voiceInteractions: number;
  visionAnalyses: number;
  context: AIContext;
}

// AI Analytics Types
export interface AIUsageStats {
  userId: string;
  period: 'day' | 'week' | 'month';
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  modelUsage: Record<string, number>;
  toolUsage: Record<string, number>;
  voiceInputCount: number;
  visionAnalysisCount: number;
  averageLatency: number;
}
