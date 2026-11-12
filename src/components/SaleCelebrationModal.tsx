'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  PartyPopper,
  Trophy,
  CheckCircle2,
  X,
  Building2,
  User,
  FileText,
  ShieldCheck,
  FileSignature,
  ClipboardCheck,
  Banknote,
  AlertCircle,
} from 'lucide-react';
import { useSettings } from '@/lib/settingsContext';

export interface SaleCelebrationPayload {
  userName?: string;
  contactName?: string;
  companyName?: string | null;
  proposalTitle?: string;
  amount?: number;
  currency?: string;
  milestones?: string[];
}

export const CLOSING_MILESTONES = [
  {
    id: 'FIRMA_CONTRATO',
    title: 'Firma de contrato',
    description: 'El acuerdo legal formalizado entre las partes.',
    icon: FileSignature,
  },
  {
    id: 'ORDEN_COMPRA',
    title: 'Orden de Compra (PO) oficial',
    description: 'El documento administrativo emitido por el cliente que respalda la contratación.',
    icon: ClipboardCheck,
  },
  {
    id: 'ANTICIPO_PAGO',
    title: 'Recepción del anticipo o primer pago',
    description: 'El ingreso efectivo del primer abono financiero.',
    icon: Banknote,
  },
] as const;

interface WinConfirmationEventDetail {
  payload: SaleCelebrationPayload;
  resolve: (selectedMilestones: string[] | null) => void;
}

/**
 * Abre primero el Modal de Confirmación de los 3 Hitos Tangibles.
 * Si el vendedor selecciona al menos 1 hito y confirma, devuelve el arreglo de hitos cumplidos.
 * Si cancela, devuelve null para que la propuesta NO cambie a Venta Ganada.
 */
export function requestWinConfirmation(payload: SaleCelebrationPayload): Promise<string[] | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<WinConfirmationEventDetail>('crm-request-win-confirmation', {
        detail: { payload, resolve },
      })
    );
  });
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

  // Estado del Modal 1: Confirmación previa de Hitos Tangibles
  const [pendingConfirm, setPendingConfirm] = useState<SaleCelebrationPayload | null>(null);
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);
  const confirmResolverRef = useRef<((milestones: string[] | null) => void) | null>(null);

  // Estado del Modal 2: Celebración con Confeti y Trompetas
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

  const playFanfare = () => {
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
  };

  useEffect(() => {
    const handleRequestConfirmation = (e: Event) => {
      const customEvent = e as CustomEvent<WinConfirmationEventDetail>;
      if (customEvent.detail) {
        confirmResolverRef.current = customEvent.detail.resolve;
        setSelectedMilestones([]);
        setPendingConfirm(customEvent.detail.payload);
      }
    };

    const handleCelebration = (e: Event) => {
      const customEvent = e as CustomEvent<SaleCelebrationPayload>;
      if (customEvent.detail) {
        setCelebration(customEvent.detail);
        playFanfare();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingConfirm) {
          handleCancelConfirmation();
        } else if (celebration) {
          setCelebration(null);
        }
      }
    };

    window.addEventListener('crm-request-win-confirmation', handleRequestConfirmation);
    window.addEventListener('crm-sale-celebration', handleCelebration);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('crm-request-win-confirmation', handleRequestConfirmation);
      window.removeEventListener('crm-sale-celebration', handleCelebration);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pendingConfirm, celebration]);

  const toggleMilestone = (title: string) => {
    setSelectedMilestones((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const handleCancelConfirmation = () => {
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setPendingConfirm(null);
    setSelectedMilestones([]);
    if (resolver) resolver(null);
  };

  const handleAcceptConfirmation = () => {
    if (selectedMilestones.length === 0 || !pendingConfirm) return;
    const confirmedMilestones = [...selectedMilestones];
    const currentPayload = { ...pendingConfirm, milestones: confirmedMilestones };
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;

    setPendingConfirm(null);
    setSelectedMilestones([]);

    if (resolver) resolver(confirmedMilestones);

    // Lanzar inmediatamente la celebración con los hitos confirmados
    setCelebration(currentPayload);
    playFanfare();
  };

  // ============================================================================
  // MODAL 1: CONFIRMACIÓN DE LOS 3 HITOS TANGIBLES ANTES DE PASAR A VENTA GANADA
  // ============================================================================
  if (pendingConfirm) {
    const canConfirm = selectedMilestones.length > 0;
    const confirmContact = pendingConfirm.contactName || 'el cliente';
    const confirmCompany = pendingConfirm.companyName?.trim() || null;
    const confirmProposal = pendingConfirm.proposalTitle || 'Propuesta Comercial';

    return (
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
        onClick={handleCancelConfirmation}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
        >
          {/* Header del Modal de Confirmación */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 relative">
            <button
              type="button"
              onClick={handleCancelConfirmation}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                  Verificación de Cierre Comercial
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  Confirmar Hitos de Venta Ganada
                </h3>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span className="truncate max-w-[70%]">
                <strong className="text-white">{confirmProposal}</strong> • {confirmContact}
                {confirmCompany ? ` (${confirmCompany})` : ''}
              </span>
              {typeof pendingConfirm.amount === 'number' && pendingConfirm.amount > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-black border border-emerald-400/30">
                  {formatMoney(pendingConfirm.amount, pendingConfirm.currency)}
                </span>
              )}
            </div>
          </div>

          {/* Cuerpo con las 3 opciones */}
          <div className="p-5 sm:p-6 space-y-4">
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Para marcarla como cerrada en tu embudo, debe cumplirse al menos uno de estos{' '}
              <strong className="font-black text-slate-900 dark:text-white">
                tres hitos tangibles
              </strong>{' '}
              (puedes elegir uno, dos o todos):
            </p>

            <div className="space-y-2.5">
              {CLOSING_MILESTONES.map((milestone, idx) => {
                const isSelected = selectedMilestones.includes(milestone.title);
                const Icon = milestone.icon;

                return (
                  <button
                    key={milestone.id}
                    type="button"
                    onClick={() => toggleMilestone(milestone.title)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Checkbox visual */}
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {idx + 1}. {milestone.title}:
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>

                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nota de advertencia */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                Mientras no exista alguno de esos tres respaldos documentales o financieros, la
                propuesta se mantiene abierta en seguimiento y no se contabiliza como venta ganada.
              </span>
            </div>

            {/* Botones de Acción */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelConfirmation}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Mantener en Seguimiento
              </button>

              <button
                type="button"
                disabled={!canConfirm}
                onClick={handleAcceptConfirmation}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 transition-all ${
                  canConfirm
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-lg shadow-emerald-600/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-70'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>
                  {canConfirm
                    ? `Confirmar Venta Ganada (${selectedMilestones.length}/3)`
                    : 'Selecciona al menos 1 hito'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODAL 2: CELEBRACIÓN CON CONFETI, TROMPETAS Y ANIMACIÓN 3D DESDE EL FONDO
  // ============================================================================
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

            {celebration.milestones && celebration.milestones.length > 0 && (
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Hitos de Cierre Verificados:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {celebration.milestones.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold border border-emerald-300/70 dark:border-emerald-700"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{m}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

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
