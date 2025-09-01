'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a relevant category for a task.
 *
 * It includes:
 * - `generateTaskCategory`: An exported function that takes a task title and description and returns a single, relevant category.
 * - `GenerateTaskCategoryInput`: The input type for the function.
 * - `GenerateTaskCategoryOutput`: The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the input schema for the flow.
const GenerateTaskCategoryInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().describe('The description of the task.'),
});
export type GenerateTaskCategoryInput = z.infer<typeof GenerateTaskCategoryInputSchema>;

// Define the output schema for the flow.
const GenerateTaskCategoryOutputSchema = z.object({
  category: z.string().describe('A single, relevant category for the task (e.g., "Work", "Personal", "Health", "Finance").'),
});
export type GenerateTaskCategoryOutput = z.infer<typeof GenerateTaskCategoryOutputSchema>;

// Exported function to generate the task category.
export async function generateTaskCategory(input: GenerateTaskCategoryInput): Promise<GenerateTaskCategoryOutput> {
  return generateTaskCategoryFlow(input);
}

// Define the prompt for generating the task category.
const generateTaskCategoryPrompt = ai.definePrompt({
  name: 'generateTaskCategoryPrompt',
  input: { schema: GenerateTaskCategoryInputSchema },
  output: { schema: GenerateTaskCategoryOutputSchema },
  prompt: `Based on the following task title and description, generate a single, concise category for it.
Examples: Work, Personal, Shopping, Health, Finance, Project Alpha.

Title: "{{title}}"
Description: "{{description}}"
`,
});

// Define the Genkit flow for generating the task category.
const generateTaskCategoryFlow = ai.defineFlow(
  {
    name: 'generateTaskCategoryFlow',
    inputSchema: GenerateTaskCategoryInputSchema,
    outputSchema: GenerateTaskCategoryOutputSchema,
  },
  async (input) => {
    const { output } = await generateTaskCategoryPrompt(input);
    return output!;
  }
);
