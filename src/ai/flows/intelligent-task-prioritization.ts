'use server';

/**
 * @fileOverview Implements the intelligent task prioritization flow using AI to assess task importance based on deadlines and impact.
 *
 * - intelligentTaskPrioritization - A function that prioritizes tasks based on AI assessment.
 * - IntelligentTaskPrioritizationInput - The input type for the intelligentTaskPrioritization function.
 * - IntelligentTaskPrioritizationOutput - The return type for the intelligentTaskPrioritization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task.'),
  title: z.string().describe('Brief title of the task.'),
  description: z.string().describe('Detailed description of the task.'),
  deadline: z.string().describe('The deadline for the task (ISO format).'),
});

const IntelligentTaskPrioritizationInputSchema = z.array(TaskSchema).describe('An array of tasks to prioritize.');
export type IntelligentTaskPrioritizationInput = z.infer<typeof IntelligentTaskPrioritizationInputSchema>;

const PrioritizedTaskSchema = TaskSchema.extend({
  priorityScore: z.number().describe('A numerical score indicating the task\u0027s priority (higher is more important).'),
  reason: z.string().describe('Explanation of why the task was assigned the given priority score.'),
});

const IntelligentTaskPrioritizationOutputSchema = z.array(PrioritizedTaskSchema).describe('An array of tasks with assigned priority scores and reasons.');
export type IntelligentTaskPrioritizationOutput = z.infer<typeof IntelligentTaskPrioritizationOutputSchema>;

export async function intelligentTaskPrioritization(input: IntelligentTaskPrioritizationInput): Promise<IntelligentTaskPrioritizationOutput> {
  return intelligentTaskPrioritizationFlow(input);
}

const estimateEffortAndImpact = ai.defineTool(
  {
    name: 'estimateEffortAndImpact',
    description: 'Estimates the effort (in hours) and impact (on a scale of 1-10) for a given task.',
    inputSchema: z.object({
      taskTitle: z.string().describe('The title of the task.'),
      taskDescription: z.string().describe('The description of the task.'),
      deadline: z.string().describe('The deadline for the task (ISO format).'),
    }),
    outputSchema: z.object({
      effortHours: z.number().describe('Estimated effort in hours to complete the task.'),
      impactScore: z.number().describe('Impact score of the task on a scale of 1-10.'),
    }),
  },
  async input => {
    // Placeholder implementation - replace with actual effort/impact estimation logic
    // In real implementation, this might use an LLM or a more complex algorithm
    return {
      effortHours: Math.floor(Math.random() * 10) + 1, // Random number between 1 and 10
      impactScore: Math.floor(Math.random() * 10) + 1, // Random number between 1 and 10
    };
  }
);

const prioritizeTasksPrompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  tools: [estimateEffortAndImpact],
  input: {schema: IntelligentTaskPrioritizationInputSchema},
  output: {schema: IntelligentTaskPrioritizationOutputSchema},
  prompt: `You are an AI task prioritization expert. Given a list of tasks with titles, descriptions, and deadlines, your job is to prioritize these tasks based on their urgency (proximity of deadline), estimated effort, and potential impact.

For each task, use the estimateEffortAndImpact tool to estimate the effort and impact of the task.  Then, based on the effort, impact, and deadline, calculate a priority score for each task. The priority score should be higher for tasks that are urgent (closer deadline), have a high impact, and require less effort. Return each task with its original information, along with the calculated priority score and a brief reason for the assigned score.

Here are the tasks:
{{#each this}}
Task ID: {{id}}
Title: {{title}}
Description: {{description}}
Deadline: {{deadline}}
{{/each}}
`,
});

const intelligentTaskPrioritizationFlow = ai.defineFlow(
  {
    name: 'intelligentTaskPrioritizationFlow',
    inputSchema: IntelligentTaskPrioritizationInputSchema,
    outputSchema: IntelligentTaskPrioritizationOutputSchema,
  },
  async (input, streamingCallback) => {
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const promptResult = await prioritizeTasksPrompt(input);
        return promptResult.output!;
      } catch (error: any) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error; // Rethrow the last error
        }
        console.log(`Attempt ${attempt} failed. Retrying in ${attempt} second(s)...`);
        // Wait for 1, 2 seconds for subsequent retries
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    // This should not be reached, but typescript needs a return path.
    throw new Error('Task prioritization failed after multiple retries.');
  }
);