'use client';

import { Task } from '@/lib/types';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { useTasks } from '@/context/TaskContext';
import { useAuth } from '@/context/AuthContext';
import * as taskService from '@/services/taskService';
import { Checkbox } from './ui/checkbox';

type Quadrant = 'UrgentImportant' | 'NotUrgentImportant' | 'UrgentNotImportant' | 'NotUrgentNotImportant';

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
      <Link href="/tasks" className="block flex-grow">
        <p id={`task-title-${task.id}`} className={cn(`font-medium`, task.completed ? 'line-through text-muted-foreground' : '')}>{task.title}</p>
      </Link>
    </div>
  );
}

export function EisenhowerMatrixClient() {
  const { user } = useAuth();
  const { tasks, isLoading } = useTasks();
  const { toast } = useToast();

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
      // Note: No need for manual UI revert, onSnapshot will handle it.
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


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Eisenhower Matrix</h1>
          <p className="text-muted-foreground">Prioritize your tasks effectively.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="min-h-[300px]">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Eisenhower Matrix</h1>
        <p className="text-muted-foreground">
          Drag and drop tasks between quadrants. Changes are saved automatically.
        </p>
      </header>
      <main>
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
      </main>
    </div>
  );
}
