'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting frame styles for content players based on content analysis.
 *
 * The flow analyzes the content of a given URL and suggests frame styles to enhance the player's look and feel.
 * - suggestFrameStyles - The function to trigger the content analysis and style suggestion.
 */

import {ai} from '@/ai/genkit';
import { SuggestFrameStylesInputSchema, SuggestFrameStylesOutputSchema, type SuggestFrameStylesInput, type SuggestFrameStylesOutput } from './content-adaptive-styling-schema';


export async function suggestFrameStyles(input: SuggestFrameStylesInput): Promise<SuggestFrameStylesOutput> {
  return suggestFrameStylesFlow(input);
}

const suggestFrameStylesPrompt = ai.definePrompt({
  name: 'suggestFrameStylesPrompt',
  input: {schema: SuggestFrameStylesInputSchema},
  output: {schema: SuggestFrameStylesOutputSchema},
  prompt: `Analyze the content at the following URL: {{{contentUrl}}}. Based on the content,
  suggest CSS frame styles that would enhance the player's presentation. Consider color schemes, border styles, shadow effects, and any other relevant CSS properties. Return only the CSS code. Be consise and only return the CSS code required to style the frame.
  Do not include any introductory or explanatory text. Do not add styling for sizes. The styles should be modern, flat, and clean. Always set the border radius to 8px.
  Always set the background color to white. Always add a box shadow.
  Here is an example:
  
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  `,
});

const suggestFrameStylesFlow = ai.defineFlow(
  {
    name: 'suggestFrameStylesFlow',
    inputSchema: SuggestFrameStylesInputSchema,
    outputSchema: SuggestFrameStylesOutputSchema,
  },
  async input => {
    const {output} = await suggestFrameStylesPrompt(input);
    return output!;
  }
);
