'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/context/TaskContext';
import { generateMotivationalQuote } from '@/ai/flows/generate-motivational-quote';
import { Lightbulb } from 'lucide-react';
import type { Task } from '@/lib/types';

export function AiQuoteWidget() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [quote, setQuote] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);

  const tasksForQuote = useMemo(() => {
    return tasks.map(t => ({
      title: t.title,
      completed: t.completed,
    }));
  }, [tasks]);

  useEffect(() => {
    const getQuote = async (tasksToAnalyze: { title: string; completed: boolean }[]) => {
      if (tasksLoading) return;
      
      setIsGenerating(true);
      try {
        const result = await generateMotivationalQuote(tasksToAnalyze);
        setQuote(result.quote);
      } catch (error) {
        console.error('Failed to get AI quote:', error);
        // Fallback quote
        setQuote("The secret of getting ahead is getting started.");
      } finally {
        setIsGenerating(false);
      }
    };

    getQuote(tasksForQuote);
  }, [tasksForQuote, tasksLoading]);

  if (tasksLoading) {
      return null;
  }

  return (
    <div className="mb-6">
      <Card className="bg-transparent shadow-none border-0">
        <CardContent className="p-0">
          {isGenerating ? (
            <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
            </div>
          ) : (
            <blockquote className="text-center">
              <p className="text-lg font-quote italic text-muted-foreground">"{quote}"</p>
            </blockquote>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
