'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Phone,
  PhoneCall,
  FileText,
  Send,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  ChevronRight,
  Plus,
  TrendingUp,
  Sparkles,
  CalendarDays,
  ExternalLink,
  MessageSquare,
  History,
  X,
  Zap,
  ShieldAlert,
  UserCheck,
  Mail,
} from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';
import LeadModal from '@/components/LeadModal';
import { formatFriendlyDate } from '@/lib/timeUtils';
import { useSettings } from '@/lib/settingsContext';

export default function DashboardPage() {
  const { currency, currencySymbol, formatMoney } = useSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);

  // Quick Action Modals State
  const [callModalContact, setCallModalContact] = useState<any>(null);
  const [callChannel, setCallChannel] = useState<'LLAMADA' | 'WHATSAPP' | 'CORREO' | 'REUNION'>('LLAMADA');
  const [callOutcome, setCallOutcome] = useState('CONVERSACION');
  const [callNotes, setCallNotes] = useState('');
  const [callNextDate, setCallNextDate] = useState('');
  const [callNextTask, setCallNextTask] = useState('');
  const [savingCall, setSavingCall] = useState(false);

  const [proposalModalContact, setProposalModalContact] = useState<any>(null);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalAmount, setProposalAmount] = useState('1500');
  const [proposalNotes, setProposalNotes] = useState('');
  const [savingProposal, setSavingProposal] = useState(false);

  const [discardModalContact, setDiscardModalContact] = useState<any>(null);
  const [discardReason, setDiscardReason] = useState('POSPONER');
  const [savingDiscard, setSavingDiscard] = useState(false);

  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

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

    const handleReload = () => {
      fetchDashboard();
    };
    window.addEventListener('crm-lead-saved', handleReload);
    window.addEventListener('crm-proposal-saved', handleReload);
    window.addEventListener('crm-user-approved', handleReload);
    window.addEventListener('crm-settings-updated', handleReload);
    return () => {
      window.removeEventListener('crm-lead-saved', handleReload);
      window.removeEventListener('crm-proposal-saved', handleReload);
      window.removeEventListener('crm-user-approved', handleReload);
      window.removeEventListener('crm-settings-updated', handleReload);
    };
  }, []);

  // Quick Action 1: Guardar Llamada o Mensaje
  const handleSaveCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callModalContact) return;

    setSavingCall(true);
    try {
      const isNoAnswer = callOutcome === 'NO_CONTESTO';

      const outcomeText =
        callOutcome === 'CONVERSACION'
          ? 'Contestó / Conversación Productiva / Interesado'
          : callOutcome === 'NO_CONTESTO'
          ? 'No contestó / Dejé mensaje de voz o WhatsApp (En lista de espera para reintento mañana)'
          : callOutcome === 'VOLVER_A_LLAMAR'
          ? 'Solicitó contactar en otro horario'
          : callOutcome === 'MENSAJE_ENVIADO'
          ? 'Mensaje o presentación enviada'
          : 'Reunión o presentación acordada';

      const channelLabel =
        callChannel === 'WHATSAPP'
          ? 'WhatsApp'
          : callChannel === 'CORREO'
          ? 'Correo'
          : callChannel === 'REUNION'
          ? 'Reunión'
          : 'Llamada';

      const fullDescription = callNotes.trim()
        ? `[${channelLabel}] ${outcomeText}. Detalle: ${callNotes.trim()}`
        : `[${channelLabel}] ${outcomeText}`;

      // Si fue "No contestó" y no se indicó fecha manual:
      // Se programa automáticamente para MAÑANA a las 8:00 AM (al pasar las 12 de la noche entrará a LLAMAR HOY)
      let finalNextDate: string | null = null;
      let finalNextTask: string | null = null;

      if (callNextDate) {
        finalNextDate = new Date(callNextDate).toISOString();
        if (callOutcome === 'REUNION') {
          const t = callNextTask.trim() || 'Reunión acordada con el cliente';
          finalNextTask = t.toLowerCase().includes('reunión') || t.toLowerCase().includes('reunion')
            ? t
            : `[Reunión] ${t}`;
        } else {
          finalNextTask = callNextTask.trim() || 'Seguimiento programado';
        }
      } else if (isNoAnswer) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        finalNextDate = tomorrow.toISOString();
        finalNextTask = 'Reintento: No contestó hoy - Volver a llamar mañana';
      }

      const payload: any = {
        type: callChannel || 'LLAMADA',
        description: fullDescription,
        nextFollowUp: finalNextDate,
        nextFollowUpTask: finalNextTask,
      };

      const res = await fetch(`/api/contacts/${callModalContact.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al registrar actividad');

      // Asegurar que el contacto se actualice directamente
      await fetch(`/api/contacts/${callModalContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUp: finalNextDate,
          nextFollowUpTask: finalNextTask,
        }),
      });

      // Optimistic update on dashboard: si no contestó, pasa a lista de espera; si fue exitoso, sale de la lista
      setData((prev: any) => {
        if (!prev) return prev;
        const updatedPending = (prev.pendingFollowUps || []).filter((c: any) => c.id !== callModalContact.id);
        const updatedWaiting = isNoAnswer && !callNextDate
          ? [
              {
                ...callModalContact,
                nextFollowUp: finalNextDate,
                nextFollowUpTask: finalNextTask,
              },
              ...(prev.waitingListFollowUps || []).filter((c: any) => c.id !== callModalContact.id),
            ]
          : (prev.waitingListFollowUps || []).filter((c: any) => c.id !== callModalContact.id);

        return {
          ...prev,
          pendingFollowUps: updatedPending,
          waitingListFollowUps: updatedWaiting,
          summary: {
            ...prev.summary,
            pendingFollowUpsCount: updatedPending.length,
            waitingListCount: updatedWaiting.length,
          },
        };
      });

      setCallModalContact(null);
      setCallNotes('');
      setCallNextDate('');
      setCallNextTask('');

      if (isNoAnswer && !callNextDate) {
        setActionSuccessMsg(`⏳ ${callModalContact.name} puesto en LISTA DE ESPERA para mañana. Volverá a LLAMAR HOY al pasar las 12:00 AM.`);
      } else if (finalNextDate) {
        setActionSuccessMsg(`🗓️ Seguimiento agendado para ${callModalContact.name}`);
      } else {
        setActionSuccessMsg(`✅ ${channelLabel} registrada con ${callModalContact.name} (removido de llamadas pendientes de hoy)`);
      }

      setTimeout(() => setActionSuccessMsg(null), 5000);
      window.dispatchEvent(new CustomEvent('crm-lead-saved'));
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Error al guardar actividad');
    } finally {
      setSavingCall(false);
    }
  };

  // Quick Action 2: Avanzar a Propuesta
  const handleAdvanceProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalModalContact) return;

    setSavingProposal(true);
    try {
      const existingProposal = proposalModalContact.proposals?.[0];

      if (existingProposal) {
        // Actualizar propuesta existente a etapa PROPUESTA
        const res = await fetch(`/api/proposals/${existingProposal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: 'PROPUESTA',
            amount: parseFloat(proposalAmount) || existingProposal.amount,
            currency: currency || 'HNL',
            notes: proposalNotes ? `${existingProposal.notes || ''}\n${proposalNotes}`.trim() : existingProposal.notes,
          }),
        });
        if (!res.ok) throw new Error('Error al actualizar propuesta');
      } else {
        // Crear nueva propuesta en etapa PROPUESTA
        const res = await fetch('/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: proposalTitle.trim() || `Propuesta Comercial - ${proposalModalContact.companyName || proposalModalContact.name}`,
            amount: parseFloat(proposalAmount) || 0,
            currency: currency || 'HNL',
            stage: 'PROPUESTA',
            contactId: proposalModalContact.id,
            companyId: proposalModalContact.company?.id || proposalModalContact.companyId || null,
            notes: proposalNotes.trim() || null,
          }),
        });
        if (!res.ok) throw new Error('Error al crear propuesta');
      }

      // Registrar actividad automática de avance de propuesta sin borrar reuniones o citas agendadas
      await fetch(`/api/contacts/${proposalModalContact.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CAMBIO_ETAPA',
          description: `Oportunidad avanzada a etapa de PROPUESTA ENVIADA por un monto de ${formatMoney(parseFloat(proposalAmount || '0'))}.`,
        }),
      });

      // Despeje optimista inmediato de la lista del dashboard
      setData((prev: any) => {
        if (!prev) return prev;
        const updated = (prev.pendingFollowUps || []).filter((c: any) => c.id !== proposalModalContact.id);
        return {
          ...prev,
          pendingFollowUps: updated,
          summary: {
            ...prev.summary,
            pendingFollowUpsCount: updated.length,
          },
        };
      });

      setProposalModalContact(null);
      setProposalTitle('');
      setProposalAmount('1500');
      setProposalNotes('');
      setActionSuccessMsg(`🚀 Oportunidad de ${proposalModalContact.name} avanzada a PROPUESTA (removido de llamadas pendientes)`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      window.dispatchEvent(new CustomEvent('crm-proposal-saved'));
      window.dispatchEvent(new CustomEvent('crm-lead-saved'));
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Error al avanzar a propuesta');
    } finally {
      setSavingProposal(false);
    }
  };

  // Quick Action 3: Descartar
  // Quick Action: Aprobar o Rechazar Vendedor (Solo Director)
  const handleApproveUser = async (userId: string, approved: boolean) => {
    setApprovingUserId(userId);
    try {
      const res = await fetch('/api/team/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approved }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al procesar solicitud');

      setActionSuccessMsg(
        approved
          ? '✅ Ejecutivo aprobado exitosamente. Se le ha enviado un correo con su confirmación de acceso.'
          : 'Solicitud de registro rechazada.'
      );
      setTimeout(() => setActionSuccessMsg(null), 5000);

      window.dispatchEvent(new CustomEvent('crm-notification-update'));
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Error al procesar la aprobación');
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleDiscard = async () => {
    if (!discardModalContact) return;

    setSavingDiscard(true);
    try {
      if (discardReason === 'POSPONER') {
        // Posponer 7 días adelante
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await fetch(`/api/contacts/${discardModalContact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nextFollowUp: nextWeek.toISOString(),
            nextFollowUpTask: 'Seguimiento pospuesto para próxima semana',
          }),
        });
        await fetch(`/api/contacts/${discardModalContact.id}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NOTA',
            description: 'Contacto pospuesto 7 días por el asesor comercial.',
          }),
        });
        setActionSuccessMsg(`🗓️ Contacto de ${discardModalContact.name} pospuesto 7 días`);
      } else {
        // Descartar definitivamente (quitar seguimiento y cerrar propuesta perdida)
        await fetch(`/api/contacts/${discardModalContact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nextFollowUp: null,
            nextFollowUpTask: 'Descartado / Sin seguimiento',
          }),
        });

        if (discardModalContact.proposals?.[0]) {
          await fetch(`/api/proposals/${discardModalContact.proposals[0].id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: 'PERDIDO' }),
          });
        }

        await fetch(`/api/contacts/${discardModalContact.id}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NOTA',
            description: 'Contacto descartado de los seguimientos activos por el asesor.',
          }),
        });
        setActionSuccessMsg(`🗑️ Contacto ${discardModalContact.name} marcado como descartado`);
      }

      setDiscardModalContact(null);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Error al descartar contacto');
    } finally {
      setSavingDiscard(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cargando flujo de trabajo diario de PUBLIMATEC CRM...
          </p>
        </div>
      </div>
    );
  }

  const { summary, pendingFollowUps = [], waitingListFollowUps = [], recentActivities = [] } = data || {};

  // Formato Condicional de Urgencia
  const hasUrgentFollowUps = pendingFollowUps.length > 0;
  const overdueFollowUps = pendingFollowUps.filter(
    (l: any) => l.nextFollowUp && new Date(l.nextFollowUp).getTime() < Date.now()
  );
  const isOverdue = overdueFollowUps.length > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-2xl border border-slate-700/50 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Superior — Saludo & Enlace a Reportes */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>¡Hola, {data?.currentUser?.name?.split(' ')[0] || 'Asesor'}!</span>
            <span className="text-xl animate-pulse">👋</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Flujo de trabajo de acción diaria • Tu objetivo es vaciar la lista de seguimientos de hoy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Link
            href="/reports"
            className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            title="Ver métricas de ciclo de ventas y velocidad comercial"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Reportes Gerenciales</span>
          </Link>

          <button
            id="btn-new-prospect-dashboard"
            type="button"
            onClick={() => setIsLeadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer ring-2 ring-indigo-400/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ NUEVO PROSPECTO</span>
          </button>
        </div>
      </div>

      {/* NOTIFICACIÓN / ALERTA DE DIRECCIÓN: SOLICITUDES DE VENDEDORES PENDIENTES */}
      {data?.currentUser?.role === 'ADMIN' && data?.pendingApprovalUsers?.length > 0 && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-purple-500/10 border-2 border-amber-500/50 shadow-xl shadow-amber-500/10 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Solicitudes de Vendedores Pendientes de Aprobación</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
                    {data.pendingApprovalUsers.length} PENDIENTE{data.pendingApprovalUsers.length > 1 ? 'S' : ''}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Nuevos ejecutivos comerciales esperando tu autorización para acceder y comenzar a cotizar
                </p>
              </div>
            </div>

            <Link
              href="/team"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Ver Equipo Comercial</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.pendingApprovalUsers.map((userApp: any) => (
              <div
                key={userApp.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-amber-300 dark:border-amber-800/80 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {userApp.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {userApp.email} • {userApp.phone || 'Sin WhatsApp'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                      {userApp.jobTitle || 'Ejecutivo de Ventas'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Registrado {formatFriendlyDate(userApp.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={approvingUserId === userApp.id}
                    onClick={() => handleApproveUser(userApp.id, true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{approvingUserId === userApp.id ? 'Aprobando...' : 'Aprobar Acceso'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={approvingUserId === userApp.id}
                    onClick={() => handleApproveUser(userApp.id, false)}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. TARJETAS DE RESUMEN SUPERIORES CON FORMATO CONDICIONAL DE URGENCIA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Tarjeta 1: SEGUIMIENTOS PENDIENTES (FORMATO CONDICIONAL ROJO VIBRANTE) */}
        {hasUrgentFollowUps ? (
          <div className="relative rounded-2xl p-4 transition-all border-2 border-rose-500 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/40 dark:via-rose-950/20 shadow-lg shadow-rose-500/15 ring-4 ring-rose-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                <span>Seguimientos</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                {isOverdue ? `¡${overdueFollowUps.length} VENCIDOS!` : '¡HOY!'}
              </span>
            </div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 flex items-baseline gap-1.5">
              <span>{pendingFollowUps.length}</span>
              <span className="text-xs font-bold text-rose-500 uppercase tracking-tight">
                por llamar
              </span>
            </div>
            <span className="text-[10px] text-rose-600/90 dark:text-rose-400 font-semibold block mt-1">
              {isOverdue ? '⚠️ Bloquea la inacción: atiende los vencidos' : '🎯 Contactos esperando tu llamada'}
            </span>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Seguimientos
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                Al día
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              0
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Sin llamadas pendientes por hoy</span>
          </div>
        )}

        {/* Tarjeta 2: RELACIONES EN CURSO */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Relaciones en Curso
          </span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {summary?.activeCount || 0}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Prospectos activos en embudo</span>
        </div>

        {/* Tarjeta 3: EN NEGOCIACIÓN */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            En Negociación
          </span>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1 truncate">
            {formatMoney(summary?.pipelineValue || 0)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">{currency} en juego en cotizaciones</span>
        </div>

        {/* Tarjeta 4: CERRADOS GANADOS */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Cerrados Ganados
          </span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {summary?.wonCount || 0}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1 truncate">
            {formatMoney(summary?.wonSalesValue ?? summary?.wonValue ?? 0)} cerrados
          </span>
        </div>
      </div>

      {/* 2. PROTAGONISMO A LA ACCIÓN (BLOQUE CENTRAL DOMINANTE) */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        {/* Header del Bloque Central */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Personas con las que hay que hablar hoy</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    hasUrgentFollowUps
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
                  }`}>
                    {pendingFollowUps.length} {pendingFollowUps.length === 1 ? 'pendiente' : 'pendientes'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ejecuta acciones rápidas directamente sin tener que abrir cada perfil individual
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/calendar"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Ver Calendario</span>
            </Link>

            <Link
              href="/leads"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Todos los Contactos
            </Link>
          </div>
        </div>

        {/* Lista de Filas de Contacto con Botones de Acción Rápida */}
        <div className="space-y-3 pt-1">
          {pendingFollowUps.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-800 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ¡Excelente trabajo! No tienes seguimientos pendientes por hoy.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Tu lista de llamadas está en cero. Puedes explorar nuevos prospectos o revisar el embudo de ventas.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href="/leads"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
                >
                  Buscar Nuevos Contactos
                </Link>
                <Link
                  href="/pipeline"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all border border-slate-300 dark:border-slate-700"
                >
                  Abrir Embudo de Ventas
                </Link>
              </div>
            </div>
          ) : (
            pendingFollowUps.map((lead: any) => {
              const displayName = lead.name || lead.contactName || 'Contacto';
              const isLeadOverdue =
                lead.nextFollowUp && new Date(lead.nextFollowUp).getTime() < Date.now();
              const latestProposal = lead.proposals?.[0];

              return (
                <div
                  key={lead.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                    isLeadOverdue
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/10'
                      : 'bg-slate-50/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
                >
                  {/* Left Column: Contact Details & Motivo */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                      >
                        <span>{displayName}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      </Link>

                      {(lead.company?.name || lead.companyName) && (
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{lead.company?.name || lead.companyName}</span>
                        </span>
                      )}

                      {latestProposal && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Etapa: {latestProposal.stage} ({formatMoney(latestProposal.amount || 0)})
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{lead.nextFollowUpTask || 'Llamada de seguimiento comercial programada'}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className={`flex items-center gap-1 font-semibold ${isLeadOverdue ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {isLeadOverdue && '⚠️ '}
                          {new Date(lead.nextFollowUp).toLocaleDateString('es-HN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>

                      {lead.phone && (
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          📞 {lead.phone}
                        </span>
                      )}

                      {lead.assignedTo?.name && (
                        <span>
                          👤 Asesor: <strong>{lead.assignedTo.name.split(' ')[0]}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: 3 FAST ACTION BUTTONS (VERDE, AZUL, GRIS) + WHATSAPP */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-0 border-slate-200 dark:border-slate-800">
                    {/* WhatsApp Fast Trigger - Solo abre WhatsApp, no elimina de la lista */}
                    {lead.phone && (
                      <WhatsAppButton
                        phone={lead.phone}
                        contactName={displayName}
                        projectName={lead.companyName || ''}
                        size="md"
                      />
                    )}

                    {/* BOTÓN 1: REGISTRAR LLAMADA / MENSAJE (VERDE) */}
                    <button
                      type="button"
                      onClick={() => {
                        setCallModalContact(lead);
                        setCallChannel('LLAMADA');
                        setCallOutcome('CONVERSACION');
                        setCallNotes('');
                        setCallNextDate('');
                        setCallNextTask('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      title="Registrar llamada o mensaje realizado con este contacto"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Registrar Llamada / Mensaje</span>
                    </button>

                    {/* BOTÓN 2: AVANZAR A PROPUESTA (AZUL) */}
                    <button
                      type="button"
                      onClick={() => {
                        setProposalModalContact(lead);
                        setProposalTitle(
                          latestProposal?.title ||
                            `Propuesta Comercial - ${lead.company?.name || lead.companyName || displayName}`
                        );
                        setProposalAmount(latestProposal?.amount?.toString() || '1500');
                        setProposalNotes(latestProposal?.notes || '');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      title="Avanzar este contacto a la etapa de Propuesta Enviada"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Avanzar a Propuesta</span>
                    </button>

                    {/* BOTÓN 3: DESCARTAR (GRIS) */}
                    <button
                      type="button"
                      onClick={() => {
                        setDiscardModalContact(lead);
                        setDiscardReason('POSPONER');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/90 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 transition-all cursor-pointer"
                      title="Descartar o posponer este seguimiento"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Descartar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. BITÁCORA COMPACTA (TIMELINE MINIMALISTA) */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Últimas Conversaciones & Acuerdos (Timeline)
            </h3>
          </div>

          <Link
            href="/leads"
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Ver todos los contactos →
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <p className="text-center py-6 text-slate-400 text-xs italic">
            No hay conversaciones recientes registradas en la bitácora.
          </p>
        ) : (
          <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {recentActivities.slice(0, 6).map((act: any) => {
              const contactObj = act.contact || act.lead;
              const contactName = contactObj?.name || contactObj?.contactName || 'Contacto';
              const companyName = contactObj?.companyName || '';

              return (
                <div key={act.id} className="relative group text-xs flex items-baseline justify-between gap-3">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-950 shadow-xs" />

                  <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-1.5">
                    {contactObj?.id ? (
                      <Link
                        href={`/leads/${contactObj.id}`}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {contactName}
                      </Link>
                    ) : (
                      <span className="font-bold text-slate-900 dark:text-slate-100">{contactName}</span>
                    )}

                    {companyName && (
                      <span className="text-[10px] text-slate-400 font-medium">({companyName})</span>
                    )}

                    <span className="text-slate-600 dark:text-slate-300 font-normal">
                      • {act.description}
                    </span>
                  </div>

                  <div className="shrink-0 text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                    {act.user?.name && <span>{act.user.name.split(' ')[0]}</span>}
                    <span>•</span>
                    <span>
                      {new Date(act.createdAt).toLocaleDateString('es-HN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. LISTA ESPECIAL DE ESPERA: NO CONTESTARON HOY (REINTENTO PROGRAMADO PARA MAÑANA) */}
      {waitingListFollowUps.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/15 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80 dark:border-amber-800/50">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Lista de Espera: Reintento Mañana</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    {waitingListFollowUps.length} en espera
                  </span>
                </h3>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Contactos que no contestaron hoy. Al pasar las 12:00 de la medianoche volverán automáticamente a tu lista de <strong>LLAMAR HOY</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {waitingListFollowUps.map((lead: any) => {
              const displayName = lead.name || lead.contactName || 'Contacto';
              const latestProposal = lead.proposals?.[0];

              return (
                <div
                  key={lead.id}
                  className="p-4 rounded-2xl border border-amber-200/70 dark:border-amber-800/40 bg-white/80 dark:bg-slate-900/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-amber-600 transition-colors"
                      >
                        {displayName}
                      </Link>
                      {(lead.company?.name || lead.companyName) && (
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {lead.company?.name || lead.companyName}
                        </span>
                      )}
                      {latestProposal && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {latestProposal.stage}: {formatMoney(latestProposal.amount || 0)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{lead.nextFollowUpTask || 'Reintento: No contestó hoy - Volver a llamar mañana'}</span>
                    </p>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                      <span>📞 {lead.phone || 'Sin teléfono'}</span>
                      <span>• Programado para: mañana 08:00 AM</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {lead.phone && (
                      <WhatsAppButton
                        phone={lead.phone}
                        contactName={displayName}
                        projectName={lead.companyName || ''}
                        size="sm"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCallModalContact(lead);
                        setCallChannel('LLAMADA');
                        setCallOutcome('CONVERSACION');
                        setCallNotes('');
                        setCallNextDate('');
                        setCallNextTask('');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer"
                    >
                      Reintentar Ahora
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProposalModalContact(lead);
                        setProposalTitle(latestProposal?.title || `Propuesta Comercial - ${lead.company?.name || displayName}`);
                        setProposalAmount(latestProposal?.amount?.toString() || '1500');
                        setProposalNotes(latestProposal?.notes || '');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-300 dark:border-indigo-800 transition-all cursor-pointer"
                    >
                      Avanzar a Propuesta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTRAR LLAMADA RÁPIDA (VERDE) */}
      {callModalContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
            <button
              onClick={() => setCallModalContact(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {callChannel === 'WHATSAPP' ? (
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                ) : callChannel === 'CORREO' ? (
                  <Mail className="w-5 h-5 text-amber-500" />
                ) : callChannel === 'REUNION' ? (
                  <Calendar className="w-5 h-5 text-purple-500" />
                ) : (
                  <PhoneCall className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Registrar Interacción con Contacto
                </h3>
                <p className="text-xs text-slate-500">
                  {callModalContact.name} {callModalContact.companyName ? `• ${callModalContact.companyName}` : ''}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCall} className="space-y-4">
              {/* Canal / Tipo de contacto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Canal de Contacto
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[
                    { id: 'LLAMADA', label: '📞 Llamada' },
                    { id: 'WHATSAPP', label: '💬 WhatsApp' },
                    { id: 'CORREO', label: '✉️ Correo' },
                    { id: 'REUNION', label: '🤝 Reunión' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setCallChannel(ch.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-center font-semibold border transition-all text-[11px] ${
                        callChannel === ch.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultado de la interacción */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Resultado *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'CONVERSACION', label: '🟢 Contestó / Interesado' },
                    { id: 'NO_CONTESTO', label: '🟡 No Contestó / Dejé Mensaje' },
                    { id: 'VOLVER_A_LLAMAR', label: '🟣 Contactar más tarde' },
                    { id: 'REUNION', label: '🔵 Reunión acordada' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCallOutcome(item.id);
                        if (item.id === 'REUNION' && !callNextTask) {
                          setCallNextTask('Reunión acordada con el cliente');
                        }
                      }}
                      className={`p-2 rounded-xl text-left font-semibold border transition-all ${
                        callOutcome === item.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Resumen de la conversación (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="ej. Se conversó sobre su presupuesto y quedó en revisar la información enviada..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {callOutcome === 'REUNION'
                      ? '🗓️ Fecha y Hora de la Reunión Acordada *'
                      : '¿Programar siguiente seguimiento? (Opcional)'}
                  </label>
                  <input
                    type="datetime-local"
                    value={callNextDate}
                    onChange={(e) => setCallNextDate(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                      callOutcome === 'REUNION'
                        ? 'border-purple-400 dark:border-purple-600 focus:ring-purple-500/40 bg-purple-50/20'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500/40'
                    }`}
                  />
                </div>

                {callNextDate ? (
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      {callOutcome === 'REUNION'
                        ? '🤝 Objetivo o Título de la Reunión en Calendario'
                        : 'Tarea o motivo del seguimiento'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        callOutcome === 'REUNION'
                          ? 'ej. Presentación de propuesta web y alcance'
                          : 'ej. Llamar para dar seguimiento al envío de propuesta'
                      }
                      value={callNextTask}
                      onChange={(e) => setCallNextTask(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                ) : callOutcome === 'REUNION' ? (
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
                    <span>🤝</span>
                    <span>Indica arriba la fecha y hora para que esta <strong>Reunión</strong> quede guardada automáticamente en tu <strong>Calendario</strong>.</span>
                  </p>
                ) : callOutcome === 'NO_CONTESTO' ? (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                    <span>⏳</span>
                    <span>Al marcar <strong>"No contestó"</strong>, el contacto irá a la <strong>Lista de Espera</strong> y volverá a aparecer automáticamente en <strong>LLAMAR HOY</strong> mañana al pasar las 12 de la noche.</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Al guardar sin fecha futura, la persona <strong>saldrá de la lista</strong> de llamadas pendientes de hoy al haber completado la interacción.</span>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCallModalContact(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCall}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {savingCall
                    ? 'Guardando...'
                    : callChannel === 'WHATSAPP'
                    ? 'Guardar Mensaje'
                    : callChannel === 'CORREO'
                    ? 'Guardar Correo'
                    : callChannel === 'REUNION'
                    ? 'Guardar Reunión'
                    : 'Guardar Llamada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AVANZAR A PROPUESTA (AZUL) */}
      {proposalModalContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
            <button
              onClick={() => setProposalModalContact(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Avanzar a Propuesta Enviada
                </h3>
                <p className="text-xs text-slate-500">
                  {proposalModalContact.name} {proposalModalContact.companyName ? `• ${proposalModalContact.companyName}` : ''}
                </p>
              </div>
            </div>

            <form onSubmit={handleAdvanceProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Propuesta *
                </label>
                <input
                  type="text"
                  required
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="ej. Campaña Redes Sociales 2026"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto Estimado ({currencySymbol} {currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={proposalAmount}
                  onChange={(e) => setProposalAmount(e.target.value)}
                  placeholder="1500"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas de Envío / Términos Clave (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  placeholder="ej. Se envió cotización por WhatsApp y correo. Vigencia 15 días."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setProposalModalContact(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProposal}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {savingProposal ? 'Guardando...' : 'Confirmar Avance a Propuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DESCARTAR O POSPONER (GRIS) */}
      {discardModalContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95">
            <button
              onClick={() => setDiscardModalContact(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Descartar Seguimiento
                </h3>
                <p className="text-xs text-slate-500">
                  {discardModalContact.name} {discardModalContact.companyName ? `• ${discardModalContact.companyName}` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                ¿Qué deseas hacer con este contacto para despejar tu lista de hoy?
              </p>

              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  discardReason === 'POSPONER'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 font-semibold text-indigo-900 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="discardAction"
                    checked={discardReason === 'POSPONER'}
                    onChange={() => setDiscardReason('POSPONER')}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold block">🗓️ Posponer 7 días</span>
                    <span className="text-[11px] text-slate-500">
                      Mover la llamada para la próxima semana y limpiar la lista de hoy.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  discardReason === 'CERRAR_PERDIDO'
                    ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 font-semibold text-rose-900 dark:text-rose-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="discardAction"
                    checked={discardReason === 'CERRAR_PERDIDO'}
                    onChange={() => setDiscardReason('CERRAR_PERDIDO')}
                    className="mt-0.5 text-rose-600"
                  />
                  <div>
                    <span className="text-xs font-bold block text-rose-600 dark:text-rose-400">
                      🗑️ Descartar Definitivamente (Cerrado Perdido)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Quitar seguimiento y marcar oportunidad como perdida o no interesada.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDiscardModalContact(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={savingDiscard}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                >
                  {savingDiscard ? 'Procesando...' : 'Confirmar Acción'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Modal de Registro de Nuevo Prospecto */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSaved={fetchDashboard}
        currentUser={data?.currentUser || { id: '', name: '', role: 'ASESOR' }}
      />
    </div>
  );
}
