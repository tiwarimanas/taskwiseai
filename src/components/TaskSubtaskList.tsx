'use client';

import type { Subtask } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

interface TaskSubtaskListProps {
  subtasks: Subtask[];
  onSubtaskChange: (subtaskId: string, completed: boolean) => void;
}

export function TaskSubtaskList({ subtasks, onSubtaskChange }: TaskSubtaskListProps) {
  if (subtasks.length === 0) {
    return null;
  }

  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress = (completedCount / subtasks.length) * 100;

  return (
    <div className="space-y-2 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Subtasks</h4>
        <p className="text-sm text-muted-foreground">
          {completedCount} / {subtasks.length} completed
        </p>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="space-y-2 pt-2">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-3">
            <Checkbox
              id={`subtask-${subtask.id}`}
              checked={subtask.completed}
              onCheckedChange={(checked) => onSubtaskChange(subtask.id, !!checked)}
            />
            <Label
              htmlFor={`subtask-${subtask.id}`}
              className={`text-sm ${subtask.completed ? 'text-muted-foreground line-through' : ''}`}
            >
              {subtask.text}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
