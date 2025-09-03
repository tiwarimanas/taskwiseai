'use client';

import type { Task } from '@/lib/types';
import { CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TaskSubtaskList } from './TaskSubtaskList';

interface TaskDetailsProps {
  task: Task;
  onSubtaskChange: (taskId: string, subtaskId: string, completed: boolean) => void;
}

export function TaskDetails({ task, onSubtaskChange }: TaskDetailsProps) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  
  if (!task.description && !hasSubtasks) {
    return null;
  }

  return (
    <>
      <CardContent className="pt-0 pb-4">
        {task.description && (
          <CardDescription className="whitespace-pre-wrap">{task.description}</CardDescription>
        )}
        {task.description && hasSubtasks && <Separator className="my-4" />}
        {hasSubtasks && (
          <TaskSubtaskList
            subtasks={task.subtasks}
            onSubtaskChange={(subtaskId, completed) => onSubtaskChange(task.id, subtaskId, completed)}
          />
        )}
      </CardContent>
    </>
  );
}
