'use client';

import { useState, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  Shield,
  Phone,
  Mail,
  Award,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trash2,
  Edit,
  AlertTriangle,
} from 'lucide-react';
import UserModal from '@/components/UserModal';

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // User modal state (both create & edit)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeam = () => {
    fetch('/api/team')
      .then((res) => res.json())
      .then((data) => {
        if (data.team) setTeam(data.team);
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
    fetchTeam();
    fetchUser();
  }, []);

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, active: !currentStatus }),
      });
      fetchTeam();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/team?id=${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar usuario');
      }

      setUserToDelete(null);
      fetchTeam();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar usuario');
    } finally {
      setDeleting(false);
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Fuerza Comercial Multi-Usuario
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Equipo de Ventas & Dirección
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestión completa (CRUD) de usuarios, roles, fotografías de perfil y rendimiento comercial
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setUserToEdit(null);
              setIsUserModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Agregar Vendedor / Usuario</span>
          </button>
        )}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            Cargando equipo...
          </div>
        ) : (
          team.map((member) => {
            const canEdit = isAdmin || currentUser?.id === member.id;
            const canDelete = isAdmin && currentUser?.id !== member.id;

            return (
              <div
                key={member.id}
                className={`glass-panel rounded-2xl p-5 border ${
                  member.active ? 'border-slate-200 dark:border-slate-800' : 'border-rose-300 dark:border-rose-900/40 opacity-70'
                } flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700 shadow-sm`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* User Avatar with fallback */}
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0 border border-white/20">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {member.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase inline-block mt-0.5 ${
                            member.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
                              : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20'
                          }`}
                        >
                          {member.role === 'ADMIN' ? 'Dirección' : 'Asesor de Ventas'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setUserToEdit(member);
                            setIsUserModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors"
                          title="Editar información de usuario"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canDelete && (
                        <>
                          <button
                            onClick={() => toggleUserActive(member.id, member.active)}
                            className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                              member.active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                            }`}
                            title={member.active ? 'Pausar/Desactivar' : 'Reactivar'}
                          >
                            {member.active ? 'Activo' : 'Inactivo'}
                          </button>

                          <button
                            onClick={() => setUserToDelete(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors"
                            title="Eliminar usuario permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-200 dark:border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Contactos</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {member.totalContacts ?? member.totalLeads ?? 0}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-200 dark:border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">En Negocio</div>
                    <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {member.activeProposals ?? member.activeLeads ?? 0}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-200 dark:border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Ventas</div>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ${(member.wonValue || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Create / Edit Modal */}
      {isUserModalOpen && (
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setUserToEdit(null);
          }}
          onSaved={fetchTeam}
          userToEdit={userToEdit}
          currentUser={currentUser}
        />
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ¿Eliminar al usuario {userToDelete.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Esta acción removerá el acceso de <strong>{userToDelete.email}</strong>. El historial de llamadas y notas de clientes se preservará íntegramente en la bitácora.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
