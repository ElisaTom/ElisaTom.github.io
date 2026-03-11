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

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const isConfigured = true;

// Kept for backward compatibility — clears the app config and reloads
// so the user is taken back to the SetupWizard.
export const resetFirebaseConfig = () => {
    localStorage.removeItem('couple_os_config');
    window.location.reload();
};
