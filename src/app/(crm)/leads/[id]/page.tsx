'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  User,
  Calendar,
  Clock,
  Edit,
  Trash2,
  MessageSquare,
  FileText,
  TrendingUp,
  Plus,
  Award,
  CheckCircle2,
  Lock,
  Shield,
  Paperclip,
} from 'lucide-react';
import { STAGES, PROPOSAL_STAGES } from '@/lib/constants';
import WhatsAppButton from '@/components/WhatsAppButton';
import ActivityModal from '@/components/ActivityModal';
import ScheduleModal from '@/components/ScheduleModal';
import LeadModal from '@/components/LeadModal';
import ProposalModal from '@/components/ProposalModal';
import { getStalenessInfo, formatFriendlyDate, formatFriendlyDateTime, getDaysDiff } from '@/lib/timeUtils';
import { useSettings } from '@/lib/settingsContext';

export default function ContactDetailPage() {
  const { currency, formatMoney } = useSettings();
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictedContact, setRestrictedContact] = useState<any>(null);

  // Modals
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any | null>(null);

  const fetchContact = () => {
    fetch(`/api/contacts/${contactId}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 403 && data.restricted) {
          setIsRestricted(true);
          setRestrictedContact(data.contact);
          setLoading(false);
          return;
        }
        if (data.contact) {
          setContact(data.contact);
          setIsRestricted(false);
        }
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
    fetchContact();
    fetchUser();
  }, [contactId]);

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este contacto y todo su historial?')) {
      return;
    }

    try {
      const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/leads');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProposalStage = async (propId: string, newStage: string) => {
    try {
      await fetch(`/api/proposals/${propId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      fetchContact();
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

  if (isRestricted) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/10">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Contacto Privado
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Este prospecto <strong>({restrictedContact?.name})</strong> pertenece a la cartera comercial de{' '}
          <strong className="text-indigo-600 dark:text-indigo-400">
            {restrictedContact?.assignedTo?.name || 'otro asesor'}
          </strong>.
        </p>
        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 text-left space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Política de Privacidad Comercial:</span>
          </div>
          <p className="text-[11px] leading-normal text-amber-800/90 dark:text-amber-300/90">
            Por protección de cartera, el número de teléfono, enlace directo a WhatsApp y el historial de cotizaciones solo están disponibles para el asesor asignado y la Dirección Comercial.
          </p>
        </div>
        <div className="pt-3 flex items-center justify-center gap-2.5">
          <Link
            href="/companies"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Ver Empresas
          </Link>
          <Link
            href="/leads"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
          >
            Mis Prospectos
          </Link>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contacto no encontrado</h2>
        <Link href="/leads" className="text-indigo-600 dark:text-indigo-400 text-xs hover:underline mt-2 inline-block">
          Volver a la lista de contactos
        </Link>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'LLAMADA':
        return <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'REUNION':
        return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'CORREO':
        return <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'VENTA_CERRADA':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'CAMBIO_ETAPA':
        return <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Directorio de Contactos</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditContactModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
          >
            <Edit className="w-3.5 h-3.5 text-slate-400" />
            <span>Editar Contacto</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 transition-colors"
            title="Eliminar contacto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Contact Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0 overflow-hidden border border-white/20">
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
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {contact.name}
              </h1>
              {contact.jobTitle && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {contact.jobTitle}
                </span>
              )}
            </div>

            {contact.company ? (
              <Link
                href={`/companies/${contact.company.id}`}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 flex items-center gap-1.5 font-semibold"
              >
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                <span>{contact.company.name}</span>
                {contact.company.industry && (
                  <span className="text-[10px] text-slate-400 font-normal">({contact.company.industry})</span>
                )}
              </Link>
            ) : contact.companyName ? (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{contact.companyName}</span>
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
              {contact.phone && (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  📞 {contact.phone}
                </span>
              )}
              {contact.email && <span>✉️ {contact.email}</span>}
              {!contact.phone && !contact.email && (
                <span className="text-slate-400 italic">Sin datos directos de contacto</span>
              )}
              {contact.assignedTo && (
                <span>👤 Vendedor: <strong className="text-slate-800 dark:text-slate-200">{contact.assignedTo.name}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <WhatsAppButton
            phone={contact.phone}
            contactName={contact.name}
            projectName={contact.companyName || ''}
            advisorName={currentUser?.name}
            size="md"
          />

          <button
            onClick={() => {
              setEditingProposal(null);
              setIsProposalModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Propuesta</span>
          </button>

          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            title="Registrar una interacción efectuada con este cliente"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Registrar Contacto</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Seguimiento & Propuestas */}
        <div className="space-y-4 md:col-span-1">
          {/* Medición del Tiempo & Viaje del Cliente */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Viaje Comercial & Tiempos</span>
              </h3>
              <Link
                href="/calendar"
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Ver Agenda →
              </Link>
            </div>

            {(() => {
              const staleness = getStalenessInfo(contact.lastContactAt || contact.createdAt);
              const daysInJourney = getDaysDiff(contact.firstContactAt || contact.createdAt);

              return (
                <div className="space-y-2.5 text-xs">
                  {/* Semáforo de Actividad */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Estado de Respuesta:</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[10px] border ${staleness.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${staleness.dotColor}`} />
                      <span>{staleness.label}</span>
                    </span>
                  </div>

                  {/* Primer Contacto */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-slate-500 dark:text-slate-400">Primer Contacto:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatFriendlyDate(contact.firstContactAt || contact.createdAt)}
                    </span>
                  </div>

                  {/* Duración en el embudo */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-slate-500 dark:text-slate-400">Tiempo en el Embudo:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {daysInJourney === 0 ? 'Inició hoy' : `${daysInJourney} días de viaje`}
                    </span>
                  </div>

                  {/* Última interacción */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-slate-500 dark:text-slate-400">Última Interacción:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatFriendlyDateTime(contact.lastContactAt || contact.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Próximo contacto / Seguimiento */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Próximo Seguimiento</span>
              </h3>
              {contact.nextFollowUp && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Agendado
                </span>
              )}
            </div>

            {contact.nextFollowUp ? (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/20 space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {new Date(contact.nextFollowUp).toLocaleDateString('es-HN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    {contact.nextFollowUpTask || 'Llamada o mensaje de seguimiento'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors text-center"
                  >
                    Reprogramar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(true)}
                    className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition-all text-center"
                    title="Registrar llamada efectuada con este cliente"
                  >
                    Registrar Resultado
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-400 italic">
                  Sin seguimiento programado con este cliente.
                </p>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Programar Llamada</span>
                </button>
              </div>
            )}
          </div>

          {/* Propuestas & Ventas Vinculadas */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500" />
                Propuestas & Ventas
              </h3>
              <button
                onClick={() => {
                  setEditingProposal(null);
                  setIsProposalModalOpen(true);
                }}
                className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                + Cotizar
              </button>
            </div>

            {contact.proposals?.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No hay propuestas activas aún para este cliente.
              </p>
            ) : (
              <div className="space-y-2.5">
                {contact.proposals.map((p: any) => {
                  const isWon = p.stage === 'GANADO' || p.stage === 'VENTA';
                  const stageConfig = STAGES[p.stage] || STAGES.PROPUESTA;

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isWon
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {p.title}
                        </span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className={`text-xs font-extrabold ${isWon ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                            {formatMoney(p.amount || 0, p.currency)}
                          </span>
                          {p.currency && p.currency !== currency && (
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                              Orig: {p.currency === 'USD' ? '$' : p.currency === 'EUR' ? '€' : 'L'} {(p.amount || 0).toLocaleString('es-HN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProposal(p);
                            setIsProposalModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors"
                        >
                          <Paperclip className="w-3 h-3 text-indigo-500" />
                          <span>
                            {p.documents && p.documents.length > 0
                              ? `${p.documents.length} doc${p.documents.length > 1 ? 's' : ''}`
                              : 'Adjuntar PDF/PPT'}
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${stageConfig.badgeClass}`}>
                            {stageConfig.label}
                          </span>

                          {!isWon && (
                            <button
                              onClick={() => handleUpdateProposalStage(p.id, 'GANADO')}
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>¡Cerrar!</span>
                            </button>
                          )}

                          {isWon && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              <Award className="w-3.5 h-3.5" />
                              <span>Ganada</span>
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

          {/* Notas Generales */}
          {contact.notes && (
            <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-1.5 transition-colors">
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Antecedentes / Notas
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {contact.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Conversaciones & Bitácora */}
        <div className="md:col-span-2">
          <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Historial de Conversaciones & Acuerdos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Todo lo que se ha hablado con {contact.name}
                </p>
              </div>

              <button
                onClick={() => setIsActivityModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold transition-colors"
              >
                + Registrar Contacto
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-3.5 mt-4">
              {contact.activities?.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Aún no hay conversaciones registradas con este contacto.
                </div>
              ) : (
                contact.activities?.map((act: any) => (
                  <div
                    key={act.id}
                    className={`p-3.5 rounded-xl border transition-colors shadow-sm ${
                      act.type === 'VENTA_CERRADA'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getActivityIcon(act.type)}
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {act.user?.name || 'Vendedor'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.createdAt).toLocaleDateString('es-HN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mt-1 pl-6">
                      {act.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Modal (Interacciones Efectuadas / Pasadas) */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSaved={fetchContact}
        leadId={contact.id}
        leadTitle={contact.name + (contact.companyName ? ' (' + contact.companyName + ')' : '')}
      />

      {/* Schedule Modal (Agendar Próxima Llamada a Futuro) */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSaved={fetchContact}
        leadId={contact.id}
        leadTitle={contact.name + (contact.companyName ? ' (' + contact.companyName + ')' : '')}
        currentFollowUp={contact.nextFollowUp}
        currentFollowUpTask={contact.nextFollowUpTask}
      />

      {/* Edit Contact Modal */}
      <LeadModal
        isOpen={isEditContactModalOpen}
        onClose={() => setIsEditContactModalOpen(false)}
        onSaved={fetchContact}
        leadToEdit={contact}
        currentUser={currentUser || { id: '', name: '', role: 'ADMIN' }}
      />

      {/* Proposal Modal */}
      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onSaved={fetchContact}
        proposalToEdit={editingProposal}
        defaultContactId={contact.id}
        currentUser={currentUser || { id: '', name: '', role: 'ADMIN' }}
      />
    </div>
  );
}
