'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a motivational quote based on a list of tasks.
 *
 * It includes:
 * - `generateMotivationalQuote`: An exported function that takes a list of tasks and returns a quote.
 * - `GenerateMotivationalQuoteInput`: The input type for the function.
 * - `GenerateMotivationalQuoteOutput`: The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TaskSchema = z.object({
  title: z.string().describe('The title of the task.'),
  completed: z.boolean().describe('Whether the task is completed.'),
});

const GenerateMotivationalQuoteInputSchema = z.array(TaskSchema).describe('An array of tasks to generate a quote from.');
export type GenerateMotivationalQuoteInput = z.infer<typeof GenerateMotivationalQuoteInputSchema>;

const GenerateMotivationalQuoteOutputSchema = z.object({
  quote: z.string().describe('A short, inspiring quote from a real, famous personality related to the user\'s task status.'),
  author: z.string().describe('The name of the person who said the quote.'),
});
export type GenerateMotivationalQuoteOutput = z.infer<typeof GenerateMotivationalQuoteOutputSchema>;

export async function generateMotivationalQuote(input: GenerateMotivationalQuoteInput): Promise<GenerateMotivationalQuoteOutput> {
  return generateMotivationalQuoteFlow(input);
}

const generateQuotePrompt = ai.definePrompt({
  name: 'generateMotivationalQuotePrompt',
  input: { schema: GenerateMotivationalQuoteInputSchema },
  output: { schema: GenerateMotivationalQuoteOutputSchema },
  prompt: `You are a curator of inspiring quotes. Look at the user's list of tasks and find a short, relevant quote from a real, famous person (e.g., inventor, leader, artist, philosopher) that reflects their current situation. Provide the quote and the author.

- If they have many tasks, find a quote about getting started or overcoming overwhelm.
- If they have few tasks, find a quote about focus or quality.
- If they've completed many tasks, find a quote about achievement or perseverance.
- If they have no tasks, find a quote about planning or purpose.

The quote should feel insightful and encouraging.

Here are the tasks:
{{#each this}}
- Task: "{{title}}", Completed: {{completed}}
{{else}}
- No tasks yet.
{{/each}}
`,
});

const generateMotivationalQuoteFlow = ai.defineFlow(
  {
    name: 'generateMotivationalQuoteFlow',
    inputSchema: GenerateMotivationalQuoteInputSchema,
    outputSchema: GenerateMotivationalQuoteOutputSchema,
  },
  async (input) => {
    // Prevent calling the AI with an empty list of tasks for a custom message.
    if (input.length === 0) {
      return { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" };
    }
    const { output } = await generateQuotePrompt(input);
    return output!;
  }
);
