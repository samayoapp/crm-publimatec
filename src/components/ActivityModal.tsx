'use client';

import { useState } from 'react';
import { X, Phone, MessageSquare, Calendar, Mail, FileText, Clock } from 'lucide-react';
import { ACTIVITY_TYPES } from '@/lib/constants';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  leadId: string;
  leadTitle: string;
}

export default function ActivityModal({
  isOpen,
  onClose,
  onSaved,
  leadId,
  leadTitle,
}: ActivityModalProps) {
  const [type, setType] = useState('LLAMADA');
  const [description, setDescription] = useState('');
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [nextFollowUpTask, setNextFollowUpTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Por favor escribe el detalle de la actividad');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        type,
        description: description.trim(),
      };

      if (scheduleNext && nextFollowUp) {
        payload.nextFollowUp = new Date(nextFollowUp).toISOString();
        payload.nextFollowUpTask = nextFollowUpTask;
      } else {
        payload.nextFollowUp = null;
        payload.nextFollowUpTask = null;
      }

      const res = await fetch(`/api/contacts/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la actividad');
      }

      window.dispatchEvent(new CustomEvent('crm-lead-saved'));
      setDescription('');
      setScheduleNext(false);
      setNextFollowUp('');
      setNextFollowUpTask('');
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (key: string) => {
    switch (key) {
      case 'LLAMADA':
        return <Phone className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />;
      case 'REUNION':
        return <Calendar className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
      case 'CORREO':
        return <Mail className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 transition-colors">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Registrar Actividad / Bitácora
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-sm">
              {leadTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Tipo de actividad */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Contacto
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACTIVITY_TYPES.filter(t => t.key !== 'CAMBIO_ETAPA').map((t) => {
                const isSelected = type === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setType(t.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-400 dark:border-indigo-500 text-indigo-900 dark:text-white font-bold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    {getIcon(t.key)}
                    <span>{t.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen o notas de la interacción */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ¿Qué se conversó o acordó? *
            </label>
            <textarea
              required
              rows={3}
              placeholder="ej. Se conversó por WhatsApp. Le interesó el paquete intermedio de branding. Quedamos en enviar cotización formal mañana..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Checkbox para programar siguiente seguimiento */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900"
              />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                Programar siguiente llamada / tarea de seguimiento
              </span>
            </label>

            {scheduleNext && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2.5 animate-fadeIn">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Fecha y Hora
                  </label>
                  <input
                    type="datetime-local"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Motivo o Tarea
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Enviar propuesta por correo y llamar para confirmar"
                    value={nextFollowUpTask}
                    onChange={(e) => setNextFollowUpTask(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar en Bitácora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
