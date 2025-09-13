
'use client';

import { useState, useMemo } from 'react';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowDownUp, CalendarDays, MoreVertical, Check, List, LayoutGrid, Calendar as CalendarIconLucide } from 'lucide-react';
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
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import { Calendar } from '@/components/ui/calendar';


type ViewMode = 'list' | 'matrix' | 'calendar';
type SortOrder = 'eisenhower' | 'deadline';
type FilterType = 'all' | 'active';
type DeleteAction = 'completed' | 'all' | null;
type Quadrant = 'UrgentImportant' | 'NotUrgentImportant' | 'UrgentNotImportant' | 'NotUrgentNotImportant';


const quadrantOrder: Record<Task['eisenhowerQuadrant'] & string, number> = {
  UrgentImportant: 1,
  NotUrgentImportant: 2,
  UrgentNotImportant: 3,
  NotUrgentNotImportant: 4,
};

const quadrantConfig: Record<Quadrant, { title: string; description: string; className: string }> = {
    UrgentImportant: { title: 'Urgent & Important', description: 'Do First', className: 'bg-green-500/10 border-green-500/40' },
    NotUrgentImportant: { title: 'Not Urgent & Important', description: 'Schedule', className: 'bg-blue-500/10 border-blue-500/40' },
    UrgentNotImportant: { title: 'Urgent & Not Important', description: 'Delegate', className: 'bg-yellow-500/10 border-yellow-500/40' },
    NotUrgentNotImportant: { title: 'Not Urgent & Not Important', description: 'Delete', className: 'bg-red-500/10 border-red-500/40' },
};
  
function TaskMatrixItem({ task, isDragging, onToggleComplete }: { task: Task; isDragging: boolean, onToggleComplete: (taskId: string, completed: boolean) => void }) {
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };
    
    return (
        <div
        className={cn(
            'p-3 mb-2 border rounded-lg bg-card hover:bg-accent cursor-pointer transition-colors flex items-start gap-3',
            isDragging && 'shadow-lg'
        )}
        >
        <Checkbox
                className="mt-1"
                checked={task.completed}
                onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
                aria-labelledby={`task-title-${task.id}`}
                onClick={stopPropagation}
            />
        <div className="block flex-grow">
            <p id={`task-title-${task.id}`} className={cn(`font-medium`, task.completed ? 'line-through text-muted-foreground' : '')}>{task.title}</p>
        </div>
        </div>
    );
}

function CalendarTaskItem({ task, onToggleComplete }: { task: Task, onToggleComplete: (taskId: string, completed: boolean) => void }) {
    const stopPropagation = (e: React.MouseEvent) => {
      e.stopPropagation();
    };
    
    return (
      <div className="p-3 mb-2 border rounded-lg bg-card hover:bg-accent cursor-pointer transition-colors flex items-start gap-3">
          <Checkbox
              className="mt-1"
              checked={task.completed}
              onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
              aria-labelledby={`task-title-${task.id}`}
              onClick={stopPropagation}
          />
          <div className="flex-grow">
              <p id={`task-title-${task.id}`} className={cn(`font-medium`, task.completed ? 'line-through text-muted-foreground' : '')}>{task.title}</p>
              {task.deadline && format(task.deadline, 'HH:mm') !== '00:00' && (
                  <p className="text-xs text-muted-foreground">{format(task.deadline, 'p')}</p>
              )}
          </div>
      </div>
    );
}
  

