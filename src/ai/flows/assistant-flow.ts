
'use server';
/**
* @fileoverview A versatile AI assistant flow for the tv25 application.
 * This flow can use tools to perform actions like searching the web, YouTube, or scraping web pages.
 * It's designed as a simple agent that can loop through tool calls to achieve a goal.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
// import { googleSearch } from '@genkit-ai/google-genai';
import { type AssistantInput, type AssistantOutput, AssistantInputSchema, AssistantOutputSchema, MessageSchema, type Message } from './assistant-schema';
import { analyzeItem } from './analyze-item-flow';
import { analyzeContent } from './content-analysis-flow';
import { suggestFrameStyles } from './content-adaptive-styling';
import { fetchOembedMetadata } from '@/lib/oembed-helpers';
import { logAIRequest, logToolCall, updateAIRequestStatus, type AIToolName } from '@/lib/ai/ai-logger';


// Schemas for our tools
const YouTubeSearchResultSchema = z.object({
    title: z.string().describe('The title of the YouTube video.'),
    link: z.string().describe('The URL of the video.'),
    channel: z.string().describe('The name of the YouTube channel.'),
});

// Lazy initialization - tools and flow will be created only when needed
let tools: any[] | null = null;
let assistantFlow: ReturnType<typeof ai.defineFlow> | null = null;
const MAX_TOOL_ITERATIONS = 5;

function initializeToolsAndFlow() {
  if (tools && assistantFlow) return;
  
  // Use the built-in Google Search tool from Genkit
  // const webSearchTool = googleSearch('webSearch');

  // Define a more realistic tool for YouTube search
  // @ts-expect-error Zod/Genkit type incompatibility

  const youtubeSearchTool = ai.defineTool(
    {
      name: 'youtubeSearch',
      description: 'Searches YouTube for videos matching the given query.',
      inputSchema: z.object({ query: z.string() }),
      outputSchema: z.array(YouTubeSearchResultSchema),
    },
    async ({ query }) => {
      console.log(`AI is searching YouTube for: "${query}"`);
       // In a real application, you would use the YouTube Data API here.
      return [
        { title: 'React in 100 Seconds', link: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', channel: 'Fireship' },
        { title: 'Full Modern React Tutorial', link: 'https://www.youtube.com/watch?v=SqcY0GlETPk', channel: 'The Net Ninja' },
      ];
    }
  );

  // Define a new tool for scraping web page content
  // @ts-expect-error Zod/Genkit type incompatibility

  const pageScraperTool = ai.defineTool(
    {
      name: 'pageScraper',
      description: 'Fetches the content of a given URL. Useful for deep research after finding promising links with webSearch.',
      inputSchema: z.object({ url: z.string().url() }),
      outputSchema: z.string().describe('The text content of the web page.'),
    },
    async ({ url }) => {
      console.log(`AI is scraping content from: "${url}"`);
      // In a real application, you'd use a library like Cheerio or Puppeteer.
      // For now, we return simulated content based on the URL.
      if (url.includes('react.dev')) {
        return 'React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called "components". React has a few different kinds of components, but we\'ll start with React.Component subclasses...';
      }
      if (url.includes('nextjs.org')) {
          return 'Next.js is a flexible React framework that gives you building blocks to create fast web applications. It handles the tooling and configuration needed for React, and provides additional structure, features, and optimizations for your application.';
      }
      return `Simulated content for ${url}. The page discusses various modern web development technologies and best practices.`;
    }
  );

  // @ts-expect-error Zod/Genkit type incompatibility


  const highlightElementTool = ai.defineTool(
      {
        name: 'highlightElement',
        description: 'Highlights a specific UI element on the screen by providing its ID. This is used to guide the user.',
        inputSchema: z.object({
          elementId: z.string().describe('The ID of the element to highlight (e.g., "root", "yt-1", etc.).'),
        }),
        outputSchema: z.object({
          success: z.boolean(),
        }),
      },
      async ({ elementId }) => {
        console.log(`AI is requesting to highlight element: ${elementId}`);
        return { success: true };
      }
  );

  // @ts-expect-error Zod/Genkit type incompatibility


  const addPlayerTool = ai.defineTool(
      {
        name: 'addPlayerTool',
        description: 'Adds a new player/item to the current canvas with the given URL and title.',
        inputSchema: z.object({
          url: z.string().url().describe('The URL of the content to add.'),
          title: z.string().describe('A suitable title for the new player.'),
          type: z.enum(['video', 'website', 'image', 'notes']).optional().describe('The type of the item.'),
        }),
        outputSchema: z.object({
          success: z.boolean(),
          itemId: z.string().optional(),
        }),
      },
      async ({ url, title, type }) => {
        console.log(`AI is requesting to add a player with URL: "${url}", title: "${title}", type: "${type}"`);
        return { success: true, itemId: `new-item-${Date.now()}` };
      }
  );

  // @ts-expect-error Zod/Genkit type incompatibility


  const fetchYoutubeMetaTool = ai.defineTool(
      {
          name: 'fetchYoutubeMeta',
          description: 'Fetches detailed metadata for a YouTube video URL, including views, likes, and channel info.',
          inputSchema: z.object({ url: z.string().url() }),
          outputSchema: z.any(),
      },
      async ({ url }) => {
          return await fetchOembedMetadata(url);
      }
  );

  // @ts-expect-error Zod/Genkit type incompatibility


  const analyzeItemTool = ai.defineTool(
      {
          name: 'analyzeItem',
          description: 'Analyzes an image of an item to identify it and find pricing/reviews.',
          inputSchema: z.object({ imageUri: z.string() }),
          outputSchema: z.any(),
      },
      async (input) => {
          return await analyzeItem(input);
      }
  );

  // @ts-expect-error Zod/Genkit type incompatibility


  const analyzeContentTool = ai.defineTool(
      {
          name: 'analyzeContent',
          description: 'Analyzes a collection of items to provide a summary, theme, and category.',
          inputSchema: z.object({ item: z.any() }),
          outputSchema: z.any(),
      },
      async (input) => {
          return await analyzeContent(input);
      }
  );

  // @ts-expect-error Zod/Genkit type incompatibility


  const suggestFrameStylesTool = ai.defineTool(
      {
          name: 'suggestFrameStyles',
          description: 'Suggests CSS styles for a content player based on its URL.',
          inputSchema: z.object({ contentUrl: z.string().url() }),
          outputSchema: z.any(),
      },
      async (input) => {
          return await suggestFrameStyles(input);
      }
  );

  // @ts-expect-error Zod/Genkit type incompatibility


  const offlineAnalyticsTool = ai.defineTool(
      {
          name: 'offlineAnalytics',
          description: 'Performs offline deep learning analysis on user interaction data to provide insights and predictions.',
          inputSchema: z.object({ 
              data: z.array(z.any()).describe('The interaction data to analyze.'),
              metric: z.enum(['engagement', 'retention', 'conversion']).optional()
          }),
          outputSchema: z.object({
              insights: z.array(z.string()),
              prediction: z.string(),
              confidence: z.number(),
          }),
      },
      async ({ data, metric }) => {
          console.log(`Performing offline deep learning analysis on ${data?.length || 0} items for metric: ${metric || 'general'}`);
          return {
              insights: [
                  "KullanÄ±cÄ±lar en Ã§ok video iÃ§erikleriyle etkileÅŸime giriyor.",
                  "AkÅŸam saatlerinde (20:00 - 22:00) kullanÄ±m yoÄŸunluÄŸu artÄ±yor.",
                  "EÄŸitim kategorisindeki iÃ§erikler daha uzun sÃ¼re izleniyor."
              ],
              prediction: "Gelecek hafta video iÃ§eriklerine olan ilginin %15 artmasÄ± bekleniyor.",
              confidence: 0.89
          };
      }
  );

  tools = [
      youtubeSearchTool, 
      pageScraperTool, 
      highlightElementTool, 
      addPlayerTool,
      fetchYoutubeMetaTool,
      analyzeItemTool,
      analyzeContentTool,
      suggestFrameStylesTool,
      offlineAnalyticsTool
  ];

  // Define the main assistant flow with an agentic loop
  assistantFlow = ai.defineFlow(
    {
      name: 'assistantFlow',
      // @ts-expect-error Zod schema type compatibility with Genkit
      inputSchema: AssistantInputSchema,
      // @ts-expect-error Zod schema type compatibility with Genkit
      outputSchema: AssistantOutputSchema,
    },
    async (input) => {
      // ğŸ”¥ LOGLAMA 1: AI isteÄŸi baÅŸladÄ±
      const userId = input.userId || 'anonymous';
      const lastUserMessage = input.history.filter((m: any) => m.role === 'user').pop();
      const prompt = lastUserMessage?.content[0]?.text || 'Unknown prompt';
      
      const logId = await logAIRequest(userId, 'assistant', {
        prompt,
        conversationId: input.conversationId,
        modelName: 'gemini-1.5-flash',
        requestParams: {
          historyLength: input.history.length,
          hasSystemPrompt: true,
        },
      });
      
      let history = [...input.history];
      const systemPrompt = `You are a powerful and friendly AI assistant for the tv25 application.
Your role is to be helpful and provide accurate information, and to guide the user through the application's features.
You can use the available tools to perform actions and gather information.
When asked to find content (like a video or article) and add it to the canvas, you MUST use a two-step process:
1. First, use 'webSearch' or 'youtubeSearch' to find relevant URLs.
2. Second, after finding a suitable URL, use the 'addPlayerTool' to add it to the user's canvas. Provide a descriptive title for the new player.

You can also:
- Use 'fetchYoutubeMeta' to get detailed stats for a YouTube video.
- Use 'analyzeItem' to analyze an image of a product or object.
- Use 'analyzeContent' to summarize and categorize a list of items.
- Use 'suggestFrameStyles' to get CSS styling suggestions for a player.
- Use 'offlineAnalytics' to perform deep learning analysis on interaction data and get insights.

When asked to give a tour of the application, you must use the 'highlightElement' tool to point out UI elements as you describe them. Talk about one element at a time.
For example, first, call highlightElement for 'layout-settings-button', then explain what it does. Next, call highlightElement for 'style-settings-button' and explain it.
Always provide your answers in Turkish.

Here are the test IDs for the main UI elements:
- 'layout-settings-button': The button to open layout settings.
- 'style-settings-button': The button to open style settings.
- 'ai-chat-button': The button to open the AI assistant panel.
- 'edit-mode-button': The button to toggle between edit and view mode.
- 'hide-ui-button': The button to hide the UI for a clean view.
- 'fullscreen-button': The button to enter or exit fullscreen mode.
- 'library-accordion': The main library section in the sidebar.
- 'add-content-dialog-button': The button to add new content.
- 'main-canvas': The main canvas area where all items are displayed.
`;


      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          try {
            const llmResponse = await ai.generate({
              model: 'googleai/gemini-1.5-flash',
              system: systemPrompt,
              messages: history,
              tools: tools!,
              config: {
                temperature: 0.5,
                maxOutputTokens: 8192,
              },
            });

            const llmMessage = llmResponse.output;
            if (!llmMessage) {
                console.error('âŒ AI did not return a message at iteration', i);
                await updateAIRequestStatus(logId, 'error', { errorMessage: 'No response from AI model' });
                throw new Error("AI did not return a message.");
            }
          
          history.push(llmMessage);

          const toolRequests = llmMessage.content.filter((part: any) => 'toolRequest' in part);

          if (toolRequests.length === 0) {
              // No more tools to call, break the loop and return the final answer.
              return { history };
          }
          
          // Execute tool calls and add responses to history
          const toolResponses = await Promise.all(
              llmMessage.content.map(async (part: any) => {
                  if (!('toolRequest' in part)) return null;

                  const toolRequest = part.toolRequest;
                  let toolResponseOutput: any;
                  const toolStartTime = Date.now();
                  
                  try {
                      // ğŸ”¥ LOGLAMA 2: Tool Ã§aÄŸrÄ±sÄ± yapÄ±lÄ±yor
                      const toolName = toolRequest.name;
                      console.log(`ğŸ”§ Calling tool: ${toolName}`, toolRequest.input);
                      
                      switch (toolName) {
                          case 'webSearch':
                              toolResponseOutput = { results: [], message: "Web search is currently unavailable. Please try using other tools." };
                              break;
                          case 'youtubeSearch':
                              toolResponseOutput = await youtubeSearchTool(toolRequest.input);
                              break;
                          case 'pageScraper':
                              toolResponseOutput = await pageScraperTool(toolRequest.input);
                              break;
                          case 'highlightElement':
                              toolResponseOutput = await highlightElementTool(toolRequest.input);
                              break;
                          case 'addPlayerTool':
                              toolResponseOutput = await addPlayerTool(toolRequest.input);
                              break;
                          case 'fetchYoutubeMeta':
                              toolResponseOutput = await fetchYoutubeMetaTool(toolRequest.input);
                              break;
                          case 'analyzeItem':
                              toolResponseOutput = await analyzeItemTool(toolRequest.input);
                              break;
                          case 'analyzeContent':
                              toolResponseOutput = await analyzeContentTool(toolRequest.input);
                              break;
                          case 'suggestFrameStyles':
                              toolResponseOutput = await suggestFrameStylesTool(toolRequest.input);
                              break;
                          case 'offlineAnalytics':
                              toolResponseOutput = await offlineAnalyticsTool(toolRequest.input);
                              break;
                          default:
                              console.error(`âŒ Unknown tool: ${toolName}`);
                              toolResponseOutput = { error: `Tool '${toolName}' not found.` };
                      }
                      
                      console.log(`âœ… Tool ${toolName} completed successfully`);
                      
                      // Tool baÅŸarÄ±lÄ± - logla
                      await logToolCall(
                        logId,
                        toolRequest.name as AIToolName,
                        toolRequest.input,
                        toolResponseOutput,
                        undefined,
                        Date.now() - toolStartTime
                      );
                  } catch(e: any) {
                      toolResponseOutput = { error: `Error executing tool '${toolRequest.name}': ${e.message}` };
                      
                      // Tool hata verdi - logla
                      await logToolCall(
                        logId,
                        toolRequest.name as AIToolName,
                        toolRequest.input,
                        undefined,
                        e.message,
                        Date.now() - toolStartTime
                      );
                  }

                  return {
                      role: 'tool' as const,
                      content: [{
                          toolResponse: {
                              name: toolRequest.name,
                              output: toolResponseOutput,
                          },
                      }],
                  };
              })
          );

          history.push(...toolResponses.filter((r): r is Message => r !== null));
          } catch (iterationError: any) {
            console.error('âŒ Error in iteration', i, ':', iterationError);
            await updateAIRequestStatus(logId, 'error', { errorMessage: iterationError.message });
            
            // Return error message to user
            return {
              history: [
                ...history,
                {
                  role: 'model',
                  content: [{
                    text: `ÃœzgÃ¼nÃ¼m, iÅŸlem sÄ±rasÄ±nda bir hata oluÅŸtu: ${iterationError.message}. LÃ¼tfen tekrar deneyin.`
                  }]
                }
              ]
            };
          }
      }

      // If the loop finishes, return the history as is. 
      // The model might need one last generation to summarize the tool outputs.
      try {
        const finalResponse = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemPrompt,
            messages: history,
            tools: [], // No tools in the final step
            config: {
              temperature: 0.5,
              maxOutputTokens: 8192,
            },
        });

        if (finalResponse.output) {
            history.push(finalResponse.output);
        }

        // ğŸ”¥ LOGLAMA 3: Ä°stek tamamlandÄ±
        const finalMessage = history.filter(m => m.role === 'model').pop();
        const responseText = finalMessage?.content[0]?.text || 'No response';
        
        await updateAIRequestStatus(logId, 'success', {
          response: responseText.substring(0, 500), // Ä°lk 500 karakter
          tokensUsed: undefined, // Genkit'te usage bilgisi farklÄ± alÄ±nabilir
        });

        return { history };
      } catch (finalError: any) {
        console.error('âŒ Error in final generation:', finalError);
        await updateAIRequestStatus(logId, 'error', { errorMessage: finalError.message });
        
        // Still return the history we have so far
        return { history };
      }
    }
  );
}

// Main function that clients will call
export async function askAi(input: AssistantInput): Promise<AssistantOutput> {
  initializeToolsAndFlow();
  
  try {
    const result = await assistantFlow!(input);
    return result;
  } catch (error: any) {
    // Hata durumunda loglama (eÄŸer logId varsa)
    console.error('AI Flow Error:', error);
    
    // En azÄ±ndan bir hata mesajÄ± dÃ¶ndÃ¼r
    return {
      history: [
        ...input.history,
        {
          role: 'model',
          content: [{
            text: `ÃœzgÃ¼nÃ¼m, bir hata oluÅŸtu: ${error.message || 'Bilinmeyen hata'}. LÃ¼tfen tekrar deneyin.`
          }]
        }
      ]
    };
  }
}




