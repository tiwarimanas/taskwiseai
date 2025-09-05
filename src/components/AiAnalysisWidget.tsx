'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/context/TaskContext';
import { analyzeTasks } from '@/ai/flows/analyze-tasks';
import { Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';

export function AiAnalysisWidget() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const { toast } = useToast();

  const tasksForAnalysis = useMemo(() => {
    return tasks.map(t => ({
      title: t.title,
      completed: t.completed,
      deadline: t.deadline ? t.deadline.toISOString() : null
    }));
  }, [tasks]);
  
  useEffect(() => {
    const getAnalysis = async (tasksToAnalyze: Task[]) => {
      if (tasksLoading) return;
      
      setIsAnalyzing(true);
      try {
        const result = await analyzeTasks(tasksToAnalyze.map(t => ({
            title: t.title,
            completed: t.completed,
            deadline: t.deadline ? t.deadline.toISOString() : null,
        })));
        setAnalysis(result.analysis);
      } catch (error) {
        console.error('Failed to get AI analysis:', error);
        // Silently fail, don't show a toast for this
      } finally {
        setIsAnalyzing(false);
      }
    };

    getAnalysis(tasks);
  }, [tasks, tasksLoading, toast]); // Re-run when tasks change

  if (tasksLoading) {
      return null; // Don't show skeleton if main task list is loading
  }

  return (
    <div className="mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">AI Analysis</CardTitle>
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{analysis}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
