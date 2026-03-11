
import { Storage, KEYS } from './storage';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

// Types of data to sync
interface SyncPayload {
  activities: any[];
  movies: any[];
  food: any[];
  registry: any[];
  loveNotes: any[];
  logs: any[];
  recipes: any[];
  timestamp: number;
}

let currentRoomId: string | null = null;
let pushTimeout: any = null;
let isConnected = false;
let statusCallback: ((peers: number) => void) | null = null;
let unsubscribeSnapshot: any = null;

const updateStatus = (status: boolean) => {
  if (isConnected !== status) {
    isConnected = status;
    if (statusCallback) statusCallback(status ? 1 : 0);
  }
};

export const SyncService = {
  // Connect to the room and start real-time sync
  connect: (roomId: string, onStatusChange: (peers: number) => void) => {
    if (currentRoomId === roomId) return; // Already connected
    
    console.log(`Connecting to Firebase Room: ${roomId}`);
    currentRoomId = roomId;
    statusCallback = onStatusChange;
    
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }

    const roomRef = doc(db, 'rooms', roomId);
    
    // Listen for real-time updates from Firebase
    unsubscribeSnapshot = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SyncPayload;
        SyncService.merge(data);
        updateStatus(true);
      } else {
        // Room doesn't exist yet, push initial data
        SyncService.pushData();
        updateStatus(true);
      }
    }, (error) => {
      console.error("Firebase sync error:", error);
      updateStatus(false);
    });

    // Listen for local changes to push
    window.addEventListener('db-update', (e: any) => {
      if (e.detail.isRemote) return; // Don't push if the change came from a pull
      
      if (pushTimeout) clearTimeout(pushTimeout);
      pushTimeout = setTimeout(() => {
        SyncService.pushData();
      }, 1000); // Debounce pushes
    });
  },

  // Send local data to server
  pushData: async () => {
    if (!currentRoomId) return;
    
    const payload: SyncPayload = {
      activities: Storage.get(KEYS.activities) || [],
      movies: Storage.get(KEYS.movies) || [],
      food: Storage.get(KEYS.food) || [],
      registry: Storage.get(KEYS.registry) || [],
      loveNotes: Storage.get(KEYS.loveNotes) || [],
      logs: Storage.get(KEYS.logs) || [],
      recipes: Storage.get(KEYS.recipes) || [],
      timestamp: Storage.getLastModified()
    };
    
    try {
      const roomRef = doc(db, 'rooms', currentRoomId);
      await setDoc(roomRef, payload, { merge: true });
      console.log("Data pushed to Firebase");
      updateStatus(true);
    } catch (e) {
      console.error("Failed to push sync data to Firebase", e);
      updateStatus(false);
    }
  },

  // Merge logic: Combine arrays, dedup by ID, prefer newer updatedAt
  merge: (remote: SyncPayload) => {
    let hasChanges = false;
    
    const mergeCollection = (key: string, remoteItems: any[]) => {
      if (!remoteItems) return;
      const localItems = Storage.get<any>(key) || [];
      const map = new Map();

      // Load local
      localItems.forEach(i => map.set(i.id, i));

      // Merge remote
      remoteItems.forEach(remoteItem => {
        const localItem = map.get(remoteItem.id);
        if (!localItem) {
          // New item from partner
          map.set(remoteItem.id, remoteItem);
          hasChanges = true;
        } else {
          // Conflict: take the one with newer timestamp
          const localTime = localItem.updatedAt || 0;
          const remoteTime = remoteItem.updatedAt || 0;
          if (remoteTime > localTime) {
            map.set(remoteItem.id, remoteItem);
            hasChanges = true;
          }
        }
      });

      // Save back to storage if changed
      if (hasChanges) {
        Storage.set(key, Array.from(map.values()), remote.timestamp, true);
      }
    };

    mergeCollection(KEYS.activities, remote.activities);
    mergeCollection(KEYS.movies, remote.movies);
    mergeCollection(KEYS.food, remote.food);
    mergeCollection(KEYS.registry, remote.registry);
    mergeCollection(KEYS.loveNotes, remote.loveNotes);
    mergeCollection(KEYS.logs, remote.logs);
    mergeCollection(KEYS.recipes, remote.recipes);
  }
};
