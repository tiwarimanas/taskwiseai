'use client';

import { useState, useMemo } from 'react';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SortAsc, SortDesc, ArrowDownUp, CalendarDays, List, ListX, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { categorizeTaskEisenhower } from '@/ai/flows/eisenhower-matrix-categorization';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import * as taskService from '@/services/taskService';
import { Skeleton } from './ui/skeleton';
import { CountdownWidget } from './CountdownWidget';
import { useTasks } from '@/context/TaskContext';
import { QuickAddTask } from './QuickAddTask';
import { Dialog } from './ui/dialog';

type SortOrder = 'eisenhower' | 'deadline';
type FilterType = 'all' | 'active';
type DeleteAction = 'completed' | 'all' | null;

const quadrantOrder: Record<Task['eisenhowerQuadrant'] & string, number> = {
  UrgentImportant: 1,
  NotUrgentImportant: 2,
  UrgentNotImportant: 3,
  NotUrgentNotImportant: 4,
};

export function TaskPageClient() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tasks, isLoading } = useTasks();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [sortOrder, setSortOrder] = useState<SortOrder>('eisenhower');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const [deleteAction, setDeleteAction] = useState<DeleteAction>(null);


  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'completed'> & { id?: string }) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { title, description, deadline } = taskData;

      const eisenhowerResult = await categorizeTaskEisenhower({
        title,
        description: description || '',
        deadline: deadline ? deadline.toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const taskWithAiData = {
        ...taskData,
        eisenhowerQuadrant: eisenhowerResult.quadrant,
      };

      if (taskData.id) {
        await taskService.updateTask(user.uid, taskData.id, taskWithAiData);
      } else {
        await taskService.addTask(user.uid, taskWithAiData);
      }
      setIsFormOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to save task:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your task. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
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
  
  const handleSortChange = (newSortOrder: SortOrder) => {
    if (newSortOrder === sortOrder) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOrder(newSortOrder);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
        if (filter === 'active') {
            return !task.completed;
        }
        return true;
    });

    return [...filtered].sort((a, b) => {
      let compare = 0;
      switch (sortOrder) {
        case 'eisenhower':
          compare = (quadrantOrder[a.eisenhowerQuadrant || 'NotUrgentNotImportant']) - (quadrantOrder[b.eisenhowerQuadrant || 'NotUrgentNotImportant']);
          if (compare === 0) {
            compare = (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity);
          }
          break;
        case 'deadline':
          compare = (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity);
          break;
      }
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [tasks, sortOrder, sortDirection, filter]);

  const confirmDelete = async () => {
    if (!user || !deleteAction) return;

    let tasksToDelete: Task[] = [];
    let toastMessage = '';

    if (deleteAction === 'completed') {
      tasksToDelete = tasks.filter(t => t.completed);
      toastMessage = 'All completed tasks have been deleted.';
    } else if (deleteAction === 'all') {
      tasksToDelete = tasks;
      toastMessage = 'All tasks have been deleted.';
    }
    
    setDeleteAction(null);

    if (tasksToDelete.length === 0) {
        toast({
            title: 'No tasks to delete.',
        });
        return;
    }
    
    try {
      await Promise.all(tasksToDelete.map(task => taskService.deleteTask(user.uid, task.id)));
      toast({
        title: 'Success!',
        description: toastMessage,
      });
    } catch (error) {
      console.error(`Failed to delete tasks:`, error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete tasks. Please try again.',
      });
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <CountdownWidget />
      </header>

      <div className="mb-6">
        <QuickAddTask onSave={handleSaveTask} isSaving={isSaving} onAdvancedEdit={() => setIsFormOpen(true)} />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Button
            variant={sortOrder === 'eisenhower' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => handleSortChange('eisenhower')}
            className="h-9 w-9"
            aria-label="Sort by Matrix"
        >
            <ArrowDownUp className="h-4 w-4" />
        </Button>
        <Button
            variant={sortOrder === 'deadline' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => handleSortChange('deadline')}
            className="h-9 w-9"
            aria-label="Sort by Deadline"
        >
            <CalendarDays className="h-4 w-4" />
        </Button>
        <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setFilter('all')}
            className="h-9 w-9"
            aria-label="Show all tasks"
        >
            <List className="h-4 w-4" />
        </Button>
        <Button
            variant={filter === 'active' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setFilter('active')}
            className="h-9 w-9"
            aria-label="Show active tasks"
        >
            <ListX className="h-4 w-4" />
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More Actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDeleteAction('completed')}>
                    Delete completed tasks
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteAction('all')} className="text-destructive focus:text-destructive">
                    Delete all tasks
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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

      <Dialog
        open={isFormOpen}
        onOpenChange={(isOpen) => {
          if (isSaving) return;
          setIsFormOpen(isOpen);
          if (!isOpen) setEditingTask(null);
        }}
      >
        {isFormOpen && (
          <TaskForm
            task={editingTask}
            allTasks={tasks}
            onSave={handleSaveTask}
            onClose={() => setIsFormOpen(false)}
            isSaving={isSaving}
          />
        )}
      </Dialog>

      <AlertDialog open={!!deleteAction} onOpenChange={() => setDeleteAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAction === 'completed'
                ? 'This action will permanently delete all completed tasks.'
                : 'This action will permanently delete all your tasks. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
