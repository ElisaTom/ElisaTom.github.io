import React from 'react';
import { Log, Language } from '../types';
import { Calendar, Heart, Zap, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { t } from '../i18n';

interface Props {
  logs: Log[];
  onNavigate: (tab: any) => void;
  dayCount: number;
  language: Language;
}

export const TabHome: React.FC<Props> = ({ logs, onNavigate, dayCount, language }) => {
  const today = new Date();
  const dateLocale = language === 'it' ? it : enUS;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero: Streak Counter */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-80">
               <Flame className="w-5 h-5 text-orange-300 fill-orange-300 animate-pulse" />
               <span className="font-mono text-sm tracking-wider uppercase">{t(language, "Couple Streak")}</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-bold font-['Outfit'] tracking-tighter">
              {dayCount}
            </h2>
            <p className="text-lg opacity-90 font-medium mt-1">
              {t(language, "Days of shared history")}.
            </p>
          </div>
          
          <div className="text-right md:text-right hidden md:block">
            <div className="text-sm opacity-60 font-mono mb-1">{format(today, 'EEEE, MMMM d', { locale: dateLocale })}</div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-orange-500/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Action: Calendar */}
        <button 
          onClick={() => onNavigate('memories')}
          className="glass-card p-6 rounded-3xl flex flex-col items-start gap-4 hover:scale-[1.02] transition-transform text-left group dark:bg-slate-800"
        >
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors dark:bg-indigo-900/50 dark:text-indigo-300">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-700 dark:text-white">{t(language, "Calendar")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t(language, "View timeline")}</p>
          </div>
        </button>

        {/* Quick Action: Love Notes (Formerly Love Tank) */}
        <button 
          onClick={() => onNavigate('lovenotes')}
          className="glass-card p-6 rounded-3xl flex flex-col items-start gap-4 hover:scale-[1.02] transition-transform text-left group dark:bg-slate-800"
        >
          <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl group-hover:bg-pink-600 group-hover:text-white transition-colors dark:bg-pink-900/50 dark:text-pink-300">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-700 dark:text-white">{t(language, "Love Notes")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t(language, "Boost partner")}</p>
          </div>
        </button>

        {/* Oracle Suggestion (Now just Suggestion) */}
        <button 
          onClick={() => onNavigate('discovery')}
          className="glass-card p-6 rounded-3xl flex flex-col items-start gap-4 hover:scale-[1.02] transition-transform text-left md:col-span-2 bg-gradient-to-r from-fuchsia-50 to-purple-50 border-fuchsia-100 group dark:from-fuchsia-900/20 dark:to-purple-900/20 dark:border-fuchsia-900/50"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-2xl group-hover:scale-110 transition-transform dark:bg-fuchsia-900/50 dark:text-fuchsia-300">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-fuchsia-900 dark:text-fuchsia-100">{t(language, "Oracle Suggestion")}</h3>
              <p className="text-sm text-fuchsia-700 opacity-80 dark:text-fuchsia-300">{t(language, "Indecisive?")}</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
