import { db } from '@/lib/firebase';
import type { FocusSession } from '@/lib/types';
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';

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

const fromFirestore = (data: FirestoreFocusSession): FocusSession => {
  return {
    ...data,
    startTime: data.startTime.toDate(),
    endTime: data.endTime.toDate(),
    pausedTime: data.pausedTime?.toDate(),
  };
};

export const streamFocusSession = (
  userId: string,
  onUpdate: (session: FocusSession | null) => void
): (() => void) => {
  const focusDoc = getFocusDoc(userId);
  return onSnapshot(focusDoc, (doc) => {
    if (doc.exists()) {
      onUpdate(fromFirestore(doc.data() as FirestoreFocusSession));
    } else {
      onUpdate(null);
    }
  });
};

export const startFocusSession = async (userId: string, durationSeconds: number): Promise<void> => {
  const focusDoc = getFocusDoc(userId);
  const now = new Date();
  const endTime = new Date(now.getTime() + durationSeconds * 1000);
  const newSession: FocusSession = {
    isActive: true,
    startTime: now,
    endTime: endTime,
  };
  await setDoc(focusDoc, newSession);
};

export const pauseFocusSession = async (userId: string, remainingSeconds: number): Promise<void> => {
  const focusDoc = getFocusDoc(userId);
  const updateData = {
    isActive: false,
    pausedTime: new Date(),
    remainingOnPause: remainingSeconds,
  };
  await setDoc(focusDoc, updateData, { merge: true });
};

export const resetFocusSession = async (userId: string): Promise<void> => {
  const focusDoc = getFocusDoc(userId);
  await setDoc(focusDoc, { isActive: false }, { merge: false });
};
