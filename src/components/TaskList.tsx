'use client';

import { TaskItem } from './TaskItem';
import type { Task, Category } from '@/lib/types';

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onSubtaskChange: (taskId: string, subtaskId: string, completed: boolean) => void;
}

export function TaskList({
  tasks,
  categories,
  onToggleComplete,
  onEdit,
  onDelete,
  onSubtaskChange,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-16 text-center">
        <h3 className="text-xl font-semibold">No tasks yet!</h3>
        <p className="text-muted-foreground mt-2">Click "Add Task" to get started.</p>
      </div>
    );
  }

  const findCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          category={findCategory(task.category)}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onSubtaskChange={onSubtaskChange}
        />
      ))}
    </div>
  );
}
