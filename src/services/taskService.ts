import { db } from '@/lib/firebase';
import type { Task } from '@/lib/types';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';

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
    subtasks: data.subtasks || [],
  };
};

export const streamTasks = (
  userId: string,
  onUpdate: (tasks: Task[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }
  const tasksCollection = getTasksCollection(userId);
  const q = query(tasksCollection, orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      const tasks = snapshot.docs.map(fromFirestore);
      onUpdate(tasks);
    },
    (error) => {
      console.error("Error fetching tasks in real-time:", error);
      onError(error);
    }
  );

  return unsubscribe;
};

export const addTask = async (userId: string, taskData: Omit<Task, 'id' | 'completed'>): Promise<string> => {
  const tasksCollection = getTasksCollection(userId);

  const dataToSave = {
    ...taskData,
    deadline: taskData.deadline ? Timestamp.fromDate(taskData.deadline) : null,
    createdAt: serverTimestamp(),
    completed: false,
  };

  const docRef = await addDoc(tasksCollection, dataToSave);
  return docRef.id;
};

export const updateTask = async (userId: string, taskId: string, taskData: Partial<Omit<Task, 'id'>>): Promise<void> => {
  const taskDoc = doc(db, 'users', userId, 'tasks', taskId);

  const dataToUpdate: { [key: string]: any } = { ...taskData };

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
