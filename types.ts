
export type TabId = 'home' | 'memories' | 'discovery' | 'activities' | 'media' | 'food' | 'wishlist' | 'lovenotes' | 'insights' | 'settings';

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'prism' | 'blue' | 'rose' | 'violet' | 'emerald' | 'amber';
export type Language = 'en';

export interface BaseItem {
  id: string;
  updatedAt?: number;
}

export interface Activity extends BaseItem {
  name: string;
  category: 'Nature' | 'Culture' | 'Sport' | 'Relax' | 'Social' | 'Trip' | 'Other';
  customCategory?: string;
  budget: 1 | 2 | 3; // 1 = $, 2 = $$, 3 = $$$
  energy: 1 | 2 | 3 | 4 | 5;
  location?: string;
}

export interface Movie extends BaseItem {
  title: string;
  platform: 'Netflix' | 'Prime' | 'Disney+' | 'HBO' | 'Hulu' | 'AppleTV+' | 'Other';
  type: 'movie' | 'series';
  genre: string;
  status: 'active' | 'wishlist' | 'watched';
  tracker?: { s: number; e: number; total?: number };
  rating?: number;
  review?: string;
  dateCompleted?: string;
}

export interface FoodSpot extends BaseItem {
  name: string;
  type: string;
  status: 'wishlist' | 'visited';
  ratings?: {
    location: number;
    menu: number;
    service: number;
    bill: number;
  };
  totalScore?: number;
  review?: string;
  dateVisited?: string;
  location?: string;
}

export interface RegistryItem extends BaseItem {
  text: string;
  type: string;
  beneficiary: 'Him' | 'Her' | 'Us';
  status: 'pending' | 'granted';
}

export interface LoveNote extends BaseItem {
  text: string;
  beneficiary: 'Him' | 'Her';
  date: string;
}

export interface Log extends BaseItem {
  activityId?: string; // Optional linkage
  title: string;
  rating: number; // 1-5
  date: string;
  notes?: string;
  photo?: string;
  type: 'milestone' | 'activity' | 'media' | 'food' | 'other';
}

export interface Recipe extends BaseItem {
  title: string;
  category: 'Appetizers' | 'First Course' | 'Second Course' | 'Dessert' | 'Ethnic' | 'Other';
  ingredients?: string;
  instructions?: string;
  rating?: number;
  photo?: string;
}
