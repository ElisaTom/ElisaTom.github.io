
// This replaces Firebase with simple LocalStorage
import { Activity, Movie, FoodSpot, RegistryItem, LoveNote, Log } from '../types';

export const KEYS = {
  activities: 'db_activities',
  movies: 'db_movies',
  food: 'db_food',
  registry: 'db_registry',
  loveNotes: 'db_loveNotes',
  logs: 'db_logs',
  config: 'couple_os_config'
};

const dispatch = (key: string, data: any) => {
    window.dispatchEvent(new CustomEvent('db-update', { detail: { key, data } }));
};

export const Storage = {
    get: <T>(key: string): T[] => {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch(e) { return []; }
    },
    
    set: <T>(key: string, data: T[]) => {
        localStorage.setItem(key, JSON.stringify(data));
        dispatch(key, data);
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
    delete: <T extends { id: string }>(key: string, id: string) => {
        const current = Storage.get<T>(key);
        const filtered = current.filter(i => i.id !== id);
        Storage.set(key, filtered);
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