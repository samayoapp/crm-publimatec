'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { crmCache } from '@/lib/crmCache';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Briefcase,
  UserCheck,
  Building2,
  Settings,
  Sparkles,
  ExternalLink,
  FileText,
  Calendar,
  X,
  BarChart3,
  FolderOpen,
  User,
  Feather,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  isOpen?: boolean;
  onClose?: () => void;
  onOpenQuote?: () => void;
}

export default function Sidebar({ user, isOpen = false, onClose, onOpenQuote }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
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
      setIsLoggingOut(false);
    }
  };

  // Auto-close sidebar on route change on mobile
  useEffect(() => {
    onClose?.();
  }, [pathname]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isAdmin = user?.role === 'ADMIN';

  const menuSections = [
    {
      id: 'core',
      items: [
        {
          label: 'Resumen',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Embudo',
          href: '/pipeline',
          icon: Kanban,
        },
        {
          label: 'Calendario',
          href: '/calendar',
          icon: Calendar,
        },
      ],
    },
    {
      id: 'crm',
      items: [
        {
          label: 'Contactos',
          href: '/leads',
          icon: Users,
        },
        {
          label: 'Empresas',
          href: '/companies',
          icon: Building2,
        },
        {
          label: 'Propuestas',
          href: '/proposals',
          icon: FileText,
        },
      ],
    },
    {
      id: 'team_resources',
      items: [
        {
          label: 'Equipo Comercial',
          href: '/team',
          icon: UserCheck,
        },
        {
          label: 'Biblioteca de Recursos',
          href: '/resources',
          icon: FolderOpen,
        },
        {
          label: isAdmin ? 'Reportes Gerenciales' : 'Mis Reportes',
          href: '/reports',
          icon: BarChart3,
        },
      ],
    },
    {
      id: 'profile_settings',
      items: [
        {
          label: 'Mi Perfil',
          href: '/profile',
          icon: User,
        },
        ...(isAdmin
          ? [
              {
                label: 'Configuración',
                href: '/settings',
                icon: Settings,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity animate-fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full lg:h-screen lg:w-64 lg:sticky lg:top-0 lg:z-auto lg:shadow-none lg:translate-x-0 bg-white dark:bg-[#0d1322] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 select-none transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="block group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <img
                    src="/brand/logo-publimatec-horizontal.png"
                    alt="PUBLIMATEC CRM"
                    className="h-8 sm:h-9 w-auto max-w-[180px] object-contain drop-shadow-sm dark:brightness-105"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold">CRM COMERCIAL</span>
                  <span>• PUBLIMATEC</span>
                </div>
              </Link>

              {/* Close Button on Mobile */}
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Cerrar menú"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/40 dark:border-slate-700/40 border border-slate-200">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Inversiones Publimatec S.A.</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {menuSections.map((section, sectionIdx) => (
              <div key={section.id} className="space-y-1">
                {sectionIdx > 0 && (
                  <div className="py-1.5 px-2">
                    <div className="border-t border-slate-200 dark:border-slate-800/80" />
                  </div>
                )}
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={onClose}
                      onMouseEnter={() => {
                        try {
                          crmCache.prefetchCoreData();
                        } catch (e) {}
                      }}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* Divisor antes de Cerrar Sesión */}
            <div className="py-1.5 px-2">
              <div className="border-t border-slate-200 dark:border-slate-800/80" />
            </div>

            {/* Botón Cerrar Sesión en Menú Lateral */}
            <div>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer group ${
                  isLoggingOut ? 'opacity-50 pointer-events-none' : ''
                }`}
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors" />
                <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
              </button>
            </div>

            {/* Acceso discreto a Frase Inspiracional / Plumita (Justificada a la Izquierda) */}
            <div className="pt-2 pb-6 px-1.5 flex items-center justify-start">
              <button
                id="btn-sidebar-quote"
                type="button"
                onClick={() => {
                  onClose?.();
                  if (onOpenQuote) {
                    onOpenQuote();
                  } else {
                    window.dispatchEvent(new CustomEvent('crm-show-quote'));
                  }
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Inspiración del día"
                aria-label="Inspiración del día"
              >
                <Feather className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
