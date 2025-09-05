'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import type { Task, Subtask } from '@/lib/types';
import { CalendarIcon, PlusCircle, Sparkles, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, parse, startOfDay } from 'date-fns';
import { useState, useEffect, useCallback, useRef } from 'react';
import { generateTaskDetails } from '@/ai/flows/generate-task-details';
import { suggestTaskTime } from '@/ai/flows/suggest-task-time';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from './ui/badge';
import * as userService from '@/services/userService';
import { useAuth } from '@/context/AuthContext';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().optional(),
  deadline: z.date().nullable(),
  deadlineTime: z.string().optional(),
  subtasks: z.array(z.object({ text: z.string().min(1, 'Subtask cannot be empty') })),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task | null;
  allTasks: Task[];
  onSave: (task: Omit<Task, 'id' | 'completed' | 'eisenhowerQuadrant'> & { id?: string }) => void;
  onClose: () => void;
  isSaving: boolean;
}

export function TaskForm({ task, allTasks, onSave, onClose, isSaving }: TaskFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSuggestingTime, setIsSuggestingTime] = useState(false);
  const [timeSuggestions, setTimeSuggestions] = useState<string[]>([]);
  
  const userKnowledgeRef = useRef<string | undefined>();

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const profile = await userService.getUserProfile(user.uid);
        userKnowledgeRef.current = profile?.knowledge;
      } catch (error) {
        console.error('Failed to fetch user profile for AI suggestions:', error);
      }
    }
    fetchProfile();
  }, [user]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      deadline: task?.deadline || null,
      deadlineTime: task?.deadline ? format(task.deadline, 'HH:mm') : '',
      subtasks: task?.subtasks?.map((s) => ({ text: s.text })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subtasks',
  });
  
  const deadlineValue = form.watch('deadline');
  const titleValue = form.watch('title');

  const handleSuggestTime = useCallback(async (deadline: Date, title: string) => {
    setIsSuggestingTime(true);
    setTimeSuggestions([]);
    try {
      const startOfSelectedDay = startOfDay(deadline);
      const tasksForDay = allTasks.filter(t => t.deadline && startOfDay(t.deadline).getTime() === startOfSelectedDay.getTime());

      const result = await suggestTaskTime({
        forDate: deadline.toISOString(),
        taskTitle: title,
        existingTasks: tasksForDay.map(t => ({ title: t.title, deadline: t.deadline!.toISOString() })),
        userKnowledge: userKnowledgeRef.current,
      });
      setTimeSuggestions(result.suggestions);

    } catch (error) {
      console.error('AI time suggestion failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Could not suggest times. Please try again.',
      });
    } finally {
      setIsSuggestingTime(false);
    }
  }, [allTasks, toast]);

  useEffect(() => {
    if (deadlineValue && titleValue && titleValue.length >= 3) {
      const handler = setTimeout(() => {
        handleSuggestTime(deadlineValue, titleValue);
      }, 500); // Debounce to avoid excessive calls
      return () => clearTimeout(handler);
    } else {
      setTimeSuggestions([]);
    }
  }, [deadlineValue, titleValue, handleSuggestTime]);


  useEffect(() => {
    if (!deadlineValue) {
      form.setValue('deadlineTime', '');
    }
  }, [deadlineValue, form]);


  const handleGenerateDetails = async () => {
    const title = form.getValues('title');
    if (!title) {
      form.setError('title', { message: 'Please enter a title first.' });
      return;
    }

    setIsGenerating(true);
    setIsAdvancedOpen(true);
    try {
      const result = await generateTaskDetails({ title });
      form.setValue('description', result.description, { shouldValidate: true });
      const newSubtasks = result.subtasks.map((st) => ({ text: st }));
      form.setValue('subtasks', newSubtasks, { shouldValidate: true });
    } catch (error) {
      console.error('AI generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: 'Could not generate task details. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = (data: TaskFormValues) => {
    const newSubtasks: Subtask[] = data.subtasks.map((st, index) => {
      const existingSubtask = task?.subtasks?.[index];
      return {
        id: existingSubtask?.id || `new_${Date.now()}_${index}`,
        text: st.text,
        completed: existingSubtask?.completed || false,
      };
    });

    let finalDeadline: Date | null = data.deadline;
    if (data.deadline && data.deadlineTime) {
      try {
        const datePart = format(data.deadline, 'yyyy-MM-dd');
        const timePart = data.deadlineTime;
        finalDeadline = parse(`${datePart}T${timePart}`, "yyyy-MM-dd'T'HH:mm", new Date());
      } catch (e) {
        console.error("Error parsing date/time", e);
        finalDeadline = data.deadline;
      }
    }
    
    const taskToSave = {
      ...task,
      ...data,
      deadline: finalDeadline,
      subtasks: newSubtasks,
    };
    onSave(taskToSave);
  };

  return (
    <DialogContent className="sm:max-w-[600px] grid-rows-[auto,1fr,auto] max-h-[90svh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
        <DialogDescription>
          {task ? 'Update the details of your task.' : ''}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 overflow-y-auto pr-4 flex-grow">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input placeholder="Task Title (e.g., Launch new marketing campaign)" {...field} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateDetails}
                    disabled={isGenerating}
                    aria-label="Generate task details with AI"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <Button type="button" variant={cn(field.value && format(field.value, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'secondary' : 'outline')} size="sm" onClick={() => field.onChange(new Date())}>Today</Button>
                  <Button type="button" variant={cn(field.value && format(field.value, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd') ? 'secondary' : 'outline')} size="sm" onClick={() => field.onChange(addDays(new Date(), 1))}>Tomorrow</Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          size="sm"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a deadline</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {deadlineValue && (
            <FormField
              control={form.control}
              name="deadlineTime"
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-center gap-2'>
                    <FormControl>
                      <Input type="time" {...field} className="w-48" placeholder="Time"/>
                    </FormControl>
                    {isSuggestingTime && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  <FormMessage />
                  {timeSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {timeSuggestions.map(time => (
                            <Badge
                                key={time}
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => form.setValue('deadlineTime', time, {shouldValidate: true})}
                            >
                                {format(parse(time, 'HH:mm', new Date()), 'p')}
                            </Badge>
                        ))}
                    </div>
                  )}
                </FormItem>
              )}
            />
          )}

          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-start px-0">
                <ChevronDown className={cn('mr-2 h-4 w-4 transition-transform', isAdvancedOpen && 'rotate-180')} />
                Advanced
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Add a more detailed description..." className="resize-y" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-2'>
                <div className="space-y-2 mt-2">
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`subtasks.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input placeholder={`Subtask ${index + 1}`} {...field} />
                            </FormControl>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Subtask
                  </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </Form>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? (task ? 'Saving...' : 'Creating...') : (task ? 'Save Changes' : 'Create Task')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
