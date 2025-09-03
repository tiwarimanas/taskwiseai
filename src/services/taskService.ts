import { db } from '@/lib/firebase';
import type { Task } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// A type guard to check if a value is a Firestore Timestamp
function isTimestamp(value: any): value is Timestamp {
  return value && typeof value.toDate === 'function';
}

// Type for task data coming from Firestore
type FirestoreTask = Omit<Task, 'id' | 'deadline'> & {
  deadline: Timestamp | null;
  createdAt: Timestamp;
};

const getTasksCollection = (userId: string) => {
  return collection(db, 'users', userId, 'tasks');
};

// Converts a Firestore document to our local Task type
const fromFirestore = (doc: any): Task => {
  const data = doc.data() as FirestoreTask;
  return {
    id: doc.id,
    ...data,
    deadline: data.deadline ? data.deadline.toDate() : null,
    // Ensure subtasks is always an array
    subtasks: data.subtasks || [],
  };
};

export const getTasks = async (userId: string): Promise<Task[]> => {
  if (!userId) return [];
  const tasksCollection = getTasksCollection(userId);
  const q = query(tasksCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
};

export const addTask = async (userId: string, taskData: Omit<Task, 'id' | 'completed'>): Promise<Task> => {
  const tasksCollection = getTasksCollection(userId);

  // Convert deadline Date to Firestore Timestamp if it exists
  const dataToSave = {
    ...taskData,
    deadline: taskData.deadline ? Timestamp.fromDate(taskData.deadline) : null,
    createdAt: serverTimestamp(),
    completed: false, // Ensure new tasks are not completed
  };

  const docRef = await addDoc(tasksCollection, dataToSave);

  return {
    id: docRef.id,
    ...taskData,
    completed: false,
  };
};

export const updateTask = async (userId: string, taskId: string, taskData: Partial<Omit<Task, 'id'>>): Promise<void> => {
  const taskDoc = doc(db, 'users', userId, 'tasks', taskId);

  const dataToUpdate: { [key: string]: any } = { ...taskData };

  // Convert deadline Date to Firestore Timestamp if it's being updated
  if (taskData.deadline && taskData.deadline instanceof Date) {
    dataToUpdate.deadline = Timestamp.fromDate(taskData.deadline);
  } else if (taskData.hasOwnProperty('deadline') && taskData.deadline === null) {
    dataToUpdate.deadline = null;
  }

  await updateDoc(taskDoc, dataToUpdate);
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  const taskDoc = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskDoc);
};
