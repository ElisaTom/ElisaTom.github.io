import { db } from './firebase';
import { Storage, KEYS, setFirestoreSyncing } from './storage';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

let unsubscribeSnapshot: (() => void) | null = null;

const mergeCollection = (key: string, remoteItems: any[], timestamp: number) => {
    const localItems = Storage.get<any>(key);
    const map = new Map();

    localItems.forEach(i => map.set(i.id, i));

    remoteItems.forEach(remoteItem => {
        const localItem = map.get(remoteItem.id);
        if (!localItem) {
            map.set(remoteItem.id, remoteItem);
        } else {
            const localTime = localItem.updatedAt || 0;
            const remoteTime = remoteItem.updatedAt || 0;
            if (remoteTime > localTime) {
                map.set(remoteItem.id, remoteItem);
            }
        }
    });

    Storage.set(key, Array.from(map.values()), timestamp);
};

const mergeDocumentData = (data: any) => {
    const timestamp = data.updatedAt || Date.now();
    setFirestoreSyncing(true);
    try {
        if (data.activities) mergeCollection(KEYS.activities, data.activities, timestamp);
        if (data.movies) mergeCollection(KEYS.movies, data.movies, timestamp);
        if (data.food) mergeCollection(KEYS.food, data.food, timestamp);
        if (data.registry) mergeCollection(KEYS.registry, data.registry, timestamp);
        if (data.loveNotes) mergeCollection(KEYS.loveNotes, data.loveNotes, timestamp);
        if (data.logs) mergeCollection(KEYS.logs, data.logs, timestamp);
        if (data.recipes) mergeCollection(KEYS.recipes, data.recipes, timestamp);
    } finally {
        setFirestoreSyncing(false);
    }
};

export const pushToFirestore = async (roomId: string): Promise<void> => {
    if (!roomId) return;
    try {
        const ref = doc(db, 'rooms', roomId);
        await setDoc(ref, {
            activities: Storage.get(KEYS.activities),
            movies: Storage.get(KEYS.movies),
            food: Storage.get(KEYS.food),
            registry: Storage.get(KEYS.registry),
            loveNotes: Storage.get(KEYS.loveNotes),
            logs: Storage.get(KEYS.logs),
            recipes: Storage.get(KEYS.recipes),
            updatedAt: Date.now()
        });
        console.log('Pushed to Firestore');
    } catch (e) {
        console.error('Firestore push error:', e);
    }
};

export const pullFromFirestore = async (roomId: string): Promise<void> => {
    if (!roomId) return;
    try {
        const ref = doc(db, 'rooms', roomId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        mergeDocumentData(snap.data());
        console.log('Pulled from Firestore');
    } catch (e) {
        console.error('Firestore pull error:', e);
    }
};

export const subscribeToFirestore = (roomId: string, callback: () => void): (() => void) => {
    if (!roomId) return () => {};
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
    }

    const ref = doc(db, 'rooms', roomId);
    unsubscribeSnapshot = onSnapshot(
        ref,
        (snap) => {
            // Skip snapshots caused by our own pending writes to avoid loops
            if (snap.metadata.hasPendingWrites) return;
            if (!snap.exists()) return;
            mergeDocumentData(snap.data());
            callback();
        },
        (e) => {
            console.error('Firestore snapshot error:', e);
        }
    );

    return () => {
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
        }
    };
};
