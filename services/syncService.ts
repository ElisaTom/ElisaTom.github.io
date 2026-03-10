import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Storage, KEYS, Config } from './storage';

let unsubscribe: any = null;
let isPushing = false;

export const SyncService = {
  connect: (roomId: string, onStatusChange: (peers: number) => void) => {
    if (unsubscribe) return; // Evita connessioni doppie

    console.log(`Collegato alla stanza Cloud: ${roomId}`);
    const docRef = doc(db, 'rooms', roomId);

    // Accendiamo la spia verde "Connected" fissa!
    onStatusChange(1);

    // 1. IN ASCOLTO: Se il tuo ragazzo aggiunge qualcosa, scaricalo subito!
    unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && !isPushing) {
        const data = docSnap.data() as any;
        // Aggiorna solo se i dati dal cloud sono più recenti
        if (data.timestamp > Storage.getLastModified()) {
           console.log("Nuovi ricordi scaricati dal Cloud!");
           SyncService.merge(data);
        }
      }
    });

    // 2. IN INVIO: Ogni volta che aggiungi qualcosa, salvalo subito nel Cloud
    window.addEventListener('db-update', () => {
       if (!isPushing) {
           SyncService.pushData(roomId);
       }
    });

    // 3. Appena si apre l'app, fai un salvataggio di sicurezza
    SyncService.pushData(roomId);
  },

  pushData: async (roomId?: string) => {
    const id = roomId || Config.get().roomId;
    if (!id) return;

    isPushing = true; // Blocchiamo il download mentre stiamo caricando
    const payload = {
      activities: Storage.get(KEYS.activities) || [],
      movies: Storage.get(KEYS.movies) || [],
      food: Storage.get(KEYS.food) || [],
      registry: Storage.get(KEYS.registry) || [],
      loveNotes: Storage.get(KEYS.loveNotes) || [],
      logs: Storage.get(KEYS.logs) || [],
      timestamp: Storage.getLastModified()
    };
    
    try {
        await setDoc(doc(db, 'rooms', id), payload, { merge: true });
    } catch (e) {
        console.error("Errore di sincronizzazione Cloud:", e);
    }
    
    setTimeout(() => { isPushing = false; }, 1000);
  },

  merge: (remote: any) => {
    const mergeCollection = (key: string, remoteItems: any[]) => {
      if (!remoteItems) return;
      const localItems = Storage.get<any>(key) || [];
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

      // Salviamo i dati uniti senza far scattare un finto upload
      isPushing = true;
      Storage.set(key, Array.from(map.values()), remote.timestamp);
      setTimeout(() => { isPushing = false; }, 500);
    };

    mergeCollection(KEYS.activities, remote.activities);
    mergeCollection(KEYS.movies, remote.movies);
    mergeCollection(KEYS.food, remote.food);
    mergeCollection(KEYS.registry, remote.registry);
    mergeCollection(KEYS.loveNotes, remote.loveNotes);
    mergeCollection(KEYS.logs, remote.logs);
  }
};
