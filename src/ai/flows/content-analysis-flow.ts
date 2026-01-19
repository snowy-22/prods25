

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ContentItem } from '@/lib/initial-content'; // Assuming this type definition exists

// Define Zod schemas for input and output
const ContentAnalysisInputSchema = z.object({
  item: z.any().describe('The folder or list ContentItem to analyze, including its children.'),
});

const ContentAnalysisOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the content in the list.'),
  theme: z.string().describe('The overall theme of the content.'),
  category: z.string().describe('A suggested category for the list (e.g., Education, Entertainment, Technology).'),
  tags: z.array(z.string()).describe('A list of relevant keywords or tags.'),
  suggestedNames: z.array(z.string()).describe('A few alternative, catchy names for the list.'),
  suggestedDescription: z.string().describe('A suggested, engaging description for the list.'),
});

export type ContentAnalysisInput = z.infer<typeof ContentAnalysisInputSchema>;
export type ContentAnalysisOutput = z.infer<typeof ContentAnalysisOutputSchema>;

// Define the main function that clients will call
export async function analyzeContent(input: ContentAnalysisInput): Promise<ContentAnalysisOutput> {
  initializeFlows();
  return contentAnalysisFlow!(input);
}

// Create a text representation of the content for the LLM
function formatContentForAnalysis(item: ContentItem): string {
    if (!item.children || item.children.length === 0) {
        // If it's a single item, describe it
        return `- ${item.title} (${item.type}): ${item.url || item.content || ''}`;
    }

    // If it's a folder/list, describe its children
    const childDescriptions = item.children.map(child =>
        `  - ${child.title} (${child.type}): ${child.url || ''}`
    ).join('\n');

    return `Liste Adı: "${item.title}"\nİçerikler:\n${childDescriptions}`;
}

// Lazy initialization - defer AI flow definitions until needed
let analysisPrompt: ReturnType<typeof ai.definePrompt> | null = null;
let contentAnalysisFlow: ReturnType<typeof ai.defineFlow> | null = null;

function initializeFlows() {
  if (analysisPrompt && contentAnalysisFlow) return;
  
  analysisPrompt = ai.definePrompt({
    name: 'contentAnalysisPrompt',
    // @ts-expect-error Zod/Genkit type incompatibility
    input: { schema: ContentAnalysisInputSchema },
    // @ts-expect-error Zod/Genkit type incompatibility
    output: { schema: ContentAnalysisOutputSchema },
    prompt: `You are a content curator and SEO expert. Analyze the following list of content items.
Based on the titles and URLs, provide a comprehensive analysis.

${'{{#if item}}'}
Content to analyze:
{{{formatContentForAnalysis item}}}
${'{{/if}}'}

Your analysis must include:
- A concise summary of what the list is about.
- The central theme or topic.
- The most fitting category for this collection.
- A list of 5-7 relevant tags/keywords.
- 3 creative and engaging alternative names for this list.
- A well-written, engaging description for the list.

Please provide the output in the specified JSON format.
`,
  });

  contentAnalysisFlow = ai.defineFlow(
    {
      name: 'contentAnalysisFlow',
      // @ts-expect-error Zod/Genkit type incompatibility
      inputSchema: ContentAnalysisInputSchema,
      // @ts-expect-error Zod/Genkit type incompatibility
      outputSchema: ContentAnalysisOutputSchema,
    },
    async (input) => {
      const { output } = await analysisPrompt!(input);
      if (!output) {
        throw new Error('AI analysis failed to produce a valid output.');
      }
      return output;
    }
  );
}


