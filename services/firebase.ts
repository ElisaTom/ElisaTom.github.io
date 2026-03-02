import { initializeApp, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Keys for LocalStorage
const CONFIG_KEY = 'couple_os_firebase_config';
const OFFLINE_KEY = 'couple_os_offline_mode';

const savedConfig = localStorage.getItem(CONFIG_KEY);
const isOffline = localStorage.getItem(OFFLINE_KEY) === 'true';

let app;
let db: any;
let isConfigured = false;

// Initialize based on mode
if (isOffline) {
    console.log("App running in Offline Mode");
    isConfigured = true; // We treat offline as a valid configuration
} else if (savedConfig) {
  try {
    const config = JSON.parse(savedConfig);
    try {
        app = getApp();
    } catch (e) {
        app = initializeApp(config);
    }
    db = getFirestore(app);
    isConfigured = true;
  } catch (e) {
    console.error("Firebase Initialization Error", e);
    isConfigured = false;
  }
} else {
    // Not configured yet
    isConfigured = false;
}

export { db, isConfigured, isOffline };

export const saveFirebaseConfig = (config: any) => {
    try {
        // Validate minimal fields
        if (!config.apiKey || !config.projectId) return false;
        
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        localStorage.removeItem(OFFLINE_KEY); // Ensure we aren't in offline mode
        window.location.reload();
        return true;
    } catch (e) {
        return false;
    }
};

export const enableOfflineMode = () => {
    localStorage.setItem(OFFLINE_KEY, 'true');
    localStorage.removeItem(CONFIG_KEY); // Clear any broken config
    window.location.reload();
};

export const resetFirebaseConfig = () => {
    localStorage.removeItem(CONFIG_KEY);
    localStorage.removeItem(OFFLINE_KEY);
    window.location.reload();
};