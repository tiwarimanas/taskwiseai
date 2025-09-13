
'use client';

import { useState, useMemo } from 'react';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowDownUp, CalendarDays, MoreVertical, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
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
import { AiQuoteWidget } from './AiQuoteWidget';
import { addDays } from 'date-fns';

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

  const [quickAddTitle, setQuickAddTitle] = useState('');

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'completed'> & { id?: string }, fromQuickAdd = false) => {
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

      if (fromQuickAdd) {
        setQuickAddTitle('');
      } else {
        setIsFormOpen(false);
        setEditingTask(null);
      }
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

  const handleQuickSave = (deadline: Date | null) => {
    if (quickAddTitle.trim().length < 3) {
      toast({
        variant: 'destructive',
        title: 'Too short!',
        description: 'Task title must be at least 3 characters.',
      });
      return;
    }

    handleSaveTask({
      title: quickAddTitle.trim(),
      description: '',
      deadline: deadline,
      subtasks: [],
    }, true);
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
        <div className="mb-6 text-left">
            <AiQuoteWidget />
        </div>
        <CountdownWidget />
      </header>

      <div className="flex items-start gap-4 mb-6">
        <div className="flex-grow">
          <QuickAddTask
            title={quickAddTitle}
            onTitleChange={setQuickAddTitle}
            onSave={() => handleQuickSave(null)}
            isSaving={isSaving}
            onAdvancedEdit={() => {
              if (quickAddTitle) {
                setEditingTask({ id: '', title: quickAddTitle, description: '', subtasks: [], deadline: null, completed: false });
              } else {
                setEditingTask(null);
              }
              setIsFormOpen(true);
            }}
          />
          {quickAddTitle.length > 2 && (
            <div className="mt-2 flex items-center gap-2">
                <Button type="button" variant='outline' size="sm" onClick={() => handleQuickSave(new Date())} className="rounded-full">Today</Button>
                <Button type="button" variant='outline' size="sm" onClick={() => handleQuickSave(addDays(new Date(), 1))} className="rounded-full">Tomorrow</Button>
            </div>
          )}
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0 rounded-full">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">More Actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                  <DropdownMenuRadioItem value="eisenhower">
                    <ArrowDownUp className="mr-2 h-4 w-4" />
                    <span>Matrix</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="deadline">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>Deadline</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Filter</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                  <DropdownMenuRadioItem value="all">Show All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="active">Show Active</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setDeleteAction('completed')}>
                    Delete completed tasks
                </DropdownMenuItem>
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

      <Sheet
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
            onSave={(task) => handleSaveTask(task, false)}
            onClose={() => setIsFormOpen(false)}
            isSaving={isSaving}
          />
        )}
      </Sheet>

      <Sheet open={!!deleteAction} onOpenChange={() => setDeleteAction(null)}>
        <SheetContent side="bottom" className="sm:max-w-md mx-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Are you absolutely sure?</SheetTitle>
            <SheetDescription>
              {deleteAction === 'completed'
                ? 'This action will permanently delete all completed tasks.'
                : 'This action will permanently delete all your tasks. This cannot be undone.'}
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-4 flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={confirmDelete}>
              Continue
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  );
}
