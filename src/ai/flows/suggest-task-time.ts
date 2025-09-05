'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal time slots for a new task.
 *
 * It includes:
 * - `suggestTaskTime`: An exported function that takes existing tasks and a date to suggest times.
 * - `SuggestTaskTimeInput`: The input type for the function.
 * - `SuggestTaskTimeOutput`: The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the schema for a single task with its deadline.
const TaskDeadlineSchema = z.object({
  title: z.string().describe('The title of the existing task.'),
  deadline: z.string().describe('The ISO string of the existing task\'s deadline.'),
});

// Define the input schema for the flow.
const SuggestTaskTimeInputSchema = z.object({
  existingTasks: z.array(TaskDeadlineSchema).describe('A list of tasks already scheduled for the selected day.'),
  forDate: z.string().describe('The date (ISO string) for which to suggest times.'),
  taskTitle: z.string().describe('The title of the new task to be scheduled.'),
});
export type SuggestTaskTimeInput = z.infer<typeof SuggestTaskTimeInputSchema>;

// Define the output schema for the flow.
const SuggestTaskTimeOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of up to 4 suggested time slots in HH:mm format (e.g., "09:30", "14:00").'),
});
export type SuggestTaskTimeOutput = z.infer<typeof SuggestTaskTimeOutputSchema>;


export async function suggestTaskTime(input: SuggestTaskTimeInput): Promise<SuggestTaskTimeOutput> {
  return suggestTaskTimeFlow(input);
}

// Define the prompt for suggesting times.
const suggestTimePrompt = ai.definePrompt({
  name: 'suggestTaskTimePrompt',
  input: { schema: SuggestTaskTimeInputSchema },
  output: { schema: SuggestTaskTimeOutputSchema },
  prompt: `You are a smart scheduling assistant. Your goal is to find up to 4 optimal time slots for a new task on a given day, considering the user's existing schedule.

Analyze the list of existing tasks and their deadlines for the date: {{forDate}}.
The new task to schedule is: "{{taskTitle}}".

Assume standard working hours are between 08:00 and 18:00.
Avoid suggesting times that are too close to other deadlines. Leave at least a 1-hour gap between tasks if possible.
Return the suggestions as an array of strings in "HH:mm" 24-hour format.

Here are the tasks already scheduled for that day:
{{#each existingTasks}}
- "{{this.title}}" at {{this.deadline}}
{{else}}
No other tasks scheduled for this day.
{{/each}}
`,
});

// Define the Genkit flow for time suggestion.
const suggestTaskTimeFlow = ai.defineFlow(
  {
    name: 'suggestTaskTimeFlow',
    inputSchema: SuggestTaskTimeInputSchema,
    outputSchema: SuggestTaskTimeOutputSchema,
  },
  async (input) => {
    const { output } = await suggestTimePrompt(input);
    return output!;
  }
);
