import { db } from '@/lib/firebase';
import type { FocusSession } from '@/lib/types';
import { doc, onSnapshot, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';

type FirestoreFocusSession = Omit<FocusSession, 'startTime' | 'endTime' | 'pausedTime'> & {
  startTime: Timestamp;
  endTime: Timestamp;
  pausedTime?: Timestamp;
};

const getFocusDoc = (userId: string) => {
  return doc(db, 'users', userId, 'focus', 'session');
};

const fromFirestore = (data: Partial<FirestoreFocusSession>): FocusSession | null => {
  if (!data.startTime || !data.endTime) {
    return null;
  }
  return {
    isActive: data.isActive ?? false,
    startTime: data.startTime.toDate(),
    endTime: data.endTime.toDate(),
    pausedTime: data.pausedTime?.toDate(),
    remainingOnPause: data.remainingOnPause,
    sessionType: data.sessionType || 'focus',
    duration: data.duration || 25 * 60,
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

export const startFocusSession = async (userId: string, durationSeconds: number, sessionType: 'focus' | 'break'): Promise<void> => {
  const focusDoc = getFocusDoc(userId);
  const now = new Date();
  const endTime = new Date(now.getTime() + durationSeconds * 1000);
  
  const newSession: Omit<FirestoreFocusSession, 'pausedTime' | 'remainingOnPause'> = {
    isActive: true,
    startTime: Timestamp.fromDate(now),
    endTime: Timestamp.fromDate(endTime),
    sessionType,
    duration: durationSeconds,
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
  await deleteDoc(focusDoc);
};
