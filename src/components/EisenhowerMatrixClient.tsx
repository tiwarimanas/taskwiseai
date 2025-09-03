'use client';

import { useAuth } from '@/context/AuthContext';
import { Task } from '@/lib/types';
import * as taskService from '@/services/taskService';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type Quadrant = 'UrgentImportant' | 'NotUrgentImportant' | 'UrgentNotImportant' | 'NotUrgentNotImportant';

const quadrantTitles: Record<Quadrant, { title: string; description: string }> = {
  UrgentImportant: { title: 'Urgent & Important', description: 'Do First' },
  NotUrgentImportant: { title: 'Not Urgent & Important', description: 'Schedule' },
  UrgentNotImportant: { title: 'Urgent & Not Important', description: 'Delegate' },
  NotUrgentNotImportant: { title: 'Not Urgent & Not Important', description: 'Delete' },
};

function TaskMatrixItem({ task }: { task: Task }) {
  return (
    <Link href="/tasks" className="block">
      <div className="p-3 mb-2 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
        <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
      </div>
    </Link>
  );
}

export function EisenhowerMatrixClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categorizedTasks, setCategorizedTasks] = useState<Record<Quadrant, Task[]>>({
    UrgentImportant: [],
    NotUrgentImportant: [],
    UrgentNotImportant: [],
    NotUrgentNotImportant: [],
  });

  useEffect(() => {
    async function fetchAndCategorizeTasks() {
      if (!user) return;
      setIsLoading(true);
      try {
        const userTasks = await taskService.getTasks(user.uid);
        setTasks(userTasks);

        const newCategorizedTasks: Record<Quadrant, Task[]> = {
          UrgentImportant: [],
          NotUrgentImportant: [],
          UrgentNotImportant: [],
          NotUrgentNotImportant: [],
        };

        userTasks.forEach((task) => {
          if (task.eisenhowerQuadrant && newCategorizedTasks[task.eisenhowerQuadrant as Quadrant]) {
            newCategorizedTasks[task.eisenhowerQuadrant as Quadrant].push(task);
          }
        });
        setCategorizedTasks(newCategorizedTasks);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch your tasks for the matrix.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAndCategorizeTasks();
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Eisenhower Matrix</h1>
          <p className="text-muted-foreground">Prioritize your tasks effectively.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="min-h-[300px]">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Eisenhower Matrix</h1>
        <p className="text-muted-foreground">
          A visual overview of your tasks based on urgency and importance. Use the "Prioritize with AI" button on the Tasks page to categorize them.
        </p>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(quadrantTitles) as Quadrant[]).map((quadrant) => (
          <Card key={quadrant} className="min-h-[300px] flex flex-col">
            <CardHeader>
              <CardTitle>{quadrantTitles[quadrant].title}</CardTitle>
              <p className="text-muted-foreground">{quadrantTitles[quadrant].description}</p>
            </CardHeader>
            <CardContent className="flex-grow">
              {categorizedTasks[quadrant].length > 0 ? (
                categorizedTasks[quadrant].map((task) => <TaskMatrixItem key={task.id} task={task} />)
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No tasks in this quadrant.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
