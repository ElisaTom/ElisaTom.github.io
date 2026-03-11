
import { Storage, KEYS } from './storage';
import { Activity, Movie, FoodSpot, RegistryItem, LoveNote, Log, Recipe } from '../types';

// Wrapper that just points to LocalStorage
// The "Sync" happens separately via SyncService events or manual triggers

const createService = <T>(key: string) => ({
    subscribe: (cb: (data: T[]) => void) => Storage.subscribe<T>(key, (data) => cb(data.filter((i: any) => !i.deleted))),
    add: (item: T) => Storage.add(key, item as any),
    update: (id: string, data: Partial<T>) => Storage.update(key, id, data as any),
    delete: (id: string) => Storage.delete(key, id),
});

export const DataService = {
  activities: createService<Activity>(KEYS.activities),
  movies: createService<Movie>(KEYS.movies),
  food: createService<FoodSpot>(KEYS.food),
  registry: createService<RegistryItem>(KEYS.registry),
  loveNotes: createService<LoveNote>(KEYS.loveNotes),
  logs: createService<Log>(KEYS.logs),
  recipes: createService<Recipe>(KEYS.recipes),
};
