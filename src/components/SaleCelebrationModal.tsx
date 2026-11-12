'use client';

import { useState, useEffect, useMemo } from 'react';
import { Award, Sparkles, PartyPopper, Trophy, CheckCircle2, X, Building2, User, FileText } from 'lucide-react';
import { useSettings } from '@/lib/settingsContext';

export interface SaleCelebrationPayload {
  userName?: string;
  contactName?: string;
  companyName?: string | null;
  proposalTitle?: string;
  amount?: number;
  currency?: string;
}

export function triggerSaleCelebration(payload: SaleCelebrationPayload) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('crm-sale-celebration', { detail: payload }));
  }
}

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  isCircle: boolean;
}

const CONFETTI_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber/gold
  '#6366f1', // indigo
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f43f5e', // rose
  '#eab308', // yellow
];

export default function SaleCelebrationModal({ defaultUserName }: { defaultUserName?: string }) {
  const { formatMoney } = useSettings();
  const [celebration, setCelebration] = useState<SaleCelebrationPayload | null>(null);

  // Generar 90 piezas de confeti variadas
  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 90 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.4,
      duration: 2.6 + Math.random() * 2.4,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + Math.floor(Math.random() * 8),
      rotate: Math.floor(Math.random() * 360),
      isCircle: i % 3 === 0,
    }));
  }, [celebration]);

  useEffect(() => {
    const handleCelebration = (e: Event) => {
      const customEvent = e as CustomEvent<SaleCelebrationPayload>;
      if (customEvent.detail) {
        setCelebration(customEvent.detail);

        // Pequeña fanfarria triunfal con Web Audio API (sin archivos externos)
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const notes = [523.25, 659.25, 783.99, 1046.5]; // Do - Mi - Sol - Do (acorde triunfal)
            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
              gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.11);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.55);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + idx * 0.11);
              osc.stop(ctx.currentTime + idx * 0.11 + 0.55);
            });
          }
        } catch (err) {}
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCelebration(null);
      }
    };

    window.addEventListener('crm-sale-celebration', handleCelebration);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('crm-sale-celebration', handleCelebration);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!celebration) return null;

  const rawUser = (celebration.userName || defaultUserName || 'Campeón').trim();
  const displayUser = rawUser.split(/\s+/)[0];
  const displayContact = celebration.contactName || 'el cliente';
  const displayCompany = celebration.companyName?.trim() || null;
  const displayProposal = celebration.proposalTitle || 'Propuesta Comercial';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
      onClick={() => setCelebration(null)}
    >
      {/* Lluvia de Confeti en Pantalla Completa */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, -12vh, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            transform: translate3d(25px, 105vh, 0) rotate(720deg) scale(0.85);
            opacity: 0;
          }
        }
        @keyframes trumpet-bounce {
          0%, 100% {
            transform: scale(1) rotate(-6deg);
          }
          50% {
            transform: scale(1.18) rotate(8deg);
          }
        }
        @keyframes modal-pop-from-depth {
          0% {
            opacity: 0;
            transform: perspective(1000px) translateZ(-700px) scale(0.15) translateY(60px);
          }
          55% {
            opacity: 1;
            transform: perspective(1000px) translateZ(40px) scale(1.08) translateY(-10px);
          }
          75% {
            transform: perspective(1000px) translateZ(-15px) scale(0.95) translateY(4px);
          }
          90% {
            transform: perspective(1000px) translateZ(8px) scale(1.02) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: perspective(1000px) translateZ(0px) scale(1) translateY(0px);
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden z-[101]">
        {confettiPieces.map((p) => (
          <span
            key={p.id}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: p.isCircle ? `${p.size}px` : `${Math.round(p.size * 1.7)}px`,
              backgroundColor: p.color,
              borderRadius: p.isCircle ? '9999px' : '3px',
              animation: `confetti-fall ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s infinite`,
              transform: `rotate(${p.rotate}deg)`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
          />
        ))}
      </div>

      {/* Tarjeta Central de Celebración con Efecto 3D Rebote desde el Fondo */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'modal-pop-from-depth 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          transformOrigin: 'center center',
        }}
        className="relative z-[102] w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-500/60 shadow-[0_0_70px_-10px_rgba(245,158,11,0.5)] overflow-hidden"
      >
        {/* Banner Superior Festivo Dorado/Esmeralda */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 px-6 pt-8 pb-6 text-center text-white overflow-hidden">
          <button
            type="button"
            onClick={() => setCelebration(null)}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            aria-label="Cerrar celebración"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Trompetas y Trofeo Central */}
          <div className="flex items-center justify-center gap-3 sm:gap-5 mb-3 select-none">
            <span
              className="text-4xl sm:text-5xl drop-shadow-lg inline-block"
              style={{ animation: 'trumpet-bounce 1.2s ease-in-out infinite' }}
              role="img"
              aria-label="Trompeta"
            >
              🎺
            </span>

            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center shadow-2xl">
              <Trophy className="w-9 h-9 sm:w-11 sm:h-11 text-amber-200 drop-shadow" />
            </div>

            <span
              className="text-4xl sm:text-5xl drop-shadow-lg inline-block"
              style={{ animation: 'trumpet-bounce 1.2s ease-in-out infinite 0.3s' }}
              role="img"
              aria-label="Celebración"
            >
              🎉
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-black uppercase tracking-widest text-amber-100 mb-2 border border-white/30">
            <PartyPopper className="w-3.5 h-3.5" />
            <span>¡Venta Cerrada Ganada!</span>
            <span>🎺</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
            ¡FELICIDADES, {displayUser.toUpperCase()}!
          </h2>
        </div>

        {/* Cuerpo del Mensaje Personalizado */}
        <div className="p-6 sm:p-7 space-y-5 text-center">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            Por haber cerrado la venta con{' '}
            <strong className="font-black text-slate-900 dark:text-white underline decoration-emerald-500/60 decoration-2 underline-offset-2">
              {displayContact}
            </strong>
            {displayCompany ? (
              <>
                {' '}de la empresa{' '}
                <strong className="font-black text-indigo-600 dark:text-indigo-400">
                  {displayCompany}
                </strong>
              </>
            ) : null}{' '}
            con la propuesta{' '}
            <strong className="font-black text-emerald-600 dark:text-emerald-400">
              &ldquo;{displayProposal}&rdquo;
            </strong>
            .
          </p>

          {/* Resumen Destacado del Cierre */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-50 via-amber-50/40 to-indigo-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-indigo-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5 text-left shadow-inner">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Cliente:</span>
              <span className="font-extrabold text-slate-900 dark:text-white truncate">{displayContact}</span>
            </div>

            {displayCompany && (
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Empresa:</span>
                <span className="font-extrabold text-slate-900 dark:text-white truncate">{displayCompany}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Propuesta:</span>
              <span className="font-extrabold text-slate-900 dark:text-white truncate">{displayProposal}</span>
            </div>

            {typeof celebration.amount === 'number' && celebration.amount > 0 && (
              <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Monto Cerrado Ganado</span>
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatMoney(celebration.amount, celebration.currency)}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCelebration(null)}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>¡Excelente, a seguir cerrando ventas! 🎺🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}
