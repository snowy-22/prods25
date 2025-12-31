import { z } from 'zod';

// Define the schema for a single message part (text, tool call, etc.)
const MessagePartSchema = z.union([
  z.object({ text: z.string() }),
  z.object({
    toolRequest: z.object({
      name: z.string(),
      input: z.any(),
    }),
  }),
  z.object({
    toolResponse: z.object({
      name: z.string(),
      output: z.any(),
    }),
  }),
]);

// Define the schema for a single message in the chat history
export const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.array(MessagePartSchema),
});
export type Message = z.infer<typeof MessageSchema>;

// Define the input schema for the main assistant flow
export const AssistantInputSchema = z.object({
  history: z.array(MessageSchema),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

// Define the output schema for the main assistant flow
export const AssistantOutputSchema = z.object({
  history: z.array(MessageSchema),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;
