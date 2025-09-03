'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Bot, Plus, Search, SortAsc, SortDesc } from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { intelligentTaskPrioritization } from '@/ai/flows/intelligent-task-prioritization';
import { categorizeTaskEisenhower } from '@/ai/flows/eisenhower-matrix-categorization';
import { generateTaskCategory } from '@/ai/flows/generate-task-category';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import * as taskService from '@/services/taskService';
import { Skeleton } from './ui/skeleton';
import { CountdownWidget } from './CountdownWidget';

type SortOrder = 'priority' | 'deadline' | 'title';

export function TaskPageClient() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userTasks = await taskService.getTasks(user.uid);
      setTasks(userTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch your tasks. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'completed' | 'category' | 'eisenhowerQuadrant'> & { id?: string }) => {
    if (!user) return;

    try {
      if (taskData.id) {
        // This is an update, don't regenerate category
        await taskService.updateTask(user.uid, taskData.id, taskData);
      } else {
        // This is a new task, generate category with AI
        const { category } = await generateTaskCategory({
          title: taskData.title,
          description: taskData.description || '',
        });
        const taskWithCategory = { ...taskData, category };
        await taskService.addTask(user.uid, taskWithCategory);
      }
      await fetchTasks(); // Refetch all tasks to get the latest state
    } catch (error) {
      console.error('Failed to save task:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your task. Please try again.',
      });
    }

    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!user) return;
    const originalTasks = [...tasks];
    setTasks(tasks.filter((t) => t.id !== taskId)); // Optimistic update
    try {
      await taskService.deleteTask(user.uid, taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      setTasks(originalTasks); // Revert on error
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete the task.',
      });
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    if (!user) return;
    const originalTasks = [...tasks];
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed } : t))); // Optimistic
    try {
      await taskService.updateTask(user.uid, taskId, { completed });
    } catch (error) {
      console.error('Failed to update task status:', error);
      setTasks(originalTasks); // Revert
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update task status.',
      });
    }
  };

  const handleSubtaskChange = async (taskId: string, subtaskId: string, completed: boolean) => {
    if (!user) return;
    const originalTasks = [...tasks];

    let updatedSubtasks: any[] = [];
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          updatedSubtasks = task.subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, completed } : subtask
          );
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      })
    ); // Optimistic

    try {
      await taskService.updateTask(user.uid, taskId, { subtasks: updatedSubtasks });
    } catch (error) {
      console.error('Failed to update subtask:', error);
      setTasks(originalTasks); // Revert
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update subtask.',
      });
    }
  };

  const handlePrioritize = async () => {
    if (!user) return;
    setIsPrioritizing(true);
    try {
      const tasksToPrioritize = tasks
        .filter((t) => !t.completed)
        .map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          deadline: t.deadline ? t.deadline.toISOString() : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        }));

      if (tasksToPrioritize.length === 0) {
        toast({ title: 'No tasks to prioritize', description: 'All your tasks are completed!' });
        return;
      }
      
      const [prioritizedResult, eisenhowerResult] = await Promise.all([
        intelligentTaskPrioritization(tasksToPrioritize),
        Promise.all(tasksToPrioritize.map(t => categorizeTaskEisenhower({
            title: t.title,
            description: t.description,
            deadline: t.deadline,
        })))
      ]);

      const eisenhowerMap = tasksToPrioritize.reduce((acc, task, index) => {
        acc[task.id] = eisenhowerResult[index].quadrant;
        return acc;
      }, {} as Record<string, string>);

      const updatePromises = prioritizedResult.map((pTask) =>
        taskService.updateTask(user.uid, pTask.id, { 
          priorityScore: pTask.priorityScore, 
          reason: pTask.reason,
          eisenhowerQuadrant: eisenhowerMap[pTask.id],
        })
      );
      await Promise.all(updatePromises);
      await fetchTasks();

      setSortOrder('priority');
      setSortDirection('desc');
      toast({
        title: 'Tasks Prioritized!',
        description: 'Your tasks have been intelligently sorted and categorized in the Eisenhower Matrix.',
      });
    } catch (error) {
      console.error('AI prioritization failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Prioritization Failed',
        description: 'Could not prioritize tasks. Please try again.',
      });
    } finally {
      setIsPrioritizing(false);
    }
  };
  
  const uniqueCategories = useMemo(() => {
    const allCategories = tasks.map(t => t.category).filter(Boolean);
    return [...new Set(allCategories)];
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const categoryMatch = filterCategory === 'all' || task.category === filterCategory;
        const searchMatch =
          searchTerm === '' ||
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase());
        return categoryMatch && searchMatch;
      })
      .sort((a, b) => {
        let compare = 0;
        switch (sortOrder) {
          case 'priority':
            compare = (b.priorityScore ?? -1) - (a.priorityScore ?? -1);
            if (compare === 0) {
              // secondary sort by deadline
              compare = (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity);
            }
            break;
          case 'deadline':
            compare = (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity);
            break;
          case 'title':
            compare = a.title.localeCompare(b.title);
            break;
        }
        return sortDirection === 'asc' ? compare : -compare;
      });
  }, [tasks, filterCategory, sortOrder, sortDirection, searchTerm]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold font-headline">My Tasks</h1>
            <p className="text-muted-foreground">Manage your tasks efficiently with AI.</p>
          </div>
        </div>
        <Dialog
          open={isFormOpen}
          onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setEditingTask(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          {isFormOpen && (
            <TaskForm
              task={editingTask}
              onSave={handleSaveTask}
              onClose={() => setIsFormOpen(false)}
            />
          )}
        </Dialog>
      </header>
      
      <CountdownWidget />

      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="relative w-full sm:w-auto sm:flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="category-filter" className="text-sm font-medium sr-only">
            Category
          </label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger id="category-filter" className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="sort-order" className="text-sm font-medium sr-only">
            Sort by
          </label>
          <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as SortOrder)}>
            <SelectTrigger id="sort-order" className="w-full sm:w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>

        <div className="w-full sm:w-auto">
          <Button onClick={handlePrioritize} disabled={isPrioritizing} className="w-full">
            <Bot className="mr-2 h-4 w-4" />
            {isPrioritizing ? 'Prioritizing...' : 'Prioritize with AI'}
          </Button>
        </div>
      </div>

      <main>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <TaskList
            tasks={filteredAndSortedTasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSubtaskChange={handleSubtaskChange}
          />
        )}
      </main>
    </div>
  );
}
