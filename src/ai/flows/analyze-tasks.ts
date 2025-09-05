'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a list of tasks and providing insights.
 *
 * It includes:
 * - `analyzeTasks`: An exported function that takes a list of tasks and returns an analysis.
 * - `AnalyzeTasksInput`: The input type for the function.
 * - `AnalyzeTasksOutput`: The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TaskSchema = z.object({
  title: z.string().describe('The title of the task.'),
  completed: z.boolean().describe('Whether the task is completed.'),
  deadline: z.string().nullable().describe('The deadline for the task (ISO format), if any.'),
});

const AnalyzeTasksInputSchema = z.array(TaskSchema).describe('An array of tasks to analyze.');
export type AnalyzeTasksInput = z.infer<typeof AnalyzeTasksInputSchema>;

const AnalyzeTasksOutputSchema = z.object({
  analysis: z.string().describe('A brief, insightful, and encouraging analysis of the tasks. Should be 2-3 sentences max.'),
});
export type AnalyzeTasksOutput = z.infer<typeof AnalyzeTasksOutputSchema>;

export async function analyzeTasks(input: AnalyzeTasksInput): Promise<AnalyzeTasksOutput> {
  return analyzeTasksFlow(input);
}

const analyzeTasksPrompt = ai.definePrompt({
  name: 'analyzeTasksPrompt',
  input: { schema: AnalyzeTasksInputSchema },
  output: { schema: AnalyzeTasksOutputSchema },
  prompt: `You are a productivity assistant. Analyze the following list of tasks and provide a brief, insightful, and encouraging summary (2-3 sentences). 

Consider the total number of tasks, how many are completed, and if any are overdue (deadline is in the past). 
Start with a key insight and end with a motivational sentence to help the user focus.
Today's date is ${new Date().toDateString()}.

Here are the tasks:
{{#each this}}
- Task: "{{title}}", Completed: {{completed}}{{#if deadline}}, Deadline: {{deadline}}{{/if}}
{{/each}}
`,
});

const analyzeTasksFlow = ai.defineFlow(
  {
    name: 'analyzeTasksFlow',
    inputSchema: AnalyzeTasksInputSchema,
    outputSchema: AnalyzeTasksOutputSchema,
  },
  async (input) => {
    // Prevent calling the AI with an empty list of tasks.
    if (input.length === 0) {
      return { analysis: "You have no tasks. Add one to get started!" };
    }
    const { output } = await analyzeTasksPrompt(input);
    return output!;
  }
);
