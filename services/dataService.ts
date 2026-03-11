import { Storage, KEYS } from './storage';
import { Activity, Log, FoodSpot, LoveNote, RegistryItem, Movie, Recipe } from '../types';

export const DataService = {
  // ... (ci sono già activities, logs, ecc.)
  
  // DEVI AGGIUNGERE QUESTO BLOCCO:
  recipes: {
    subscribe: (cb: (data: Recipe[]) => void) => Storage.subscribe(KEYS.recipes, cb),
    add: (item: Recipe) => Storage.add(KEYS.recipes, item),
    update: (id: string, data: Partial<Recipe>) => Storage.update(KEYS.recipes, id, data),
    delete: (id: string) => Storage.delete(KEYS.recipes, id),
  }
};
