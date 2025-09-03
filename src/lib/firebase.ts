import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence,CACHE_SIZE_UNLIMITED } from "firebase/firestore";

const firebaseConfig = {
  projectId: "taskwise-ai-6pso3",
  appId: "1:489747524316:web:676b79753f7158bdcb6219",
  storageBucket: "taskwise-ai-6pso3.firebasestorage.app",
  apiKey: "AIzaSyAhreESpT5XVDtEhgTDkAouwFpEi6fDDqU",
  authDomain: "taskwise-ai-6pso3.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "489747524316",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
try {
    enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
} catch (err: any) {
    if (err.code == 'failed-precondition') {
        console.warn(
          'Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.'
        );
      } else if (err.code == 'unimplemented') {
        console.warn(
          'Firestore persistence failed: The current browser does not support all of the features required to enable persistence.'
        );
      }
}

export { auth, db, googleProvider };
