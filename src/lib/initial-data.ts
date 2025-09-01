import type { Task, Category } from './types';
import { Briefcase, User, ShoppingCart } from 'lucide-react';

export const initialCategories: Category[] = [
  { id: 'work', name: 'Work', icon: Briefcase },
  { id: 'personal', name: 'Personal', icon: User },
  { id: 'shopping', name: 'Shopping', icon: ShoppingCart },
];

export const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Finalize Q3 report',
    description: 'Compile sales data, analyze performance metrics, and write the final Q3 financial report for the board meeting.',
    subtasks: [
      { id: 's1-1', text: 'Gather sales data from all regions', completed: true },
      { id: 's1-2', text: 'Create visualizations for key metrics', completed: false },
      { id: 's1-3', text: 'Write executive summary', completed: false },
    ],
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)),
    category: 'work',
    completed: false,
  },
  {
    id: '2',
    title: 'Plan team offsite event',
    description: 'Organize a team-building offsite for the engineering department. Includes finding a venue, planning activities, and managing the budget.',
    subtasks: [],
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)),
    category: 'work',
    completed: false,
  },
  {
    id: '3',
    title: 'Book dentist appointment',
    description: 'Schedule a routine check-up and cleaning with the dentist.',
    subtasks: [],
    deadline: null,
    category: 'personal',
    completed: true,
  },
  {
    id: '4',
    title: 'Buy groceries for the week',
    description: 'Get all necessary items from the grocery store for the upcoming week\'s meals.',
    subtasks: [
      { id: 's4-1', text: 'Milk', completed: false },
      { id: 's4-2', text: 'Bread', completed: false },
      { id: 's4-3', text: 'Eggs', completed: false },
      { id: 's4-4', text: 'Vegetables', completed: false },
    ],
    deadline: new Date(new Date().setDate(new Date().getDate() + 1)),
    category: 'shopping',
    completed: false,
  },
];
