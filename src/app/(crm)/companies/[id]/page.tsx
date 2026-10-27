'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Users,
  FileText,
  DollarSign,
  Plus,
  ExternalLink,
  Award,
  Sparkles,
  Calendar,
  Lock,
} from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';
import CompanyModal from '@/components/CompanyModal';
import LeadModal from '@/components/LeadModal';
import ProposalModal from '@/components/ProposalModal';
import { STAGES } from '@/lib/constants';
import { useSettings } from '@/lib/settingsContext';

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

export default function CompanyDetailPage() {
  const { formatMoney, formatOriginal, userCurrency } = useSettings();
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  const fetchCompany = () => {
    fetch(`/api/companies/${companyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.company) setCompany(data.company);
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

  useEffect(() => {
    fetchCompany();
    fetchUser();
  }, [companyId]);

  const handleDeleteCompany = async () => {
    if (!confirm(`¿Eliminar la empresa "${company.name}"? Los contactos y propuestas mantendrán su información sin la asociación a esta empresa.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/companies');
      } else {
        const d = await res.json();
        alert(d.error || 'Error al eliminar empresa');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-slate-500 text-sm">Empresa no encontrada.</p>
        <Link href="/companies" className="text-indigo-600 text-xs hover:underline">
          Volver al directorio de empresas
        </Link>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/companies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Directorio de Empresas</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition-all"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Editar Empresa</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleDeleteCompany}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 text-xs font-semibold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="w-8 h-8 text-indigo-500" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {company.name}
                </h1>
                {company.industry && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                    {company.industry}
                  </span>
                )}
              </div>

              {company.legalName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {company.legalName}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2.5 flex-wrap">
                {company.taxId && (
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    RTN: {company.taxId}
                  </span>
                )}

                {company.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {company.city}, {company.country || 'Honduras'}
                  </span>
                )}

                {company.website && (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{company.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}

                {company.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {company.phone}
                  </span>
                )}

                {company.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {company.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Contactos</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {company.contacts?.length || 0}
              </span>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-500/20 text-center min-w-[130px]">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Ventas Ganadas</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {formatMoney(company.metrics?.wonValue || 0, company.metrics?.currency)}
              </span>
            </div>
          </div>
        </div>

        {company.notes && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Perfil Institucional / Notas:
            </span>
            {company.notes}
          </div>
        )}
      </div>

      {/* Grid: Linked Contacts & Proposals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Linked Contacts / People (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Personas Vinculadas ({company.contacts?.length || 0})
              </h3>

              <button
                onClick={() => setIsPersonModalOpen(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                + Registrar Persona
              </button>
            </div>

            {company.contacts?.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                No hay personas asociadas a esta empresa aún.
              </p>
            ) : (
              <div className="space-y-3">
                {company.contacts.map((c: any) => {
                  const isOwner = c.canAccess ?? (currentUser?.role === 'ADMIN' || !c.assignedToId || c.assignedToId === currentUser?.id);
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
                            {isOwner ? (
                              c.avatarUrl ? (
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
                              )
                            ) : (
                              <Lock className="w-4 h-4 text-white" />
                            )}
                          </div>

                          <div>
                            {isOwner ? (
                              <Link
                                href={`/leads/${c.id}`}
                                className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1"
                              >
                                <span>{c.name}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            ) : (
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-default">
                                <span>{c.name}</span>
                                <Lock className="w-3 h-3 text-amber-500" />
                              </div>
                            )}
                            <div className="mt-1">
                              {c.jobTitle ? (
                                <span
                                  className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                                    c.jobTitle
                                  )} truncate max-w-[200px]`}
                                >
                                  {c.jobTitle}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Contacto directo</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isOwner && c.phone ? (
                          <WhatsAppButton
                            phone={c.phone}
                            contactName={c.name}
                            size="sm"
                          />
                        ) : !isOwner ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-500" />
                            Privado
                          </span>
                        ) : null}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                        {isOwner ? (
                          <span>{c.phone || 'Sin teléfono'}</span>
                        ) : (
                          <span className="italic text-slate-400 flex items-center gap-1 text-[10px]">
                            Teléfono y WhatsApp protegidos
                          </span>
                        )}
                        {c.assignedTo && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            Asesor: {c.assignedTo.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Proposals & Deals (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Historial de Propuestas & Ventas
              </h3>

              <button
                onClick={() => setIsProposalModalOpen(true)}
                className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                + Nueva Propuesta
              </button>
            </div>

            {company.proposals?.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No hay propuestas registradas con esta empresa.
              </p>
            ) : (
              <div className="space-y-3">
                {company.proposals.map((p: any) => {
                  const isWon = p.stage === 'GANADO' || p.stage === 'VENTA';
                  const stageConfig = STAGES[p.stage] || STAGES.PROPUESTA;

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isWon
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {p.title}
                          </span>
                          {p.contact && (
                            <Link
                              href={`/leads/${p.contact.id}`}
                              className="text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:underline inline-block mt-0.5"
                            >
                              Contacto: {p.contact.name}
                            </Link>
                          )}
                        </div>

                        <div className="text-right">
                          <span className={`text-sm font-black ${isWon ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                            {formatMoney(p.amount || 0, p.currency)}
                          </span>
                          {p.currency && p.currency !== userCurrency && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              Orig: {formatOriginal(p.amount || 0, p.currency)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${stageConfig?.badgeClass || ''}`}>
                          {stageConfig?.label || p.stage}
                        </span>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          {p.assignedTo && (
                            <span>Asesor: <strong>{p.assignedTo.name}</strong></span>
                          )}
                          {isWon && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              <Award className="w-3.5 h-3.5" />
                              <span>Venta Ganada</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Company Modal */}
      <CompanyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={fetchCompany}
        companyToEdit={company}
      />

      {/* Create Person in this Company */}
      {isPersonModalOpen && (
        <LeadModal
          isOpen={isPersonModalOpen}
          onClose={() => setIsPersonModalOpen(false)}
          onSaved={fetchCompany}
          currentUser={currentUser}
          defaultCompanyId={company.id}
          defaultCompanyName={company.name}
        />
      )}

      {/* Create Proposal for this Company */}
      {isProposalModalOpen && (
        <ProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          onSaved={fetchCompany}
          currentUser={currentUser}
          defaultContactId={company.contacts?.[0]?.id || null}
          defaultCompanyId={company.id}
        />
      )}
    </div>
  );
}
