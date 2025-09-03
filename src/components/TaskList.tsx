'use client';

import { TaskItem } from './TaskItem';
import type { Task } from '@/lib/types';
import { useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onSubtaskChange: (taskId: string, subtaskId: string, completed: boolean) => void;
}

export function TaskList({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onSubtaskChange,
}: TaskListProps) {
  const taskListRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (taskListRef.current) {
      const taskElements = taskListRef.current.children;
      gsap.fromTo(
        taskElements,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.07,
          ease: 'power3.out',
        }
      );
    }
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-16 text-center">
        <h3 className="text-xl font-semibold">No tasks yet!</h3>
        <p className="text-muted-foreground mt-2">Click "Add Task" to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={taskListRef}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onSubtaskChange={onSubtaskChange}
        />
      ))}
    </div>
  );
}
