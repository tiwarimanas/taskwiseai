'use client';

import { useState, useMemo } from 'react';
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
import { useTasks } from '@/context/TaskContext';

type SortOrder = 'priority' | 'deadline' | 'title';

export function TaskPageClient() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tasks, isLoading } = useTasks();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'completed'> & { id?: string }) => {
    if (!user) return;

    try {
      const { title, description, deadline } = taskData;

      const [categoryResult, eisenhowerResult] = await Promise.all([
        generateTaskCategory({ title, description: description || '' }),
        categorizeTaskEisenhower({
          title,
          description: description || '',
          deadline: deadline ? deadline.toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ]);

      const taskWithAiData = {
        ...taskData,
        category: categoryResult.category,
        eisenhowerQuadrant: eisenhowerResult.quadrant,
      };

      if (taskData.id) {
        await taskService.updateTask(user.uid, taskData.id, taskWithAiData);
      } else {
        await taskService.addTask(user.uid, taskWithAiData);
      }
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
    try {
      await taskService.deleteTask(user.uid, taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete the task.',
      });
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    if (!user) return;
    try {
      await taskService.updateTask(user.uid, taskId, { completed });
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update task status.',
      });
    }
  };

  const handleSubtaskChange = async (taskId: string, subtaskId: string, completed: boolean) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, completed } : subtask
    );

    try {
      await taskService.updateTask(user.uid, taskId, { subtasks: updatedSubtasks });
    } catch (error) {
      console.error('Failed to update subtask:', error);
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
          description: t.description || '',
          deadline: t.deadline ? t.deadline.toISOString() : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        }));

      if (tasksToPrioritize.length === 0) {
        toast({ title: 'No tasks to prioritize', description: 'All your tasks are completed!' });
        return;
      }
      
      const prioritizedResult = await intelligentTaskPrioritization(tasksToPrioritize);

      const updatePromises = prioritizedResult.map((pTask) =>
        taskService.updateTask(user.uid, pTask.id, { 
          priorityScore: pTask.priorityScore, 
          reason: pTask.reason,
        })
      );
      await Promise.all(updatePromises);
      
      setSortOrder('priority');
      setSortDirection('desc');
      toast({
        title: 'Tasks Prioritized!',
        description: 'Your tasks have been intelligently sorted by priority score.',
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
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return categoryMatch && searchMatch;
      })
      .sort((a, b) => {
        let compare = 0;
        switch (sortOrder) {
          case 'priority':
            compare = (b.priorityScore ?? -1) - (a.priorityScore ?? -1);
            if (compare === 0) {
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
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
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
