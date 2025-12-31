
'use server';
/**
 * @fileOverview An AI flow to analyze an image of a product,
 * search the web for it, and return structured data including pricing and reviews.
 */

import { ai } from '@/ai/genkit';
import { ItemAnalysisInputSchema, ItemAnalysisOutputSchema, type ItemAnalysisInput, type ItemAnalysisOutput } from './analyze-item-schema';
// import { googleSearch } from '@genkit-ai/google-genai';

// Main function that clients will call
export async function analyzeItem(input: ItemAnalysisInput): Promise<ItemAnalysisOutput> {
  return analyzeItemFlow(input);
}

// const webSearchTool = googleSearch('webSearch');
// const youtubeSearchTool = googleSearch('youtubeSearch');

const analysisPrompt = ai.definePrompt({
    name: 'analyzeItemPrompt',
    input: { schema: ItemAnalysisInputSchema },
    output: { schema: ItemAnalysisOutputSchema },
    // tools: [webSearchTool, youtubeSearchTool],
    prompt: `You are an expert product and image analyst with web search capabilities. Your task is to analyze the provided image, identify the main subject (it could be a product, a landmark, a piece of art, etc.), and perform comprehensive analysis.

    Based on the image and your knowledge, extract the following information:
    *   **title:** The full, official name of the item.
    *   **description:** A detailed summary of what the item is, its main function, features, or significance.
    *   **category:** The category this item belongs to (e.g., Electronics, Clothing, Food, Furniture).
    *   **brand:** The brand name if visible or identifiable.
    *   **barcode:** Any barcode number visible on the product (EAN-13, UPC, QR code content, etc.).
    *   **sku:** Product SKU or model number if visible.
    *   **detectedLabels:** List of labels describing visible elements in the image (e.g., "bottle", "smartphone", "chair").
    *   **webEntities:** Related concepts and entities found through web knowledge (with confidence scores 0-1).
    *   **imageUrl:** Find a high-quality, clear image URL of the item from the web.
    *   **priceLinks:** If the item is a commercial product, search for it on e-commerce sites (especially Turkish sites like Hepsiburada, Trendyol, N11, Amazon.com.tr) and provide up to 5 links with store name, URL, and price if available.
    *   **reviewVideos:** Search YouTube for up to 3 popular review or informational videos about the item and provide their titles and URLs.

    Focus on accurate product identification, especially for consumer electronics, household items, and retail products.
    If you detect a barcode, try to decode it and use it to find exact product information.
    Provide Turkish language results for Turkish e-commerce sites.

    You must provide a response in the specified JSON format.

    Image to analyze: {{media url=imageUri}}
    `,
});

const analyzeItemFlow = ai.defineFlow(
  {
    name: 'analyzeItemFlow',
    inputSchema: ItemAnalysisInputSchema,
    outputSchema: ItemAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    if (!output) {
      throw new Error('AI analysis failed to produce a valid output. The model might not have found enough information or could not format it correctly.');
    }
    return output;
  }
);
