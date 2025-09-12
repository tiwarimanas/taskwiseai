'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, SlidersHorizontal, Loader2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface QuickAddTaskProps {
  onSave: (task: Omit<Task, 'id' | 'completed' | 'eisenhowerQuadrant'> & { id?: string }) => void;
  isSaving: boolean;
  onAdvancedEdit: () => void;
}

export function QuickAddTask({ onSave, isSaving, onAdvancedEdit }: QuickAddTaskProps) {
  const [title, setTitle] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      toast({
        variant: 'destructive',
        title: 'Too short!',
        description: 'Task title must be at least 3 characters.',
      });
      return;
    }

    onSave({
      title: title.trim(),
      description: '',
      deadline: null,
      subtasks: [],
    });
    
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Add a new task... (e.g., Book flight to Bali)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="pr-24 h-12 text-base rounded-full shadow-sm"
          disabled={isSaving}
        />
        <div className="absolute top-0 right-0 h-full flex items-center pr-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={onAdvancedEdit} 
            className="text-muted-foreground"
            aria-label="Advanced Edit"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full w-9 h-9" 
            disabled={isSaving || title.trim().length === 0}
            aria-label="Add Task"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
