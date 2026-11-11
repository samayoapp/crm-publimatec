'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Menu, LogOut, Users } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import { crmCache } from '@/lib/crmCache';

interface NavbarProps {
  title?: string;
  subtitle?: string;
  user: {
    id: string;
    name: string;
    role: string;
    email?: string;
    avatarUrl?: string | null;
  };
  onNewLeadClick?: () => void;
  onToggleSidebar?: () => void;
}

export default function Navbar({
  title,
  subtitle,
  user,
  onNewLeadClick,
  onToggleSidebar,
}: NavbarProps) {
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';

  const [advisorFilter, setAdvisorFilter] = useState<string>('ME');
  const [advisors, setAdvisors] = useState<any[]>(() => crmCache.getTeam().data || []);

  useEffect(() => {
    if (!isAdmin) return;

    const initialFilter = crmCache.restoreAdvisorFilter();
    setAdvisorFilter(initialFilter);
    // Asegurar que la cookie esté sincronizada desde el inicio
    crmCache.setAdvisorFilter(initialFilter);

    const cachedTeam = crmCache.getTeam();
    if (cachedTeam.data && cachedTeam.data.length > 0) {
      setAdvisors(cachedTeam.data);
    }
    fetch('/api/team')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.team) {
          setAdvisors(d.team);
          crmCache.setTeam(d.team);
        }
      })
      .catch(() => {});

    const handleExternalSync = (e: any) => {
      const nextVal = e?.detail?.filter || crmCache.getAdvisorFilter();
      setAdvisorFilter(nextVal);
    };
    window.addEventListener('crm-advisor-filter-changed', handleExternalSync);
    return () => {
      window.removeEventListener('crm-advisor-filter-changed', handleExternalSync);
    };
  }, [isAdmin]);

  const handleGlobalFilterChange = (newFilter: string) => {
    setAdvisorFilter(newFilter);
    crmCache.setAdvisorFilter(newFilter);
    window.dispatchEvent(new CustomEvent('crm-advisor-filter-changed', { detail: { filter: newFilter } }));
    window.dispatchEvent(new CustomEvent('crm-lead-saved'));
    window.dispatchEvent(new CustomEvent('crm-proposal-saved'));
    window.dispatchEvent(new CustomEvent('crm-contact-saved'));
  };

  const handleLogout = async () => {
    try {
      try {
        sessionStorage.clear();
        document.cookie = 'welcome_pending=; path=/; max-age=0;';
      } catch (e) {}
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error al salir', err);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Lado Izquierdo: Menú móvil + Tarjeta de Usuario */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Abrir menú de navegación"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Tarjeta del Usuario en la Barra Superior (Arriba a la Izquierda) */}
        <div className="flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 pr-2.5 sm:pr-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/70 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-all">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow border border-white/40 dark:border-slate-700">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              user.name.charAt(0)
            )}
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate max-w-[120px] sm:max-w-[180px]">
              {user.name}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
                    : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30'
                }`}
              >
                {user.role === 'ADMIN' ? 'Dirección' : 'Ventas'}
              </span>
            </div>
          </div>

          {/* Botón Cerrar Sesión */}
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors shrink-0 ml-0.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Lado Derecho: Filtro Global ADMIN + Tema + Notificaciones + Botón Nuevo Prospecto */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* FILTRO GLOBAL PERMANENTE (EXCLUSIVO PARA ADMIN) */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 bg-indigo-50/90 dark:bg-indigo-950/50 border-2 border-indigo-500/40 dark:border-indigo-500/50 rounded-xl px-2 sm:px-3 py-1.5 shadow-xs transition-all">
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 hidden xs:inline" />
            <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 hidden md:inline">
              Vista Global:
            </span>
            <select
              value={advisorFilter}
              onChange={(e) => handleGlobalFilterChange(e.target.value)}
              className="text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white bg-transparent focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[220px] truncate"
              title="Filtro Global de Administrador: afecta Resumen, Contactos, Propuestas, Embudo, Empresas, Calendario y Reportes"
            >
              <option value="ME" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                👤 Solo lo mío ({user.name.split(' ')[0]})
              </option>
              <option value="OTHERS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                👥 Solo los demás colaboradores
              </option>
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                🏢 Todo el equipo (Global)
              </option>
              {advisors.filter((a) => a.id !== user.id && a.active !== false && a.approved !== false).length > 0 && (
                <optgroup
                  label="Por Colaborador Específico"
                  className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400"
                >
                  {advisors
                    .filter((a) => a.id !== user.id && a.active !== false && a.approved !== false)
                    .map((adv) => (
                      <option
                        key={adv.id}
                        value={adv.id}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                      >
                        👨‍💼 {adv.name}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>
        )}

        {/* Quick Theme Toggle Icon */}
        <ThemeToggle variant="compact" />

        {/* Notifications Center */}
        <NotificationBell userRole={user.role} />

        {onNewLeadClick && (
          <button
            onClick={onNewLeadClick}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Nuevo Prospecto</span>
            <span className="sm:hidden font-medium">Prospecto</span>
          </button>
        )}
      </div>
    </header>
  );
}

