import { z } from 'genkit';

export const SuggestFrameStylesInputSchema = z.object({
  contentUrl: z.string().describe('URL of the content to analyze for styling.'),
});
export type SuggestFrameStylesInput = z.infer<typeof SuggestFrameStylesInputSchema>;

export const SuggestFrameStylesOutputSchema = z.object({
  suggestedStyles: z.string().describe('Suggested frame styles based on content analysis.'),
});
export type SuggestFrameStylesOutput = z.infer<typeof SuggestFrameStylesOutputSchema>;
