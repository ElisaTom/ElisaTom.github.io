import React, { useState, useEffect, useMemo } from 'react';
import { DataService } from './services/dataService';
import { Config } from './services/storage';
import { SyncService } from './services/syncService';
import { TabId, Activity, Log, FoodSpot, LoveNote, RegistryItem, Movie, ThemeMode, ThemeColor, Language } from './types';
import { Navigation } from './components/Navigation';
import { TabHome } from './components/TabHome';
import { TabMemories } from './components/TabMemories';
import { TabDiscovery } from './components/TabDiscovery';
import { TabActivities } from './components/TabActivities';
import { TabFood } from './components/TabFood';
import { TabWishlist } from './components/TabWishlist';
import { TabLoveNotes } from './components/TabLoveNotes';
import { TabMedia } from './components/TabMedia';
import { TabSettings } from './components/TabSettings';
import { TabInsights } from './components/TabInsights';
import { differenceInDays, parseISO } from 'date-fns';
import { Heart, Wifi, WifiOff, Users, ArrowRight, Lock } from 'lucide-react';
import { t } from './i18n';

const PRISM_THEME_MAP: Record<TabId, string> = {
  home: 'text-slate-600 dark:text-slate-300',
  memories: 'text-indigo-600 dark:text-indigo-400',
  discovery: 'text-fuchsia-600 dark:text-fuchsia-400',
  activities: 'text-emerald-600 dark:text-emerald-400',
  media: 'text-rose-600 dark:text-rose-400',
  food: 'text-orange-600 dark:text-orange-400',
  wishlist: 'text-teal-600 dark:text-teal-400',
  lovenotes: 'text-pink-600 dark:text-pink-400',
  insights: 'text-blue-600 dark:text-blue-400',
  settings: 'text-slate-600 dark:text-slate-400',
};

const PRISM_BG_MAP: Record<TabId, string> = {
  home: 'bg-slate-50 dark:bg-slate-900',
  memories: 'bg-indigo-50/50 dark:bg-slate-900',
  discovery: 'bg-fuchsia-50/50 dark:bg-slate-900',
  activities: 'bg-emerald-50/50 dark:bg-slate-900',
  media: 'bg-rose-50/50 dark:bg-slate-900',
  food: 'bg-orange-50/50 dark:bg-slate-900',
  wishlist: 'bg-teal-50/50 dark:bg-slate-900',
  lovenotes: 'bg-pink-50/50 dark:bg-slate-900',
  insights: 'bg-blue-50/50 dark:bg-slate-900',
  settings: 'bg-slate-50 dark:bg-slate-900',
};

const PASTEL_THEMES: Record<Exclude<ThemeColor, 'prism'>, { text: string, bg: string }> = {
  blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-slate-900' },
  rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-slate-900' },
  violet: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-slate-900' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-slate-900' },
  amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-slate-900' },
};

