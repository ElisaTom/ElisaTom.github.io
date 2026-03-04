import React, { useState } from 'react';
import { Activity, FoodSpot, Movie, Language, Recipe } from '../types';
import { pickFromList } from '../services/geminiService';
import { Sparkles, Loader, Dice5, BrainCircuit, MapPin, Battery, Wallet, Utensils, Film, ChefHat } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  activities: Activity[];
  foodSpots: FoodSpot[];
  recipes: Recipe[];
  movies: Movie[];
  language: Language;
}

export const TabDiscovery: React.FC<Props> = ({ activities, foodSpots, recipes, movies, language }) => {
  const [domain, setDomain] = useState<'Activity' | 'Food' | 'Media'>('Activity');
  const [foodMode, setFoodMode] = useState<'out' | 'home'>('out');
  const [mode, setMode] = useState<'fate' | 'smart'>('fate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [chosenItem, setChosenItem] = useState<any>(null);

  // --- Generic Filters ---
  const [energy, setEnergy] = useState(3);
  const [budget, setBudget] = useState(2);
  const [location, setLocation] = useState('');

  // --- Food Specific Filters ---
  const [cuisine, setCuisine] = useState('');
  const [includeVisited, setIncludeVisited] = useState(false);
  const [recipeCategory, setRecipeCategory] = useState<string>('Any');

  // --- Media Specific Filters ---
  const [mediaGenre, setMediaGenre] = useState('');
  const [mediaPlatform, setMediaPlatform] = useState('Any');
  const [mediaType, setMediaType] = useState('Any');
  const [includeWatched, setIncludeWatched] = useState(false);

  const getPool = () => {
    switch(domain) {
      case 'Activity': 
        return activities;
      case 'Food': 
        if (foodMode === 'out') {
          let foodPool = foodSpots.filter(f => f.status === 'wishlist');
          if (includeVisited) {
            foodPool = [...foodPool, ...foodSpots.filter(f => f.status === 'visited')];
          }
          return foodPool;
        } else {
          let recipePool = recipes;
          if (recipeCategory !== 'Any') {
            recipePool = recipes.filter(r => r.category === recipeCategory);
          }
          return recipePool;
        }
      case 'Media': 
        let mediaPool = movies.filter(m => m.status === 'wishlist');
        if (includeWatched) {
          mediaPool = [...mediaPool, ...movies.filter(m => m.status === 'watched')];
        }
        return mediaPool;
      default: return [];
    }
  };

  const handleDecide = async () => {
    setLoading(true);
    setResult(null);
    setChosenItem(null);

    const pool = getPool();

    if (pool.length === 0) {
      alert("No items available with these filters!");
      setLoading(false);
      return;
    }

    // --- FATE MODE ---
    if (mode === 'fate') {
      await new Promise(r => setTimeout(r, 800));
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      setChosenItem(randomItem);
      setResult({
        reason: "The stars have aligned.",
        matchScore: 100
      });
      setLoading(false);
      return;
    }

    // --- SMART MODE ---
    try {
      let criteria: any = {};
      if (domain === 'Activity') criteria = { energy: `${energy}/5`, budget: `${budget}/3`, location };
      else if (domain === 'Food') {
        if (foodMode === 'out') {
          criteria = { cuisine: cuisine || 'Any', budget: `${budget}/3`, location: location || 'Any' };
        } else {
          criteria = { category: recipeCategory };
        }
      }
      else if (domain === 'Media') criteria = { genre: mediaGenre || 'Any', platform: mediaPlatform, type: mediaType };

      const decision = await pickFromList(pool, domain, criteria);
      if (decision && decision.selectedId) {
        setChosenItem(pool.find(i => i.id === decision.selectedId));
        setResult(decision);
      } else {
        setChosenItem(pool[Math.floor(Math.random() * pool.length)]);
        setResult({ reason: "Oracle's backup choice.", matchScore: 50 });
      }
    } catch (e) {
      setChosenItem(pool[Math.floor(Math.random() * pool.length)]);
      setResult({ reason: "Offline choice.", matchScore: 50 });
    } finally {
      setLoading(false);
    }
  };

  const getThemeColor = () => {
    if (domain === 'Activity') return 'text-fuchsia-600 border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/40 dark:border-fuchsia-500 dark:text-fuchsia-300';
    if (domain === 'Food') return 'text-orange-600 border-orange-400 bg-orange-50 dark:bg-orange-900/40 dark:border-orange-500 dark:text-orange-300';
    return 'text-rose-600 border-rose-400 bg-rose-50 dark:bg-rose-900/40 dark:border-rose-500 dark:text-rose-300';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t(language, "Discovery")}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t(language, "Let the system choose")}</p>
      </div>

      <div className="glass-card p-6 rounded-[2rem] max-w-xl mx-auto space-y-8 shadow-xl dark:bg-slate-800">
        
        {/* Domain Selector */}
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-700 rounded-2xl">
          <button onClick={() => { setDomain('Activity'); setResult(null); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${domain === 'Activity' ? 'bg-white dark:bg-slate-600 shadow-sm text-fuchsia-600 dark:text-fuchsia-300' : 'text-slate-400'}`}>{t(language, "Activity")}</button>
          <button onClick={() => { setDomain('Food'); setResult(null); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${domain === 'Food' ? 'bg-white dark:bg-slate-600 shadow-sm text-orange-600 dark:text-orange-300' : 'text-slate-400'}`}>{t(language, "Food")}</button>
          <button onClick={() => { setDomain('Media'); setResult(null); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${domain === 'Media' ? 'bg-white dark:bg-slate-600 shadow-sm text-rose-600 dark:text-rose-300' : 'text-slate-400'}`}>{t(language, "Media")}</button>
        </div>

        {/* Food Mode Selector */}
        {domain === 'Food' && (
          <div className="flex p-1 bg-orange-100/50 dark:bg-slate-700/50 rounded-xl animate-fade-in">
            <button
              onClick={() => { setFoodMode('out'); setResult(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                foodMode === 'out' ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-300 shadow-sm' : 'text-slate-400 hover:text-orange-400'
              }`}
            >
              <MapPin className="w-3 h-3" /> {t(language, "Eating Out")}
            </button>
            <button
              onClick={() => { setFoodMode('home'); setResult(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                foodMode === 'home' ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-300 shadow-sm' : 'text-slate-400 hover:text-orange-400'
              }`}
            >
              <ChefHat className="w-3 h-3" /> {t(language, "Cooking at Home")}
            </button>
          </div>
        )}

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setMode('fate')} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${mode === 'fate' ? getThemeColor() : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 text-slate-400'}`}>
            <Dice5 className="w-8 h-8" />
            <div className="text-center"><span className="block font-bold">{t(language, "Blind Fate")}</span><span className="text-[10px] opacity-70">{t(language, "Random pick")}</span></div>
          </button>
          <button onClick={() => setMode('smart')} className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${mode === 'smart' ? getThemeColor() : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 text-slate-400'}`}>
            <BrainCircuit className="w-8 h-8" />
            <div className="text-center"><span className="block font-bold">{t(language, "Smart Match")}</span><span className="text-[10px] opacity-70">{t(language, "AI Analysis")}</span></div>
          </button>
        </div>

        {/* --- FILTERS SECTION --- */}
        {mode === 'smart' && (
          <div className="space-y-6 pt-6 border-t border-dashed border-slate-200 dark:border-slate-600 animate-slide-in">
            <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{t(language, "Calibrate Selection")}</h3>
            
            <div className="space-y-4">
              {domain === 'Activity' && (
                <>
                  <div className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-300 font-bold text-sm"><Battery className="w-4 h-4" /> {t(language, "Energy")}</div>
                      <span className="text-xs font-mono bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-600 dark:text-fuchsia-300 px-2 py-0.5 rounded-md">{energy}/5</span>
                    </div>
                    <input type="range" min="1" max="5" value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"/>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-300 font-bold text-sm"><Wallet className="w-4 h-4" /> {t(language, "Budget")}</div>
                      <span className="text-xs font-mono bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-600 dark:text-fuchsia-300 px-2 py-0.5 rounded-md">{budget}/3</span>
                    </div>
                    <input type="range" min="1" max="3" value={budget} onChange={(e) => setBudget(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"/>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-2xl">
                     <div className="flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-300 font-bold text-sm mb-2"><MapPin className="w-4 h-4" /> {t(language, "Location")}</div>
                     <input className="w-full bg-transparent border-b border-slate-300 dark:border-slate-500 focus:border-fuchsia-500 outline-none py-1 text-sm dark:text-white" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </>
              )}

              {domain === 'Food' && (
                <>
                  {foodMode === 'out' ? (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl border border-orange-100 dark:border-orange-900">
                        <input type="checkbox" checked={includeVisited} onChange={(e) => setIncludeVisited(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                        <span className="text-sm font-bold text-orange-800 dark:text-orange-200">{t(language, "Include visited spots?")}</span>
                      </div>
                      <div className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-2xl">
                         <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-bold text-sm mb-2"><Utensils className="w-4 h-4" /> {t(language, "Cuisine")}</div>
                         <input className="w-full bg-transparent border-b border-slate-300 dark:border-slate-500 focus:border-orange-500 outline-none py-1 text-sm dark:text-white" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-bold text-sm mb-2"><ChefHat className="w-4 h-4" /> {t(language, "Select Category")}</div>
                      <select 
                        className="w-full bg-transparent border-b border-slate-300 dark:border-slate-500 focus:border-orange-500 outline-none py-1 text-sm dark:text-white"
                        value={recipeCategory}
                        onChange={(e) => setRecipeCategory(e.target.value)}
                      >
                        <option value="Any">Any</option>
                        {['Appetizers', 'First Course', 'Second Course', 'Dessert', 'Ethnic', 'Other'].map(c => (
                          <option key={c} value={c}>{t(language, c)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {domain === 'Media' && (
                <>
                  <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/30 rounded-xl border border-rose-100 dark:border-rose-900">
                    <input type="checkbox" checked={includeWatched} onChange={(e) => setIncludeWatched(e.target.checked)} className="w-5 h-5 accent-rose-500" />
                    <span className="text-sm font-bold text-rose-800 dark:text-rose-200">{t(language, "Include re-watch?")}</span>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-2xl">
                     <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm mb-2"><Film className="w-4 h-4" /> {t(language, "Genre / Mood")}</div>
                     <input className="w-full bg-transparent border-b border-slate-300 dark:border-slate-500 focus:border-rose-500 outline-none py-1 text-sm dark:text-white" value={mediaGenre} onChange={(e) => setMediaGenre(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleDecide}
          disabled={loading}
          className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3 disabled:opacity-80 transition-all transform active:scale-95
            ${domain === 'Activity' ? 'bg-fuchsia-600 shadow-fuchsia-200 dark:shadow-none' : domain === 'Food' ? 'bg-orange-600 shadow-orange-200 dark:shadow-none' : 'bg-rose-600 shadow-rose-200 dark:shadow-none'}
          `}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>{t(language, "Consulting the Spirits...")}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>{t(language, "Make the Choice")}</span>
            </>
          )}
        </button>
      </div>

      {/* Result Reveal */}
      {result && chosenItem && (
        <div className="max-w-xl mx-auto animate-scale-up">
           <div className={`relative glass-card p-8 rounded-[2.5rem] shadow-2xl bg-gradient-to-b from-white dark:from-slate-800 text-center overflow-hidden
             ${domain === 'Activity' ? 'border-fuchsia-200 to-fuchsia-50 dark:to-fuchsia-900/20 dark:border-fuchsia-800' : domain === 'Food' ? 'border-orange-200 to-orange-50 dark:to-orange-900/20 dark:border-orange-800' : 'border-rose-200 to-rose-50 dark:to-rose-900/20 dark:border-rose-800'}
           `}>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                {mode === 'fate' ? t(language, "The Wheel of Fate Chose") : t(language, "The Oracle Recommends")}
              </h2>
              
              <h3 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4 font-['Outfit'] leading-tight">
                {chosenItem.name || chosenItem.title}
              </h3>

              <div className="bg-white/60 dark:bg-slate-700/60 p-6 rounded-2xl border border-white dark:border-slate-600">
                 <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">"{result.reason}"</p>
                 {mode === 'smart' && (
                   <div className="mt-4 flex justify-center items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{result.matchScore}% {t(language, "Match")}</span>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};