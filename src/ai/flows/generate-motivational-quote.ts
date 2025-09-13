'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a motivational quote.
 * It uses an AI model to generate an original quote from a fictional persona.
 *
 * It includes:
 * - `generateMotivationalQuote`: An exported function that returns a quote.
 * - `GenerateMotivationalQuoteOutput`: The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the output schema, matching what the component expects.
const GenerateMotivationalQuoteOutputSchema = z.object({
  quote: z.string().describe('A short, inspiring, and original quote about productivity or motivation. Should not be a known or famous quote.'),
  author: z.string().describe('The fictional persona who is the author of the quote.'),
});
export type GenerateMotivationalQuoteOutput = z.infer<typeof GenerateMotivationalQuoteOutputSchema>;

// Input is not used by the new flow, but we keep the type for compatibility with the calling component.
const GenerateMotivationalQuoteInputSchema = z.array(z.object({
  title: z.string(),
  completed: z.boolean(),
}));
export type GenerateMotivationalQuoteInput = z.infer<typeof GenerateMotivationalQuoteInputSchema>;

export async function generateMotivationalQuote(input: GenerateMotivationalQuoteInput): Promise<GenerateMotivationalQuoteOutput> {
  return generateQuoteFlow(input);
}

const generateQuotePrompt = ai.definePrompt({
  name: 'generateQuotePrompt',
  input: { schema: GenerateMotivationalQuoteInputSchema },
  output: { schema: GenerateMotivationalQuoteOutputSchema },
  prompt: `You are a wise and insightful productivity guru. 
  Generate a short, original, and motivational quote about productivity, focus, or getting things done. 
  The quote should be insightful but not a common cliché.
  Then, provide a fictional, inspiring-sounding name for yourself as the author.`,
  config: {
    temperature: 0.9,
  },
});

const generateQuoteFlow = ai.defineFlow(
  {
    name: 'generateQuoteFlow',
    inputSchema: GenerateMotivationalQuoteInputSchema,
    outputSchema: GenerateMotivationalQuoteOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await generateQuotePrompt(input);
      return output!;
    } catch (error) {
      console.error('Failed to generate AI quote:', error);
      // Return a reliable fallback quote if the AI fails.
      return {
        quote: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
      };
    }
  }
);