import React, { useState } from 'react';
import { RegistryItem } from '../types';
import { Check, Trash2, Plus, ShoppingBag } from 'lucide-react';

interface Props {
  items: RegistryItem[];
  onAdd: (item: RegistryItem) => void;
  onUpdate: (id: string, data: Partial<RegistryItem>) => void;
  onDelete: (id: string) => void;
}

export const TabWishlist: React.FC<Props> = ({ items, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<RegistryItem>>({
    text: '', type: 'General', beneficiary: 'Us', status: 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.text) return;
    onAdd({ ...newItem, id: Date.now().toString() } as RegistryItem);
    setNewItem({ text: '', type: 'General', beneficiary: 'Us', status: 'pending' });
    setShowForm(false);
  };

  const pendingItems = items.filter(i => i.status === 'pending');
  const grantedItems = items.filter(i => i.status === 'granted');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-teal-900 dark:text-teal-300">Desideri</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="p-3 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg shadow-teal-200 dark:shadow-none transition-all"
        >
          <Plus className={`w-6 h-6 transition-transform ${showForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl space-y-4 animate-slide-in dark:bg-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desidero...</label>
            <input 
              className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-teal-100 dark:border-teal-900 rounded-xl dark:text-white"
              value={newItem.text}
              onChange={e => setNewItem({...newItem, text: e.target.value})}
              placeholder="es. Dyson Airwrap"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
               <select 
                 className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-teal-100 dark:border-teal-900 rounded-xl dark:text-white"
                 value={newItem.type}
                 onChange={e => setNewItem({...newItem, type: e.target.value})}
               >
                 {['Tech', 'Beauty', 'Home', 'Travel', 'Fashion', 'General'].map(c => (
                   <option key={c} value={c}>{c}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Per</label>
               <select 
                 className="w-full p-3 bg-white/50 dark:bg-slate-700/50 border border-teal-100 dark:border-teal-900 rounded-xl dark:text-white"
                 value={newItem.beneficiary}
                 onChange={e => setNewItem({...newItem, beneficiary: e.target.value as any})}
               >
                 <option value="Us">Noi</option>
                 <option value="Him">Lui</option>
                 <option value="Her">Lei</option>
               </select>
             </div>
          </div>
          <button type="submit" className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-md">Aggiungi al Registro</button>
        </form>
      )}

      {/* Grid of Wishes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingItems.map(item => (
          <div key={item.id} className="glass-card p-5 rounded-3xl relative group hover:scale-[1.01] transition-transform dark:bg-slate-800">
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => onUpdate(item.id, { status: 'granted' })}
                className="p-1.5 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200 transition-colors"
                title="Segna Esaudito"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(item.id)}
                className="p-1.5 bg-rose-100 text-rose-500 rounded-lg hover:bg-rose-200 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full 
                ${item.beneficiary === 'Him' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 
                  item.beneficiary === 'Her' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                Per {item.beneficiary === 'Him' ? 'Lui' : item.beneficiary === 'Her' ? 'Lei' : 'Noi'}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{item.text}</h3>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> {item.type}
            </span>
          </div>
        ))}
      </div>

      {/* Granted Archive */}
      {grantedItems.length > 0 && (
        <div className="pt-8 border-t border-teal-100/50 dark:border-teal-900/50">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Archivio Esauditi</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {grantedItems.map(item => (
                <div key={item.id} className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center opacity-75">
                   <span className="text-slate-500 dark:text-slate-400 line-through">{item.text}</span>
                   <button onClick={() => onDelete(item.id)} className="text-slate-300 hover:text-rose-400">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};