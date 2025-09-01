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
