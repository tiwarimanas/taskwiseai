'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Task, Category, Subtask } from '@/lib/types';
import { initialTasks, initialCategories } from '@/lib/initial-data';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot, Plus, SortAsc, SortDesc } from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { intelligentTaskPrioritization } from '@/ai/flows/intelligent-task-prioritization';
import { useToast } from '@/hooks/use-toast';

type SortOrder = 'priority' | 'deadline' | 'title';

export function TaskPageClient() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories] = useState<Category[]>(initialCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks).map((t: any) => ({
          ...t,
          deadline: t.deadline ? new Date(t.deadline) : null,
        }));
        setTasks(parsedTasks);
      } else {
        setTasks(initialTasks);
      }
    } catch (error) {
      console.error('Failed to parse tasks from localStorage', error);
      setTasks(initialTasks);
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'completed'> & { id?: string }) => {
    if (taskData.id) {
      setTasks(tasks.map((t) => (t.id === taskData.id ? { ...t, ...taskData } : t)));
    } else {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        completed: false,
      };
      setTasks([newTask, ...tasks]);
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)));
  };

  const handleSubtaskChange = (taskId: string, subtaskId: string, completed: boolean) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, completed } : subtask
            ),
          };
        }
        return task;
      })
    );
  };

  const handlePrioritize = async () => {
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
        toast({ title: "No tasks to prioritize", description: "All your tasks are completed!" });
        return;
      }
      
      const prioritizedResult = await intelligentTaskPrioritization(tasksToPrioritize);

      setTasks((currentTasks) => {
        const prioritizedMap = new Map(prioritizedResult.map((p) => [p.id, p]));
        return currentTasks.map((task) => {
          if (prioritizedMap.has(task.id)) {
            const pTask = prioritizedMap.get(task.id)!;
            return { ...task, priorityScore: pTask.priorityScore, reason: pTask.reason };
          }
          return task;
        });
      });
      setSortOrder('priority');
      setSortDirection('desc');
      toast({
        title: "Tasks Prioritized!",
        description: "Your tasks have been intelligently sorted by priority.",
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

  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task) => filterCategory === 'all' || task.category === filterCategory)
      .sort((a, b) => {
        let compare = 0;
        switch (sortOrder) {
          case 'priority':
            compare = (b.priorityScore ?? -1) - (a.priorityScore ?? -1);
            if (compare === 0) { // secondary sort by deadline
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
  }, [tasks, filterCategory, sortOrder, sortDirection]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks efficiently with AI.</p>
        </div>
        <Dialog
          open={isFormOpen}
          onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setEditingTask(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          {isFormOpen && (
            <TaskForm
              task={editingTask}
              categories={categories}
              onSave={handleSaveTask}
              onClose={() => setIsFormOpen(false)}
            />
          )}
        </Dialog>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <label htmlFor="category-filter" className="text-sm font-medium">
            Category:
          </label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger id="category-filter" className="w-[160px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-order" className="text-sm font-medium">
            Sort by:
          </label>
          <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as SortOrder)}>
            <SelectTrigger id="sort-order" className="w-[140px]">
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

        <div className="flex-grow sm:flex-grow-0 sm:ml-auto">
          <Button onClick={handlePrioritize} disabled={isPrioritizing} className="w-full sm:w-auto">
            <Bot className="mr-2 h-4 w-4" />
            {isPrioritizing ? 'Prioritizing...' : 'Prioritize with AI'}
          </Button>
        </div>
      </div>

      <main>
        <TaskList
          tasks={filteredAndSortedTasks}
          categories={categories}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSubtaskChange={handleSubtaskChange}
        />
      </main>
    </div>
  );
}
