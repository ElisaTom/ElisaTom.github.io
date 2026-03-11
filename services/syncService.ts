
import { Storage, KEYS } from './storage';
import { Config } from './storage';

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
let syncInterval: any = null;
let pushTimeout: any = null;
let isConnected = false;
let statusCallback: ((peers: number) => void) | null = null;

const updateStatus = (status: boolean) => {
  if (isConnected !== status) {
    isConnected = status;
    if (statusCallback) statusCallback(status ? 1 : 0);
  }
};

export const SyncService = {
  // Connect to the room and start periodic sync
  connect: (roomId: string, onStatusChange: (peers: number) => void) => {
    if (currentRoomId === roomId) return; // Already connected
    
    console.log(`Connecting to Sync Room: ${roomId}`);
    currentRoomId = roomId;
    statusCallback = onStatusChange;
    
    // Initial pull
    SyncService.pullData();

    // Periodic sync every 10 seconds
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
      SyncService.pullData();
    }, 10000);

    // Listen for local changes to push
    window.addEventListener('db-update', (e: any) => {
      if (e.detail.isRemote) return; // Don't push if the change came from a pull
      
      if (pushTimeout) clearTimeout(pushTimeout);
      pushTimeout = setTimeout(() => {
        SyncService.pushData();
      }, 1000); // Debounce pushes
    });
  },

  // Pull data from server
  pullData: async () => {
    if (!currentRoomId) return;
    try {
      const res = await fetch(`/api/sync/${currentRoomId}`);
      if (res.ok) {
        const data: SyncPayload = await res.json();
        if (data) {
          SyncService.merge(data);
        }
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    } catch (e) {
      console.error("Failed to pull sync data", e);
      updateStatus(false);
    }
  },

  // Send local data to server
  pushData: async () => {
    if (!currentRoomId) return;
    
    const payload: SyncPayload = {
      activities: Storage.get(KEYS.activities),
      movies: Storage.get(KEYS.movies),
      food: Storage.get(KEYS.food),
      registry: Storage.get(KEYS.registry),
      loveNotes: Storage.get(KEYS.loveNotes),
      logs: Storage.get(KEYS.logs),
      recipes: Storage.get(KEYS.recipes),
      timestamp: Storage.getLastModified()
    };
    
    try {
      const res = await fetch(`/api/sync/${currentRoomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const mergedData: SyncPayload = await res.json();
        SyncService.merge(mergedData);
        console.log("Data pushed to server and merged");
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    } catch (e) {
      console.error("Failed to push sync data", e);
      updateStatus(false);
    }
  },

  // Merge logic: Combine arrays, dedup by ID, prefer newer updatedAt
  merge: (remote: SyncPayload) => {
    let hasChanges = false;
    
    const mergeCollection = (key: string, remoteItems: any[]) => {
      if (!remoteItems) return;
      const localItems = Storage.get<any>(key);
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
