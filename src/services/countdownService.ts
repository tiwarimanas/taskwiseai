import { db } from '@/lib/firebase';
import type { Countdown } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

// Type for countdown data coming from Firestore
type FirestoreCountdown = Omit<Countdown, 'id' | 'date'> & {
  date: Timestamp;
};

const getCountdownsCollection = (userId: string) => {
  return collection(db, 'users', userId, 'countdowns');
};

// Converts a Firestore document to our local Countdown type
const fromFirestore = (doc: any): Countdown => {
  const data = doc.data() as FirestoreCountdown;
  return {
    id: doc.id,
    ...data,
    date: data.date.toDate(),
  };
};

export const getCountdowns = async (userId: string): Promise<Countdown[]> => {
  if (!userId) return [];
  const countdownsCollection = getCountdownsCollection(userId);
  const q = query(countdownsCollection, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
};

export const addCountdown = async (userId: string, countdownData: Omit<Countdown, 'id'>): Promise<Countdown> => {
  const countdownsCollection = getCountdownsCollection(userId);

  const dataToSave = {
    ...countdownData,
    date: Timestamp.fromDate(countdownData.date),
  };

  const docRef = await addDoc(countdownsCollection, dataToSave);

  return {
    id: docRef.id,
    ...countdownData,
  };
};

export const deleteCountdown = async (userId: string, countdownId: string): Promise<void> => {
  const countdownDoc = doc(db, 'users', userId, 'countdowns', countdownId);
  await deleteDoc(countdownDoc);
};
