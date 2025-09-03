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
import { Calendar, Edit, Trash2, HelpCircle, Tag, ChevronDown } from 'lucide-react';
import { TaskSubtaskList } from './TaskSubtaskList';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TaskDetails } from './TaskDetails';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = task.description || (task.subtasks && task.subtasks.length > 0);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={task.completed ? 'bg-muted/50' : ''}>
        <CardHeader className="pb-4">
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
                className={`text-lg ${task.completed ? 'text-muted-foreground line-through' : ''}`}
              >
                {task.title}
              </CardTitle>

              {(task.deadline || task.category) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                  {task.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className={task.deadline && !task.completed && new Date() > task.deadline ? 'text-destructive font-medium' : ''}>
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
            {hasDetails && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <TaskDetails task={task} onSubtaskChange={onSubtaskChange} />
        </CollapsibleContent>

        <CardFooter className="justify-end gap-2 pt-2">
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
    </Collapsible>
  );
}
