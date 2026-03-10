import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import * as AppStorage from './storage';

let unsubscribe: any = null;
let isPushing = false;

export const SyncService = {
  connect: (roomId: string, onStatusChange: (peers: number) => void) => {
    if (unsubscribe) return;

    console.log(`Collegato alla stanza Cloud: ${roomId}`);
    const docRef = doc(db, 'rooms', roomId);

    onStatusChange(1);

    unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        if (isPushing) return; // Ignora i rimbalzi mentre stiamo salvando noi
        
        const data = docSnap.data() as any;
        const localTs = AppStorage.Storage.getLastModified();
        
        // Se il Cloud ha dati più nuovi, SCARICALI
        if (data && data.timestamp > localTs) {
           console.log("Novità dal Cloud! Scarico i dati...");
           SyncService.merge(data);
        } 
        // Se invece il telefono ha dati più nuovi, CARICALI
        else if (data && localTs > data.timestamp) {
           console.log("Dati locali più recenti, aggiorno il Cloud...");
           SyncService.pushData(roomId);
        }
      } else {
        // Se la stanza è vuota (primo accesso assoluto), crea il salvataggio
        SyncService.pushData(roomId);
      }
    });

    window.addEventListener('db-update', () => {
       if (!isPushing) {
           SyncService.pushData(roomId);
       }
    });
  },

  pushData: async (roomId?: string) => {
    const id = roomId || AppStorage.Config.get().roomId;
    if (!id) return;

    isPushing = true;
    const payload = {
      activities: AppStorage.Storage.get(AppStorage.KEYS.activities) || [],
      movies: AppStorage.Storage.get(AppStorage.KEYS.movies) || [],
      food: AppStorage.Storage.get(AppStorage.KEYS.food) || [],
      registry: AppStorage.Storage.get(AppStorage.KEYS.registry) || [],
      loveNotes: AppStorage.Storage.get(AppStorage.KEYS.loveNotes) || [],
      logs: AppStorage.Storage.get(AppStorage.KEYS.logs) || [],
      timestamp: AppStorage.Storage.getLastModified()
    };
    
    try {
        await setDoc(doc(db, 'rooms', id), payload, { merge: true });
    } catch (e) {
        console.error("Errore di sincronizzazione Cloud:", e);
    }
    
    setTimeout(() => { isPushing = false; }, 1000);
  },

  merge: (remote: any) => {
    if (!remote) return;
    const mergeCollection = (key: string, remoteItems: any[]) => {
      if (!remoteItems) return;
      const localItems = AppStorage.Storage.get<any>(key) || [];
      const map = new Map();

      localItems.forEach((i: any) => map.set(i.id, i));

      remoteItems.forEach((remoteItem: any) => {
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

      AppStorage.Storage.set(key, Array.from(map.values()), remote.timestamp);
    };

    isPushing = true;
    mergeCollection(AppStorage.KEYS.activities, remote.activities);
    mergeCollection(AppStorage.KEYS.movies, remote.movies);
    mergeCollection(AppStorage.KEYS.food, remote.food);
    mergeCollection(AppStorage.KEYS.registry, remote.registry);
    mergeCollection(AppStorage.KEYS.loveNotes, remote.loveNotes);
    mergeCollection(AppStorage.KEYS.logs, remote.logs);
    setTimeout(() => { isPushing = false; }, 500);
  }
};
