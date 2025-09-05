'use client';

import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Task } from '@/lib/types';
import { format, isPast } from 'date-fns';
import { Calendar, Edit, Trash2, HelpCircle, ChevronDown } from 'lucide-react';
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

const quadrantConfig = {
    UrgentImportant: { className: 'bg-green-500/10' },
    NotUrgentImportant: { className: 'bg-blue-500/10' },
    UrgentNotImportant: { className: 'bg-yellow-500/10' },
    NotUrgentNotImportant: { className: 'bg-red-500/10' },
};


export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onSubtaskChange,
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = task.description || (task.subtasks && task.subtasks.length > 0);

  const quadrantDetails = task.eisenhowerQuadrant ? quadrantConfig[task.eisenhowerQuadrant] : null;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={cn(
        'rounded-xl shadow-none',
        task.completed ? 'bg-muted/50' : (quadrantDetails?.className || 'bg-card')
      )}>
        <CardHeader className="p-3">
          <div className="flex items-start gap-3">
            <Checkbox
              className="mt-1"
              checked={task.completed}
              onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
              aria-labelledby={`task-title-${task.id}`}
            />
            <div className="flex-1">
              <CardTitle
                id={`task-title-${task.id}`}
                className={`text-base font-medium ${task.completed ? 'text-muted-foreground line-through' : ''}`}
              >
                {task.title}
              </CardTitle>

              {task.deadline && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className={cn(
                      !task.completed && isPast(task.deadline) && 'text-destructive font-medium'
                    )}>
                      {format(task.deadline, 'MMM d, yy')}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center -mr-2 -my-2">
                {task.priorityScore !== undefined && (
                <TooltipProvider>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-sm font-semibold cursor-default p-2">
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
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => onEdit(task)}>
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
                {hasDetails && (
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                    </Button>
                </CollapsibleTrigger>
                )}
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <TaskDetails task={task} onSubtaskChange={onSubtaskChange} />
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
