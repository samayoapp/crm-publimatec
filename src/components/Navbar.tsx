'use client';

import { Plus } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface NavbarProps {
  title: string;
  subtitle?: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  onNewLeadClick?: () => void;
}

export default function Navbar({ title, subtitle, user, onNewLeadClick }: NavbarProps) {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Theme Toggle Icon */}
        <ThemeToggle variant="compact" />

        {onNewLeadClick && (
          <button
            onClick={onNewLeadClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Contacto</span>
          </button>
        )}
      </div>
    </header>
  );
}
