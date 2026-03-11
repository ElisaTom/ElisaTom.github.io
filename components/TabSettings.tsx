import React from 'react';
import { Log, Activity, FoodSpot, Movie, RegistryItem, LoveNote, ThemeMode, ThemeColor, Language, Recipe } from '../types';
import { format } from 'date-fns';
import { Download, Upload, Database, Moon, Sun, Palette, Check, RefreshCw, Languages } from 'lucide-react';
import { DataService } from '../services/dataService';
import { t } from '../i18n';

interface Props {
  logs: Log[];
  activities: Activity[];
  foodSpots: FoodSpot[];
  recipes: Recipe[];
  movies: Movie[];
  registry: RegistryItem[];
  loveNotes: LoveNote[];
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  themeColor: ThemeColor;
  setThemeColor: (c: ThemeColor) => void;
  language: Language;
  setLanguage: (l: Language) => void;
}

export const TabSettings: React.FC<Props> = ({ 
  logs, activities, foodSpots, recipes, movies, registry, loveNotes, 
  theme, setTheme, themeColor, setThemeColor,
  language, setLanguage
}) => {
  
  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      logs, activities, foodSpots, recipes, movies, registry, loveNotes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eli-nic-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

   const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if(!confirm(t(language, "This will merge imported data into your current database. Continue?"))) return;
        
        if(json.activities) json.activities.forEach((i: any) => DataService.activities.add(i));
        if(json.logs) json.logs.forEach((i: any) => DataService.logs.add(i));
        if(json.foodSpots) json.foodSpots.forEach((i: any) => DataService.food.add(i));
        if(json.movies) json.movies.forEach((i: any) => DataService.movies.add(i));
        if(json.registry) json.registry.forEach((i: any) => DataService.registry.add(i));
        if(json.loveNotes) json.loveNotes.forEach((i: any) => DataService.loveNotes.add(i));
        if(json.recipes) json.recipes.forEach((i: any) => DataService.recipes.add(i));
        
        alert(t(language, "Import Complete!"));
      } catch (err) {
        alert(t(language, "Invalid JSON file"));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t(language, "System Settings")}</h2>
        </div>
      </div>

      {/* --- SECTION: APPEARANCE --- */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Palette className="w-4 h-4" /> {t(language, "Appearance")}
        </h3>

        {/* Theme Mode */}
        <div className="glass-card p-4 rounded-2xl flex items-center justify-between dark:bg-slate-800">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300">
                {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200">{t(language, "Theme")}</h4>
                <p className="text-xs text-slate-400">{theme === 'light' ? t(language, 'Minimal Light') : t(language, 'Minimal Dark')}</p>
              </div>
           </div>
           <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <button 
                onClick={() => setTheme('light')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${theme === 'light' ? 'bg-white shadow text-amber-500' : 'text-slate-400'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${theme === 'dark' ? 'bg-slate-600 shadow text-indigo-400' : 'text-slate-400'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Theme Color Selector */}
        <div className="glass-card p-4 rounded-2xl space-y-3 dark:bg-slate-800">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300">
                 <Palette className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200">{t(language, "Theme Color")}</h4>
                <p className="text-xs text-slate-400">{t(language, "Accent Color")}</p>
              </div>
           </div>
           <div className="flex flex-wrap gap-2 pt-2">
              <button 
                 onClick={() => setThemeColor('prism')} 
                 className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 
                 ${themeColor === 'prism' ? 'border-slate-400 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
              >
                 Prism UI
              </button>
              {[
                { id: 'blue', bg: 'bg-blue-200' },
                { id: 'rose', bg: 'bg-rose-200' },
                { id: 'violet', bg: 'bg-violet-200' },
                { id: 'emerald', bg: 'bg-emerald-200' },
                { id: 'amber', bg: 'bg-amber-200' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setThemeColor(c.id as any)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${c.bg} ${themeColor === c.id ? 'ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-800' : ''}`}
                >
                   {themeColor === c.id && <Check className="w-4 h-4 text-slate-700" />}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* --- SECTION: DATA MANAGEMENT --- */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Database className="w-4 h-4" /> {t(language, "Data Management")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Export */}
           <button 
             onClick={handleExport}
             className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/60 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors group text-center"
           >
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200">{t(language, "Backup Data")}</h4>
                <p className="text-xs text-slate-400">{t(language, "Download JSON file")}</p>
              </div>
           </button>

           {/* Import */}
           <div className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/60 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors group text-center relative">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 rounded-full group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200">{t(language, "Restore Data")}</h4>
                <p className="text-xs text-slate-400">{t(language, "Import JSON file")}</p>
              </div>
              <input 
                type="file" 
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
           </div>
        </div>
      </div>

      <div className="text-center pt-8 text-slate-300 text-xs font-mono">
        Eli & Nic Couple OS
      </div>
    </div>
  );
};
