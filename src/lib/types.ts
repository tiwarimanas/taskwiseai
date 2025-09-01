import type { LucideIcon } from 'lucide-react';

export type Subtask = {
  id: string;
  text: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  subtasks: Subtask[];
  deadline: Date | null;
  category: string;
  completed: boolean;
  priorityScore?: number;
  reason?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
};
