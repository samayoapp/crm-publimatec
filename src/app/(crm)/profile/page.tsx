'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
  Camera,
} from 'lucide-react';
import ImageInput from '@/components/ImageInput';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('ASESOR');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok && data.user) {
        setName(data.user.name || '');
        setEmail(data.user.email || '');
        setPhone(data.user.phone || '');
        setJobTitle(data.user.jobTitle || '');
        setAvatarUrl(data.user.avatarUrl || '');
        setRole(data.user.role || 'ASESOR');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('El nombre no puede estar vacío');
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg('Debes ingresar tu contraseña actual para cambiarla');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('La confirmación de la nueva contraseña no coincide');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        avatarUrl: avatarUrl.trim() || null,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar perfil');
      }

      setSuccessMsg('✅ Tu perfil ha sido actualizado exitosamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Refrescar página para sincronizar con la barra superior
      setTimeout(() => {
        router.refresh();
      }, 500);

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const isAdmin = role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Mi Perfil de Usuario</span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
                    : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30'
                }`}
              >
                {isAdmin ? 'Dirección General' : 'Ejecutivo Comercial'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Administra tu información personal, fotografía de perfil y contraseña de acceso
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Datos Personales & Avatar */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 transition-colors shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Información de Contacto & Presentación
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Foto de Perfil */}
            <div className="md:col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-xl border-4 border-white dark:border-slate-800">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    name.charAt(0) || 'U'
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Foto de Perfil
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Visible en la barra superior y cotizaciones
                </span>
              </div>

              <div className="w-full">
                <ImageInput
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  label=""
                  placeholder="Subir foto o pegar URL..."
                />
              </div>
            </div>

            {/* Campos de Información */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cargo / Puesto Comercial
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="ej. Ejecutivo Comercial Senior"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    WhatsApp / Teléfono Móvil
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="ej. +504 9900-1122"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo Electrónico (Usuario de Acceso)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Tu correo electrónico es tu credencial única de acceso. Si necesitas cambiarlo, comunícate con la Dirección.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Seguridad & Cambio de Contraseña */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 transition-colors shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Seguridad & Cambio de Contraseña
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Opcional (llenar solo si deseas cambiarla)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Tu contraseña actual"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando Cambios...' : 'Guardar Mi Perfil'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
