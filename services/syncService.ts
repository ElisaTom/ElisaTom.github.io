import { Storage, KEYS, setOnDataChange, setFirestoreSyncing } from './storage';
import { pullFromFirestore, pushToFirestore, subscribeToFirestore } from './firestoreSync';

let currentRoomId: string | null = null;
let unsubscribeFirestore: (() => void) | null = null;

/**
 * Simple SyncService that uses Firestore as single real-time source.
 */
export const SyncService = {
  connect: (roomId: string, onStatusChange?: (peers: number) => void) => {
    if (!roomId) return;
    if (currentRoomId === roomId) return; // already connected

    // cleanup previous
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
      unsubscribeFirestore = null;
    }

    currentRoomId = roomId;

    // Pull once at connect
    pullFromFirestore(roomId).catch((e) => console.error('pullFromFirestore error', e));

    // Subscribe to realtime changes (fires merge into Storage via firestoreSync)
    unsubscribeFirestore = subscribeToFirestore(roomId, () => {
      try { onStatusChange?.(1); } catch {}
    });

    // When local data changes, push to Firestore
    setOnDataChange(() => {
      if ((window as any).__firestore_syncing) return;
      SyncService.pushData();
    });

    console.log('SyncService: connected to', roomId);
  },

  pushData: async () => {
    if (!currentRoomId) return;
    try {
      await pushToFirestore(currentRoomId);
      console.log('SyncService: pushed local data to Firestore');
    } catch (e) {
      console.error('SyncService pushData error', e);
    }
  },

  disconnect: () => {
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
      unsubscribeFirestore = null;
    }
    currentRoomId = null;
    setOnDataChange(() => {});
    console.log('SyncService: disconnected');
  }
};
