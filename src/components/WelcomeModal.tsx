'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Zap, X, Quote, RefreshCw, Flame } from 'lucide-react';

interface WelcomeModalProps {
  userName: string;
  quotes: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({
  userName,
  quotes,
  isOpen,
  onClose,
}: WelcomeModalProps) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Pick a random quote when opened
  useEffect(() => {
    if (isOpen && quotes && quotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setCurrentQuoteIndex(randomIndex);
    }
  }, [isOpen, quotes]);

  if (!isOpen) return null;

  const validQuotes = quotes && quotes.length > 0
    ? quotes
    : ['Cada llamada y cada seguimiento es una oportunidad para superar tus límites. ¡Hoy se cierran grandes tratos!'];

  const currentQuote = validQuotes[currentQuoteIndex % validQuotes.length];

  const handleNextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % validQuotes.length);
  };

  // Get clean first name if available
  const firstName = userName ? userName.trim().split(' ')[0] : 'Equipo';

  return (
    <div
      id="welcome-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        id="welcome-modal-card"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 p-6 sm:p-8 text-center transition-all animate-in zoom-in-95 duration-300"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button Top Right */}
        <button
          id="close-welcome-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Badge Icon */}
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/30">
          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-pulse" />
          </div>
        </div>

        {/* Welcome Headline in GRANDE */}
        <div className="space-y-1 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            PixelMedia • Publimatec CRM
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase pt-2">
            ¡BIENVENIDO,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              {firstName}!
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Preparados para conquistar metas, construir relaciones y cerrar grandes proyectos.
          </p>
        </div>

        {/* Motivational Quote Box */}
        <div className="relative mb-8 text-left bg-gradient-to-br from-indigo-50/70 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
              <Quote className="w-3.5 h-3.5" />
              Frase de Ventas del Día
            </span>
            {validQuotes.length > 1 && (
              <button
                type="button"
                onClick={handleNextQuote}
                className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="Ver otra frase motivadora"
              >
                <RefreshCw className="w-3 h-3" />
                Cambiar frase
              </button>
            )}
          </div>

          <p className="text-sm sm:text-base font-medium italic text-slate-700 dark:text-slate-200 leading-relaxed">
            "{currentQuote}"
          </p>
        </div>

        {/* Big Action Button: ¡VAMOS A LA ACCIÓN! */}
        <button
          id="btn-vamos-a-la-accion"
          onClick={onClose}
          className="group relative w-full inline-flex items-center justify-center gap-3 py-4 px-8 rounded-2xl text-base sm:text-lg font-black tracking-wide text-white uppercase bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <span>¡VAMOS A LA ACCIÓN!</span>
          <Zap className="w-5 h-5 fill-white text-white group-hover:scale-125 transition-transform" />
        </button>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
          Haz clic para ingresar al panel de control y ver tus prospectos
        </p>
      </div>
    </div>
  );
}
