'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  variant?: 'pill' | 'compact';
  className?: string;
}

export default function ThemeToggle({ variant = 'pill', className = '' }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return empty placeholder with same dimensions to avoid hydration shift
    return <div className={`h-8 w-full rounded-xl bg-slate-800/20 ${className}`} />;
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro'}
        className={`p-2 rounded-xl transition-all border ${
          theme === 'dark'
            ? 'bg-slate-800/80 text-amber-400 hover:text-amber-300 border-slate-700/80 hover:bg-slate-800'
            : 'bg-slate-100 text-indigo-600 hover:text-indigo-700 border-slate-200 hover:bg-slate-200'
        } ${className}`}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  // Pill selector (shows both Claro / Oscuro buttons side by side)
  return (
    <div
      className={`flex items-center p-1 rounded-xl border transition-all ${
        theme === 'dark'
          ? 'bg-slate-900/90 border-slate-800/80'
          : 'bg-slate-100 border-slate-200 shadow-inner'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
          theme === 'light'
            ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span>Claro</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
          theme === 'dark'
            ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Moon className="w-3.5 h-3.5 text-indigo-400" />
        <span>Oscuro</span>
      </button>
    </div>
  );
}
