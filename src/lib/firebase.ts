// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
