// The directive tells the Next.js runtime that this code should only be executed on the server.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating task descriptions and subtasks based on a brief title.
 *
 * It includes:
 * - `generateTaskDetails`: An exported function that takes a task title and returns a detailed task description and a list of subtasks.
 * - `GenerateTaskDetailsInput`: The input type for the `generateTaskDetails` function.
 * - `GenerateTaskDetailsOutput`: The output type for the `generateTaskDetails` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the flow.
const GenerateTaskDetailsInputSchema = z.object({
  title: z.string().describe('A brief title for the task.'),
});
export type GenerateTaskDetailsInput = z.infer<typeof GenerateTaskDetailsInputSchema>;

// Define the output schema for the flow.
const GenerateTaskDetailsOutputSchema = z.object({
  description: z.string().describe('A detailed description of the task.'),
  subtasks: z.array(z.string()).describe('A list of subtasks required to complete the task.'),
});
export type GenerateTaskDetailsOutput = z.infer<typeof GenerateTaskDetailsOutputSchema>;

// Exported function to generate task details.
export async function generateTaskDetails(input: GenerateTaskDetailsInput): Promise<GenerateTaskDetailsOutput> {
  return generateTaskDetailsFlow(input);
}

// Define the prompt for generating task details.
const generateTaskDetailsPrompt = ai.definePrompt({
  name: 'generateTaskDetailsPrompt',
  input: {schema: GenerateTaskDetailsInputSchema},
  output: {schema: GenerateTaskDetailsOutputSchema},
  prompt: `Given the task title: "{{title}}", generate a detailed description of the task and a list of subtasks required to complete the task.

Description:

Subtasks:`,
});

// Define the Genkit flow for generating task details.
const generateTaskDetailsFlow = ai.defineFlow(
  {
    name: 'generateTaskDetailsFlow',
    inputSchema: GenerateTaskDetailsInputSchema,
    outputSchema: GenerateTaskDetailsOutputSchema,
  },
  async input => {
    const {output} = await generateTaskDetailsPrompt(input);
    return output!;
  }
);
