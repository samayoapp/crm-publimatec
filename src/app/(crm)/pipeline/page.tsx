'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Kanban,
  Search,
  DollarSign,
  Plus,
  CheckCircle2,
  Building,
  User,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  ExternalLink,
  Clock,
  Phone,
  Edit,
  Table2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { STAGES, STAGE_KEYS } from '@/lib/constants';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProposalModal from '@/components/ProposalModal';
import { getDaysDiff, formatFriendlyDate } from '@/lib/timeUtils';
import { useSettings } from '@/lib/settingsContext';

export default function PipelinePage() {
  const { currency, currencySymbol, formatMoney, convert } = useSettings();
  const [proposals, setProposals] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');

  // Horizontal scroll ref & controls
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollBoard = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const fetchProposals = () => {
    let url = '/api/proposals?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (currentUser?.role === 'ADMIN' && selectedAdvisor) {
      url += `assignedToId=${encodeURIComponent(selectedAdvisor)}&`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.proposals) setProposals(data.proposals);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchAdvisors = () => {
    fetch('/api/team')
      .then((res) => res.json())
      .then((data) => {
        if (data.team) setAdvisors(data.team);
      })
      .catch((err) => console.error(err));
  };

  const fetchUser = () => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAdvisors();
    fetchUser();
  }, []);

  useEffect(() => {
    fetchProposals();

    const handleReload = () => fetchProposals();
    window.addEventListener('crm-proposal-saved', handleReload);
    window.addEventListener('crm-lead-saved', handleReload);
    return () => {
      window.removeEventListener('crm-proposal-saved', handleReload);
      window.removeEventListener('crm-lead-saved', handleReload);
    };
  }, [search, selectedAdvisor]);

  const updateStage = async (proposalId: string, newStage: string) => {
    // Optimistic update
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, stage: newStage } : p))
    );

    try {
      await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      fetchProposals();
    } catch (err) {
      console.error(err);
      fetchProposals();
    }
  };

  // Helper to match stage with compatibility aliases
  const matchStage = (itemStage: string, columnKey: string) => {
    if (itemStage === columnKey) return true;
    if (columnKey === 'PROPUESTA' && itemStage === 'ENVIADA') return true;
    if (columnKey === 'GANADO' && itemStage === 'VENTA') return true;
    if (columnKey === 'PERDIDO' && itemStage === 'PERDIDA') return true;
    return false;
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Header */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors shadow-xs overflow-hidden">
        {/* Tier 1: Title, Kanban/Table link & Primary Action */}
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Kanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Embudo de Ventas (Pipeline Comercial)
              </h2>
              <Link
                href="/proposals"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
                title="Cambiar a Vista Tabla Comparativa y Tarjetas"
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Ver en Tabla</span>
              </Link>
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                title="Abrir Calendario Comercial & Citas"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Calendario & Citas</span>
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Flujo comercial interactivo: arrastra y avanza prospectos entre etapas o compáralos en la vista de tabla.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap sm:flex-nowrap">
            {/* Scroll navigation controls */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => scrollBoard('left')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Desplazar hacia la izquierda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 px-1 select-none">
                Desplazar
              </span>
              <button
                type="button"
                onClick={() => scrollBoard('right')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Desplazar hacia la derecha"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setEditingProposal(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Nueva Oportunidad / Propuesta</span>
              <span className="sm:hidden">+ Oportunidad</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Search & Advisor Filter Bar */}
        <div className="p-3 bg-white/60 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar prospecto, cliente o propuesta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 pl-8 pr-7 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="hidden sm:block h-5 w-[1px] bg-slate-200 dark:bg-slate-750" />

            {currentUser?.role === 'ADMIN' ? (
              <>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Filtrar:
                  </span>
                </div>

                <select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium"
                >
                  <option value="">Todos los vendedores</option>
                  {advisors.map((adv) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Mis Oportunidades Asignadas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board with ALL 6 STAGES - Clean Horizontal Scroll with comfortable column width */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 items-start overflow-x-auto pb-6 pt-1 px-1 kanban-scrollbar scroll-smooth"
      >
        {STAGE_KEYS.map((stageKey, colIndex) => {
          const config = STAGES[stageKey];
          const stageProps = proposals.filter((p) => matchStage(p.stage, stageKey));
          const totalVal = stageProps.reduce((acc, curr) => acc + convert(curr.amount || 0, curr.currency), 0);
          const isWonCol = stageKey === 'GANADO';

          return (
            <div
              key={stageKey}
              className={`w-[290px] min-w-[290px] xl:w-[310px] xl:min-w-[310px] shrink-0 bg-slate-100/70 dark:bg-[#0c1220] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col border-t-[3px] ${config.headerBorder} transition-colors`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/40 rounded-t-xl flex items-center justify-between">
                <div className="min-w-0 pr-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                    {isWonCol && <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    <span className="truncate">{config.label}</span>
                  </h3>
                  <span className={`text-[11px] font-extrabold ${isWonCol ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {formatMoney(totalVal)}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0">
                  {stageProps.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="p-2 space-y-2.5 min-h-[450px] max-h-[calc(100vh-220px)] overflow-y-auto">
                {stageProps.length === 0 ? (
                  <div className="text-center py-10 px-2 text-[11px] text-slate-400 dark:text-slate-600 border border-dashed border-slate-300/80 dark:border-slate-800/60 rounded-xl">
                    Sin propuestas en esta etapa
                  </div>
                ) : (
                  stageProps.map((prop) => {
                    const isWon = prop.stage === 'GANADO' || prop.stage === 'VENTA';

                    return (
                      <div
                        key={prop.id}
                        className={`bg-white dark:bg-slate-900 border rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col gap-2 ${
                          isWon
                            ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40'
                        }`}
                      >
                        {/* Título de la oportunidad */}
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <h4
                              onClick={() => {
                                setEditingProposal(prop);
                                setIsModalOpen(true);
                              }}
                              className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer leading-snug line-clamp-2"
                            >
                              {prop.title}
                            </h4>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex flex-col items-end">
                                <span className={`text-xs font-extrabold tracking-tight ${
                                  isWon ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                                }`}>
                                  {formatMoney(prop.amount || 0, prop.currency)}
                                </span>
                                {prop.currency && prop.currency !== currency && (
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                    Orig: {prop.currency === 'USD' ? '$' : prop.currency === 'EUR' ? '€' : 'L'} {(prop.amount || 0).toLocaleString('es-HN')}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  setEditingProposal(prop);
                                  setIsModalOpen(true);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Editar o gestionar propuesta"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Contacto asociado */}
                          {prop.contact && (
                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                              <Link
                                href={`/leads/${prop.contact.id}`}
                                className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 truncate"
                              >
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{prop.contact.name}</span>
                              </Link>

                              <WhatsAppButton
                                phone={prop.contact.phone}
                                contactName={prop.contact.name}
                                projectName={prop.title}
                                size="sm"
                                className="text-[10px] px-2 py-0.5 shrink-0"
                              />
                            </div>
                          )}

                          {prop.contact?.companyName && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building className="w-2.5 h-2.5 text-slate-400" />
                              <span className="truncate">{prop.contact.companyName}</span>
                            </p>
                          )}
                        </div>

                        {/* Notas */}
                        {prop.notes && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-1.5 rounded-lg line-clamp-2 leading-relaxed">
                            {prop.notes}
                          </p>
                        )}

                        {/* Control de Tiempos & Inactividad */}
                        {(() => {
                          const daysInStage = getDaysDiff(prop.stageUpdatedAt || prop.updatedAt || prop.createdAt);
                          const isFollowUpOverdue = prop.contact?.nextFollowUp
                            ? new Date(prop.contact.nextFollowUp).getTime() < new Date().setHours(0, 0, 0, 0)
                            : false;

                          return (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                              {!isWon && (
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold border ${
                                    daysInStage >= 7
                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                                      : daysInStage >= 4
                                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                                      : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                  }`}
                                  title={`Permanencia en etapa: ${daysInStage} días`}
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{daysInStage === 0 ? 'Hoy' : `${daysInStage}d`}</span>
                                </span>
                              )}

                              {prop.contact?.nextFollowUp && (
                                <Link
                                  href="/calendar"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold border ${
                                    isFollowUpOverdue
                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
                                  }`}
                                  title={prop.contact.nextFollowUpTask || 'Cita programada'}
                                >
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>{isFollowUpOverdue ? 'Cita Vencida' : formatFriendlyDate(prop.contact.nextFollowUp)}</span>
                                </Link>
                              )}
                            </div>
                          );
                        })()}

                        {/* Footer: Vendedor & Acciones */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400">
                            {prop.assignedTo?.name?.split(' ')[0] || 'Libre'}
                          </span>

                          {/* Botón rápido: ¡Cerrar Venta! */}
                          {!isWon && (
                            <button
                              onClick={() => updateStage(prop.id, 'GANADO')}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/30 transition-colors"
                              title="Aprobar y marcar como venta ganada"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>¡Cerrar Venta!</span>
                            </button>
                          )}

                          {isWon && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                              <Award className="w-3 h-3" />
                              <span>Venta Cerrada</span>
                            </span>
                          )}
                        </div>

                        {/* Navegación entre etapas */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/40 text-[10px]">
                          {colIndex > 0 ? (
                            <button
                              onClick={() => updateStage(prop.id, STAGE_KEYS[colIndex - 1])}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 flex items-center gap-0.5"
                            >
                              <ArrowLeft className="w-3 h-3" />
                              <span>Atrás</span>
                            </button>
                          ) : (
                            <div />
                          )}

                          {colIndex < STAGE_KEYS.length - 1 && (
                            <button
                              onClick={() => updateStage(prop.id, STAGE_KEYS[colIndex + 1])}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold p-0.5 flex items-center gap-0.5 ml-auto"
                            >
                              <span>Avanzar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <ProposalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchProposals}
        proposalToEdit={editingProposal}
        currentUser={currentUser || { id: '', name: '', role: 'ADMIN' }}
      />
    </div>
  );
}
