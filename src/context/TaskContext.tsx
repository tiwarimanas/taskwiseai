'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as taskService from '@/services/taskService';
import type { Task } from '@/lib/types';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      setIsLoading(true);
      unsubscribe = taskService.streamTasks(user.uid, (fetchedTasks) => {
        setTasks(fetchedTasks);
        setIsLoading(false);
      }, (error) => {
        console.error("Failed to stream tasks:", error);
        setIsLoading(false);
      });
    } else {
      setTasks([]);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  return (
    <TaskContext.Provider value={{ tasks, isLoading }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
