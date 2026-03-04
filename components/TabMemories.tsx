import React, { useMemo, useState } from 'react';
import { Log, Language } from '../types';
import { differenceInDays, addYears, isPast, getYear, format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from 'date-fns';
import { X, Calendar as CalendarIcon, MapPin, Film, Utensils, ChevronLeft, ChevronRight, Plus, Star, Camera, Image as ImageIcon } from 'lucide-react';
import { it, enUS } from 'date-fns/locale';
import { t } from '../i18n';

interface Props {
  logs: Log[];
  onAddLog: (log: Log) => void;
  language: Language;
}

export const TabMemories: React.FC<Props> = ({ logs, onAddLog, language }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLog, setNewLog] = useState<Partial<Log>>({
    title: '', type: 'other', rating: 5, notes: '', photo: ''
  });

  const dateLocale = language === 'it' ? it : enUS;

  const MILESTONES = [
    { label: "Nic's Birthday", date: '03-10', icon: '🎂' },
    { label: "Anniversary", date: '10-07', icon: '💑' },
    { label: "Eli's Birthday", date: '11-07', icon: '🎂' },
  ];

  const SPECIAL_EVENTS: Record<string, { type: 'bday' | 'love', label: string }> = {
    '03-10': { type: 'bday', label: t(language, "Happy Birthday Nic") },
    '11-07': { type: 'bday', label: t(language, "Happy Birthday Eli") },
    '10-07': { type: 'love', label: t(language, "Happy Anniversary") },
    '02-14': { type: 'love', label: t(language, "Happy Valentine") },
  };

  // --- Milestones Logic ---
  const milestones = MILESTONES.map(m => {
    const currentYear = getYear(new Date());
    let nextDate = new Date(`${currentYear}-${m.date}`);
    if (isPast(nextDate) && differenceInDays(nextDate, new Date()) < 0) {
      nextDate = addYears(nextDate, 1);
    }
    const daysLeft = differenceInDays(nextDate, new Date());
    return { ...m, daysLeft, nextDateStr: format(nextDate, 'MMM d, yyyy') };
  });

  // --- Calendar Logic ---
  const daysInMonth = getDaysInMonth(viewDate);
  const startDay = getDay(startOfMonth(viewDate)); // 0 = Sunday

  // Group logs by date string 'YYYY-MM-DD'
  const logsByDate = useMemo(() => {
    const map = new Map<string, Log[]>();
    logs.forEach(log => {
      const existing = map.get(log.date) || [];
      existing.push(log);
      map.set(log.date, existing);
    });
    return map;
  }, [logs]);

  // Handlers
  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
  
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.title || !selectedDate) return;
    
    onAddLog({
        ...newLog,
        id: Date.now().toString(),
        date: selectedDate,
    } as Log);

    setNewLog({ title: '', type: 'other', rating: 5, notes: '', photo: '' });
    setShowAddForm(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLog(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const closeOverlay = () => {
    setSelectedDate(null);
    setShowAddForm(false);
  };

  // Check for special event
  const specialEvent = selectedDate ? SPECIAL_EVENTS[selectedDate.slice(5)] : null;

  // Generate Calendar Grid
  const renderCalendar = () => {
    const days = [];
    const yearMonth = format(viewDate, 'yyyy-MM');
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Empty slots for start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yearMonth}-${d.toString().padStart(2, '0')}`;
      const dayLogs = logsByDate.get(dateStr) || [];
      const hasLogs = dayLogs.length > 0;
      
      const avgRating = hasLogs ? dayLogs.reduce((acc, l) => acc + l.rating, 0) / dayLogs.length : 0;
      
      let bgClass = 'bg-slate-100 border-slate-200 dark:bg-slate-700 dark:border-slate-600';
      if (hasLogs) {
        if (avgRating >= 4.5) bgClass = 'bg-indigo-600 border-indigo-700 text-white';
        else if (avgRating >= 3.5) bgClass = 'bg-indigo-400 border-indigo-500 text-white';
        else bgClass = 'bg-indigo-300 border-indigo-400 text-white';
      }

      // Special Date Marker on Grid
      const isSpecial = SPECIAL_EVENTS[dateStr.slice(5)];

      const isToday = dateStr === todayStr;

      days.push(
        <button
          key={dateStr}
          onClick={() => setSelectedDate(dateStr)}
          className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative transition-transform hover:scale-105 ${bgClass} ${isToday ? 'ring-2 ring-rose-400 ring-offset-2 dark:ring-offset-slate-800' : ''}`}
        >
          {isSpecial ? (
            <span className="text-xl">{isSpecial.type === 'bday' ? '🎈' : '❤️'}</span>
          ) : (
            <span className={`text-sm font-bold ${hasLogs ? 'opacity-100' : 'opacity-40 text-slate-400'}`}>{d}</span>
          )}
          {hasLogs && (
            <div className="flex gap-0.5 mt-1">
               {dayLogs.slice(0, 3).map((_, i) => (
                 <div key={i} className="w-1 h-1 rounded-full bg-white/70" />
               ))}
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  const selectedDayLogs = selectedDate ? logsByDate.get(selectedDate) || [] : [];

  return (
    <div className="space-y-8 animate-fade-in relative h-full">
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(-80vh) rotate(360deg); opacity: 0; }
          }
          .animate-float {
            animation: float linear infinite;
          }
        `}
      </style>
      <h2 className="text-3xl font-bold text-indigo-900 dark:text-indigo-300">{t(language, "Memories")}</h2>
      
      {/* Milestones Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {milestones.map((m, idx) => (
          <div key={idx} className="glass-card p-4 rounded-3xl border-indigo-100 dark:border-indigo-900/50 flex flex-col items-center text-center dark:bg-slate-800">
            <div className="text-2xl mb-1">{m.icon}</div>
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">{m.label}</h3>
            <div className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {m.daysLeft} <span className="text-xs font-sans font-normal text-slate-400">{t(language, "days")}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="glass-card p-6 rounded-3xl dark:bg-slate-800">
        <div className="flex justify-between items-center mb-6">
           <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-300">
             <ChevronLeft className="w-6 h-6" />
           </button>
           
           <div className="flex items-center gap-2">
             <CalendarIcon className="w-5 h-5 text-indigo-400" />
             <h3 className="text-xl font-bold text-indigo-900 dark:text-white capitalize">{format(viewDate, 'MMMM yyyy', { locale: dateLocale })}</h3>
           </div>

           <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-300">
             <ChevronRight className="w-6 h-6" />
           </button>
        </div>
        
        <div className="grid grid-cols-7 gap-3 text-center mb-2">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="text-xs font-bold text-slate-400">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-3">
          {renderCalendar()}
        </div>
      </div>

      {/* Detail Overlay */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeOverlay} />
          
          <div className="relative w-full max-w-md bg-slate-50 dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-slide-in-up md:animate-scale-up max-h-[85vh] flex flex-col z-10">
            {/* Header */}
            <div className={`p-6 text-white flex justify-between items-center shrink-0 relative overflow-hidden transition-colors duration-500
              ${specialEvent?.type === 'love' ? 'bg-pink-500' : specialEvent?.type === 'bday' ? 'bg-indigo-500' : 'bg-indigo-600'}
            `}>
               <div className="relative z-10">
                  <h3 className="text-2xl font-bold font-['Outfit'] capitalize">
                    {specialEvent ? specialEvent.label : format(new Date(selectedDate), 'EEEE, d MMM', { locale: dateLocale })}
                  </h3>
                  {!specialEvent && (
                    <p className="text-indigo-200 text-sm font-mono">
                      {selectedDayLogs.length > 0 
                        ? `${selectedDayLogs.length} ${t(language, "memories recorded")}` 
                        : t(language, 'No memories recorded')}
                    </p>
                  )}
               </div>
               <button onClick={closeOverlay} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors relative z-10">
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 relative z-10">
               {/* Show actual date if special event is overriding title */}
               {specialEvent && (
                 <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{format(new Date(selectedDate), 'EEEE, d MMMM', { locale: dateLocale })}</div>
                 </div>
               )}

               {selectedDayLogs.length === 0 && !showAddForm ? (
                 <div className="text-center py-8 text-slate-400">
                    <p className="mb-4">{t(language, "Nothing logged on this day")}</p>
                    <button 
                        onClick={() => setShowAddForm(true)}
                        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 mx-auto"
                    >
                        <Plus className="w-5 h-5" /> {t(language, "Add Memory")}
                    </button>
                 </div>
               ) : (
                 <>
                    {selectedDayLogs.map(log => (
                    <div key={log.id} className="glass-card p-4 rounded-2xl flex gap-4 items-start dark:bg-slate-800">
                        <div className={`p-3 rounded-xl shrink-0 
                            ${log.type === 'activity' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 
                            log.type === 'food' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' : 
                            log.type === 'media' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {log.type === 'activity' && <MapPin className="w-5 h-5" />}
                            {log.type === 'food' && <Utensils className="w-5 h-5" />}
                            {log.type === 'media' && <Film className="w-5 h-5" />}
                            {log.type === 'milestone' && <CalendarIcon className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">{log.title}</h4>
                            {log.notes && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">"{log.notes}"</p>}
                            {log.photo && (
                                <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <img src={log.photo} alt={log.title} className="w-full h-auto max-h-48 object-cover" referrerPolicy="no-referrer" />
                                </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full uppercase text-slate-500 dark:text-slate-400">{log.type}</span>
                                <span className="text-xs font-mono text-amber-500 font-bold">★ {log.rating}</span>
                            </div>
                        </div>
                    </div>
                    ))}
                    
                    {!showAddForm && (
                        <button 
                            onClick={() => setShowAddForm(true)}
                            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 rounded-xl hover:border-indigo-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 font-bold"
                        >
                            <Plus className="w-5 h-5" /> {t(language, "Add Memory")}
                        </button>
                    )}
                 </>
               )}

               {showAddForm && (
                   <form onSubmit={handleAddSubmit} className="glass-card p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900 animate-slide-in">
                       <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-3">{t(language, "Add Memory")}</h4>
                       <div className="space-y-3">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t(language, "What happened?")}</label>
                               <input 
                                   className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                   value={newLog.title}
                                   onChange={e => setNewLog({...newLog, title: e.target.value})}
                                   placeholder={t(language, "Title")}
                                   required
                               />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t(language, "Type")}</label>
                                   <select 
                                       className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 dark:text-white"
                                       value={newLog.type}
                                       onChange={e => setNewLog({...newLog, type: e.target.value as any})}
                                   >
                                       {['activity', 'food', 'media', 'milestone', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t(language, "Rating")}</label>
                                   <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                       <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                       <input 
                                         type="number" min="1" max="5" 
                                         className="w-full bg-transparent font-bold text-slate-700 dark:text-white focus:outline-none"
                                         value={newLog.rating}
                                         onChange={e => setNewLog({...newLog, rating: parseInt(e.target.value) as any})}
                                       />
                                   </div>
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t(language, "Notes")}</label>
                               <textarea 
                                   className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 h-20 resize-none"
                                   value={newLog.notes}
                                   onChange={e => setNewLog({...newLog, notes: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t(language, "Photo")}</label>
                               <div className="flex items-center gap-4">
                                   <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-100 dark:border-indigo-800 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                                       <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                       {newLog.photo ? (
                                           <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                               <ImageIcon className="w-4 h-4" /> {t(language, "Change Photo")}
                                           </div>
                                       ) : (
                                           <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                                               <Camera className="w-4 h-4" /> {t(language, "Upload Photo")}
                                           </div>
                                       )}
                                   </label>
                                   {newLog.photo && (
                                       <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-indigo-200">
                                           <img src={newLog.photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                           <button 
                                               type="button"
                                               onClick={() => setNewLog(prev => ({ ...prev, photo: '' }))}
                                               className="absolute top-0 right-0 p-0.5 bg-rose-500 text-white rounded-bl-lg"
                                           >
                                               <X className="w-3 h-3" />
                                           </button>
                                       </div>
                                   )}
                               </div>
                           </div>
                           <div className="flex gap-3 pt-2">
                               <button 
                                   type="button" 
                                   onClick={() => setShowAddForm(false)}
                                   className="flex-1 py-2 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                               >
                                   {t(language, "Cancel")}
                               </button>
                               <button 
                                   type="submit" 
                                   className="flex-1 py-2 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 shadow-md"
                               >
                                   {t(language, "Save Memory")}
                               </button>
                           </div>
                       </div>
                   </form>
               )}
            </div>
            
            {/* Particles Effect Layer */}
            {specialEvent && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${3 + Math.random() * 4}s`,
                      animationDelay: `${Math.random() * 2}s`,
                      fontSize: `${20 + Math.random() * 20}px`,
                      bottom: '-50px',
                      opacity: 0
                    }}
                  >
                    {specialEvent.type === 'bday' ? (i % 2 === 0 ? '🎈' : '🎉') : '❤️'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};