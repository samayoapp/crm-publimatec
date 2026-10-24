'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Building,
  Clock,
  ExternalLink,
  MessageSquare,
  FileText,
  Award,
  UserPlus,
  Edit,
  Trash2,
  LayoutGrid,
  Table2,
  ArrowUpDown,
  Phone,
  Mail,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Filter,
  RotateCcw,
  X,
} from 'lucide-react';
import { PROPOSAL_STAGES } from '@/lib/constants';
import WhatsAppButton from '@/components/WhatsAppButton';
import LeadModal from '@/components/LeadModal';
import { getStalenessInfo, formatFriendlyDate, getDaysDiff } from '@/lib/timeUtils';

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

export default function ContactsListPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters, Sort & View Mode
  const [search, setSearch] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relation-desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<any | null>(null);

  const fetchContacts = () => {
    let url = '/api/contacts?';
    if (search) url += `search=${encodeURIComponent(search)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.contacts) setContacts(data.contacts);
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

  const handleDeleteContact = async (contact: any) => {
    if (!confirm(`¿Estás seguro de eliminar a "${contact.name}" y todo su historial de interacción?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('crm-contact-saved'));
        window.dispatchEvent(new CustomEvent('crm-proposal-saved'));
        fetchContacts();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar contacto');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchUser();

    const handleReload = () => fetchContacts();
    window.addEventListener('crm-contact-saved', handleReload);
    window.addEventListener('crm-lead-saved', handleReload);
    return () => {
      window.removeEventListener('crm-contact-saved', handleReload);
      window.removeEventListener('crm-lead-saved', handleReload);
    };
  }, [search]);

  // Helpers
  const hasPurchased = (c: any) =>
    c.proposals?.some((p: any) => p.stage === 'VENTA' || p.stage === 'GANADO');

  const getContactAmount = (c: any) =>
    c.proposals?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

  // Filtered & Sorted contacts
  const filteredAndSortedContacts = contacts
    .filter((c) => {
      if (buyerFilter === 'buyers') return hasPurchased(c);
      if (buyerFilter === 'prospects') return !hasPurchased(c);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'relation-desc') {
        // Mayor tiempo de relación (más antiguos primero)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'relation-asc') {
        // Más recientes primero
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'buyer-first') {
        // Clientes con compras ganadas primero
        const aBuy = hasPurchased(a) ? 1 : 0;
        const bBuy = hasPurchased(b) ? 1 : 0;
        if (bBuy !== aBuy) return bBuy - aBuy;
        return getContactAmount(b) - getContactAmount(a);
      }
      if (sortBy === 'pipeline-desc') {
        return getContactAmount(b) - getContactAmount(a);
      }
      if (sortBy === 'followup-asc') {
        if (!a.nextFollowUp && !b.nextFollowUp) return 0;
        if (!a.nextFollowUp) return 1;
        if (!b.nextFollowUp) return -1;
        return new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime();
      }
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

  // KPI Metrics
  const totalContacts = contacts.length;
  const totalBuyers = contacts.filter(hasPurchased).length;
  const totalInNegotiation = contacts.filter((c) => !hasPurchased(c) && (c.proposals?.length || 0) > 0).length;
  const totalPendingFollowups = contacts.filter((c) => c.nextFollowUp).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Directorio de Personas
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalContacts}
          </div>
          <span className="text-[10px] text-slate-400">Contactos en agenda</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Clientes con Compras
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalBuyers}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Han cerrado ventas
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            En Negociación
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {totalInNegotiation}
          </div>
          <span className="text-[10px] text-slate-400">Prospectos activos</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Seguimientos Activos
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalPendingFollowups}
          </div>
          <span className="text-[10px] text-slate-400">Fechas programadas</span>
        </div>
      </div>

      {/* Header, Search & Filter Toolbar */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors shadow-xs overflow-hidden">
        {/* Tier 1: Title, View Switcher & Primary Action */}
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Directorio de Personas & Clientes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Administra relaciones individuales, clasifica compradores o prospectos y gestiona sus seguimientos
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
                setContactToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Contacto</span>
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
                placeholder="Buscar persona, empresa, WhatsApp..."
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

            {/* Buyer Filter */}
            <div className="relative">
              <select
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium"
              >
                <option value="all">Todas las personas</option>
                <option value="buyers">🏆 Clientes (Ya compraron)</option>
                <option value="prospects">💼 En Negociación / Sin compra</option>
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
                <option value="relation-desc">🕒 Mayor Tiempo de Relación</option>
                <option value="relation-asc">🆕 Más Recientes (Nuevos)</option>
                <option value="buyer-first">🛍️ Ya Compraron Primero</option>
                <option value="pipeline-desc">💰 Mayor Monto Propuestas ($)</option>
                <option value="followup-asc">⏰ Próximo Seguimiento</option>
                <option value="name-asc">🔤 Nombre (A - Z)</option>
                <option value="name-desc">🔤 Nombre (Z - A)</option>
              </select>
            </div>

            {/* Reset filters button if active */}
            {(search || buyerFilter !== 'all' || sortBy !== 'relation-desc') && (
              <button
                onClick={() => {
                  setSearch('');
                  setBuyerFilter('all');
                  setSortBy('relation-desc');
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
          Cargando contactos...
        </div>
      ) : filteredAndSortedContacts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {contacts.length === 0 ? 'No hay contactos ni personas registradas' : 'No se encontraron contactos'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {contacts.length === 0
              ? 'Agrega a las personas clave, clientes o prospectos para iniciar el seguimiento comercial y vincularlos a empresas.'
              : 'Prueba cambiando los filtros o el término de búsqueda.'}
          </p>
          {contacts.length === 0 && (
            <button
              onClick={() => {
                setContactToEdit(null);
                setIsModalOpen(true);
              }}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Primera Persona</span>
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
                  <th className="py-3.5 px-4">Persona / Contacto</th>
                  <th className="py-3.5 px-4">Empresa & Cargo</th>
                  <th className="py-3.5 px-4">Tipo de Relación</th>
                  <th className="py-3.5 px-4">Última Conversación</th>
                  <th className="py-3.5 px-4">Propuestas / Negocios</th>
                  <th className="py-3.5 px-4">Próximo Seguimiento</th>
                  <th className="py-3.5 px-4">Vendedor</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {filteredAndSortedContacts.map((contact) => {
                  const latestAct = contact.activities?.[0];
                  const isOverdue =
                    contact.nextFollowUp &&
                    new Date(contact.nextFollowUp).getTime() < Date.now();
                  const isBuyer = hasPurchased(contact);
                  const roleStyle = getRoleBadgeStyle(contact.jobTitle);

                  return (
                    <tr
                      key={contact.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors group"
                    >
                      {/* Persona */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                            {contact.avatarUrl ? (
                              <img
                                src={contact.avatarUrl}
                                alt={contact.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              contact.name.charAt(0)
                            )}
                          </div>

                          <div className="min-w-0">
                            <Link
                              href={`/leads/${contact.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                            >
                              <span className="truncate">{contact.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </Link>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {contact.phone || contact.email || 'Sin teléfono'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Empresa & Cargo */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {contact.jobTitle && (
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleStyle}`}>
                              {contact.jobTitle}
                            </span>
                          )}

                          {contact.company ? (
                            <Link
                              href={`/companies/${contact.company.id}`}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                            >
                              <Building className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[150px]">{contact.company.name}</span>
                            </Link>
                          ) : contact.companyName ? (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{contact.companyName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Sin empresa</span>
                          )}
                        </div>
                      </td>

                      {/* Tipo de Relación (Cliente o Prospecto) */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isBuyer
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                        }`}>
                          {isBuyer ? '🏆 Cliente' : '💼 Prospecto'}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Desde {new Date(contact.createdAt).toLocaleDateString('es-HN', { month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Último Contacto & Inactividad */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {(() => {
                          const staleness = getStalenessInfo(contact.lastContactAt || contact.createdAt);
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${staleness.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${staleness.dotColor}`} />
                                  <span>{staleness.label}</span>
                                </span>
                              </div>
                              {latestAct ? (
                                <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                                    {latestAct.type === 'WHATSAPP' ? '💬 ' : latestAct.type === 'LLAMADA' ? '📞 ' : latestAct.type === 'VENTA_CERRADA' ? '🎉 ' : '📝 '}
                                  </span>
                                  {latestAct.description}
                                </div>
                              ) : contact.notes ? (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                                  {contact.notes}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">Sin actividades</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Propuestas / Negocios */}
                      <td className="py-3.5 px-4">
                        {contact.proposals?.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">Sin propuestas</span>
                        ) : (
                          <div className="space-y-1">
                            {contact.proposals.map((p: any) => {
                              const isWon = p.stage === 'VENTA' || p.stage === 'GANADO';
                              return (
                                <div key={p.id} className="flex items-center gap-1.5 text-[11px]">
                                  <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase ${
                                    isWon
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                      : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                  }`}>
                                    {isWon ? 'Venta' : 'Propuesta'}
                                  </span>
                                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                                    {p.title}
                                  </span>
                                  <span className="font-bold text-slate-600 dark:text-slate-400">
                                    (${p.amount?.toLocaleString()})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Próximo Seguimiento */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {contact.nextFollowUp ? (
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${
                              isOverdue
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>
                              {new Date(contact.nextFollowUp).toLocaleDateString('es-HN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No programado</span>
                        )}
                      </td>

                      {/* Asignado */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                        {contact.assignedTo?.name?.split(' ')[0] || (
                          <span className="text-slate-400 italic">Libre</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <WhatsAppButton
                            phone={contact.phone}
                            contactName={contact.name}
                            projectName={contact.companyName || ''}
                            size="sm"
                          />

                          <button
                            onClick={() => {
                              setContactToEdit(contact);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors"
                            title="Editar contacto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteContact(contact)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors"
                            title="Eliminar contacto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/leads/${contact.id}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                          >
                            Ver Ficha
                          </Link>
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
          {filteredAndSortedContacts.map((contact) => {
            const isBuyer = hasPurchased(contact);
            const latestAct = contact.activities?.[0];
            const isOverdue =
              contact.nextFollowUp &&
              new Date(contact.nextFollowUp).getTime() < Date.now();
            const totalAmount = getContactAmount(contact);
            const roleBadge = getRoleBadgeStyle(contact.jobTitle);

            return (
              <div
                key={contact.id}
                className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Header card with Avatar & Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt={contact.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          contact.name.charAt(0)
                        )}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/leads/${contact.id}`}
                          className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate block"
                        >
                          {contact.name}
                        </Link>

                        {contact.jobTitle && (
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleBadge} mt-0.5 truncate max-w-[170px]`}>
                            {contact.jobTitle}
                          </span>
                        )}

                        {(contact.company || contact.companyName) && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            {contact.company ? (
                              <Link
                                href={`/companies/${contact.company.id}`}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                              >
                                {contact.company.name}
                              </Link>
                            ) : (
                              <span className="truncate">{contact.companyName}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buyer badge & quick edit/delete */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isBuyer
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                      }`}>
                        {isBuyer ? '🏆 Cliente' : '💼 Prospecto'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setContactToEdit(contact);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors"
                          title="Editar contacto"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors"
                          title="Eliminar contacto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info & WhatsApp */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      {contact.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>

                    <WhatsAppButton
                      phone={contact.phone}
                      contactName={contact.name}
                      projectName={contact.companyName || ''}
                      size="sm"
                    />
                  </div>

                  {/* Proposals pill */}
                  <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {contact.proposals?.length || 0} Propuestas
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      ${totalAmount.toLocaleString()} USD
                    </span>
                  </div>

                  {/* Latest Activity & Staleness */}
                  <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {(() => {
                      const staleness = getStalenessInfo(contact.lastContactAt || contact.createdAt);
                      return (
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Última interacción:
                          </span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold border ${staleness.badgeClass}`}>
                            <span className={`w-1 h-1 rounded-full ${staleness.dotColor}`} />
                            <span>{staleness.shortLabel}</span>
                          </span>
                        </div>
                      );
                    })()}
                    {latestAct ? (
                      <p className="line-clamp-2 italic bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                        {latestAct.description}
                      </p>
                    ) : contact.notes ? (
                      <p className="line-clamp-2 italic">{contact.notes}</p>
                    ) : (
                      <span className="italic text-slate-400">Sin notas aún</span>
                    )}
                  </div>
                </div>

                {/* Footer: Followup & Assigned */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div>
                    {contact.nextFollowUp ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                        isOverdue
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {new Date(contact.nextFollowUp).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' })}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Sin seguimiento</span>
                    )}
                  </div>

                  <Link
                    href={`/leads/${contact.id}`}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors"
                  >
                    Ver Ficha
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal CRUD para Contactos */}
      {currentUser && (
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchContacts}
          leadToEdit={contactToEdit}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
