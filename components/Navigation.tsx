import React, { useState } from 'react';
import { TabId, Language } from '../types';
import { 
  Home, Clock, Compass, Map, Film, Utensils, Gift, Heart, Menu, X, Settings, BarChart2 
} from 'lucide-react';
import { t } from '../i18n';

interface NavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  colorClass: string;
  language: Language;
}

const NAVIGATION_ITEMS: { id: TabId; icon: React.ElementType; labelKey: string }[] = [
  { id: 'home', icon: Home, labelKey: 'Home' },
  { id: 'memories', icon: Clock, labelKey: 'Memories' },
  { id: 'discovery', icon: Compass, labelKey: 'Discovery' },
  { id: 'activities', icon: Map, labelKey: 'Activities' },
  { id: 'media', icon: Film, labelKey: 'Media' },
  { id: 'food', icon: Utensils, labelKey: 'Food & Drink' },
  { id: 'wishlist', icon: Gift, labelKey: 'Wishlist' },
  { id: 'lovenotes', icon: Heart, labelKey: 'Love Notes' },
  { id: 'insights', icon: BarChart2, labelKey: 'Insights' },
  { id: 'settings', icon: Settings, labelKey: 'Settings' },
];

export const Navigation: React.FC<NavProps> = ({ activeTab, onTabChange, colorClass, language }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNav = (id: TabId) => {
    onTabChange(id);
    setIsMobileOpen(false);
  };

  const NavList = () => (
    <div className="flex flex-col gap-2 p-4">
      <div className="mb-8 px-4 py-2">
        <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight text-slate-800 dark:text-white">Eli & Nic</h1>
      </div>
      {NAVIGATION_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? `bg-white dark:bg-slate-700 shadow-md ${colorClass} font-semibold` 
                : 'hover:bg-white/40 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400'}`}
          >
            <item.icon className={`w-5 h-5 ${isActive ? colorClass : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
            <span>{t(language, item.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-72 h-screen glass border-r border-white/40 sticky top-0 z-40 overflow-y-auto">
        <NavList />
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center justify-between px-4">
        <span className="font-bold text-lg dark:text-white">Eli & Nic</span>
        <button onClick={() => setIsMobileOpen(true)} className="p-2 bg-white/50 dark:bg-slate-700/50 rounded-full">
          <Menu className="w-6 h-6 text-slate-700 dark:text-white" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-3/4 max-w-xs h-full bg-slate-50 dark:bg-slate-900 shadow-2xl animate-slide-in overflow-y-auto">
             <div className="flex justify-end p-4">
               <button onClick={() => setIsMobileOpen(false)}><X className="w-6 h-6 dark:text-white" /></button>
             </div>
             <NavList />
          </div>
        </div>
      )}
    </>
  );
};