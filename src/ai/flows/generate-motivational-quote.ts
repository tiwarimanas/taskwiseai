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
  quote: z.string().describe('A short, inspiring quote related to the user\'s task status. It should not be a generic productivity quote.'),
});
export type GenerateMotivationalQuoteOutput = z.infer<typeof GenerateMotivationalQuoteOutputSchema>;

export async function generateMotivationalQuote(input: GenerateMotivationalQuoteInput): Promise<GenerateMotivationalQuoteOutput> {
  return generateMotivationalQuoteFlow(input);
}

const generateQuotePrompt = ai.definePrompt({
  name: 'generateMotivationalQuotePrompt',
  input: { schema: GenerateMotivationalQuoteInputSchema },
  output: { schema: GenerateMotivationalQuoteOutputSchema },
  prompt: `You are a wise and encouraging mentor. Look at the user's list of tasks and generate a short, unique, and inspiring quote (about 10-20 words) that reflects their current situation.

- If they have many tasks, inspire them to start.
- If they have few tasks, encourage them to focus.
- If they've completed many tasks, praise their progress.
- If they have no tasks, motivate them to think about their goals.

Do not be generic. Make the quote feel personal and insightful based on the list.

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
      return { quote: "An empty list is a blank canvas. What will you create today?" };
    }
    const { output } = await generateQuotePrompt(input);
    return output!;
  }
);
