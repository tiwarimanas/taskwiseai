'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Task, Category } from '@/lib/types';
import { initialCategories } from '@/lib/initial-data';
import { DashboardCharts } from './DashboardCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import * as taskService from '@/services/taskService';
import { useToast } from '@/hooks/use-toast';
import { SidebarTrigger } from './ui/sidebar';

export function DashboardClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userTasks = await taskService.getTasks(user.uid);
      setTasks(userTasks);
    } catch (error) {
      console.error('Failed to fetch tasks for dashboard:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch dashboard data.',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const dashboardData = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(
      (t) => !t.completed && t.deadline && new Date() > t.deadline
    ).length;

    const taskStatusData = [
      { name: 'Pending', value: pendingTasks, fill: 'hsl(var(--chart-1))' },
      { name: 'Completed', value: completedTasks, fill: 'hsl(var(--chart-2))' },
    ];

    const tasksByCategoryData = categories.map((cat) => ({
      name: cat.name,
      tasks: tasks.filter((task) => task.category === cat.id).length,
      fill: `hsl(var(--chart-${categories.findIndex(c => c.id === cat.id) + 1}))`,
    }));

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      taskStatusData,
      tasksByCategoryData,
    };
  }, [tasks, categories]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8 flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <div>
            <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
            <p className="text-muted-foreground">A visual overview of your productivity.</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{dashboardData.totalTasks}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
           {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{dashboardData.completedTasks}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
           {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{dashboardData.pendingTasks}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
           {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold text-destructive">{dashboardData.overdueTasks}</div>}
          </CardContent>
        </Card>
      </div>

      <DashboardCharts data={dashboardData} loading={loading} />
    </div>
  );
}
