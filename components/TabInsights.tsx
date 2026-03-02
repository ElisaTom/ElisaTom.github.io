import React, { useMemo, useState } from 'react';
import { Log, Language } from '../types';
import { format, isSameMonth, subMonths, addMonths, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, MapPin, Utensils, Film, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { enUS } from 'date-fns/locale';
import { t } from '../i18n';

interface Props {
  logs: Log[];
  language: Language;
}

export const TabInsights: React.FC<Props> = ({ logs, language }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateLocale = enUS;

  const analysis = useMemo(() => {
    const prevDate = subMonths(currentDate, 1);

    const currentLogs = logs.filter(l => isSameMonth(parseISO(l.date), currentDate));
    const prevLogs = logs.filter(l => isSameMonth(parseISO(l.date), prevDate));

    const getStats = (list: Log[], type: string) => {
      const items = list.filter(l => l.type === type);
      const counts: Record<string, number> = {};
      let maxItem = null;
      let maxCount = 0;
      items.forEach(i => {
        counts[i.title] = (counts[i.title] || 0) + 1;
        if(counts[i.title] > maxCount) {
          maxCount = counts[i.title];
          maxItem = i.title;
        }
      });
      return { count: items.length, top: maxCount > 1 ? maxItem : null };
    };

    return {
      current: {
        total: currentLogs.length,
        activity: getStats(currentLogs, 'activity'),
        food: getStats(currentLogs, 'food'),
        media: getStats(currentLogs, 'media'),
      },
      last: {
        total: prevLogs.length,
        activity: getStats(prevLogs, 'activity'),
        food: getStats(prevLogs, 'food'),
        media: getStats(prevLogs, 'media'),
      }
    };
  }, [logs, currentDate]);

  const renderTrend = (curr: number, prev: number) => {
    const diff = curr - prev;
    if (diff > 0) return <div className="flex items-center text-emerald-500 text-xs font-bold gap-1"><TrendingUp className="w-3 h-3" /> +{diff}</div>;
    if (diff < 0) return <div className="flex items-center text-rose-500 text-xs font-bold gap-1"><TrendingDown className="w-3 h-3" /> {diff}</div>;
    return <div className="flex items-center text-slate-400 text-xs font-bold gap-1"><Minus className="w-3 h-3" /> {t(language, "Same")}</div>;
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    if (next <= new Date()) setCurrentDate(next);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t(language, "Insights")}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t(language, "Historical overview of your activities")}</p>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm max-w-md mx-auto">
         <button onClick={handlePrevMonth} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300">
           <ChevronLeft className="w-5 h-5" />
         </button>
         <div className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white capitalize">
           <Calendar className="w-5 h-5 text-indigo-500" />
           {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
         </div>
         <button 
           onClick={handleNextMonth} 
           disabled={isSameMonth(currentDate, new Date())}
           className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
         >
           <ChevronRight className="w-5 h-5" />
         </button>
      </div>

      {/* Global Activity Card */}
      <div className="glass-card p-6 rounded-[2rem] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-blue-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-900 dark:text-blue-100 font-bold text-lg">{t(language, "Total Interactions")}</span>
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analysis.current.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">{t(language, "vs Mese Scorso")} ({analysis.last.total})</span>
            {renderTrend(analysis.current.total, analysis.last.total)}
          </div>
          
          <div className="w-full bg-blue-200/50 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-blue-500 dark:bg-blue-400 h-full transition-all duration-1000" 
              style={{ width: `${Math.min((analysis.current.total / (analysis.last.total || 1)) * 50, 100)}%` }} 
            />
          </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Activity Analysis */}
          <div className="glass-card p-5 rounded-3xl relative overflow-hidden dark:bg-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><MapPin className="w-5 h-5"/></div>
              {renderTrend(analysis.current.activity.count, analysis.last.activity.count)}
            </div>
            <h4 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase mb-1">{t(language, "Adventures")}</h4>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{analysis.current.activity.count} <span className="text-sm font-normal text-slate-400">{t(language, "events")}</span></div>
            {analysis.current.activity.top && (
              <div className="text-xs bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full inline-block">
                {t(language, "Obsession")}: <b>{analysis.current.activity.top}</b>
              </div>
            )}
          </div>

          {/* Food Analysis */}
          <div className="glass-card p-5 rounded-3xl relative overflow-hidden dark:bg-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl"><Utensils className="w-5 h-5"/></div>
              {renderTrend(analysis.current.food.count, analysis.last.food.count)}
            </div>
            <h4 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase mb-1">{t(language, "Dining")}</h4>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{analysis.current.food.count} <span className="text-sm font-normal text-slate-400">{t(language, "visits")}</span></div>
            {analysis.current.food.top ? (
                <div className="text-xs bg-orange-50 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full inline-block">
                  {t(language, "Favorite")}: <b>{analysis.current.food.top}</b>
                </div>
            ) : (
                <div className="text-xs text-slate-400 italic">{t(language, "Try something new!")}</div>
            )}
          </div>

          {/* Media Analysis */}
          <div className="glass-card p-5 rounded-3xl relative overflow-hidden dark:bg-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl"><Film className="w-5 h-5"/></div>
              {renderTrend(analysis.current.media.count, analysis.last.media.count)}
            </div>
            <h4 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase mb-1">{t(language, "Cinema/TV")}</h4>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{analysis.current.media.count} <span className="text-sm font-normal text-slate-400">{t(language, "watched")}</span></div>
            {analysis.current.media.top && (
                <div className="text-xs bg-rose-50 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full inline-block">
                  {t(language, "Binged")}: <b>{analysis.current.media.top}</b>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};