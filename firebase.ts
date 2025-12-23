import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUsTy1pfRTlN9TtCnAob0woCIxpWL3uvc",
  authDomain: "senategolf.firebaseapp.com",
  projectId: "senategolf",
  storageBucket: "senategolf.firebasestorage.app",
  messagingSenderId: "114735306112",
  appId: "1:114735306112:web:eac04279ca2fb1b4db5d65"
};

// Singleton pattern to prevent double-initialization in development/HMR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize and export Cloud Firestore
export const db = getFirestore(app);