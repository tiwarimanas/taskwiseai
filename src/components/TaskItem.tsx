'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Task } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, Edit, Trash2, HelpCircle, Tag } from 'lucide-react';
import { TaskSubtaskList } from './TaskSubtaskList';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onSubtaskChange: (taskId: string, subtaskId: string, completed: boolean) => void;
}

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onSubtaskChange,
}: TaskItemProps) {
  const isOverdue = task.deadline && !task.completed ? new Date() > task.deadline : false;

  return (
    <Card className={task.completed ? 'bg-muted/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Checkbox
            className="mt-1.5"
            checked={task.completed}
            onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
            aria-labelledby={`task-title-${task.id}`}
          />
          <div className="flex-1">
            <CardTitle
              id={`task-title-${task.id}`}
              className={`text-xl ${task.completed ? 'text-muted-foreground line-through' : ''}`}
            >
              {task.title}
            </CardTitle>
            {task.description && (
              <CardDescription className="mt-1">{task.description}</CardDescription>
            )}
          </div>
          {task.priorityScore !== undefined && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-sm font-semibold cursor-default">
                    {Math.round(task.priorityScore)}
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{task.reason}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-0">
        {(task.deadline || task.category) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                  {format(task.deadline, 'MMM d, yyyy')}
                </span>
              </div>
            )}
            {task.category && (
              <Badge variant="outline" className="flex items-center gap-1.5 py-0.5">
                <Tag className="h-3.5 w-3.5" />
                {task.category}
              </Badge>
            )}
          </div>
        )}
        {task.subtasks && task.subtasks.length > 0 && <Separator />}
        <TaskSubtaskList
          subtasks={task.subtasks}
          onSubtaskChange={(subtaskId, completed) => onSubtaskChange(task.id, subtaskId, completed)}
        />
      </CardContent>
      <CardFooter className="justify-end gap-2 pt-3">
        <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(task.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
