'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Building,
  Phone,
  PhoneCall,
  Mail,
  DollarSign,
  Calendar,
  Sparkles,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Zap,
  Check,
  Lock,
  Clock,
} from 'lucide-react';
import { STAGES, STAGE_KEYS } from '@/lib/constants';
import ImageInput from '@/components/ImageInput';
import { useSettings } from '@/lib/settingsContext';

interface Advisor {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CompanyOption {
  id: string;
  name: string;
  industry?: string | null;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  leadToEdit?: any | null;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  defaultCompanyId?: string | null;
  defaultCompanyName?: string | null;
}

export default function LeadModal({
  isOpen,
  onClose,
  onSaved,
  leadToEdit,
  currentUser,
  defaultCompanyId,
  defaultCompanyName,
}: LeadModalProps) {
  const { currency, currencySymbol } = useSettings();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states - Quick Lead Capture
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyMode, setCompanyMode] = useState<'write' | 'select'>('write');
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const companyBoxRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState('');

  // Advanced / Optional states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('NUEVO');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [proposalCurrency, setProposalCurrency] = useState('HNL');
  const [assignedToId, setAssignedToId] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [nextFollowUpTask, setNextFollowUpTask] = useState('');

  // Cerrar lista de sugerencias al hacer clic fuera del campo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyBoxRef.current && !companyBoxRef.current.contains(event.target as Node)) {
        setShowCompanySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch advisors and companies
  useEffect(() => {
    if (isOpen) {
      fetch('/api/team')
        .then((res) => res.json())
        .then((data) => {
          if (data.team) setAdvisors(data.team);
        })
        .catch((err) => console.error(err));

      fetch('/api/companies')
        .then((res) => res.json())
        .then((data) => {
          if (data.companies) setCompanies(data.companies);
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  // Load existing data if editing or defaults
  useEffect(() => {
    if (leadToEdit) {
      setContactName(leadToEdit.name || leadToEdit.contactName || '');
      setPhone(leadToEdit.phone || '');
      setJobTitle(leadToEdit.jobTitle || '');
      const cId = leadToEdit.companyId || leadToEdit.company?.id || '';
      const cName = leadToEdit.companyName || leadToEdit.company?.name || '';
      setCompanyId(cId);
      setCompanyName(cName);
      setCompanyMode('write'); // Prioridad de escritura
      setShowCompanySuggestions(false);

      setEmail(leadToEdit.email || '');
      setAvatarUrl(leadToEdit.avatarUrl || '');
      setTitle(leadToEdit.title || '');
      const rawStage = leadToEdit.stage;
      setStage(rawStage === 'ENVIADA' ? 'PROPUESTA' : (rawStage || 'NUEVO'));
      setEstimatedValue(leadToEdit.estimatedValue ? leadToEdit.estimatedValue.toString() : '');
      setAssignedToId(leadToEdit.assignedToId || leadToEdit.assignedTo?.id || '');
      setNotes(leadToEdit.notes || '');
      setNextFollowUpTask(leadToEdit.nextFollowUpTask || '');
      if (leadToEdit.nextFollowUp) {
        setNextFollowUp(new Date(leadToEdit.nextFollowUp).toISOString().slice(0, 16));
      } else {
        setNextFollowUp('');
      }

      // Automatically open advanced details if existing record has them
      const hasAdvanced = Boolean(
        leadToEdit.avatarUrl ||
        (leadToEdit.proposals && leadToEdit.proposals.length > 0)
      );
      setShowAdvanced(hasAdvanced);
    } else {
      // Prioridad de escritura para nuevo contacto
      setContactName('');
      setPhone('');
      setJobTitle('');
      setCompanyId(defaultCompanyId || '');
      setCompanyName(defaultCompanyName || '');
      setCompanyMode('write'); // Prioridad de escritura por defecto
      setShowCompanySuggestions(false);
      setEmail('');
      setAvatarUrl('');
      setTitle('');
      setStage('NUEVO');
      setEstimatedValue('');
      setProposalCurrency(currency || 'HNL');
      setAssignedToId(currentUser?.id || '');
      setNotes('');
      // Todo nuevo contacto entra de inmediato con prioridad para LLAMAR HOY
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const defaultDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setNextFollowUp(defaultDateStr);
      setNextFollowUpTask('Primer contacto / Llamar hoy');
      setShowAdvanced(false);
    }
    setError(null);
  }, [leadToEdit, isOpen, currentUser, defaultCompanyId, defaultCompanyName, currency]);

  // Empresas que coinciden con lo que se escribe
  const query = companyName.trim().toLowerCase();
  const matchingCompanies = query
    ? companies.filter((c) => c.name.toLowerCase().includes(query))
    : [];

  const handleSelectSuggestedCompany = (comp: CompanyOption) => {
    setCompanyName(comp.name);
    setCompanyId(comp.id);
    setShowCompanySuggestions(false);
  };

  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) {
      setCompanyId('');
      setShowCompanySuggestions(false);
      return;
    }
    // Verificar si coincide exactamente con alguna existente
    const exact = companies.find((c) => c.name.toLowerCase() === trimmed);
    if (exact) {
      setCompanyId(exact.id);
    } else {
      // Si el texto difiere, se vacía companyId para que el backend la cree automáticamente
      setCompanyId('');
    }
    setShowCompanySuggestions(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      setError('Por favor ingresa el nombre de la persona');
      return;
    }

    setLoading(true);
    setError(null);

    const now = new Date();
    const finalFollowUp = nextFollowUp ? new Date(nextFollowUp).toISOString() : now.toISOString();
    const finalTask = nextFollowUpTask.trim() || 'Primer contacto / Llamar hoy';

    const payload: any = {
      name: contactName.trim(),
      phone: phone ? phone.trim() : '',
      jobTitle: jobTitle.trim() || null,
      companyId: companyId || null,
      companyName: companyName ? companyName.trim() : null,
      notes: notes.trim() || null,
      // Optional details
      email: email ? email.trim() : null,
      avatarUrl: avatarUrl ? avatarUrl.trim() : null,
      assignedToId: assignedToId || null,
      nextFollowUp: finalFollowUp,
      nextFollowUpTask: finalTask,
    };

    if (!leadToEdit && (estimatedValue || title)) {
      payload.amount = parseFloat(estimatedValue) || 0;
      payload.currency = proposalCurrency || currency || 'HNL';
      payload.initialProposalTitle =
        title.trim() || (contactName ? `Propuesta para ${contactName.trim()}` : 'Propuesta inicial');
      payload.stage = stage;
    }

    try {
      const url = leadToEdit ? `/api/contacts/${leadToEdit.id}` : '/api/contacts';
      const method = leadToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el contacto');
      }

      window.dispatchEvent(new CustomEvent('crm-contact-saved'));
      window.dispatchEvent(new CustomEvent('crm-lead-saved'));
      window.dispatchEvent(new CustomEvent('crm-proposal-saved'));

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header: Clean & Fast */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {leadToEdit ? 'Editar Contacto / Lead' : 'Registro Rápido de Lead'}
                </h2>
                {!leadToEdit && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-200/80 dark:border-amber-900/40">
                    ⚡ Express
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {leadToEdit
                  ? 'Modifica los datos del contacto o cliente'
                  : 'Guarda los datos esenciales en segundos para contactarlo de inmediato'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* 1. Datos Principales: Persona, Teléfono & Correo */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nombre de la Persona <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="ej. Lic. Roberto Flores"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 pl-9 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>WhatsApp / Teléfono</span>
                  <span className="text-[10px] font-normal text-slate-400">Opcional</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ej. 9888-2233"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 pl-9 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>Correo Electrónico</span>
                  <span className="text-[10px] font-normal text-slate-400">Opcional</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-indigo-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="ej. contacto@empresa.hn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 pl-9 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Empresa o Negocio (Prioridad de Escritura & Detección Inteligente) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                <span>Empresa o Negocio</span>
              </label>
              {companies.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (companyMode === 'write') {
                      setCompanyMode('select');
                      setShowCompanySuggestions(false);
                    } else {
                      setCompanyMode('write');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 transition-all shadow-xs"
                >
                  {companyMode === 'write' ? (
                    <>
                      <Building className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Empresa Existente</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>+ Escribir / Nueva Empresa</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {companyMode === 'select' ? (
              <div>
                <select
                  value={companyId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setCompanyId(selectedId);
                    if (selectedId) {
                      const found = companies.find((c) => c.id === selectedId);
                      if (found) setCompanyName(found.name);
                    } else {
                      setCompanyName('');
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">-- Sin empresa / Seleccionar cuenta ({companies.length}) --</option>
                  {companies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} {comp.industry ? `(${comp.industry})` : ''}
                    </option>
                  ))}
                </select>
                {companyId && (
                  <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Empresa seleccionada: <strong>{companyName}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <div ref={companyBoxRef} className="relative">
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Escribe el nombre de la empresa o negocio..."
                    value={companyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    onFocus={() => {
                      if (companyName.trim().length > 0) {
                        setShowCompanySuggestions(true);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 pl-9 pr-8 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {companyName && (
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyName('');
                        setCompanyId('');
                        setShowCompanySuggestions(false);
                      }}
                      className="absolute right-2.5 top-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Limpiar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Lista desplegable flotante de coincidencias en vivo */}
                {showCompanySuggestions && matchingCompanies.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>Empresas similares encontradas ({matchingCompanies.length})</span>
                      <span className="text-[9px] lowercase font-normal text-slate-500">clic para vincular</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {matchingCompanies.map((comp) => {
                        const isSelected = comp.id === companyId;
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => handleSelectSuggestedCompany(comp)}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors group ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/60'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                {comp.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {comp.industry && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {comp.industry}
                                </span>
                              )}
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notificaciones y estados del campo */}
                {companyId && companyName ? (
                  <div className="flex items-center justify-between mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <div className="flex items-center gap-1.5 font-medium truncate">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Empresa existente vinculada:</span>
                      <strong className="truncate">{companyName}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCompanyId('')}
                      className="ml-2 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-white underline text-[10px] shrink-0"
                    >
                      Desvincular
                    </button>
                  </div>
                ) : companyName.trim().length > 0 ? (
                  <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-[11px] text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Nueva empresa: se creará automáticamente <strong>&quot;{companyName.trim()}&quot;</strong> al guardar.</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 3. Cargo / Rol con Selección Rápida */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Cargo o Rol
            </label>
            <div className="relative mb-1.5">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ej. Dueño, Gestor de compras, Gte de mercadeo..."
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 pl-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Pills de Selección Rápida */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: '👑 Dueño / Director', value: 'Dueño / Director General' },
                { label: '🛒 Compras', value: 'Gestor de Compras' },
                { label: '📢 Mercadeo', value: 'Gerente de Mercadeo' },
                { label: '💼 Ventas', value: 'Gerente de Ventas' },
                { label: '👔 Administración', value: 'Administrador / Finanzas' },
              ].map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setJobTitle(jobTitle === chip.value ? '' : chip.value)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    jobTitle === chip.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/70'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Nota Rápida / ¿Qué busca? */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Nota Rápida / ¿Qué necesita?
            </label>
            <textarea
              rows={2}
              placeholder="ej. Interesado en rotulación comercial o pantallas LED, volver a llamar el martes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
          </div>

          {/* 5. Prioridad Comercial: Llamar Hoy */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Prioridad de Contacto: Llamar Hoy</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Prioridad Inmediata
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Entra de inmediato a tu lista de <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Llamar Hoy</strong> en el Resumen para contactarlo hoy.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <input
                type="datetime-local"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="w-full sm:w-44 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/80 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          {/* 6. Acordeón Opcional: Más detalles (Correo, Foto, Propuesta, Seguimiento) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 transition-colors">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  {showAdvanced
                    ? 'Ocultar campos adicionales'
                    : '+ Agregar más detalles (Foto, cotización inicial, asesor asignado...)'}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showAdvanced && (
              <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900/60 animate-fadeIn">
                {/* Fotografía de Perfil */}
                <ImageInput
                  label="Fotografía de Perfil (Opcional)"
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  placeholder="Subir foto del cliente o pegar URL..."
                />

                {/* Propuesta / Oportunidad Inicial */}
                <div className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                    Cotización / Propuesta Inicial (Opcional)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Título ej. Branding 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <select
                        value={proposalCurrency}
                        onChange={(e) => setProposalCurrency(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      >
                        <option value="HNL">🇭🇳 HNL (L)</option>
                        <option value="USD">🇺🇸 USD ($)</option>
                        <option value="EUR">🇪🇺 EUR (€)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        value={estimatedValue}
                        onChange={(e) => setEstimatedValue(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      >
                        {STAGE_KEYS.map((key) => {
                          const st = STAGES[key];
                          return (
                            <option key={st.key} value={st.key}>
                              {st.label}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Vendedor Asignado y Próximo Seguimiento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Asesor de Venta</span>
                      {currentUser?.role !== 'ADMIN' && (
                        <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          Solo Admin reasigna
                        </span>
                      )}
                    </label>

                    {currentUser?.role === 'ADMIN' ? (
                      <select
                        value={assignedToId}
                        onChange={(e) => setAssignedToId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      >
                        <option value={currentUser?.id}>
                          {currentUser?.name} (Tú - Admin)
                        </option>
                        {advisors
                          .filter((adv) => adv.id !== currentUser?.id)
                          .map((adv) => (
                            <option key={adv.id} value={adv.id}>
                              {adv.name} ({adv.role})
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="w-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span className="font-semibold">
                          {leadToEdit?.assignedTo?.name || currentUser?.name || 'Tú (Asesor)'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                          Asignado
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Motivo o Tarea de Seguimiento
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Enviar propuesta o coordinar reunión..."
                      value={nextFollowUpTask}
                      onChange={(e) => setNextFollowUpTask(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{loading ? 'Guardando...' : leadToEdit ? 'Guardar Cambios' : 'Guardar Lead Inmediato'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
