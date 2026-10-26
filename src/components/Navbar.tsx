'use client';

import { Plus, Menu } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';

interface NavbarProps {
  title: string;
  subtitle?: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  onNewLeadClick?: () => void;
  onToggleSidebar?: () => void;
}

export default function Navbar({
  title,
  subtitle,
  user,
  onNewLeadClick,
  onToggleSidebar,
}: NavbarProps) {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Abrir menú de navegación"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0 flex items-center gap-2.5">
          <img
            src="/brand/isotipo-publimatec.png"
            alt="Publimatec"
            className="w-7 h-7 object-contain shrink-0 hidden sm:block drop-shadow-xs"
          />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Theme Toggle Icon */}
        <ThemeToggle variant="compact" />

        {/* Notifications Center */}
        <NotificationBell userRole={user.role} />

        {onNewLeadClick && (
          <button
            onClick={onNewLeadClick}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Nuevo Prospecto</span>
            <span className="sm:hidden font-medium">Prospecto</span>
          </button>
        )}
      </div>
    </header>
  );
}

