'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  Users,
  FileText,
  DollarSign,
  Globe,
  Phone,
  ExternalLink,
  MapPin,
  TrendingUp,
  Award,
  Edit,
  Trash2,
  UserPlus,
  LayoutGrid,
  Table2,
  ArrowUpDown,
  CheckCircle2,
  Filter,
  RotateCcw,
  X,
} from 'lucide-react';
import CompanyModal from '@/components/CompanyModal';
import LeadModal from '@/components/LeadModal';
import WhatsAppButton from '@/components/WhatsAppButton';

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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters, Sort & View Mode
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('pipeline-desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [selectedCompanyForPerson, setSelectedCompanyForPerson] = useState<any | null>(null);

  const fetchCompanies = () => {
    let url = '/api/companies?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (selectedIndustry) url += `industry=${encodeURIComponent(selectedIndustry)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.companies) setCompanies(data.companies);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchUser = () => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteCompany = async (comp: any) => {
    if (
      !confirm(
        `¿Eliminar la empresa "${comp.name}"? Los contactos y propuestas mantendrán su historial sin vincular a esta empresa.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/companies/${comp.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCompanies();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar empresa');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchCompanies();

    const handleReload = () => fetchCompanies();
    window.addEventListener('crm-contact-saved', handleReload);
    window.addEventListener('crm-lead-saved', handleReload);
    return () => {
      window.removeEventListener('crm-contact-saved', handleReload);
      window.removeEventListener('crm-lead-saved', handleReload);
    };
  }, [search, selectedIndustry]);

  // Aggregate stats
  const totalCompanies = companies.length;
  const totalLinkedContacts = companies.reduce((acc, curr) => acc + (curr.metrics?.contactsCount || 0), 0);
  const totalPipeline = companies.reduce((acc, curr) => acc + (curr.metrics?.pipelineValue || 0), 0);
  const totalWon = companies.reduce((acc, curr) => acc + (curr.metrics?.wonValue || 0), 0);

  // Available industries for filter
  const industries = Array.from(new Set(companies.map((c) => c.industry).filter(Boolean)));

  const filteredAndSortedCompanies = companies
    .filter((c) => {
      if (statusFilter === 'won') return (c.metrics?.wonValue || 0) > 0;
      if (statusFilter === 'active') return (c.metrics?.pipelineValue || 0) > 0;
      if (statusFilter === 'empty') {
        return (c.metrics?.wonValue || 0) === 0 && (c.metrics?.pipelineValue || 0) === 0;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'pipeline-desc') {
        return (b.metrics?.pipelineValue || 0) - (a.metrics?.pipelineValue || 0);
      }
      if (sortBy === 'pipeline-asc') {
        return (a.metrics?.pipelineValue || 0) - (b.metrics?.pipelineValue || 0);
      }
      if (sortBy === 'won-desc') {
        return (b.metrics?.wonValue || 0) - (a.metrics?.wonValue || 0);
      }
      if (sortBy === 'won-asc') {
        return (a.metrics?.wonValue || 0) - (b.metrics?.wonValue || 0);
      }
      if (sortBy === 'contacts-desc') {
        return (b.contacts?.length || 0) - (a.contacts?.length || 0);
      }
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Resumen Comercial de Cuentas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Empresas & Cuentas
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalCompanies}
          </div>
          <span className="text-[10px] text-slate-400">Entidades registradas</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Personas Asociadas
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {totalLinkedContacts}
          </div>
          <span className="text-[10px] text-slate-400">Contactos en empresas</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            En Negociación
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ${totalPipeline.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">USD en pipeline</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Ventas Cerradas
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalWon.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            USD acumulados
          </span>
        </div>
      </div>

      {/* Header, Search & Filter Toolbar */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors shadow-xs overflow-hidden">
        {/* Tier 1: Title, View Switcher & Primary Action */}
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Directorio Corporativo de Empresas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cuentas corporativas, personas vinculadas con sus cargos y análisis financiero de compras
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
                setEditingCompany(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Empresa</span>
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
                placeholder="Buscar empresa, RTN, ciudad..."
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
            <div className="hidden sm:block h-5 w-[1px] bg-slate-200 dark:bg-slate-750" />

            {/* Filter Section Header / Tag */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Filtros:
              </span>
            </div>

            {/* Industry Filter */}
            {industries.length > 0 && (
              <div className="relative">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium"
                >
                  <option value="">Todos los sectores</option>
                  {industries.map((ind: any) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium"
              >
                <option value="all">Todas las cuentas</option>
                <option value="won">🏆 Con Ventas Ganadas</option>
                <option value="active">💼 En Negociación</option>
                <option value="empty">⚪ Sin Movimiento</option>
              </select>
            </div>
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
                <option value="pipeline-desc">💰 Mayor Propuestas ($)</option>
                <option value="pipeline-asc">💵 Menor Propuestas ($)</option>
                <option value="won-desc">🏆 Mayor Ventas Ganadas ($)</option>
                <option value="won-asc">📉 Menor Ventas Ganadas ($)</option>
                <option value="contacts-desc">👥 Más Contactos</option>
                <option value="name-asc">🔤 Nombre (A - Z)</option>
                <option value="name-desc">🔤 Nombre (Z - A)</option>
              </select>
            </div>

            {/* Reset filters button if active */}
            {(search || selectedIndustry || statusFilter !== 'all' || sortBy !== 'pipeline-desc') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedIndustry('');
                  setStatusFilter('all');
                  setSortBy('pipeline-desc');
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

      {/* Content: Cards vs Table */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-400 text-xs border border-slate-200 dark:border-slate-800">
          Cargando empresas...
        </div>
      ) : filteredAndSortedCompanies.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {companies.length === 0 ? 'No hay empresas registradas' : 'No se encontraron empresas'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {companies.length === 0
              ? 'Comienza registrando la primera empresa o cuenta comercial para vincular sus contactos y propuestas.'
              : 'Prueba cambiando los filtros o el término de búsqueda.'}
          </p>
          {companies.length === 0 && (
            <button
              onClick={() => {
                setEditingCompany(null);
                setIsModalOpen(true);
              }}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Empresa</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/60 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Empresa / Cuenta</th>
                  <th className="py-3.5 px-4">RTN & Ubicación</th>
                  <th className="py-3.5 px-4">Personas & Cargos</th>
                  <th className="py-3.5 px-4">En Negociación</th>
                  <th className="py-3.5 px-4">Ventas Ganadas</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {filteredAndSortedCompanies.map((comp) => (
                  <tr
                    key={comp.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors group"
                  >
                    {/* Empresa Logo & Nombre */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                          {comp.logoUrl ? (
                            <img
                              src={comp.logoUrl}
                              alt={comp.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-indigo-500" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <Link
                            href={`/companies/${comp.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                          >
                            <span className="truncate">{comp.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>

                          {comp.industry && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/20">
                              {comp.industry}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* RTN & Ubicación */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                        {comp.taxId && (
                          <div className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                            {comp.taxId}
                          </div>
                        )}
                        {comp.city && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{comp.city}, {comp.country || 'Honduras'}</span>
                          </div>
                        )}
                        {comp.website && (
                          <a
                            href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline block truncate max-w-[150px]"
                          >
                            {comp.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Personas & Cargos */}
                    <td className="py-3.5 px-4">
                      {comp.contacts?.length === 0 ? (
                        <button
                          onClick={() => {
                            setSelectedCompanyForPerson(comp);
                            setIsPersonModalOpen(true);
                          }}
                          className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 italic flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ Vincular persona</span>
                        </button>
                      ) : (
                        <div className="space-y-1.5 max-w-sm">
                          {comp.contacts.map((c: any) => {
                            const badgeStyle = getRoleBadgeStyle(c.jobTitle);
                            return (
                              <div key={c.id} className="flex items-center gap-2">
                                <Link
                                  href={`/leads/${c.id}`}
                                  className="font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[130px]"
                                >
                                  {c.name}
                                </Link>
                                {c.jobTitle && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeStyle} shrink-0`}>
                                    {c.jobTitle}
                                  </span>
                                )}
                                {c.phone && (
                                  <WhatsAppButton
                                    phone={c.phone}
                                    contactName={c.name}
                                    projectName={comp.name}
                                    size="sm"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* En Negociación */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          ${(comp.metrics?.pipelineValue || 0).toLocaleString()} USD
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {comp.metrics?.activeProposalsCount || 0} en proceso
                        </span>
                      </div>
                    </td>

                    {/* Ventas Ganadas */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className={`text-xs font-extrabold ${
                          (comp.metrics?.wonValue || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                          ${(comp.metrics?.wonValue || 0).toLocaleString()} USD
                        </span>
                        {(comp.metrics?.wonProposalsCount || 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {comp.metrics?.wonProposalsCount} compras cerradas
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCompanyForPerson(comp);
                            setIsPersonModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors"
                          title="Vincular nueva persona"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingCompany(comp);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors"
                          title="Editar empresa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCompany(comp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors"
                          title="Eliminar empresa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/companies/${comp.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
                        >
                          Ver Ficha
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Companies Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedCompanies.map((comp) => (
            <div
              key={comp.id}
              className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
            >
              <div>
                {/* Header card with Logo & Name */}
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                    {comp.logoUrl ? (
                      <img
                        src={comp.logoUrl}
                        alt={comp.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-indigo-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/companies/${comp.id}`}
                        className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 truncate"
                      >
                        <span className="truncate">{comp.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </Link>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingCompany(comp);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors"
                          title="Editar empresa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(comp)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors"
                          title="Eliminar empresa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {comp.industry && (
                      <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/20">
                        {comp.industry}
                      </span>
                    )}

                    {comp.city && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{comp.city}, {comp.country || 'Honduras'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="mt-3.5 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {comp.taxId && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">RTN:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{comp.taxId}</span>
                    </div>
                  )}

                  {comp.website && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                      <a
                        href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                      >
                        {comp.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {/* Personas Vinculadas / Contactos Clave */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 tracking-wider">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Personas Vinculadas ({comp.contacts?.length || 0})</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCompanyForPerson(comp);
                          setIsPersonModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        title="Vincular nuevo contacto a esta empresa"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Persona</span>
                      </button>
                    </div>

                    {comp.contacts?.length === 0 ? (
                      <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-center">
                        <p className="text-[11px] text-slate-400 mb-1.5">No hay personas vinculadas aún</p>
                        <button
                          onClick={() => {
                            setSelectedCompanyForPerson(comp);
                            setIsPersonModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold border border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Vincular Persona</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {comp.contacts.map((c: any) => {
                          const badgeStyle = getRoleBadgeStyle(c.jobTitle);
                          return (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all group/person"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden border border-white/20 shadow-xs">
                                  {c.avatarUrl ? (
                                    <img
                                      src={c.avatarUrl}
                                      alt={c.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    c.name.charAt(0)
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <Link
                                    href={`/leads/${c.id}`}
                                    className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 truncate"
                                  >
                                    <span className="truncate">{c.name}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/person:opacity-100 transition-opacity shrink-0" />
                                  </Link>

                                  <div className="mt-0.5">
                                    {c.jobTitle ? (
                                      <span
                                        className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeStyle} truncate max-w-[190px]`}
                                      >
                                        {c.jobTitle}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">Contacto directo</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {c.phone && (
                                  <WhatsAppButton
                                    phone={c.phone}
                                    contactName={c.name}
                                    projectName={comp.name}
                                    size="sm"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Metrics Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-200 dark:border-slate-800/80">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Propuestas</div>
                  <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    ${comp.metrics?.pipelineValue.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-200 dark:border-slate-800/80">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Ventas Ganadas</div>
                  <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${comp.metrics?.wonValue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Company */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchCompanies}
        companyToEdit={editingCompany}
      />

      {/* Modal Vincular Persona / Contacto a Empresa */}
      {currentUser && (
        <LeadModal
          isOpen={isPersonModalOpen}
          onClose={() => {
            setIsPersonModalOpen(false);
            setSelectedCompanyForPerson(null);
          }}
          onSaved={fetchCompanies}
          currentUser={currentUser}
          defaultCompanyId={selectedCompanyForPerson?.id}
          defaultCompanyName={selectedCompanyForPerson?.name}
        />
      )}
    </div>
  );
}
