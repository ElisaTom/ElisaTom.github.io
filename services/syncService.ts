import { joinRoom } from 'trystero/torrent';
import { Storage, KEYS } from './storage';
import { Config } from './storage';
import { pullFromFirestore, pushToFirestore, subscribeToFirestore } from './firestoreSync';

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

let room: any = null;
let sendAction: any = null;
let onReceiveAction: any = null;
let currentRoomId: string | null = null;

export const SyncService = {
  // Join a "Room" based on the Couple ID
  connect: (roomId: string, onStatusChange: (peers: number) => void) => {
    if (room) return; // Already connected

    console.log(`Connecting to Sync Room: ${roomId}`);
    currentRoomId = roomId;

    // Config: appId distinguishes our app traffic from others on the public tracker
    room = joinRoom({ appId: 'couple-os-v1' }, roomId);

    // Track peers
    room.onPeerJoin((peerId: string) => {
      console.log('Partner joined!', peerId);
      onStatusChange(1);
      SyncService.pushData(); // Auto-push when partner joins
    });

    room.onPeerLeave((peerId: string) => {
      console.log('Partner left', peerId);
      onStatusChange(0);
    });

    // Create Action Channel
    const [send, get] = room.makeAction('sync_data');
    sendAction = send;
    onReceiveAction = get;

    // Handle Incoming Data
    onReceiveAction((data: SyncPayload, peerId: string) => {
      console.log("Received Sync Data from partner", data);
      SyncService.merge(data);
      alert("Sincronizzazione completata! Nuovi dati dal partner.");
    });

    // Pull any data written to Firestore while we were offline
    pullFromFirestore(roomId);

    // Subscribe to real-time Firestore changes from the partner
    subscribeToFirestore(roomId, () => {
      console.log("Firestore sync received");
    });
  },

  // Send local data to partner
  pushData: () => {
    if (!sendAction) return;
    
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
    
    sendAction(payload);
    console.log("Data pushed to partner");

    // Also persist to Firestore so it's available when partner comes back online
    if (currentRoomId) pushToFirestore(currentRoomId);
  },

  // Merge logic: Combine arrays, dedup by ID, prefer newer updatedAt
  merge: (remote: SyncPayload) => {
    const mergeCollection = (key: string, remoteItems: any[]) => {
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
        } else {
          // Conflict: take the one with newer timestamp
          const localTime = localItem.updatedAt || 0;
          const remoteTime = remoteItem.updatedAt || 0;
          if (remoteTime > localTime) {
            map.set(remoteItem.id, remoteItem);
          }
        }
      });

      // Save back to storage
      Storage.set(key, Array.from(map.values()), remote.timestamp);
    };

    mergeCollection(KEYS.activities, remote.activities || []);
    mergeCollection(KEYS.movies, remote.movies || []);
    mergeCollection(KEYS.food, remote.food || []);
    mergeCollection(KEYS.registry, remote.registry || []);
    mergeCollection(KEYS.loveNotes, remote.loveNotes || []);
    mergeCollection(KEYS.logs, remote.logs || []);
    mergeCollection(KEYS.recipes, remote.recipes || []);
  }
};
