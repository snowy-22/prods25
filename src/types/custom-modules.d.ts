// Lightweight module shims to satisfy TypeScript until proper types are added

declare module '@ai-sdk/openai' {
  export function createOpenAI(...args: any[]): any;
}

declare module '@ai-sdk/anthropic' {
  export function createAnthropic(...args: any[]): any;
}

declare module '@ai-sdk/google' {
  export function createGoogleGenerativeAI(...args: any[]): any;
}

declare module '@ai-sdk/*' {
  const whatever: any;
  export default whatever;
}

declare module 'ai' {
  const AI: any;
  export function streamText(...args: any[]): any;
  export default AI;
}

declare module 'pdfjs-dist' {
  const pdfjs: any;
  export = pdfjs;
}

declare module 'uuid' {
  export function v4(): string;
}

// Generic wildcard for any other packages missing types
declare module '*';
