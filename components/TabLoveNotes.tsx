import React, { useState } from 'react';
import { LoveNote, Language } from '../types';
import { Heart, Send, Trash2, X, Sparkles, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  notes: LoveNote[];
  onAdd: (note: LoveNote) => void;
  onDelete: (id: string) => void;
  language: Language;
}

export const TabLoveNotes: React.FC<Props> = ({ notes, onAdd, onDelete, language }) => {
  const [showForm, setShowForm] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [boostNote, setBoostNote] = useState<LoveNote | null>(null);
  const [newNote, setNewNote] = useState<Partial<LoveNote>>({
    text: '', beneficiary: 'Her'
  });

  const handleBoost = (beneficiary: 'Him' | 'Her') => {
    const pool = notes.filter(n => n.beneficiary === beneficiary);
    if (pool.length === 0) {
      alert(`${t(language, "No notes for")} ${beneficiary === 'Him' ? t(language, 'Him') : t(language, 'Her')} ${t(language, "yet! Add some.")}`);
      return;
    }
    const random = pool[Math.floor(Math.random() * pool.length)];
    setBoostNote(random);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.text) return;
    onAdd({
      ...newNote,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0]
    } as LoveNote);
    setNewNote({ text: '', beneficiary: 'Her' });
    setShowForm(false);
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-pink-900 dark:text-pink-300">{t(language, "Love Notes")}</h2>
        <p className="text-pink-600 dark:text-pink-400">{t(language, "Send love to fill the tank")}</p>
      </div>

      {/* Boost Buttons */}
      <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-2xl mx-auto">
        <button 
          onClick={() => handleBoost('Him')}
          className="group relative overflow-hidden p-8 rounded-[2rem] bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-xl hover:scale-105 transition-transform"
        >
          <div className="relative z-10 flex flex-col items-center gap-2">
             <Heart className="w-12 h-12 fill-white/20" />
             <span className="text-2xl font-bold">{t(language, "Boost Him")}</span>
          </div>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-[2rem]" />
        </button>

        <button 
          onClick={() => handleBoost('Her')}
          className="group relative overflow-hidden p-8 rounded-[2rem] bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-xl hover:scale-105 transition-transform"
        >
          <div className="relative z-10 flex flex-col items-center gap-2">
             <Heart className="w-12 h-12 fill-white/20" />
             <span className="text-2xl font-bold">{t(language, "Boost Her")}</span>
          </div>
           <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-[2rem]" />
        </button>
      </div>

      {/* Add Form */}
      <div className="max-w-xl mx-auto">
        {!showForm ? (
          <button 
            onClick={() => setShowForm(true)}
            className="w-full py-4 border-2 border-dashed border-pink-300 rounded-2xl text-pink-400 font-bold hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon /> {t(language, "Write a Note")}
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl space-y-4 dark:bg-slate-800">
             <textarea 
               className="w-full p-4 bg-white/50 dark:bg-slate-700/50 border border-pink-200 dark:border-pink-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 dark:text-white"
               placeholder={t(language, "Write something sweet...")}
               value={newNote.text}
               onChange={e => setNewNote({...newNote, text: e.target.value})}
               rows={3}
             />
             <div className="flex gap-4">
               <div className="flex-1 flex gap-2 bg-white/50 dark:bg-slate-700/50 p-1 rounded-xl">
                 <button 
                   type="button"
                   onClick={() => setNewNote({...newNote, beneficiary: 'Him'})}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${newNote.beneficiary === 'Him' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-400'}`}
                 >
                   {t(language, "For Him")}
                 </button>
                 <button 
                   type="button"
                   onClick={() => setNewNote({...newNote, beneficiary: 'Her'})}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${newNote.beneficiary === 'Her' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-200' : 'text-slate-400'}`}
                 >
                   {t(language, "For Her")}
                 </button>
               </div>
               <button type="submit" className="px-6 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors">
                 <Send className="w-5 h-5" />
               </button>
             </div>
          </form>
        )}
      </div>

      {/* Secret Vault Section */}
      <div className="max-w-2xl mx-auto pt-12 pb-12">
        <button 
            onClick={() => setShowVault(!showVault)}
            className="flex items-center justify-center gap-2 w-full text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
            <span>{showVault ? t(language, 'Close') : t(language, 'Open')} {t(language, "The Vault")} ({notes.length})</span>
            {showVault ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showVault && (
            <div className="space-y-3 mt-6 animate-slide-in">
                {notes.length === 0 && <p className="text-center text-slate-400 italic">{t(language, "The vault is empty")}</p>}
                {notes.map(note => (
                    <div key={note.id} className="glass-card p-4 rounded-2xl flex items-center gap-4 group opacity-80 hover:opacity-100 dark:bg-slate-800">
                        <div className={`p-3 rounded-full ${note.beneficiary === 'Him' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-500' : 'bg-pink-100 dark:bg-pink-900 text-pink-500'}`}>
                            <Lock className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            {/* Obscured Text to preserve surprise */}
                            <p className="text-slate-400 dark:text-slate-500 font-mono text-sm tracking-widest">••••••••••••••••••••</p> 
                            <span className="text-xs text-slate-400 dark:text-slate-500">{note.date} • {t(language, "For")} {note.beneficiary === 'Him' ? t(language, 'Him') : t(language, 'Her')}</span>
                        </div>
                        <button 
                            onClick={() => onDelete(note.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                            title={t(language, "Delete forever")}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Boost Overlay */}
      {boostNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setBoostNote(null)} />
          <div className="relative bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-lg w-full text-center animate-scale-up">
             <button onClick={() => setBoostNote(null)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
               <X className="w-6 h-6 text-slate-500 dark:text-white" />
             </button>
             
             <div className="mb-6 inline-flex p-4 bg-pink-50 dark:bg-pink-900/30 text-pink-500 rounded-full">
               <Sparkles className="w-8 h-8" />
             </div>
             
             <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-6 leading-tight font-['Outfit']">
               "{boostNote.text}"
             </h3>
             
             <div className="text-sm text-slate-400 font-mono">
               {t(language, "Sent on")} {boostNote.date}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);