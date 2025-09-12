'use client';

import { useState, useMemo } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/lib/types';
import Link from 'next/link';

function CalendarTaskItem({ task }: { task: Task }) {
  return (
    <Link href="/tasks">
        <div className="p-3 mb-2 border rounded-lg bg-card hover:bg-accent cursor-pointer transition-colors">
            <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
            {task.deadline && format(task.deadline, 'HH:mm') !== '00:00' && (
                <p className="text-xs text-muted-foreground">{format(task.deadline, 'p')}</p>
            )}
        </div>
    </Link>
  );
}


export function CalendarPageClient() {
  const { tasks, isLoading } = useTasks();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tasksWithDeadlines = useMemo(() => {
    return tasks.filter((task) => task.deadline);
  }, [tasks]);
  
  const taskDates = useMemo(() => {
    return tasksWithDeadlines.map(task => startOfDay(task.deadline!));
  }, [tasksWithDeadlines]);

  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return tasksWithDeadlines
      .filter((task) => isSameDay(task.deadline!, selectedDate))
      .sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime());
  }, [selectedDate, tasksWithDeadlines]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Calendar</h1>
        <p className="text-muted-foreground">View your tasks by their deadlines.</p>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardContent className="p-0">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="p-3"
                    modifiers={{
                        hasTasks: taskDates,
                    }}
                    modifiersStyles={{
                        hasTasks: { 
                            fontWeight: 'bold',
                            textDecoration: 'underline',
                         },
                    }}
                    disabled={isLoading}
                />
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4 font-headline">
            Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}
          </h2>
          {isLoading ? (
            <p>Loading tasks...</p>
          ) : tasksForSelectedDay.length > 0 ? (
            <div className="space-y-2">
              {tasksForSelectedDay.map((task) => (
                <CalendarTaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No tasks due on this day.</p>
          )}
        </div>
      </main>
    </div>
  );
}
