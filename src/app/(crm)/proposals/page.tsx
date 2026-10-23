'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Plus,
  ArrowUpDown,
  LayoutGrid,
  Table2,
  DollarSign,
  CheckCircle2,
  Award,
  Trash2,
  Edit,
  Building,
  User,
  ExternalLink,
  Clock,
  Sparkles,
  TrendingUp,
  Kanban,
  Filter,
  RotateCcw,
  X,
} from 'lucide-react';
import { STAGES, STAGE_KEYS } from '@/lib/constants';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProposalModal from '@/components/ProposalModal';

const getRoleBadgeStyle = (title?: string | null) => {
  if (!title) {
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
  const t = title.toLowerCase();
  if (
    t.includes('dueñ') ||
    t.includes('propietari') ||
    t.includes('presidente') ||
    t.includes('socio') ||
    t.includes('director general') ||
    t.includes('ceo')
  ) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300 border-purple-200 dark:border-purple-500/30';
  }
  if (
    t.includes('compra') ||
    t.includes('adquisicion') ||
    t.includes('proveedor') ||
    t.includes('abastec')
  ) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
  }
  if (
    t.includes('mercadeo') ||
    t.includes('marketing') ||
    t.includes('publicidad') ||
    t.includes('marca') ||
    t.includes('ventas') ||
    t.includes('comercial')
  ) {
    return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30';
  }
  if (
    t.includes('gerente') ||
    t.includes('director') ||
    t.includes('gte') ||
    t.includes('operacion') ||
    t.includes('legal')
  ) {
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters, Sort & View Mode
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [sortBy, setSortBy] = useState('amount-desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any | null>(null);

  const fetchProposals = () => {
    let url = '/api/proposals?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (selectedStage) url += `stage=${encodeURIComponent(selectedStage)}&`;
    if (selectedAdvisor) url += `assignedToId=${encodeURIComponent(selectedAdvisor)}&`;

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
  }, [search, selectedStage, selectedAdvisor]);

  const updateStage = async (proposalId: string, newStage: string) => {
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

  const handleDeleteProposal = async (prop: any) => {
    if (!confirm(`¿Estás seguro de eliminar la propuesta "${prop.title}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/proposals/${prop.id}`, { method: 'DELETE' });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('crm-proposal-saved'));
        fetchProposals();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar propuesta');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper flags
  const isWon = (s: string) => s === 'GANADO' || s === 'VENTA';
  const isLost = (s: string) => s === 'PERDIDO' || s === 'PERDIDA';
  const isActive = (s: string) => !isWon(s) && !isLost(s);

  // Sorting
  const sortedProposals = [...proposals].sort((a, b) => {
    if (sortBy === 'amount-desc') return (b.amount || 0) - (a.amount || 0);
    if (sortBy === 'amount-asc') return (a.amount || 0) - (b.amount || 0);
    if (sortBy === 'date-desc') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
    if (sortBy === 'stage') return a.stage.localeCompare(b.stage);
    return 0;
  });

  // KPI Metrics
  const totalProposals = proposals.length;
  const activeProposals = proposals.filter((p) => isActive(p.stage));
  const wonProposals = proposals.filter((p) => isWon(p.stage));

  const totalPipelineAmount = activeProposals.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalWonAmount = wonProposals.reduce((sum, p) => sum + (p.amount || 0), 0);
  const avgTicket = totalProposals > 0 ? (totalPipelineAmount + totalWonAmount) / totalProposals : 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Propuestas
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalProposals}
          </div>
          <span className="text-[10px] text-slate-400">Cotizaciones registradas</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            En Negociación
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            ${totalPipelineAmount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{activeProposals.length} activas</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Ventas Ganadas
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalWonAmount.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {wonProposals.length} contratos cerrados
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Ticket Promedio
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ${Math.round(avgTicket).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">USD por cotización</span>
        </div>
      </div>

      {/* Header, Search & Filter Toolbar */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors shadow-xs overflow-hidden">
        {/* Tier 1: Title, Subtitle, Kanban link, View Switcher & Primary Action */}
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Catálogo de Propuestas & Cotizaciones
              </h2>
              <Link
                href="/pipeline"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200/70 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              >
                <Kanban className="w-3 h-3" />
                <span>Ver Embudo Kanban</span>
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compara cotizaciones comerciales, filtra por etapas y analiza montos de menor a mayor
            </p>
          </div>

          {/* Right: View Mode Toggle & Primary Action */}
          <div className="flex items-center gap-2.5 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
            {/* Segmented View Mode Toggle */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-300/50 dark:border-slate-700/60 shadow-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista de Tabla Comparativa"
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Tabla</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista de Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tarjetas</span>
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => {
                setEditingProposal(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Propuesta</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Dedicated Search, Filters & Sort Bar */}
        <div className="p-3 bg-white/60 dark:bg-slate-900/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left Sub-Group: Search + Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Bar */}
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar propuesta, cliente o empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 pl-8 pr-7 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
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

            {/* Visual Separator */}
            <div className="hidden sm:block h-5 w-[1px] bg-slate-200 dark:bg-slate-700/80" />

            {/* Filter Section Header / Tag */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Filtros:
              </span>
            </div>

            {/* Filter 1: Stage */}
            <div className="relative">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium"
              >
                <option value="">Todas las etapas</option>
                {STAGE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {STAGES[key]?.label || key}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Advisor (if available) */}
            {advisors.length > 0 && (
              <div className="relative">
                <select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium"
                >
                  <option value="">Todos los asesores</option>
                  {advisors.map((adv) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Sub-Group: Sort Section + Clear Filters */}
          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 shadow-xs">
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ordenar:
                </span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="amount-desc">💰 Monto: Mayor a menor ($$$ → $)</option>
                <option value="amount-asc">💵 Monto: Menor a mayor ($ → $$$)</option>
                <option value="date-desc">🕒 Más Recientes</option>
                <option value="title-asc">🔤 Título (A - Z)</option>
                <option value="stage">🏷️ Por Etapa</option>
              </select>
            </div>

            {/* Reset filters button if active */}
            {(search || selectedStage || selectedAdvisor || sortBy !== 'amount-desc') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedStage('');
                  setSelectedAdvisor('');
                  setSortBy('amount-desc');
                }}
                className="px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 transition-colors flex items-center gap-1"
                title="Restablecer filtros y orden"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content: Table vs Cards */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-400 text-xs border border-slate-200 dark:border-slate-800">
          Cargando propuestas...
        </div>
      ) : sortedProposals.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {proposals.length === 0 ? 'No hay propuestas comerciales registradas' : 'No se encontraron propuestas'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {proposals.length === 0
              ? 'Crea tu primera cotización u oportunidad de venta vinculándola a un cliente para dar seguimiento comercial y comparar montos.'
              : 'Prueba cambiando los filtros de etapa o el término de búsqueda.'}
          </p>
          {proposals.length === 0 && (
            <button
              onClick={() => {
                setEditingProposal(null);
                setIsModalOpen(true);
              }}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primera Propuesta</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/60 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Propuesta / Oportunidad</th>
                  <th className="py-3.5 px-4">Contacto & Cargo</th>
                  <th className="py-3.5 px-4">Empresa</th>
                  <th className="py-3.5 px-4">Monto (USD)</th>
                  <th className="py-3.5 px-4">Etapa Comercial</th>
                  <th className="py-3.5 px-4">Vendedor</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {sortedProposals.map((prop) => {
                  const won = isWon(prop.stage);
                  const stageConf = STAGES[prop.stage] || {
                    label: prop.stage,
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  const roleBadge = getRoleBadgeStyle(prop.contact?.jobTitle);

                  return (
                    <tr
                      key={prop.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors group"
                    >
                      {/* Título de la propuesta */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="min-w-0">
                          <button
                            onClick={() => {
                              setEditingProposal(prop);
                              setIsModalOpen(true);
                            }}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left block line-clamp-2"
                          >
                            {prop.title}
                          </button>
                          {prop.notes && (
                            <span className="text-[10px] text-slate-400 line-clamp-1 italic mt-0.5">
                              {prop.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contacto & Cargo */}
                      <td className="py-3.5 px-4">
                        {prop.contact ? (
                          <div>
                            <Link
                              href={`/leads/${prop.contact.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 truncate"
                            >
                              <span>{prop.contact.name}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>

                            {prop.contact.jobTitle && (
                              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleBadge} mt-0.5`}>
                                {prop.contact.jobTitle}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sin contacto</span>
                        )}
                      </td>

                      {/* Empresa */}
                      <td className="py-3.5 px-4">
                        {prop.company || prop.contact?.company ? (
                          <Link
                            href={`/companies/${(prop.company || prop.contact?.company).id}`}
                            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-[150px]"
                          >
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate">{(prop.company || prop.contact?.company).name}</span>
                          </Link>
                        ) : prop.contact?.companyName ? (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{prop.contact.companyName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Directo</span>
                        )}
                      </td>

                      {/* Monto */}
                      <td className="py-3.5 px-4">
                        <span className={`text-sm font-black tracking-tight ${
                          won ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          ${(prop.amount || 0).toLocaleString()} USD
                        </span>
                      </td>

                      {/* Etapa Comercial */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${stageConf.badgeClass}`}>
                          {won && <CheckCircle2 className="w-3 h-3" />}
                          <span>{stageConf.label}</span>
                        </span>
                      </td>

                      {/* Vendedor */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-600 dark:text-slate-300">
                        {prop.assignedTo?.name?.split(' ')[0] || (
                          <span className="text-slate-400 italic">Libre</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {prop.contact?.phone && (
                            <WhatsAppButton
                              phone={prop.contact.phone}
                              contactName={prop.contact.name}
                              projectName={prop.title}
                              size="sm"
                            />
                          )}

                          {!won && (
                            <button
                              onClick={() => updateStage(prop.id, 'GANADO')}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/30 transition-colors"
                              title="Cerrar venta ganada"
                            >
                              ¡Ganada!
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingProposal(prop);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors"
                            title="Editar propuesta"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProposal(prop)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors"
                            title="Eliminar propuesta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedProposals.map((prop) => {
            const won = isWon(prop.stage);
            const stageConf = STAGES[prop.stage] || {
              label: prop.stage,
              badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
            };
            const roleBadge = getRoleBadgeStyle(prop.contact?.jobTitle);

            return (
              <div
                key={prop.id}
                className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between transition-all group shadow-sm hover:shadow-md ${
                  won
                    ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40'
                }`}
              >
                <div>
                  {/* Header: Title & Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        onClick={() => {
                          setEditingProposal(prop);
                          setIsModalOpen(true);
                        }}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left line-clamp-2"
                      >
                        {prop.title}
                      </button>

                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${stageConf.badgeClass}`}>
                          {won && <CheckCircle2 className="w-3 h-3" />}
                          <span>{stageConf.label}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-base font-black tracking-tight block ${
                        won ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        ${(prop.amount || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">USD</span>
                    </div>
                  </div>

                  {/* Contact & Company Info */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    {prop.contact && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <Link
                              href={`/leads/${prop.contact.id}`}
                              className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
                            >
                              {prop.contact.name}
                            </Link>
                            {prop.contact.jobTitle && (
                              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleBadge}`}>
                                {prop.contact.jobTitle}
                              </span>
                            )}
                          </div>
                        </div>

                        {prop.contact.phone && (
                          <WhatsAppButton
                            phone={prop.contact.phone}
                            contactName={prop.contact.name}
                            projectName={prop.title}
                            size="sm"
                          />
                        )}
                      </div>
                    )}

                    {(prop.company || prop.contact?.company || prop.contact?.companyName) && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {prop.company || prop.contact?.company ? (
                          <Link
                            href={`/companies/${(prop.company || prop.contact?.company).id}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline truncate font-medium"
                          >
                            {(prop.company || prop.contact?.company).name}
                          </Link>
                        ) : (
                          <span className="truncate">{prop.contact?.companyName}</span>
                        )}
                      </div>
                    )}

                    {prop.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl line-clamp-2 italic leading-relaxed">
                        {prop.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer: Advisor, Stage Button & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Vendedor: </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {prop.assignedTo?.name?.split(' ')[0] || 'Libre'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!won && (
                      <button
                        onClick={() => updateStage(prop.id, 'GANADO')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30 transition-colors"
                        title="Marcar como venta cerrada"
                      >
                        ¡Cerrar Venta!
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingProposal(prop);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors"
                      title="Editar propuesta"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteProposal(prop)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors"
                      title="Eliminar propuesta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Propuesta CRUD */}
      {currentUser && (
        <ProposalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchProposals}
          proposalToEdit={editingProposal}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
