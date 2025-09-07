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
  completed: boolean;
  priorityScore?: number;
  reason?: string;
  eisenhowerQuadrant?: 'UrgentImportant' | 'NotUrgentImportant' | 'UrgentNotImportant' | 'NotUrgentNotImportant';
};

export type Countdown = {
  id: string;
  title: string;
  date: Date;
  color?: string;
};

export type UserProfile = {
  knowledge?: string;
};
