import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBROrCpV4iUyEixLdbdhBdrKfwd_urUvWg",
  authDomain: "elinic-60564.firebaseapp.com",
  projectId: "elinic-60564",
  storageBucket: "elinic-60564.firebasestorage.app",
  messagingSenderId: "250976980252",
  appId: "1:250976980252:web:ba6466c1d8a3966a223ed9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);