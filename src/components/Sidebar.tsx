'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Briefcase,
  UserCheck,
  Building2,
  Settings,
  LogOut,
  Sparkles,
  ExternalLink,
  FileText,
  X,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error al salir', err);
    }
  };

  const navItems = [
    {
      label: 'Resumen & Hoy',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Embudo de Ventas',
      href: '/pipeline',
      icon: Kanban,
    },
    {
      label: 'Propuestas Comerciales',
      href: '/proposals',
      icon: FileText,
    },
    {
      label: 'Empresas & Cuentas',
      href: '/companies',
      icon: Building2,
    },
    {
      label: 'Personas & Contactos',
      href: '/leads',
      icon: Users,
    },
    {
      label: 'Equipo Comercial',
      href: '/team',
      icon: UserCheck,
    },
    {
      label: 'Configuración',
      href: '/settings',
      icon: Settings,
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
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Pixel<span className="text-cyan-500">Media</span>
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  Inversiones Publimatec S.A.
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

            <a
              href="https://pixelmediahn.com"
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-between text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/40 dark:border-slate-700/40 border border-slate-200 transition-colors"
            >
              <span>pixelmediahn.com</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-2">
              Módulos Comerciales
            </div>

            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
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
          </nav>
        </div>

      {/* Bottom Area: Theme Selector + User Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 space-y-3">
        {/* Theme Selector */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 mb-1.5 flex items-center justify-between">
            <span>Tema Visual</span>
          </div>
          <ThemeToggle variant="pill" />
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow border border-white/20">
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
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
                      : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30'
                  }`}
                >
                  {user.role === 'ADMIN' ? 'Dirección' : 'Ventas'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  </>
  );
}
