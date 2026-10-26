'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Timer,
  TrendingUp,
  AlertTriangle,
  Award,
  Clock,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Users,
  Building,
  Flame,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';
import { formatFriendlyDate } from '@/lib/timeUtils';
import { useSettings } from '@/lib/settingsContext';

export default function ReportsPage() {
  const { formatMoney } = useSettings();
  const [timePeriod, setTimePeriod] = useState('last_4_weeks');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = (period: string) => {
    setLoading(true);
    fetch(`/api/analytics/time?period=${period}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching reports:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports(timePeriod);
  }, [timePeriod]);

  const timeSummary = data?.summary || {
    avgDaysToClose: 0,
    totalWonCycles: 0,
    fastestClose: 0,
    slowestClose: 0,
    activeInPipelineCount: 0,
    atRiskCount: 0,
    contactsStaleness: { fresh: 0, attention: 0, stale: 0, total: 0 },
  };

  const avgStageDuration = data?.avgStageDuration || {
    NUEVO: 0,
    CONTACTADO: 0,
    PROPUESTA: 0,
    NEGOCIACION: 0,
  };

  const atRiskProposals = data?.atRiskProposals || [];
  const wonCycleDetails = data?.wonCycleDetails || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Reportes Gerenciales & Control de Tiempos
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Velocidad del ciclo de ventas, permanencia por etapa del embudo y auditoría de deals en riesgo
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto">
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
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

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-400">Calculando métricas gerenciales...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 4 Cards: Métricas Clave de Velocidad */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Duración Promedio Ciclo de Cierre */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Ciclo de Venta Promedio
              </span>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 flex items-baseline gap-1.5">
                <span>{timeSummary.avgDaysToClose}</span>
                <span className="text-sm font-bold text-slate-400">días</span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                {timeSummary.totalWonCycles} ventas cerradas en el periodo
              </span>
            </div>

            {/* Rango de Tiempo Cierres */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Rango de Cierre
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                <span className="text-emerald-600 font-bold" title="Cierre más veloz">
                  ⚡ {timeSummary.fastestClose}d
                </span>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-slate-600 dark:text-slate-300" title="Cierre más complejo">
                  🐢 {timeSummary.slowestClose}d
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                Cierre más rápido vs más complejo
              </span>
            </div>

            {/* Deals en Riesgo / Estancados */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Deals en Riesgo / Estancados
              </span>
              <div
                className={`text-3xl font-black ${
                  timeSummary.atRiskCount > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-800 dark:text-white'
                }`}
              >
                {timeSummary.atRiskCount}
              </div>
              <span className="text-[11px] text-slate-400 block">
                {timeSummary.atRiskCount > 0
                  ? 'Llevan +7 días en la misma etapa'
                  : 'Ningún deal estancado'}
              </span>
            </div>

            {/* Salud y Respuesta de Prospectos */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Salud de Prospectos
              </span>
              <div className="flex items-center gap-3 mt-1.5 text-xs font-extrabold">
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
              <span className="text-[11px] text-slate-400 block">
                Verde: &lt;2d | Amarillo: 3-6d | Rojo: +7d
              </span>
            </div>
          </div>

          {/* Tiempo Promedio de Permanencia por Etapa */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Velocidad de Embudo: Tiempo Promedio de Permanencia por Etapa</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Identifica en qué fase del ciclo se ralentizan las negociaciones comerciales
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  1. LISTA DE PROPUESTAS
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {avgStageDuration.NUEVO || 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">días promedio</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  2. CONTACTADO / BRIEF
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {avgStageDuration.CONTACTADO || 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">días promedio</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  3. PROPUESTA ENVIADA
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {avgStageDuration.PROPUESTA || 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">días promedio</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  4. EN NEGOCIACIÓN
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {avgStageDuration.NEGOCIACION || 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">días promedio</span>
              </div>
            </div>
          </div>

          {/* Deals Estancados / En Riesgo */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Oportunidades en Riesgo (+7 Días Sin Avance)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Propuestas activas que han excedido el tiempo óptimo de respuesta
                  </p>
                </div>
              </div>

              <Link
                href="/pipeline"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Ver Pipeline Completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {atRiskProposals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                🎉 No hay oportunidades estancadas en este periodo. ¡Excelente ritmo de negociación!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {atRiskProposals.map((prop: any) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-rose-200 dark:border-rose-900/60 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                        {prop.daysInStage}d en {prop.stage}
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatMoney(prop.amount || 0)}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {prop.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      👤 {prop.contactName} {prop.companyName ? `• ${prop.companyName}` : ''}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      {prop.phone && (
                        <WhatsAppButton
                          phone={prop.phone}
                          contactName={prop.contactName}
                          size="sm"
                        />
                      )}
                      {prop.contactId && (
                        <Link
                          href={`/leads/${prop.contactId}`}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Ver ficha de contacto →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
