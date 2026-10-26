'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Phone, MessageSquare, Mail, Users, AlertCircle, Trash2 } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  leadId: string;
  leadTitle: string;
  currentFollowUp?: string | null;
  currentFollowUpTask?: string | null;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSaved,
  leadId,
  leadTitle,
  currentFollowUp,
  currentFollowUpTask,
}: ScheduleModalProps) {
  const [channel, setChannel] = useState<'LLAMADA' | 'WHATSAPP' | 'REUNION' | 'CORREO'>('LLAMADA');
  const [followUpDate, setFollowUpDate] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formatear fecha local para datetime-local
  const formatForInput = (d: Date) => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (currentFollowUp) {
        const d = new Date(currentFollowUp);
        if (!isNaN(d.getTime())) {
          setFollowUpDate(formatForInput(d));
        }
      } else {
        // Por defecto: mañana a las 9:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        setFollowUpDate(formatForInput(tomorrow));
      }

      setTaskDescription(currentFollowUpTask || '');
      setError(null);
    }
  }, [isOpen, currentFollowUp, currentFollowUpTask]);

  if (!isOpen) return null;

  // Acceso rápido a fechas
  const setQuickDate = (type: 'today_afternoon' | 'tomorrow_morning' | 'in_2_days' | 'next_week') => {
    const now = new Date();
    switch (type) {
      case 'today_afternoon': {
        const d = new Date();
        d.setHours(15, 0, 0, 0);
        if (d.getTime() < Date.now()) {
          d.setHours(d.getHours() + 2);
        }
        setFollowUpDate(formatForInput(d));
        break;
      }
      case 'tomorrow_morning': {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        setFollowUpDate(formatForInput(d));
        break;
      }
      case 'in_2_days': {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        d.setHours(10, 0, 0, 0);
        setFollowUpDate(formatForInput(d));
        break;
      }
      case 'next_week': {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(9, 30, 0, 0);
        setFollowUpDate(formatForInput(d));
        break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) {
      setError('Por favor selecciona la fecha y hora de la llamada');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const channelLabel =
        channel === 'WHATSAPP'
          ? '[WhatsApp]'
          : channel === 'REUNION'
          ? '[Reunión]'
          : channel === 'CORREO'
          ? '[Correo]'
          : '[Llamada]';

      const finalTask = taskDescription.trim()
        ? `${channelLabel} ${taskDescription.trim()}`
        : `${channelLabel} Seguimiento comercial programado`;

      const res = await fetch(`/api/contacts/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUp: new Date(followUpDate).toISOString(),
          nextFollowUpTask: finalTask,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al programar el seguimiento');
      }

      window.dispatchEvent(new CustomEvent('crm-lead-saved'));
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFollowUp = async () => {
    if (!confirm('¿Deseas cancelar el seguimiento programado de este contacto?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUp: null,
          nextFollowUpTask: null,
        }),
      });

      if (!res.ok) throw new Error('Error al cancelar seguimiento');

      window.dispatchEvent(new CustomEvent('crm-lead-saved'));
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar seguimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Programar Próxima Llamada / Agenda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-sm">
                {leadTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explicación de concepto clara */}
        <div className="mt-3.5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Esta acción <strong>calendariza un contacto a futuro</strong> en tu agenda y en <em>Llamar HOY</em>. No creará un registro de llamada efectuada en la bitácora hasta que la llamada realmente suceda.
          </p>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Canal de Seguimiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Canal que se utilizará
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'LLAMADA', label: '📞 Llamada', icon: Phone },
                { id: 'WHATSAPP', label: '💬 WhatsApp', icon: MessageSquare },
                { id: 'REUNION', label: '🤝 Reunión', icon: Users },
                { id: 'CORREO', label: '✉️ Correo', icon: Mail },
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setChannel(ch.id as any)}
                  className={`py-2 px-2 rounded-xl text-center font-semibold border transition-all text-xs flex flex-col items-center gap-1 ${
                    channel === ch.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ch.icon className="w-3.5 h-3.5" />
                  <span>{ch.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fecha y Hora Programada */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Fecha y Hora de la Llamada *
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setQuickDate('today_afternoon')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Hoy tarde
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('tomorrow_morning')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Mañana 9 AM
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('in_2_days')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                >
                  En 2 días
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('next_week')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Próx. semana
                </button>
              </div>
            </div>
            <input
              type="datetime-local"
              required
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Objetivo o Motivo del Seguimiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Objetivo o Motivo de la Llamada
            </label>
            <input
              type="text"
              placeholder="ej. Llamar para dar seguimiento a cotización de vallas publicitarias..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            {currentFollowUp ? (
              <button
                type="button"
                onClick={handleClearFollowUp}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancelar Agenda</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{loading ? 'Guardando...' : 'Agendar en Calendario'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
