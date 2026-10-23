'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  ArrowRight,
  MessageSquare,
  Users,
  Building,
  CheckCircle2,
  ChevronRight,
  Plus,
} from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();

    const handleReload = () => fetchDashboard();
    window.addEventListener('crm-lead-saved', handleReload);
    return () => window.removeEventListener('crm-lead-saved', handleReload);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Cargando relaciones de PixelMedia...</p>
        </div>
      </div>
    );
  }

  const { summary, pendingFollowUps, recentActivities } = data || {
    summary: { totalLeads: 0, activeCount: 0, pipelineValue: 0, wonCount: 0, wonValue: 0, winRate: 0 },
    pendingFollowUps: [],
    recentActivities: [],
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Resumen Superior Ultra Limpio */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Seguimientos Pendientes
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {pendingFollowUps.length}
          </div>
          <span className="text-[10px] text-slate-400">Contactos programados</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Relaciones en Curso
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summary.activeCount}
          </div>
          <span className="text-[10px] text-slate-400">Prospectos activos</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            En Negociación
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ${summary.pipelineValue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">USD en juego</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Cerrados Ganados
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {summary.wonCount}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            ${summary.wonValue.toLocaleString()} USD
          </span>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: ¿A quién tengo que llamar / contactar hoy? */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Personas con las que hay que hablar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Contactos que esperan seguimiento hoy o llamadas programadas
            </p>
          </div>

          <Link
            href="/proposals"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Ver Espacio de Propuestas</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {pendingFollowUps.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              🎉 No tienes llamadas o seguimientos pendientes por hoy. ¡Todo al día!
            </div>
          ) : (
            pendingFollowUps.map((lead: any) => {
              const displayName = lead.name || lead.contactName || 'Contacto';
              const isOverdue =
                lead.nextFollowUp &&
                new Date(lead.nextFollowUp).getTime() < Date.now();

              return (
                <div
                  key={lead.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {displayName}
                      </Link>
                      {lead.companyName && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          • {lead.companyName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-1">
                      🎯 {lead.nextFollowUpTask || 'Llamada o contacto de seguimiento'}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                          {new Date(lead.nextFollowUp).toLocaleDateString('es-HN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>

                      {lead.assignedTo && (
                        <span>• Vendedor: <strong>{lead.assignedTo.name.split(' ')[0]}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-slate-800">
                    <WhatsAppButton
                      phone={lead.phone}
                      contactName={displayName}
                      projectName={lead.companyName || ''}
                      size="md"
                    />
                    <Link
                      href={`/leads/${lead.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      Historial
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECCIÓN SECUNDARIA: Últimas conversaciones del equipo */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Últimas Conversaciones con Clientes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bitácora de llamadas y acuerdos recientes
            </p>
          </div>

          <Link
            href="/leads"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Ver todos los contactos
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Aún no hay conversaciones recientes registradas.
            </div>
          ) : (
            recentActivities.map((act: any) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold">
                  {act.user?.name?.charAt(0) || 'V'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {(act.contact || act.lead) ? (
                        <Link href={`/leads/${(act.contact || act.lead).id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                          {(act.contact || act.lead).name || (act.contact || act.lead).contactName} {(act.contact || act.lead).companyName ? `(${(act.contact || act.lead).companyName})` : ''}
                        </Link>
                      ) : (
                        'Contacto'
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleDateString('es-HN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {act.description}
                  </p>

                  <span className="text-[10px] text-slate-400 block mt-1">
                    Registrado por {act.user?.name}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
