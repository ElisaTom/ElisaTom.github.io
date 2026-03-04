import React, { useState } from 'react';
import { FoodSpot, Language, Recipe } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Utensils, MapPin, Loader, ChefHat, BookOpen, Star, ChevronDown, ChevronUp, Camera, Image as ImageIcon, X } from 'lucide-react';
import { getPlaceFromMaps } from '../services/geminiService';
import { t } from '../i18n';

interface Props {
  foodSpots: FoodSpot[];
  recipes: Recipe[];
  onAdd: (item: FoodSpot) => void;
  onDelete: (id: string) => void;
  onAddRecipe: (item: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
  language: Language;
}

export const TabFood: React.FC<Props> = ({ foodSpots, recipes, onAdd, onDelete, onAddRecipe, onDeleteRecipe, language }) => {
  const [activeSubTab, setActiveSubTab] = useState<'spots' | 'recipes'>('spots');
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<FoodSpot>>({
    name: '', type: 'Italian', status: 'wishlist', 
    ratings: { location: 3, menu: 3, service: 3, bill: 3 },
    review: '', totalScore: 0, location: ''
  });
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '', category: 'Appetizers', ingredients: '', instructions: '', rating: 5, photo: ''
  });
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [groundingResult, setGroundingResult] = useState<{text: string, chunks: any[]} | null>(null);

  const visited = foodSpots.filter(f => f.status === 'visited');
  const wishlist = foodSpots.filter(f => f.status === 'wishlist');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    let totalScore = 0;
    if (newItem.status === 'visited' && newItem.ratings) {
      totalScore = (newItem.ratings.location + newItem.ratings.menu + newItem.ratings.service + newItem.ratings.bill) / 4;
    }

    onAdd({
      ...newItem,
      totalScore,
      dateVisited: newItem.status === 'visited' ? new Date().toISOString().split('T')[0] : undefined,
      id: Date.now().toString()
    } as FoodSpot);
    
    setShowForm(false);
    setNewItem({ name: '', type: 'Italian', status: 'wishlist', ratings: { location: 3, menu: 3, service: 3, bill: 3 }, review: '', totalScore: 0, location: '' });
    setGroundingResult(null);
  };

  const handleRecipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipe.title) return;

    onAddRecipe({
      ...newRecipe,
      id: Date.now().toString()
    } as Recipe);

    setShowForm(false);
    setNewRecipe({ title: '', category: 'Appetizers', ingredients: '', instructions: '', rating: 5, photo: '' });
  };

  const handleRecipeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRecipe(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLookup = async () => {
    if(!newItem.name) return;
    setSearching(true);
    setGroundingResult(null);

    let userLoc = undefined;
    try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        userLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch(e) {
        console.log("Geolocation skipped");
    }

    const res = await getPlaceFromMaps(newItem.name, userLoc);
    if(res) {
        setGroundingResult(res);
    }
    setSearching(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-orange-900 dark:text-orange-300">{t(language, "Food & Drink")}</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-200 dark:shadow-none transition-all"
        >
          <Plus className={`w-6 h-6 transition-transform ${showForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex p-1 bg-orange-100/50 dark:bg-slate-700/50 rounded-xl">
        <button
          onClick={() => { setActiveSubTab('spots'); setShowForm(false); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'spots' ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-300 shadow-sm' : 'text-slate-400 hover:text-orange-400'
          }`}
        >
          <MapPin className="w-4 h-4" /> {t(language, "Visited Journal")}
        </button>
        <button
          onClick={() => { setActiveSubTab('recipes'); setShowForm(false); }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'recipes' ? 'bg-white dark:bg-slate-600 text-orange-600 dark:text-orange-300 shadow-sm' : 'text-slate-400 hover:text-orange-400'
          }`}
        >
          <ChefHat className="w-4 h-4" /> {t(language, "Recipes")}
        </button>
      </div>

      {showForm && activeSubTab === 'spots' && (
        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl space-y-4 animate-slide-in dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Restaurant Name")}</label>
              <div className="flex gap-2">
                <input 
                  className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-orange-100 dark:border-orange-900 rounded-xl dark:text-white"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  required
                />
                {newItem.name && (
                   <button 
                     type="button"
                     onClick={handleLookup}
                     disabled={searching}
                     className="p-3 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 transition-colors"
                   >
                     {searching ? <Loader className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                   </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Cuisine Type")}</label>
              <input 
                className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-orange-100 dark:border-orange-900 rounded-xl dark:text-white"
                value={newItem.type}
                onChange={e => setNewItem({...newItem, type: e.target.value})}
              />
            </div>
          </div>
          
          {/* Grounding Result */}
          {groundingResult && (
             <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl text-sm">
                <div className="font-bold text-orange-800 dark:text-orange-300 text-xs mb-1 uppercase tracking-wider">Gemini found:</div>
                <p className="text-slate-700 dark:text-slate-300 mb-2">{groundingResult.text}</p>
                <div className="flex flex-wrap gap-2">
                  {groundingResult.chunks.map((chunk, i) => {
                    if(chunk.maps?.uri) {
                        return (
                            <a 
                                key={i} href={chunk.maps.uri} target="_blank" rel="noreferrer" 
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-700 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-bold text-orange-600 dark:text-orange-400 hover:scale-105 transition-transform"
                            >
                                <MapPin className="w-3 h-3" /> {chunk.maps.title || 'See on Maps'}
                            </a>
                        );
                    }
                    return null;
                  })}
                </div>
             </div>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                checked={newItem.status === 'wishlist'} 
                onChange={() => setNewItem({...newItem, status: 'wishlist'})}
                className="accent-orange-500 w-5 h-5"
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">{t(language, "Wishlist")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                checked={newItem.status === 'visited'} 
                onChange={() => setNewItem({...newItem, status: 'visited'})}
                className="accent-orange-500 w-5 h-5"
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">{t(language, "Visited")}</span>
            </label>
          </div>

          {newItem.status === 'visited' && newItem.ratings && (
            <div className="space-y-4 pt-4 border-t border-orange-100 dark:border-orange-900">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(newItem.ratings).map((key) => (
                  <div key={key}>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{key}</label>
                     <input 
                       type="range" min="1" max="5" 
                       value={(newItem.ratings as any)[key]} 
                       onChange={e => setNewItem({
                         ...newItem, 
                         ratings: { ...newItem.ratings!, [key]: parseInt(e.target.value) }
                       })}
                       className="w-full accent-orange-500"
                     />
                     <div className="text-center font-mono text-orange-600 font-bold">{(newItem.ratings as any)[key]}</div>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Review")}</label>
                <textarea 
                  className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-orange-100 dark:border-orange-900 rounded-xl h-20 dark:text-white"
                  value={newItem.review}
                  onChange={e => setNewItem({...newItem, review: e.target.value})}
                />
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl shadow-md">
            {t(language, "Save Spot")}
          </button>
        </form>
      )}

      {showForm && activeSubTab === 'recipes' && (
        <form onSubmit={handleRecipeSubmit} className="glass-card p-6 rounded-3xl space-y-4 animate-slide-in dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Recipe Title")}</label>
              <input 
                className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-orange-100 dark:border-orange-900 rounded-xl dark:text-white"
                value={newRecipe.title}
                onChange={e => setNewRecipe({...newRecipe, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Category")}</label>
              <select 
                className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-orange-100 dark:border-orange-900 rounded-xl dark:text-white"
                value={newRecipe.category}
                onChange={e => setNewRecipe({...newRecipe, category: e.target.value as any})}
              >
                {['Appetizers', 'First Course', 'Second Course', 'Dessert', 'Ethnic', 'Other'].map(c => (
                  <option key={c} value={c}>{t(language, c)}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Ingredients")}</label>
            <textarea 
              className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-orange-100 dark:border-orange-900 rounded-xl h-24 dark:text-white"
              value={newRecipe.ingredients}
              onChange={e => setNewRecipe({...newRecipe, ingredients: e.target.value})}
              placeholder={t(language, "List ingredients...")}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Instructions")}</label>
            <textarea 
              className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-orange-100 dark:border-orange-900 rounded-xl h-32 dark:text-white"
              value={newRecipe.instructions}
              onChange={e => setNewRecipe({...newRecipe, instructions: e.target.value})}
              placeholder={t(language, "How to cook...")}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="block text-xs font-bold text-slate-500 uppercase">{t(language, "Rating")}</label>
            <input 
              type="range" min="1" max="5" 
              value={newRecipe.rating} 
              onChange={e => setNewRecipe({...newRecipe, rating: parseInt(e.target.value)})}
              className="flex-1 accent-orange-500"
            />
            <span className="font-bold text-orange-600">{newRecipe.rating}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t(language, "Photo")}</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/50 dark:bg-slate-700/50 border-2 border-dashed border-orange-100 dark:border-orange-900 rounded-xl cursor-pointer hover:border-orange-400 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handleRecipeFileChange} />
                {newRecipe.photo ? (
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-sm">
                    <ImageIcon className="w-4 h-4" /> {t(language, "Change Photo")}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                    <Camera className="w-4 h-4" /> {t(language, "Upload Photo")}
                  </div>
                )}
              </label>
              {newRecipe.photo && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-orange-200">
                  <img src={newRecipe.photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    type="button"
                    onClick={() => setNewRecipe(prev => ({ ...prev, photo: '' }))}
                    className="absolute top-0 right-0 p-0.5 bg-rose-500 text-white rounded-bl-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl shadow-md">
            {t(language, "Save Recipe")}
          </button>
        </form>
      )}

      {activeSubTab === 'spots' ? (
        <>
          {/* Visited Section */}
          <div>
            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              {t(language, "Visited Journal")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visited.map(spot => (
                <div key={spot.id} className="glass-card p-6 rounded-3xl flex flex-col md:flex-row gap-6 relative group dark:bg-slate-800">
                  <button 
                    onClick={() => onDelete(spot.id)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-bold text-slate-800 dark:text-white">{spot.name}</h4>
                          <span className="text-sm text-orange-500 font-medium">{spot.type}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-2xl font-bold text-orange-400 font-mono">{spot.totalScore?.toFixed(1)}</div>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 italic">"{spot.review}"</p>
                    <div className="mt-2 text-xs text-slate-400 font-mono">{spot.dateVisited}</div>
                  </div>
                  
                  {/* Radar Chart */}
                  {spot.ratings && (
                    <div className="w-full md:w-32 h-32 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Pos', A: spot.ratings.location, fullMark: 5 },
                          { subject: 'Menu', A: spot.ratings.menu, fullMark: 5 },
                          { subject: 'Serv', A: spot.ratings.service, fullMark: 5 },
                          { subject: 'Conto', A: spot.ratings.bill, fullMark: 5 },
                        ]}>
                          <PolarGrid stroke="#fed7aa" />
                          <PolarAngleAxis dataKey="subject" tick={{fontSize: 8, fill: '#9a3412'}} />
                          <Radar name="Rating" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ))}
              {visited.length === 0 && <p className="text-slate-400 italic">{t(language, "No visited spots yet")}</p>}
            </div>
          </div>

          {/* Wishlist Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              {t(language, "To Devour")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {wishlist.map(spot => (
                <div key={spot.id} className="p-4 bg-white/50 dark:bg-slate-700/50 border border-white dark:border-slate-600 rounded-2xl relative group">
                  <button 
                      onClick={() => onDelete(spot.id)}
                      className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                      <Trash2 className="w-3 h-3" />
                  </button>
                  <h4 className="font-bold text-slate-700 dark:text-slate-200">{spot.name}</h4>
                  <span className="text-xs text-slate-400">{spot.type}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {recipes.map(recipe => (
              <div key={recipe.id} className="glass-card p-5 rounded-3xl dark:bg-slate-800 relative group">
                <button 
                  onClick={() => onDeleteRecipe(recipe.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400 rounded-2xl">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-white">{recipe.title}</h4>
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-500">{t(language, recipe.category)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        {recipe.rating}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
                      className="mt-4 flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      {expandedRecipe === recipe.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {expandedRecipe === recipe.id ? t(language, "Close") : t(language, "Open")}
                    </button>

                    {expandedRecipe === recipe.id && (
                      <div className="mt-6 space-y-6 animate-fade-in border-t border-orange-100 dark:border-orange-900 pt-6">
                        {recipe.photo && (
                          <div className="rounded-2xl overflow-hidden border border-orange-100 dark:border-orange-900">
                            <img src={recipe.photo} alt={recipe.title} className="w-full h-auto max-h-64 object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {recipe.ingredients && (
                          <div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <BookOpen className="w-3 h-3" /> {t(language, "Ingredients")}
                            </h5>
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{recipe.ingredients}</p>
                          </div>
                        )}
                        {recipe.instructions && (
                          <div>
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <ChefHat className="w-3 h-3" /> {t(language, "Instructions")}
                            </h5>
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{recipe.instructions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {recipes.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>{t(language, "No recipes yet")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};