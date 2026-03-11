
// This replaces Firebase with simple LocalStorage
import { Activity, Movie, FoodSpot, RegistryItem, LoveNote, Log, Recipe } from '../types';

export const KEYS = {
  activities: 'db_activities',
  movies: 'db_movies',
  food: 'db_food',
  registry: 'db_registry',
  loveNotes: 'db_loveNotes',
  logs: 'db_logs',
  recipes: 'db_recipes',
  config: 'couple_os_config'
};

const dispatch = (key: string, data: any, isRemote: boolean = false) => {
    window.dispatchEvent(new CustomEvent('db-update', { detail: { key, data, isRemote } }));
};

export const Storage = {
    get: <T>(key: string): T[] => {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch(e) { return []; }
    },
    
    set: <T>(key: string, data: T[], timestamp?: number, isRemote: boolean = false) => {
        localStorage.setItem(key, JSON.stringify(data));
        const ts = timestamp || Date.now();
        const currentTs = Storage.getLastModified();
        if (ts > currentTs) {
            localStorage.setItem('db_last_modified', ts.toString());
        }
        dispatch(key, data, isRemote);
    },

    getLastModified: (): number => {
        return parseInt(localStorage.getItem('db_last_modified') || '0');
    },

    // Generic Add
    add: <T extends { id: string, updatedAt?: number }>(key: string, item: T) => {
        const current = Storage.get<T>(key);
        const newItem = { ...item, updatedAt: Date.now() };
        Storage.set(key, [...current, newItem]);
        return newItem;
    },

    // Generic Update
    update: <T extends { id: string, updatedAt?: number }>(key: string, id: string, updates: Partial<T>) => {
        const current = Storage.get<T>(key);
        const updated = current.map(i => i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i);
        Storage.set(key, updated);
    },

    // Generic Delete
    delete: <T extends { id: string, updatedAt?: number, deleted?: boolean }>(key: string, id: string) => {
        const current = Storage.get<T>(key);
        const updated = current.map(i => i.id === id ? { ...i, deleted: true, updatedAt: Date.now() } : i);
        Storage.set(key, updated);
    },

    // Subscribe to changes
    subscribe: <T>(key: string, callback: (data: T[]) => void) => {
        const handler = (e: any) => {
            if (e.detail.key === key) callback(e.detail.data);
        };
        // Initial call
        callback(Storage.get<T>(key));
        window.addEventListener('db-update', handler);
        return () => window.removeEventListener('db-update', handler);
    }
};

export const Config = {
    get: () => {
        try {
            return JSON.parse(localStorage.getItem(KEYS.config) || '{}');
        } catch { return {}; }
    },
    set: (data: any) => {
        const current = Config.get();
        localStorage.setItem(KEYS.config, JSON.stringify({ ...current, ...data }));
    }
};