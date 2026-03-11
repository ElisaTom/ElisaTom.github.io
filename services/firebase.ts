import { initializeApp, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBROrCpV4iUyEixLdbdhBdrKfwd_urUvWg",
  authDomain: "elinic-60564.firebaseapp.com",
  projectId: "elinic-60564",
  storageBucket: "elinic-60564.firebasestorage.app",
  messagingSenderId: "250976980252",
  appId: "1:250976980252:web:ba6466c1d8a3966a223ed9"
};

let app;
let db: any;
let isConfigured = true;

try {
  try {
    app = getApp();
  } catch (e) {
    app = initializeApp(firebaseConfig);
  }
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Initialization Error", e);
  isConfigured = false;
}

export { db, isConfigured };