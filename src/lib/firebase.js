// src/lib/firebase.js
// ─────────────────────────────────────────────────────────
// SETUP: Replace these values with your Firebase project config.
// Get them from: Firebase Console → Project Settings → Your Apps → Web App
// ─────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAryxkbV6-fMRfw3shZ7kMOUmKjfSEjpw4",
  authDomain: "anylist-724f1.firebaseapp.com",
  projectId: "anylist-724f1",
  storageBucket: "anylist-724f1.firebasestorage.app",
  messagingSenderId: "288696263355",
  appId: "1:288696263355:web:c350fba8de76ad26fabf9e",
  measurementId: "G-V5BYNEX27V",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