const ViewSwitcher = ({ view, setView }: { view: ViewMode; setView: (view: ViewMode) => void }) => {
    const views: { id: ViewMode; icon: React.ElementType; label: string }[] = [
      { id: 'list', icon: List, label: 'List' },
      { id: 'matrix', icon: LayoutGrid, label: 'Matrix' },
      { id: 'calendar', icon: CalendarIconLucide, label: 'Calendar' },
    ];
  
    return (
      <div className="flex items-center gap-2">
        {views.map((v) => (
          <Button
            key={v.id}
            variant={view === v.id ? 'default' : 'outline'}
            size="sm"
            className="rounded-full h-8 px-4"
            onClick={() => setView(v.id)}
          >
            <v.icon className="mr-2 h-4 w-4" />
            {v.label}
          </Button>
        ))}
      </div>
    );
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
  const [view, setView] = useState<ViewMode>('list');

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

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

  // Matrix-specific logic
  const categorizedTasks = useMemo(() => {
    const newCategorizedTasks: Record<Quadrant, Task[]> = {
      UrgentImportant: [],
      NotUrgentImportant: [],
      UrgentNotImportant: [],
      NotUrgentNotImportant: [],
    };
    tasks.forEach((task) => {
      const quadrant = task.eisenhowerQuadrant || 'NotUrgentNotImportant'; // Default if not set
      if (newCategorizedTasks[quadrant as Quadrant]) {
        newCategorizedTasks[quadrant as Quadrant].push(task);
      }
    });
    return newCategorizedTasks;
  }, [tasks]);

  const onDragEnd: OnDragEndResponder = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || !user) return;

    const sourceQuadrant = source.droppableId as Quadrant;
    const destQuadrant = destination.droppableId as Quadrant;
    if (sourceQuadrant === destQuadrant && source.index === destination.index) return;
    
    const taskToMove = tasks.find(t => t.id === draggableId);
    if (!taskToMove) return;

    try {
      await taskService.updateTask(user.uid, draggableId, { eisenhowerQuadrant: destQuadrant });
      toast({
        title: 'Task Moved',
        description: `"${taskToMove.title}" moved to "${quadrantConfig[destQuadrant].title}".`,
      });
    } catch (error) {
      console.error('Failed to update task quadrant:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not move the task. Please try again.',
      });
    }
  };

  // Calendar-specific logic
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }
  
    switch (view) {
      case 'list':
        return (
          <TaskList
            tasks={filteredAndSortedTasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSubtaskChange={handleSubtaskChange}
          />
        );
      case 'matrix':
        return (
            <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(quadrantConfig) as Quadrant[]).map((quadrant) => (
                <Droppable key={quadrant} droppableId={quadrant}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'min-h-[300px] flex flex-col transition-colors',
                        quadrantConfig[quadrant].className,
                        snapshot.isDraggingOver && 'bg-accent/80'
                      )}
                    >
                      <CardHeader>
                        <CardTitle>{quadrantConfig[quadrant].title}</CardTitle>
                        <p className="text-muted-foreground">{quadrantConfig[quadrant].description}</p>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        {categorizedTasks[quadrant].length > 0 ? (
                          categorizedTasks[quadrant].map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskMatrixItem task={task} isDragging={snapshot.isDragging} onToggleComplete={handleToggleComplete} />
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            {snapshot.isDraggingOver ? 'Drop task here' : 'No tasks in this quadrant.'}
                          </div>
                        )}
                        {provided.placeholder}
                      </CardContent>
                    </Card>
                  )}
                </Droppable>
              ))}
            </div>
            </DragDropContext>
        );
      case 'calendar':
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                        <CalendarTaskItem key={task.id} task={task} onToggleComplete={handleToggleComplete} />
                    ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No tasks due on this day.</p>
                )}
                </div>
            </div>
        );
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


      <div className="flex items-start gap-4 mb-4">
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
          <div className={cn(
            "mt-2 flex items-center gap-2 transition-all duration-300 ease-out",
            quickAddTitle.length > 2
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          )}>
              <Button type="button" variant='outline' size="sm" onClick={() => handleQuickSave(new Date())} className="rounded-full">Today</Button>
              <Button type="button" variant='outline' size="sm" onClick={() => handleQuickSave(addDays(new Date(), 1))} className="rounded-full">Tomorrow</Button>
          </div>
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
      
      <div className="mb-6">
        <ViewSwitcher view={view} setView={setView} />
      </div>


      <main>
        {renderContent()}
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
