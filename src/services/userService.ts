import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const getUserProfileDoc = (userId: string) => {
  return doc(db, 'users', userId);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  const userDocRef = getUserProfileDoc(userId);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  } else {
    return null;
  }
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  const userDocRef = getUserProfileDoc(userId);
  // Using setDoc with merge: true will create the document if it doesn't exist,
  // and update it if it does, only changing the fields provided.
  await setDoc(userDocRef, profileData, { merge: true });
};
