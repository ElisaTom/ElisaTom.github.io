import React, { useState } from 'react';
import { Movie, Language } from '../types';
import { Play, Plus, Trash2, CheckCircle, Tv, Film, Star, Bookmark } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  movies: Movie[];
  onAdd: (movie: Movie) => void;
  onUpdate: (id: string, data: Partial<Movie>) => void;
  onDelete: (id: string) => void;
  language: Language;
}

export const TabMedia: React.FC<Props> = ({ movies, onAdd, onUpdate, onDelete, language }) => {
  const [activeTab, setActiveTab] = useState<'wishlist' | 'active' | 'watched'>('active');
  const [showForm, setShowForm] = useState(false);
  const [rateItem, setRateItem] = useState<string | null>(null);
  const [ratingData, setRatingData] = useState({ rating: 0, review: '' });

  const [newItem, setNewItem] = useState<Partial<Movie>>({
    title: '', platform: 'Netflix', type: 'series', genre: '', status: 'active', tracker: { s: 1, e: 1 }
  });

  const filteredMovies = movies.filter(m => m.status === activeTab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;
    onAdd({ ...newItem, id: Date.now().toString() } as Movie);
    setNewItem({ title: '', platform: 'Netflix', type: 'series', genre: '', status: 'active', tracker: { s: 1, e: 1 } });
    setShowForm(false);
  };

  const handleFinish = (id: string) => {
    setRateItem(id);
    setRatingData({ rating: 3, review: '' });
  };

  const submitRating = (id: string) => {
    onUpdate(id, {
      status: 'watched',
      rating: ratingData.rating,
      review: ratingData.review,
      dateCompleted: new Date().toISOString().split('T')[0]
    });
    setRateItem(null);
  };

  const startWatching = (id: string) => {
    onUpdate(id, { status: 'active', tracker: { s: 1, e: 1 } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-rose-900 dark:text-rose-300">{t(language, "Media")}</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg shadow-rose-200 dark:shadow-none transition-all"
        >
          <Plus className={`w-6 h-6 transition-transform ${showForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-rose-100/50 dark:bg-slate-700/50 rounded-xl">
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all flex items-center justify-center gap-2 ${
            activeTab === 'wishlist' ? 'bg-white dark:bg-slate-600 text-rose-600 dark:text-rose-300 shadow-sm' : 'text-slate-400 hover:text-rose-400'
          }`}
        >
          <Bookmark className="w-4 h-4" /> {t(language, "To Watch")}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all flex items-center justify-center gap-2 ${
            activeTab === 'active' ? 'bg-white dark:bg-slate-600 text-rose-600 dark:text-rose-300 shadow-sm' : 'text-slate-400 hover:text-rose-400'
          }`}
        >
          <Play className="w-4 h-4" /> {t(language, "Watching Now")}
        </button>
        <button
          onClick={() => setActiveTab('watched')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all flex items-center justify-center gap-2 ${
            activeTab === 'watched' ? 'bg-white dark:bg-slate-600 text-rose-600 dark:text-rose-300 shadow-sm' : 'text-slate-400 hover:text-rose-400'
          }`}
        >
          <CheckCircle className="w-4 h-4" /> {t(language, "Library")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl space-y-4 animate-slide-in dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Title")}</label>
                <input 
                  className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-rose-100 dark:border-rose-900 rounded-xl dark:text-white"
                  value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})}
                  required
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Platform")}</label>
                <select 
                  className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-rose-100 dark:border-rose-900 rounded-xl dark:text-white"
                  value={newItem.platform} onChange={e => setNewItem({...newItem, platform: e.target.value as any})}
                >
                  {['Netflix', 'Prime', 'Disney+', 'HBO', 'Hulu', 'AppleTV+', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
             </div>
          </div>
          
          <div className="flex gap-4">
             <div className="flex gap-4 items-center">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" checked={newItem.type === 'series'} onChange={() => setNewItem({...newItem, type: 'series'})} className="accent-rose-500" />
                 <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{t(language, "Series")}</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" checked={newItem.type === 'movie'} onChange={() => setNewItem({...newItem, type: 'movie'})} className="accent-rose-500" />
                 <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{t(language, "Movie")}</span>
               </label>
             </div>
             <input 
                className="flex-1 p-3 bg-white/50 dark:bg-slate-700/50 border border-rose-100 dark:border-rose-900 rounded-xl dark:text-white"
                placeholder={t(language, "Genre (e.g. Sci-Fi)")}
                value={newItem.genre} onChange={e => setNewItem({...newItem, genre: e.target.value})}
             />
          </div>

          <div className="flex gap-4 border-t border-rose-100 dark:border-rose-900 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={newItem.status === 'wishlist'} onChange={() => setNewItem({...newItem, status: 'wishlist'})} className="accent-rose-500 w-5 h-5" />
              <span className="font-bold text-slate-700 dark:text-slate-300">{t(language, "To Watch")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={newItem.status === 'active'} onChange={() => setNewItem({...newItem, status: 'active'})} className="accent-rose-500 w-5 h-5" />
              <span className="font-bold text-slate-700 dark:text-slate-300">{t(language, "Watching Now")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={newItem.status === 'watched'} onChange={() => setNewItem({...newItem, status: 'watched'})} className="accent-rose-500 w-5 h-5" />
              <span className="font-bold text-slate-700 dark:text-slate-300">{t(language, "Watched")}</span>
            </label>
          </div>

          <button type="submit" className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl shadow-md">{t(language, "Add")}</button>
        </form>
      )}

      {/* Grid Content */}
      <div className={`grid gap-4 ${activeTab === 'wishlist' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'}`}>
        {filteredMovies.map(movie => {
          if (activeTab === 'wishlist') {
            return (
              <div key={movie.id} className="p-4 bg-white/50 dark:bg-slate-700/50 border border-white dark:border-slate-600 rounded-2xl relative group hover:shadow-md transition-all flex flex-col justify-between h-40">
                <button 
                  onClick={() => onDelete(movie.id)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div>
                   <div className="flex justify-between items-start">
                     {movie.type === 'series' ? <Tv className="w-4 h-4 text-indigo-400" /> : <Film className="w-4 h-4 text-rose-400" />}
                   </div>
                   <h4 className="font-bold text-slate-700 dark:text-white mt-2 line-clamp-2">{movie.title}</h4>
                   <span className="text-xs text-slate-400">{movie.platform}</span>
                </div>
                <button 
                  onClick={() => startWatching(movie.id)}
                  className="w-full mt-2 py-1.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-200"
                >
                  {t(language, "Start Watching")}
                </button>
              </div>
            );
          }

          return (
            <div key={movie.id} className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 relative group hover:shadow-lg transition-shadow dark:bg-slate-800">
              <button 
                 onClick={() => onDelete(movie.id)}
                 className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                 <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 flex-1">
                 <div className={`p-3 rounded-xl ${movie.type === 'series' ? 'bg-indigo-100 text-indigo-500 dark:bg-indigo-900 dark:text-indigo-400' : 'bg-rose-100 text-rose-500 dark:bg-rose-900 dark:text-rose-400'}`}>
                   {movie.type === 'series' ? <Tv className="w-6 h-6" /> : <Film className="w-6 h-6" />}
                 </div>
                 <div>
                    <div className="flex gap-2 items-center mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full">{movie.platform}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full">{movie.genre}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{movie.title}</h3>
                    
                    {movie.status === 'watched' && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex text-amber-400">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} className={`w-3 h-3 ${i < (movie.rating || 0) ? 'fill-current' : 'text-slate-200 dark:text-slate-600'}`} />
                           ))}
                        </div>
                        <span className="text-xs text-slate-500 italic">"{movie.review}"</span>
                      </div>
                    )}
                 </div>
              </div>

              {movie.status === 'active' && (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl border border-slate-100 dark:border-slate-600 self-start md:self-center">
                   {movie.type === 'series' && (
                      <>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">SEA</span>
                          <input 
                            type="number" className="w-10 text-center bg-transparent font-mono font-bold text-lg focus:outline-none dark:text-white"
                            value={movie.tracker?.s || 1}
                            onChange={(e) => onUpdate(movie.id, { tracker: { ...movie.tracker!, s: parseInt(e.target.value) } })}
                          />
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-600" />
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">EP</span>
                          <input 
                            type="number" className="w-10 text-center bg-transparent font-mono font-bold text-lg focus:outline-none dark:text-white"
                            value={movie.tracker?.e || 1}
                            onChange={(e) => onUpdate(movie.id, { tracker: { ...movie.tracker!, e: parseInt(e.target.value) } })}
                          />
                        </div>
                      </>
                   )}
                   <button 
                     onClick={() => handleFinish(movie.id)}
                     className="ml-2 p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                     title="Mark as Finished"
                   >
                     <CheckCircle className="w-5 h-5" />
                   </button>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredMovies.length === 0 && (
           <div className="text-center py-12 text-slate-400">
             <Film className="w-12 h-12 mx-auto mb-2 opacity-20" />
             <p>{t(language, "No titles in")} {activeTab === 'wishlist' ? t(language, 'To Watch') : activeTab === 'active' ? t(language, 'Watching Now') : t(language, 'Library')}.</p>
           </div>
        )}
      </div>

      {/* Rating Overlay */}
      {rateItem && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRateItem(null)} />
            <div className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl w-full max-w-sm text-center">
               <h4 className="font-bold text-slate-700 dark:text-white mb-4 text-xl">{t(language, "Rate this Title")}</h4>
               <div className="flex justify-center gap-2 mb-6">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setRatingData({...ratingData, rating: star})}>
                       <Star className={`w-8 h-8 ${ratingData.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  ))}
               </div>
               <textarea 
                 className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:border-rose-400 outline-none mb-6 h-24 resize-none dark:text-white"
                 placeholder={t(language, "What do you think?")}
                 value={ratingData.review} onChange={e => setRatingData({...ratingData, review: e.target.value})}
               />
               <div className="flex gap-4">
                 <button onClick={() => setRateItem(null)} className="flex-1 py-3 text-slate-400 hover:text-slate-600 font-bold">{t(language, "Cancel")}</button>
                 <button onClick={() => submitRating(rateItem)} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600">{t(language, "Save to Library")}</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};