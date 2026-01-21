/**
 * AI Complete Module - Index Export
 * Tüm AI servislerini tek bir yerden export eder
 */

// Types
export * from './types';

// Voice Services
export { 
  VoiceInputManager, 
  VoiceOutputManager, 
  getVoiceInput, 
  getVoiceOutput,
  speakAIResponse,
  transcribeFromMicrophone,
  isVoiceInputSupported,
  isVoiceOutputSupported,
} from './voice-service';

// Vision Services
export {
  CameraManager,
  getCamera,
  isCameraSupported,
  analyzeImage,
  describeImage,
  extractTextFromImage,
  identifyObjectsInImage,
  captureScreen,
  imageToBase64,
  blobToBase64,
  resizeImage,
} from './vision-service';

// Tools
export {
  AI_TOOLS,
  getToolsByCategory,
  getEnabledTools,
  getToolsRequiringConfirmation,
  toolToOpenAIFunction,
  getAllToolsAsOpenAIFunctions,
  validateToolParams,
  createToolResult,
} from './tools';

// React Hooks
export {
  useVoiceInput,
  useVoiceOutput,
  useCamera,
  useVision,
  useAIChat,
  useAIAssistant,
} from './hooks';

// Re-export types for convenience
export type {
  UseVoiceInputReturn,
  UseVoiceOutputReturn,
  UseCameraReturn,
  UseVisionReturn,
  UseAIChatOptions,
  UseAIChatReturn,
  UseAIAssistantReturn,
} from './hooks';

// MCP (Model Context Protocol)
export * from './mcp';

// MCP convenience types - re-export from types.ts
export type {
  MCPServer,
  MCPTransport,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPToolResult,
} from './types';

// MCP server types
export type {
  MCPRequest,
  MCPResponse,
} from './mcp/server';

// Tool Executor
export {
  executeTool,
  executeToolChain,
  getAvailableTools,
  createToolExecutorWithStore,
} from './tool-executor';

export type { ToolContext } from './tool-executor';
