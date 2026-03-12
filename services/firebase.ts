import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

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

// Enable IndexedDB persistence for offline support in browsers.
// If it fails (multi-tab or unsupported), we catch and continue — app still works online.
(async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Firestore persistence enabled');
  } catch (e: any) {
    console.warn('Could not enable Firestore persistence:', e?.message || e);
    // Fall back gracefully
  }
})();

// Unique ID for this client/device — used to identify origin of writes
export const clientId = (() => {
  try {
    let id = localStorage.getItem('client_id');
    if (!id) {
      id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : `client-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      localStorage.setItem('client_id', id);
    }
    return id;
  } catch (e) {
    return `client-unknown-${Date.now()}`;
  }
})();

export const isConfigured = true;

export const resetFirebaseConfig = () => {
    localStorage.removeItem('couple_os_config');
    window.location.reload();
};
