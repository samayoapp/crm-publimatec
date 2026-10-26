'use client';

import { useState, useEffect } from 'react';
import {
  X,
  User,
  Building,
  Phone,
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
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [notes, setNotes] = useState('');

  // Advanced / Optional states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('NUEVO');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [nextFollowUpTask, setNextFollowUpTask] = useState('');

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
      setIsCustomCompany(!cId && Boolean(cName));

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
        leadToEdit.email ||
        leadToEdit.avatarUrl ||
        leadToEdit.nextFollowUp ||
        (leadToEdit.proposals && leadToEdit.proposals.length > 0)
      );
      setShowAdvanced(hasAdvanced);
    } else {
      // Clean defaults for quick new contact
      setContactName('');
      setPhone('');
      setJobTitle('');
      setCompanyId(defaultCompanyId || '');
      setCompanyName(defaultCompanyName || '');
      setIsCustomCompany(Boolean(defaultCompanyName && !defaultCompanyId));
      setEmail('');
      setAvatarUrl('');
      setTitle('');
      setStage('NUEVO');
      setEstimatedValue('');
      setAssignedToId(currentUser?.id || '');
      setNotes('');
      // Asignar automáticamente 48 horas como regla comercial de contacto
      const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      const defaultDateStr = `${in48h.getFullYear()}-${pad(in48h.getMonth() + 1)}-${pad(in48h.getDate())}T${pad(in48h.getHours())}:${pad(in48h.getMinutes())}`;
      setNextFollowUp(defaultDateStr);
      setNextFollowUpTask('Primer contacto / Seguimiento comercial (48h)');
      setShowAdvanced(false);
    }
    setError(null);
  }, [leadToEdit, isOpen, currentUser, defaultCompanyId, defaultCompanyName]);

  if (!isOpen) return null;

  const handleCompanySelect = (selectedId: string) => {
    if (selectedId === 'CUSTOM_NEW') {
      setIsCustomCompany(true);
      setCompanyId('');
      setCompanyName('');
      return;
    }
    setCompanyId(selectedId);
    setIsCustomCompany(false);
    if (selectedId) {
      const found = companies.find((c) => c.id === selectedId);
      if (found) setCompanyName(found.name);
    } else {
      setCompanyName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      setError('Por favor ingresa el nombre de la persona');
      return;
    }
    if (!phone.trim()) {
      setError('Por favor ingresa un número de teléfono o WhatsApp');
      return;
    }

    setLoading(true);
    setError(null);

    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const finalFollowUp = nextFollowUp ? new Date(nextFollowUp).toISOString() : in48h.toISOString();
    const finalTask = nextFollowUpTask.trim() || 'Primer contacto / Seguimiento comercial (48h)';

    const payload: any = {
      name: contactName.trim(),
      phone: phone.trim(),
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
      payload.currency = currency || 'HNL';
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
          {/* 1. Datos Esenciales: Persona & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                WhatsApp / Teléfono <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="ej. 9888-2233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 pl-9 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>

          {/* 2. Empresa o Negocio (Flujo Unificado & Inteligente) */}
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
                    setIsCustomCompany(!isCustomCompany);
                    if (!isCustomCompany) setCompanyId('');
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  {isCustomCompany ? 'Elegir de lista existente' : '+ Escribir otra empresa'}
                </button>
              )}
            </div>

            {companies.length > 0 && !isCustomCompany ? (
              <select
                value={companyId}
                onChange={(e) => handleCompanySelect(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">-- Sin empresa / Seleccionar cuenta --</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} {comp.industry ? `(${comp.industry})` : ''}
                  </option>
                ))}
                <option value="CUSTOM_NEW">+ Escribir nueva empresa / negocio...</option>
              </select>
            ) : (
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  list="lead-companies-datalist"
                  placeholder="ej. Distribuidora del Caribe o Café Monte Alto"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    const match = companies.find(
                      (c) => c.name.toLowerCase() === e.target.value.toLowerCase().trim()
                    );
                    if (match) setCompanyId(match.id);
                    else setCompanyId('');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 pl-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <datalist id="lead-companies-datalist">
                  {companies.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
            )}

            {/* Quick Suggestions if companies exist and not selected */}
            {companies.length > 0 && !companyId && !companyName && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                <span className="text-[10px] text-slate-400 mr-1">Recientes:</span>
                {companies.slice(0, 3).map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => {
                      setCompanyId(comp.id);
                      setCompanyName(comp.name);
                      setIsCustomCompany(false);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-700/60 transition-colors"
                  >
                    {comp.name}
                  </button>
                ))}
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

          {/* 5. Regla Comercial Automática: Próximo Seguimiento (48 Horas) */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Próximo Seguimiento (Automático 48h)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Compromiso
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Límite asignado para llamar o contactar a este prospecto y evitar inacción.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <input
                type="datetime-local"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="w-full sm:w-44 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
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
                    : '+ Agregar más detalles (Correo, foto, cotización inicial, fecha de seguimiento)'}
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
                {/* Correo Electrónico */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico (opcional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="ej. contacto@empresa.hn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 pl-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>

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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1">
                      <input
                        type="text"
                        placeholder="Título ej. Branding 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={`Monto (${currencySymbol} ${currency})`}
                        value={estimatedValue}
                        onChange={(e) => setEstimatedValue(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                    <div>
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
