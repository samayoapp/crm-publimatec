'use client';

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
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
    <aside className="w-64 bg-white dark:bg-[#0d1322] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none transition-colors">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/80">
          <Link href="/dashboard" className="block group">
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
  );
}
