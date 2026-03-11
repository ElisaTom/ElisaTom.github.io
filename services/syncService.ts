import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import * as AppStorage from './storage';

let unsubscribe: any = null;
let isPushing = false;
let syncTimeout: any = null;

export const SyncService = {
  connect: (roomId: string, onStatusChange: (peers: number) => void) => {
    if (unsubscribe) return;

    console.log(`Collegato alla stanza Cloud: ${roomId}`);
    const docRef = doc(db, 'rooms', roomId);

    onStatusChange(1); // Accende la spia Verde!

    unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        if (isPushing) return;
        
        const data = docSnap.data() as any;
        const localTs = AppStorage.Storage.getLastModified();
        
        // Se il Cloud ha dati più recenti
        if (data && data.timestamp > localTs) {
           console.log("Novità dal Cloud! Allineamento in corso...");
           SyncService.applyRemoteData(data);
        } 
        // Se i dati locali sono più recenti
        else if (data && localTs > data.timestamp) {
           console.log("Dati locali più recenti, aggiorno il Cloud...");
           SyncService.pushData(roomId);
        }
      } else {
        // Stanza vuota, primo salvataggio
        SyncService.pushData(roomId);
      }
    });

    window.addEventListener('db-update', () => {
       if (!isPushing) {
           clearTimeout(syncTimeout);
           syncTimeout = setTimeout(() => {
               SyncService.pushData(roomId);
           }, 800);
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
      recipes: AppStorage.Storage.get(AppStorage.KEYS.recipes) || [], // <-- RICETTE QUI!
      timestamp: AppStorage.Storage.getLastModified()
    };
    
    try {
        await setDoc(doc(db, 'rooms', id), payload);
    } catch (e) {
        console.error("Errore di sincronizzazione Cloud:", e);
    }
    
    setTimeout(() => { isPushing = false; }, 500);
  },

  applyRemoteData: (remote: any) => {
    if (!remote) return;
    
    isPushing = true; // Blocchiamo il salvataggio mentre stiamo scaricando
    
    AppStorage.Storage.set(AppStorage.KEYS.activities, remote.activities || [], remote.timestamp);
    AppStorage.Storage.set(AppStorage.KEYS.movies, remote.movies || [], remote.timestamp);
    AppStorage.Storage.set(AppStorage.KEYS.food, remote.food || [], remote.timestamp);
    AppStorage.Storage.set(AppStorage.KEYS.registry, remote.registry || [], remote.timestamp);
    AppStorage.Storage.set(AppStorage.KEYS.loveNotes, remote.loveNotes || [], remote.timestamp);
    AppStorage.Storage.set(AppStorage.KEYS.logs, remote.logs || [], remote.timestamp);
    AppStorage.Storage.set(AppStorage.KEYS.recipes, remote.recipes || [], remote.timestamp); // <-- RICETTE QUI!
    
    setTimeout(() => { isPushing = false; }, 500);
  }
};
