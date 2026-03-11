
import { Storage, KEYS } from './storage';
import { db } from './firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

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

const COLLECTION_KEYS = ['activities', 'movies', 'food', 'registry', 'loveNotes', 'logs', 'recipes'] as const;
type CollectionKey = typeof COLLECTION_KEYS[number];

const KEY_MAP: Record<CollectionKey, string> = {
  activities: KEYS.activities,
  movies: KEYS.movies,
  food: KEYS.food,
  registry: KEYS.registry,
  loveNotes: KEYS.loveNotes,
  logs: KEYS.logs,
  recipes: KEYS.recipes,
};

let currentRoomId: string | null = null;
let pushTimeout: ReturnType<typeof setTimeout> | null = null;
let isConnected = false;
let statusCallback: ((peers: number) => void) | null = null;
let unsubscribeSnapshot: (() => void) | null = null;
// Bug 3 fix: AbortController to clean up event listeners on reconnect
let dbUpdateAbort: AbortController | null = null;
// Bug 4 fix: flags to prevent sync loops
let isPushing = false;
let lastPushedTimestamp = 0;
let isMerging = false;

const updateStatus = (status: boolean) => {
  if (isConnected !== status) {
    isConnected = status;
    if (statusCallback) statusCallback(status ? 1 : 0);
  }
};

// Bug 1 fix: mergeCollection is a standalone function with its own hasChanges per collection
const mergeCollection = (localItems: any[], remoteItems: any[]): any[] | null => {
  if (!remoteItems || remoteItems.length === 0) return null;

  const map = new Map<string, any>();
  let hasChanges = false;
  const localSize = localItems.length;

  localItems.forEach(i => map.set(i.id, i));

  remoteItems.forEach(remoteItem => {
    const localItem = map.get(remoteItem.id);
    if (!localItem) {
      map.set(remoteItem.id, remoteItem);
      hasChanges = true;
    } else {
      const localTime = localItem.updatedAt || 0;
      const remoteTime = remoteItem.updatedAt || 0;
      if (remoteTime > localTime) {
        map.set(remoteItem.id, remoteItem);
        hasChanges = true;
      }
    }
  });

  if (!hasChanges && map.size === localSize) return null;
  return Array.from(map.values());
};

export const SyncService = {
  // Connect to the room and start real-time sync
  connect: (roomId: string, onStatusChange: (peers: number) => void) => {
    if (currentRoomId === roomId && unsubscribeSnapshot) return; // Already connected

    // Bug 3 fix: clean up previous connection before starting a new one
    SyncService.disconnect();

    console.log(`[Sync] Connecting to Firebase Room: ${roomId}`);
    currentRoomId = roomId;
    statusCallback = onStatusChange;

    // Bug 5 fix: persist roomId for auto-reconnect (failure is acceptable in private browsing mode)
    try { localStorage.setItem('sync_room_id', roomId); } catch (_e) {}

    const roomRef = doc(db, 'rooms', roomId);

    // Listen for real-time updates from Firebase
    unsubscribeSnapshot = onSnapshot(roomRef, (docSnap) => {
      // Bug 4 fix: skip snapshot-triggered merges while we are pushing
      if (isPushing) return;

      if (docSnap.exists()) {
        const data = docSnap.data() as SyncPayload;
        SyncService.mergeRemote(data);
        updateStatus(true);
      } else {
        // Room doesn't exist yet, push initial data
        SyncService.pushData();
        updateStatus(true);
      }
    }, (error) => {
      console.error('[Sync] Firebase error:', error);
      updateStatus(false);
    });

    // Bug 3 fix: use AbortController so the listener is removed when disconnect() is called
    dbUpdateAbort = new AbortController();

    window.addEventListener('db-update', (e: any) => {
      // Bug 4 fix: skip if change came from a remote merge
      if (e.detail.isRemote || isMerging) return;

      if (pushTimeout) clearTimeout(pushTimeout);
      pushTimeout = setTimeout(() => {
        SyncService.pushData();
      }, 1500); // 1.5 s debounce: long enough to batch rapid edits, short enough to feel instant
    }, { signal: dbUpdateAbort.signal });

    // Bug 5 fix: re-sync when app comes to foreground (critical for iOS Safari tab suspension)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && currentRoomId) {
        console.log('[Sync] App became visible, re-syncing...');
        SyncService.pushData();
      }
    }, { signal: dbUpdateAbort.signal });
  },

  disconnect: () => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    if (dbUpdateAbort) {
      dbUpdateAbort.abort();
      dbUpdateAbort = null;
    }
    if (pushTimeout) {
      clearTimeout(pushTimeout);
      pushTimeout = null;
    }
    currentRoomId = null;
    updateStatus(false);
  },

  // Bug 2 fix: read remote state first, merge bidirectionally, then write
  pushData: async () => {
    if (!currentRoomId || isPushing) return;

    const currentTimestamp = Storage.getLastModified();
    // Bug 4 fix: skip push if nothing has changed since the last push
    if (currentTimestamp <= lastPushedTimestamp) return;

    isPushing = true;

    try {
      const roomRef = doc(db, 'rooms', currentRoomId);

      // Read current remote state to avoid overwriting partner's data
      const remoteSnap = await getDoc(roomRef);
      const remoteData = remoteSnap.exists() ? (remoteSnap.data() as SyncPayload) : null;

      // Build bidirectionally-merged payload
      const merged: any = {};

      for (const key of COLLECTION_KEYS) {
        const localItems: any[] = Storage.get<any>(KEY_MAP[key]) || [];
        const remoteItems: any[] = remoteData?.[key] || [];

        const map = new Map<string, any>();
        remoteItems.forEach((i: any) => map.set(i.id, i));
        localItems.forEach((localItem: any) => {
          const remoteItem = map.get(localItem.id);
          if (!remoteItem) {
            map.set(localItem.id, localItem);
          } else {
            const localTime = localItem.updatedAt || 0;
            const remoteTime = remoteItem.updatedAt || 0;
            // Local wins on equal timestamps during push (we are the writer for this device's changes)
            if (localTime >= remoteTime) {
              map.set(localItem.id, localItem);
            }
            // else keep remote (already in map)
          }
        });

        merged[key] = Array.from(map.values());
      }

      merged.timestamp = Math.max(currentTimestamp, remoteData?.timestamp || 0);

      await setDoc(roomRef, merged);
      lastPushedTimestamp = merged.timestamp;
      console.log('[Sync] Data pushed to Firebase');
      updateStatus(true);
    } catch (e) {
      console.error('[Sync] Failed to push', e);
      updateStatus(false);
    } finally {
      isPushing = false;
    }
  },

  // Bug 1 fix: each collection has independent hasChanges via standalone mergeCollection()
  mergeRemote: (remote: SyncPayload) => {
    isMerging = true;

    for (const key of COLLECTION_KEYS) {
      const storageKey = KEY_MAP[key];
      const localItems: any[] = Storage.get<any>(storageKey) || [];
      const remoteItems: any[] = remote[key] || [];

      const merged = mergeCollection(localItems, remoteItems);
      if (merged) {
        Storage.set(storageKey, merged, remote.timestamp, true);
      }
    }

    isMerging = false;
  },

  // Bug 5 fix: auto-reconnect on app init using persisted roomId
  autoReconnect: (onStatusChange: (peers: number) => void) => {
    try {
      const savedRoom = localStorage.getItem('sync_room_id');
      if (savedRoom && !currentRoomId) {
        SyncService.connect(savedRoom, onStatusChange);
      }
    } catch (_e) {}
  },

  getRoomId: () => currentRoomId,
};
