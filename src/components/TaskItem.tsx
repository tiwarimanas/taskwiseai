'use client';

import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Task } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, Edit, Trash2, HelpCircle, ChevronDown, ShieldAlert, ShieldCheck, User, Archive } from 'lucide-react';
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
    UrgentImportant: { label: 'Urgent & Important', icon: ShieldAlert, className: 'bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-400' },
    NotUrgentImportant: { label: 'Important', icon: ShieldCheck, className: 'bg-blue-500/10 border-blue-500/40 text-blue-700 dark:text-blue-400' },
    UrgentNotImportant: { label: 'Urgent', icon: User, className: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-700 dark:text-yellow-400' },
    NotUrgentNotImportant: { label: 'Not Urgent or Important', icon: Archive, className: 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-400' },
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
      <Card className={cn('rounded-xl shadow-none', task.completed ? 'bg-muted/50' : '')}>
        <CardHeader className="p-4">
          <div className="flex items-start gap-4">
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

              {(task.deadline || task.eisenhowerQuadrant) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                  {task.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(task.deadline, 'MMM d, yy')}
                      </span>
                    </div>
                  )}
                  {quadrantDetails && (
                     <Badge variant="outline" className={cn("flex items-center gap-1.5 py-0.5", quadrantDetails.className)}>
                      <quadrantDetails.icon className="h-3.5 w-3.5" />
                      {quadrantDetails.label}
                    </Badge>
                  )}
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
