'use client';

import { useAuth } from '@/context/AuthContext';
import { Task } from '@/lib/types';
import * as taskService from '@/services/taskService';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

type Quadrant = 'UrgentImportant' | 'NotUrgentImportant' | 'UrgentNotImportant' | 'NotUrgentNotImportant';

const quadrantConfig: Record<Quadrant, { title: string; description: string; className: string }> = {
  UrgentImportant: { title: 'Urgent & Important', description: 'Do First', className: 'bg-green-500/10 border-green-500/40' },
  NotUrgentImportant: { title: 'Not Urgent & Important', description: 'Schedule', className: 'bg-blue-500/10 border-blue-500/40' },
  UrgentNotImportant: { title: 'Urgent & Not Important', description: 'Delegate', className: 'bg-yellow-500/10 border-yellow-500/40' },
  NotUrgentNotImportant: { title: 'Not Urgent & Not Important', description: 'Delete', className: 'bg-red-500/10 border-red-500/40' },
};

function TaskMatrixItem({ task, isDragging }: { task: Task; isDragging: boolean }) {
  return (
    <Link href="/tasks" className="block">
      <div
        className={cn(
          'p-3 mb-2 border rounded-lg bg-card hover:bg-accent cursor-pointer transition-colors',
          isDragging && 'shadow-lg'
        )}
      >
        <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
      </div>
    </Link>
  );
}

export function EisenhowerMatrixClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [categorizedTasks, setCategorizedTasks] = useState<Record<Quadrant, Task[]>>({
    UrgentImportant: [],
    NotUrgentImportant: [],
    UrgentNotImportant: [],
    NotUrgentNotImportant: [],
  });

  useEffect(() => {
    async function fetchAndCategorizeTasks() {
      if (!user) return;
      setIsLoading(true);
      try {
        const userTasks = await taskService.getTasks(user.uid);

        const newCategorizedTasks: Record<Quadrant, Task[]> = {
          UrgentImportant: [],
          NotUrgentImportant: [],
          UrgentNotImportant: [],
          NotUrgentNotImportant: [],
        };

        userTasks.forEach((task) => {
          const quadrant = task.eisenhowerQuadrant || 'NotUrgentNotImportant'; // Default if not set
          if (newCategorizedTasks[quadrant as Quadrant]) {
            newCategorizedTasks[quadrant as Quadrant].push(task);
          }
        });
        setCategorizedTasks(newCategorizedTasks);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch your tasks for the matrix.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAndCategorizeTasks();
  }, [user, toast]);
  
  const onDragEnd: OnDragEndResponder = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    const sourceQuadrant = source.droppableId as Quadrant;
    const destQuadrant = destination.droppableId as Quadrant;

    // Moved to the same position in the same quadrant
    if (sourceQuadrant === destQuadrant && source.index === destination.index) {
      return;
    }

    // Find the task that was moved
    const taskToMove = categorizedTasks[sourceQuadrant].find(t => t.id === draggableId);
    if (!taskToMove) return;

    // Optimistic UI Update
    const newCategorizedTasks = { ...categorizedTasks };
    // Remove from source
    const sourceTasks = Array.from(newCategorizedTasks[sourceQuadrant]);
    sourceTasks.splice(source.index, 1);
    newCategorizedTasks[sourceQuadrant] = sourceTasks;

    // Add to destination
    const destTasks = Array.from(newCategorizedTasks[destQuadrant]);
    destTasks.splice(destination.index, 0, taskToMove);
    newCategorizedTasks[destQuadrant] = destTasks;

    setCategorizedTasks(newCategorizedTasks);

    // Update Firebase
    try {
      await taskService.updateTask(user!.uid, draggableId, { eisenhowerQuadrant: destQuadrant });
      toast({
        title: 'Task Moved',
        description: `"${taskToMove.title}" moved to "${quadrantConfig[destQuadrant].title}".`,
      });
    } catch (error) {
      console.error('Failed to update task quadrant:', error);
      // Revert UI on failure
      const revertedTasks = { ...categorizedTasks };
      revertedTasks[sourceQuadrant].splice(source.index, 0, taskToMove);
      revertedTasks[destQuadrant].splice(destination.index, 1);
      setCategorizedTasks(categorizedTasks);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not move the task. Please try again.',
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
                              <TaskMatrixItem task={task} isDragging={snapshot.isDragging} />
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
