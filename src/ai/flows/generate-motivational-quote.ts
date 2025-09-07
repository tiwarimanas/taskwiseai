'use server';

/**
 * @fileOverview This file defines a function for generating a motivational quote.
 * It fetches a random quote from the public Quotable API.
 *
 * It includes:
 * - `generateMotivationalQuote`: An exported function that returns a quote.
 * - `GenerateMotivationalQuoteOutput`: The output type for the function.
 */

import { z } from 'genkit';

// Define the output schema, matching what the component expects.
const GenerateMotivationalQuoteOutputSchema = z.object({
  quote: z.string().describe('A short, inspiring quote.'),
  author: z.string().describe('The name of the person who said the quote.'),
});
export type GenerateMotivationalQuoteOutput = z.infer<typeof GenerateMotivationalQuoteOutputSchema>;

// This input is no longer used by the API, but we keep the type for compatibility with the calling component.
const TaskSchema = z.object({
  title: z.string().describe('The title of the task.'),
  completed: z.boolean().describe('Whether the task is completed.'),
});
const GenerateMotivationalQuoteInputSchema = z.array(TaskSchema);
export type GenerateMotivationalQuoteInput = z.infer<typeof GenerateMotivationalQuoteInputSchema>;


export async function generateMotivationalQuote(input: GenerateMotivationalQuoteInput): Promise<GenerateMotivationalQuoteOutput> {
  try {
    const response = await fetch('https://api.quotable.io/random');
    if (!response.ok) {
      throw new Error(`Quotable API failed with status: ${response.status}`);
    }
    const data = await response.json();
    
    // The API returns 'content' and 'author'. We map them to 'quote' and 'author'.
    return {
      quote: data.content,
      author: data.author,
    };
  } catch (error) {
    console.error('Failed to fetch quote from Quotable API:', error);
    // Return a reliable fallback quote if the API fails.
    return {
      quote: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
    };
  }
}
