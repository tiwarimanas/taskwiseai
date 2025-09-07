import { db } from '@/lib/firebase';
import type { FocusSession } from '@/lib/types';
import { doc, onSnapshot, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';

type FirestoreFocusSession = {
  isActive: boolean;
  startTime: Timestamp;
  endTime: Timestamp;
  pausedTime?: Timestamp;
  remainingOnPause?: number;
};

const getFocusDoc = (userId: string) => {
  return doc(db, 'users', userId, 'focus', 'session');
};

const fromFirestore = (data: Partial<FirestoreFocusSession>): FocusSession | null => {
  // Validate that essential fields exist before processing
  if (!data.isActive || !data.startTime || !data.endTime) {
    return null;
  }
  return {
    isActive: data.isActive,
    startTime: data.startTime.toDate(),
    endTime: data.endTime.toDate(),
    pausedTime: data.pausedTime?.toDate(),
    remainingOnPause: data.remainingOnPause,
  };
};

export const streamFocusSession = (
  userId: string,
  onUpdate: (session: FocusSession | null) => void
): (() => void) => {
  const focusDoc = getFocusDoc(userId);
  return onSnapshot(focusDoc, (doc) => {
    if (doc.exists()) {
      onUpdate(fromFirestore(doc.data() as Partial<FirestoreFocusSession>));
    } else {
      onUpdate(null);
    }
  });
};

export const startFocusSession = async (userId: string, durationSeconds: number): Promise<void> => {
  const focusDoc = getFocusDoc(userId);
  const now = new Date();
  const endTime = new Date(now.getTime() + durationSeconds * 1000);
  
  // Use a type that matches what we write to Firestore
  const newSession: Omit<FirestoreFocusSession, 'pausedTime' | 'remainingOnPause'> = {
    isActive: true,
    startTime: Timestamp.fromDate(now),
    endTime: Timestamp.fromDate(endTime),
  };
  await setDoc(focusDoc, newSession);
};

export const pauseFocusSession = async (userId: string, remainingSeconds: number): Promise<void> => {
  const focusDoc = getFocusDoc(userId);
  const updateData = {
    isActive: false,
    pausedTime: Timestamp.now(),
    remainingOnPause: remainingSeconds,
  };
  await setDoc(focusDoc, updateData, { merge: true });
};

export const resetFocusSession = async (userId: string): Promise<void> => {
  const focusDoc = getFocusDoc(userId);
  // Deleting the document is cleaner than leaving partial data.
  await deleteDoc(focusDoc);
};