// --- SIMPLIFIED SETUP WIZARD ---
const SetupWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [roomCode, setRoomCode] = useState('');

  const handleStart = () => {
      if(!roomCode) return;
      // Save Config
      Config.set({ roomId: roomCode, isConfigured: true });
      onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card p-8 rounded-[2.5rem] shadow-2xl space-y-8 bg-white/80 dark:bg-slate-800/80 text-center">
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto">
           <Heart className="w-10 h-10 text-indigo-600 dark:text-indigo-400 fill-indigo-600/20" />
        </div>
        
        <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-['Outfit']">Welcome</h1>
            <p className="text-slate-500 dark:text-slate-400">Use the same password on both phones to connect</p>
        </div>

        <div className="space-y-4">
            <input 
                className="w-full text-center text-2xl font-bold tracking-widest p-4 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-indigo-500 outline-none uppercase dark:text-white placeholder:text-slate-300"
                placeholder="PASSWORD"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase().replace(/\s/g,''))}
            />
            
            <button 
                onClick={handleStart}
                disabled={!roomCode}
                className="w-full py-4 bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
                Start <ArrowRight className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isSetup, setIsSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [themeColor, setThemeColor] = useState<ThemeColor>('prism');
  const language: Language = 'en';
  const [peersCount, setPeersCount] = useState(0);

  // Check initial config
  useEffect(() => {
      const conf = Config.get();
      if(conf.isConfigured && conf.roomId) {
          setIsSetup(true);
          if (conf.theme) setTheme(conf.theme);
          if (conf.themeColor) setThemeColor(conf.themeColor);
          // Auto-connect sync
          SyncService.connect(conf.roomId, (count) => setPeersCount(count));
      }
  }, []);

  // Data State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [food, setFood] = useState<FoodSpot[]>([]);
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [registry, setRegistry] = useState<RegistryItem[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);

  // Toggle Dark Mode
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Subscriptions
  useEffect(() => {
    if(!isSetup) return;

    const unsubActivities = DataService.activities.subscribe(setActivities);
    const unsubLogs = DataService.logs.subscribe(setLogs);
    const unsubFood = DataService.food.subscribe(setFood);
    const unsubNotes = DataService.loveNotes.subscribe(setNotes);
    const unsubRegistry = DataService.registry.subscribe(setRegistry);
    const unsubMovies = DataService.movies.subscribe(setMovies);

    return () => {
      unsubActivities();
      unsubLogs();
      unsubFood();
      unsubNotes();
      unsubRegistry();
      unsubMovies();
    };
  }, [isSetup]);

  // Calculate Streak
  const streak = useMemo(() => {
    if (logs.length === 0) return 0;
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstLogDate = parseISO(sortedLogs[0].date);
    const today = new Date();
    const diff = differenceInDays(today, firstLogDate);
    return diff < 0 ? 0 : diff + 1;
  }, [logs]);

  // Compute Current Theme Classes
  const themeClasses = useMemo(() => {
    if (themeColor === 'prism') {
      return {
        text: PRISM_THEME_MAP[activeTab],
        bg: PRISM_BG_MAP[activeTab]
      };
    } else {
      const pastel = PASTEL_THEMES[themeColor];
      return {
        text: pastel.text,
        bg: pastel.bg
      };
    }
  }, [activeTab, themeColor]);

  // --- Handlers ---
  const handleAddActivity = (newActivity: Activity) => DataService.activities.add(newActivity);
  const handleDeleteActivity = (id: string) => DataService.activities.delete(id);
  const handleAddFood = (item: FoodSpot) => DataService.food.add(item);
  const handleDeleteFood = (id: string) => DataService.food.delete(id);
  const handleAddRegistry = (item: RegistryItem) => DataService.registry.add(item);
  const handleUpdateRegistry = (id: string, data: Partial<RegistryItem>) => DataService.registry.update(id, data);
  const handleDeleteRegistry = (id: string) => DataService.registry.delete(id);
  const handleAddNote = (note: LoveNote) => DataService.loveNotes.add(note);
  const handleDeleteNote = (id: string) => DataService.loveNotes.delete(id);
  const handleAddMovie = (movie: Movie) => DataService.movies.add(movie);
  const handleUpdateMovie = (id: string, data: Partial<Movie>) => DataService.movies.update(id, data);
  const handleDeleteMovie = (id: string) => DataService.movies.delete(id);
  const handleAddLog = (log: Log) => DataService.logs.add(log);

  const handleSetTheme = (t: ThemeMode) => {
    setTheme(t);
    Config.set({ theme: t });
  };

  const handleSetThemeColor = (c: ThemeColor) => {
    setThemeColor(c);
    Config.set({ themeColor: c });
  };

  if (!isSetup) {
      return <SetupWizard onComplete={() => {
          const conf = Config.get();
          setIsSetup(true);
          SyncService.connect(conf.roomId, (count) => setPeersCount(count));
      }} />;
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-700 ease-in-out ${themeClasses.bg}`}>
      
      {/* Sync Status Indicator */}
      {peersCount > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full shadow-sm text-xs font-bold border border-slate-200 dark:border-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">Connected</span>
          </div>
        </div>
      )}

      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        colorClass={themeClasses.text} 
        language={language}
      />
      <main className="flex-1 h-[100dvh] overflow-y-auto relative">
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-24 md:p-8 md:pt-8">
          {(() => {
            switch (activeTab) {
                case 'home': return <TabHome logs={logs} onNavigate={setActiveTab} dayCount={streak} language={language} />;
                case 'memories': return <TabMemories logs={logs} onAddLog={handleAddLog} language={language} />;
                case 'discovery': return <TabDiscovery activities={activities} foodSpots={food} movies={movies} language={language} />;
                case 'activities': return <TabActivities activities={activities} onAdd={handleAddActivity} onDelete={handleDeleteActivity} language={language} />;
                case 'food': return <TabFood foodSpots={food} onAdd={handleAddFood} onDelete={handleDeleteFood} language={language} />;
                case 'wishlist': return <TabWishlist items={registry} onAdd={handleAddRegistry} onUpdate={handleUpdateRegistry} onDelete={handleDeleteRegistry} language={language} />;
                case 'lovenotes': return <TabLoveNotes notes={notes} onAdd={handleAddNote} onDelete={handleDeleteNote} language={language} />;
                case 'media': return <TabMedia movies={movies} onAdd={handleAddMovie} onUpdate={handleUpdateMovie} onDelete={handleDeleteMovie} language={language} />;
                case 'insights': return <TabInsights logs={logs} language={language} />;
                case 'settings': return <TabSettings 
                  logs={logs} 
                  activities={activities} 
                  foodSpots={food} 
                  movies={movies} 
                  registry={registry} 
                  loveNotes={notes} 
                  theme={theme} 
                  setTheme={handleSetTheme} 
                  themeColor={themeColor} 
                  setThemeColor={handleSetThemeColor}
                  language={language}
                />;
                default: return null;
            }
          })()}
        </div>
      </main>
    </div>
  );
}