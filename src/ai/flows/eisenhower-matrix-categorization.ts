'use server';

/**
 * @fileOverview This file defines a Genkit flow for categorizing a task into the Eisenhower Matrix.
 *
 * It includes:
 * - `categorizeTaskEisenhower`: An exported function that takes task details and returns its Eisenhower Matrix quadrant.
 * - `CategorizeTaskEisenhowerInput`: The input type for the function.
 * - `CategorizeTaskEisenhowerOutput`: The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the input schema for the flow.
const CategorizeTaskEisenhowerInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().describe('The description of the task.'),
  deadline: z.string().describe('The deadline for the task (ISO format).'),
});
export type CategorizeTaskEisenhowerInput = z.infer<typeof CategorizeTaskEisenhowerInputSchema>;

// Define the output schema for the flow.
const CategorizeTaskEisenhowerOutputSchema = z.object({
  quadrant: z
    .enum(['UrgentImportant', 'NotUrgentImportant', 'UrgentNotImportant', 'NotUrgentNotImportant'])
    .describe('The Eisenhower Matrix quadrant for the task.'),
  reason: z.string().describe('A brief explanation for the categorization.'),
});
export type CategorizeTaskEisenhowerOutput = z.infer<typeof CategorizeTaskEisenhowerOutputSchema>;

// Exported function to categorize the task.
export async function categorizeTaskEisenhower(input: CategorizeTaskEisenhowerInput): Promise<CategorizeTaskEisenhowerOutput> {
  return categorizeTaskEisenhowerFlow(input);
}

// Define the prompt for the categorization.
const categorizeTaskPrompt = ai.definePrompt({
  name: 'categorizeTaskEisenhowerPrompt',
  input: { schema: CategorizeTaskEisenhowerInputSchema },
  output: { schema: CategorizeTaskEisenhowerOutputSchema },
  prompt: `You are an expert in productivity and time management. Analyze the following task and categorize it into one of the four quadrants of the Eisenhower Matrix based on its urgency and importance.
  
  - Urgent & Important (UrgentImportant): Tasks you will do immediately.
  - Not Urgent & Important (NotUrgentImportant): Tasks you will schedule to do later.
  - Urgent & Not Important (UrgentNotImportant): Tasks you will delegate to someone else.
  - Not Urgent & Not Important (NotUrgentNotImportant): Tasks that you will eliminate.

  Consider the deadline for urgency. A closer deadline means more urgent.
  Consider the description for importance. Tasks related to long-term goals, career, relationships, or health are generally important.
  
  Task Title: "{{title}}"
  Task Description: "{{description}}"
  Task Deadline: "{{deadline}}"
  
  Provide the quadrant and a brief reason for your choice.`,
});

// Define the Genkit flow for categorization.
const categorizeTaskEisenhowerFlow = ai.defineFlow(
  {
    name: 'categorizeTaskEisenhowerFlow',
    inputSchema: CategorizeTaskEisenhowerInputSchema,
    outputSchema: CategorizeTaskEisenhowerOutputSchema,
  },
  async (input) => {
    const { output } = await categorizeTaskPrompt(input);
    return output!;
  }
);
