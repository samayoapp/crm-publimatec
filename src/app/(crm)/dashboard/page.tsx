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
  Timer,
  TrendingUp,
  AlertTriangle,
  Award,
  CalendarDays,
  ExternalLink,
  Zap,
  Sparkles,
} from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';
import WelcomeModal from '@/components/WelcomeModal';
import { formatFriendlyDate } from '@/lib/timeUtils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // Time Analytics State
  const [timePeriod, setTimePeriod] = useState('last_4_weeks');
  const [timeAnalytics, setTimeAnalytics] = useState<any>(null);
  const [loadingTime, setLoadingTime] = useState(false);

  const fetchDashboard = () => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);

        // Check if welcome modal was already shown in this session
        try {
          const hasSeen = sessionStorage.getItem('crm_welcome_seen');
          if (!hasSeen) {
            setShowWelcome(true);
          }
        } catch (e) {
          setShowWelcome(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchTimeAnalytics = (period: string) => {
    setLoadingTime(true);
    fetch(`/api/analytics/time?period=${period}`)
      .then((res) => res.json())
      .then((resData) => {
        setTimeAnalytics(resData);
        setLoadingTime(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingTime(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
    fetchTimeAnalytics(timePeriod);

    const handleReload = () => {
      fetchDashboard();
      fetchTimeAnalytics(timePeriod);
    };
    window.addEventListener('crm-lead-saved', handleReload);
    window.addEventListener('crm-proposal-saved', handleReload);
    return () => {
      window.removeEventListener('crm-lead-saved', handleReload);
      window.removeEventListener('crm-proposal-saved', handleReload);
    };
  }, [timePeriod]);

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

  const timeSummary = timeAnalytics?.summary || {
    avgDaysToClose: 0,
    totalWonCycles: 0,
    fastestClose: 0,
    slowestClose: 0,
    activeInPipelineCount: 0,
    atRiskCount: 0,
    contactsStaleness: { fresh: 0, attention: 0, stale: 0, total: 0 },
  };

  const avgStageDuration = timeAnalytics?.avgStageDuration || {
    NUEVO: 0,
    CONTACTADO: 0,
    PROPUESTA: 0,
    NEGOCIACION: 0,
  };

  const atRiskProposals = timeAnalytics?.atRiskProposals || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Barra Superior con Saludo y Botón de Motivación */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>¡Hola, {data?.currentUser?.name?.split(' ')[0] || 'Equipo'}!</span>
            <span className="text-xl animate-pulse">👋</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Resumen comercial y pulso de ventas en tiempo real
          </p>
        </div>

        <button
          id="btn-trigger-welcome"
          type="button"
          onClick={() => setShowWelcome(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200/70 dark:border-indigo-800/60 shadow-sm transition-all hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Frase Motivadora</span>
        </button>
      </div>

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

      {/* SECCIÓN 1: ¿A quién tengo que llamar / contactar hoy? */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Personas con las que hay que hablar</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Contactos que esperan seguimiento hoy o llamadas programadas
            </p>
          </div>

          <Link
            href="/calendar"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-xs"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Ver Calendario Completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
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

      {/* SECCIÓN 2: CONTROL DE TIEMPO, VELOCIDAD COMERCIAL & CICLO DE VENTAS */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-5">
        {/* Header with Period Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Velocidad Comercial & Control de Tiempos</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Análisis de duración del viaje del cliente desde el 1er contacto hasta el cierre de venta
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-semibold">
            {[
              { id: 'this_week', label: 'Esta Semana' },
              { id: 'this_month', label: 'Este Mes' },
              { id: 'last_4_weeks', label: 'Últimas 4 Semanas' },
              { id: 'last_3_months', label: 'Trimestre' },
              { id: 'all', label: 'Histórico' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setTimePeriod(p.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timePeriod === p.id
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Cards: Ciclo de Ventas & Semáforo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Duración Promedio Ciclo de Cierre */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Ciclo de Venta Promedio
            </span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 flex items-baseline gap-1">
              <span>{timeSummary.avgDaysToClose}</span>
              <span className="text-xs font-bold text-slate-500">días</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {timeSummary.totalWonCycles} ventas ganadas en el periodo
            </span>
          </div>

          {/* Rango de Cierres (Mínimo / Máximo) */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Rango de Tiempo Cierres
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <span className="text-emerald-600 font-bold" title="Cierre más veloz">
                ⚡ {timeSummary.fastestClose}d
              </span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-600 dark:text-slate-300" title="Cierre más complejo">
                🐢 {timeSummary.slowestClose}d
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Más rápido vs más complejo</span>
          </div>

          {/* Deals en Riesgo / Estancados */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              En Riesgo / Estancados
            </span>
            <div className={`text-2xl font-black mt-1 ${
              timeSummary.atRiskCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'
            }`}>
              {timeSummary.atRiskCount}
            </div>
            <span className="text-[10px] text-slate-400">
              {timeSummary.atRiskCount > 0 ? 'Llevan +7 días sin avance' : 'Ningún deal estancado'}
            </span>
          </div>

          {/* Semáforo de Respuesta de Prospectos */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Salud de Prospectos
            </span>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-extrabold">
              <span className="inline-flex items-center gap-1 text-emerald-600" title="Activos en últimos 2 días">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{timeSummary.contactsStaleness.fresh}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-amber-600" title="Sin contacto 3-6 días">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{timeSummary.contactsStaleness.attention}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-rose-600" title="Sin respuesta +7 días">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{timeSummary.contactsStaleness.stale}</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Activos / Atención / Sin respuesta
            </span>
          </div>
        </div>

        {/* Permanencia por Etapa (Velocidad de Embudo) */}
        <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
            ⏱️ Tiempo Promedio de Permanencia por Etapa del Embudo
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 block">1. NUEVO</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {avgStageDuration.NUEVO || 0} <span className="text-[10px] font-normal text-slate-400">días prom</span>
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 block">2. CONTACTADO</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {avgStageDuration.CONTACTADO || 0} <span className="text-[10px] font-normal text-slate-400">días prom</span>
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 block">3. PROPUESTA ENVIADA</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {avgStageDuration.PROPUESTA || 0} <span className="text-[10px] font-normal text-slate-400">días prom</span>
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 block">4. NEGOCIACIÓN</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {avgStageDuration.NEGOCIACION || 0} <span className="text-[10px] font-normal text-slate-400">días prom</span>
              </span>
            </div>
          </div>
        </div>

        {/* Deals en Riesgo que requieren atención */}
        {atRiskProposals.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Oportunidades con Mayor Tiempo Sin Avance (Atención Prioritaria)</span>
              </span>
              <Link href="/pipeline" className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Ver en Pipeline →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {atRiskProposals.slice(0, 3).map((prop: any) => (
                <div
                  key={prop.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                      {prop.daysInStage}d en {prop.stage}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      ${(prop.amount || 0).toLocaleString()} USD
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {prop.title}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    👤 {prop.contactName} {prop.companyName ? `• ${prop.companyName}` : ''}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    {prop.phone && (
                      <WhatsAppButton
                        phone={prop.phone}
                        contactName={prop.contactName}
                        size="sm"
                        className="text-[9px] px-1.5 py-0.5"
                      />
                    )}
                    {prop.contactId && (
                      <Link
                        href={`/leads/${prop.contactId}`}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Abrir ficha
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 3: Últimas conversaciones del equipo */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Últimas Conversaciones con Clientes</span>
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

      {/* PopUp de Bienvenida y Motivación */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          try {
            sessionStorage.setItem('crm_welcome_seen', 'true');
          } catch (e) {}
        }}
        userName={data?.currentUser?.name || 'Asesor'}
        quotes={data?.motivationalQuotes || []}
      />
    </div>
  );
}

