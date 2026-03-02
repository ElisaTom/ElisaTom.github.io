import React, { useState } from 'react';
import { Activity } from '../types';
import { Plus, Trash2, MapPin, DollarSign, Zap, Loader } from 'lucide-react';
import { getPlaceFromMaps } from '../services/geminiService';

interface Props {
  activities: Activity[];
  onAdd: (a: Activity) => void;
  onDelete: (id: string) => void;
}

export const TabActivities: React.FC<Props> = ({ activities, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    name: '', category: 'Nature', budget: 1, energy: 3, location: ''
  });
  const [searching, setSearching] = useState(false);
  const [groundingResult, setGroundingResult] = useState<{text: string, chunks: any[]} | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivity.name) {
      onAdd({ ...newActivity, id: Date.now().toString() } as Activity);
      setShowForm(false);
      setNewActivity({ name: '', category: 'Nature', budget: 1, energy: 3, location: '' });
      setGroundingResult(null);
    }
  };
  
  const handleGrounding = async () => {
    if(!newActivity.location) return;
    setSearching(true);
    setGroundingResult(null);
    
    let userLoc = undefined;
    try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        userLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch(e) {
        console.log("Geolocation skipped or denied");
    }

    const res = await getPlaceFromMaps(newActivity.location, userLoc);
    if(res) {
        setGroundingResult(res);
    }
    setSearching(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-emerald-900 dark:text-emerald-300">Attività</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
        >
          <Plus className={`w-6 h-6 transition-transform ${showForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl space-y-4 animate-slide-in dark:bg-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Attività</label>
            <input 
              className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-emerald-100 dark:border-emerald-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:text-white"
              value={newActivity.name}
              onChange={e => setNewActivity({...newActivity, name: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
              <select 
                className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-emerald-100 dark:border-emerald-900 rounded-xl dark:text-white"
                value={newActivity.category}
                onChange={e => setNewActivity({...newActivity, category: e.target.value as any})}
              >
                {['Nature', 'Culture', 'Sport', 'Relax', 'Social', 'Trip', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Luogo</label>
              <div className="flex gap-2">
                  <input 
                    className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-emerald-100 dark:border-emerald-900 rounded-xl dark:text-white"
                    value={newActivity.location}
                    onChange={e => setNewActivity({...newActivity, location: e.target.value})}
                    placeholder="Nome posto o indirizzo"
                  />
                  {newActivity.location && (
                      <button 
                        type="button" 
                        onClick={handleGrounding} 
                        disabled={searching} 
                        className="p-3 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 transition-colors"
                      >
                          {searching ? <Loader className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                      </button>
                  )}
              </div>
            </div>
          </div>

          {/* Grounding Result Display */}
          {groundingResult && (
             <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl text-sm">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 text-xs mb-1 uppercase tracking-wider">Gemini ha trovato:</div>
                <p className="text-slate-700 dark:text-slate-300 mb-2">{groundingResult.text}</p>
                <div className="flex flex-wrap gap-2">
                  {groundingResult.chunks.map((chunk, i) => {
                    if(chunk.maps?.uri) {
                        return (
                            <a 
                                key={i} href={chunk.maps.uri} target="_blank" rel="noreferrer" 
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-700 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform"
                            >
                                <MapPin className="w-3 h-3" /> {chunk.maps.title || 'Vedi su Maps'}
                            </a>
                        );
                    }
                    return null;
                  })}
                </div>
             </div>
          )}

           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Budget ($)</label>
              <input type="range" min="1" max="3" value={newActivity.budget} onChange={e => setNewActivity({...newActivity, budget: parseInt(e.target.value) as any})} className="w-full accent-emerald-500"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Energia (1-5)</label>
              <input type="range" min="1" max="5" value={newActivity.energy} onChange={e => setNewActivity({...newActivity, energy: parseInt(e.target.value) as any})} className="w-full accent-emerald-500"/>
            </div>
           </div>
          <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">Aggiungi Idea</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map(activity => (
          <div key={activity.id} className="glass-card p-5 rounded-3xl hover:shadow-lg transition-all group relative dark:bg-slate-800">
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}
              className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <div className="mb-3">
              <span className="text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-1 rounded-full uppercase">
                {activity.category}
              </span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{activity.name}</h3>
            {activity.location && (
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                <MapPin className="w-3 h-3" />
                {activity.location}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
               <div className="flex items-center gap-1 text-emerald-500" title="Livello Energia">
                 <Zap className="w-4 h-4" />
                 <div className="flex gap-[2px]">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < activity.energy ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-600'}`} />
                   ))}
                 </div>
               </div>
               <div className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold" title="Budget">
                 <DollarSign className="w-4 h-4" />
                 <span>{'$'.repeat(activity.budget)}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};