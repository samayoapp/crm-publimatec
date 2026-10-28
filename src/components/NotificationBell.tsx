'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  UserCheck,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { formatFriendlyDate } from '@/lib/timeUtils';

interface NotificationBellProps {
  userRole?: string;
}

export default function NotificationBell({ userRole }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    // Si la pestaña está oculta o en segundo plano, no saturar la base de datos
    if (typeof document !== 'undefined' && document.hidden) return;

    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount((data.unreadCount || 0) + (data.pendingCount || 0));
        setPendingUsers(data.pendingUsers || []);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // 45s poll optimizado

    const handleRefresh = () => fetchNotifications();
    window.addEventListener('crm-lead-saved', handleRefresh);
    window.addEventListener('crm-notification-update', handleRefresh);

    // Si el usuario regresa a la pestaña activa, refrescar inmediatamente
    const handleVisibility = () => {
      if (!document.hidden) fetchNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('crm-lead-saved', handleRefresh);
      window.removeEventListener('crm-notification-update', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleApprove = async (userId: string, approved: boolean) => {
    setProcessingId(userId);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/team/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar');

      setStatusMessage(approved ? '✅ Vendedor aprobado y notificado por correo.' : 'Solicitud rechazada.');
      window.dispatchEvent(new CustomEvent('crm-user-approved'));
      fetchNotifications();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al procesar solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'POST' });
      fetchNotifications();
    } catch (e) {}
  };

  const totalBadgeCount = unreadCount;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="btn-navbar-notifications"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={`relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
          isOpen ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : ''
        }`}
        title="Centro de Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />

        {/* Glow Badge */}
        {totalBadgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-md shadow-rose-500/50 animate-pulse">
            {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800/80 shadow-2xl shadow-slate-950/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                <span>Notificaciones</span>
              </span>
              {totalBadgeCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                  {totalBadgeCount}
                </span>
              )}
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-semibold"
              >
                Marcar leídas
              </button>
            )}
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 text-center animate-in fade-in">
              {statusMessage}
            </div>
          )}

          {/* Scrollable list */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* DIRECTOR SECTION: Solicitudes de Registro Pendientes */}
            {pendingUsers.length > 0 && (
              <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border-b border-amber-200/50 dark:border-amber-800/40 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>Aprobación de Vendedores ({pendingUsers.length})</span>
                  </span>
                  <Link
                    href="/team"
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 lowercase font-medium"
                  >
                    <span>ver equipo</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {pendingUsers.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/60 shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {applicant.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {applicant.email}
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          {applicant.jobTitle || 'Ejecutivo de Ventas'}
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0">
                        {formatFriendlyDate(applicant.createdAt)}
                      </span>
                    </div>

                    {/* Quick Approve / Reject Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={processingId === applicant.id}
                        onClick={() => handleApprove(applicant.id, true)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{processingId === applicant.id ? 'Aprobando...' : 'Aprobar'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingId === applicant.id}
                        onClick={() => handleApprove(applicant.id, false)}
                        className="py-1.5 px-2.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline ml-1">Rechazar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Standard notifications list */}
            {notifications.length === 0 && pendingUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                <Sparkles className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <span>No tienes notificaciones pendientes</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    !item.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </span>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      {formatFriendlyDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.message}
                  </p>
                  {item.link && (
                    <Link
                      href={item.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold mt-1.5"
                    >
                      <span>Ver detalles</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-center">
            <Link
              href="/team"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Administrar Equipo Comercial →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
