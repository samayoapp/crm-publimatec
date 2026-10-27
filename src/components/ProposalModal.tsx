'use client';

import { useState, useEffect } from 'react';
import { X, FileText, User, DollarSign, Sparkles, Trash2, Lock, Paperclip, ArrowRightLeft } from 'lucide-react';
import { STAGES, STAGE_KEYS } from '@/lib/constants';
import ProposalDocumentsManager from '@/components/ProposalDocumentsManager';
import { useSettings } from '@/lib/settingsContext';
import { CURRENCIES, CurrencyCode } from '@/lib/currency';

interface ContactOption {
  id: string;
  name: string;
  companyName?: string | null;
}

interface AdvisorOption {
  id: string;
  name: string;
  role: string;
}

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  proposalToEdit?: any | null;
  defaultContactId?: string | null;
  defaultCompanyId?: string | null;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

export default function ProposalModal({
  isOpen,
  onClose,
  onSaved,
  proposalToEdit,
  defaultContactId,
  defaultCompanyId,
  currentUser,
}: ProposalModalProps) {
  const { currency, currencySymbol, convert } = useSettings();
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState('');
  const [amount, setAmount] = useState('');
  const [proposalCurrency, setProposalCurrency] = useState('HNL');
  const [stage, setStage] = useState('NUEVO');
  const [notes, setNotes] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');

  useEffect(() => {
    if (isOpen) {
      // Fetch contacts
      fetch('/api/contacts')
        .then((res) => res.json())
        .then((data) => {
          if (data.contacts) setContacts(data.contacts);
        })
        .catch((err) => console.error(err));

      // Fetch advisors
      fetch('/api/team')
        .then((res) => res.json())
        .then((data) => {
          if (data.team) setAdvisors(data.team);
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (proposalToEdit) {
      setTitle(proposalToEdit.title || '');
      setContactId(proposalToEdit.contactId || proposalToEdit.contact?.id || '');
      setAmount(proposalToEdit.amount ? proposalToEdit.amount.toString() : '');
      setProposalCurrency(proposalToEdit.currency || currency || 'HNL');
      const rawStage = proposalToEdit.stage;
      setStage(rawStage === 'ENVIADA' ? 'PROPUESTA' : (rawStage || 'NUEVO'));
      setNotes(proposalToEdit.notes || '');
      setAssignedToId(proposalToEdit.assignedToId || proposalToEdit.assignedTo?.id || '');
    } else {
      setTitle('');
      setContactId(defaultContactId || '');
      setAmount('');
      setProposalCurrency(currency || 'HNL');
      setStage('NUEVO');
      setNotes('');
      setAssignedToId(currentUser?.id || '');
    }
    setActiveTab('details');
    setError(null);
  }, [proposalToEdit, defaultContactId, isOpen, currentUser, currency]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contactId) {
      setError('Por favor indica el título de la propuesta y el contacto');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      contactId,
      amount: parseFloat(amount) || 0,
      currency: proposalCurrency,
      stage,
      notes: notes.trim() || null,
      assignedToId: assignedToId || null,
      companyId: defaultCompanyId || proposalToEdit?.companyId || null,
    };

    try {
      const url = proposalToEdit ? `/api/proposals/${proposalToEdit.id}` : '/api/proposals';
      const method = proposalToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la propuesta');
      }

      window.dispatchEvent(new CustomEvent('crm-proposal-saved'));
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProposal = async () => {
    if (!proposalToEdit) return;
    if (!confirm(`¿Estás seguro de eliminar la propuesta "${proposalToEdit.title}"?`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/${proposalToEdit.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar propuesta');
      }
      window.dispatchEvent(new CustomEvent('crm-proposal-saved'));
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar propuesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {proposalToEdit ? 'Propuesta Comercial' : 'Nueva Propuesta Comercial'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PUBLIMATEC CRM • Inversiones Publimatec S.A.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher when editing proposal */}
        {proposalToEdit && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 -mx-6 px-6 pt-2 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Detalles Generales</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'documents'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Documentos & Anexos</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Content based on Active Tab */}
        {activeTab === 'documents' && proposalToEdit ? (
          <div className="mt-4 space-y-4">
            <ProposalDocumentsManager
              proposalId={proposalToEdit.id}
              proposalTitle={proposalToEdit.title}
              clientName={proposalToEdit.contact?.name || 'Cliente'}
              clientPhone={proposalToEdit.contact?.phone}
              currentUser={currentUser}
            />
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Título de la propuesta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título del Proyecto / Cotización *
            </label>
            <input
              type="text"
              required
              placeholder="ej. Rediseño Web Corporativa + Catálogo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Contacto al que pertenece */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente / Contacto Asociado *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                required
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 pl-9 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">-- Seleccionar cliente --</option>
                {contacts.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Moneda, Monto y Etapa Comercial */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* 1. Selector de Moneda */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Moneda de Venta *
              </label>
              <select
                value={proposalCurrency}
                onChange={(e) => setProposalCurrency(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-bold"
              >
                <option value="HNL">🇭🇳 HNL - Lempiras (L)</option>
                <option value="USD">🇺🇸 USD - Dólares ($)</option>
                <option value="EUR">🇪🇺 EUR - Euros (€)</option>
              </select>
            </div>

            {/* 2. Monto de la Propuesta */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monto ({CURRENCIES[proposalCurrency as CurrencyCode]?.symbol || '$'}) *
              </label>
              <div className="relative">
                <span className="text-xs font-extrabold text-slate-400 absolute left-2.5 top-2">
                  {CURRENCIES[proposalCurrency as CurrencyCode]?.symbol || '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-2 pl-7 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold"
                />
              </div>
            </div>

            {/* 3. Etapa del Embudo */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Etapa de la Propuesta
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold"
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

          {/* Mini-card de Conversión Automática en Tiempo Real */}
          {parseFloat(amount) > 0 && (
            <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] flex flex-wrap items-center justify-between gap-1.5 animate-fadeIn">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Conversión al cambio vigente:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                {proposalCurrency !== 'HNL' && (
                  <span className="text-indigo-600 dark:text-indigo-400">
                    L {convert(parseFloat(amount), proposalCurrency, 'HNL').toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HNL
                  </span>
                )}
                {proposalCurrency !== 'USD' && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    $ {convert(parseFloat(amount), proposalCurrency, 'USD').toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                )}
                {proposalCurrency !== 'EUR' && (
                  <span className="text-purple-600 dark:text-purple-400">
                    € {convert(parseFloat(amount), proposalCurrency, 'EUR').toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Vendedor Asignado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Vendedor a Cargo</span>
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
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value={currentUser?.id}>
                  {currentUser?.name} (Tú - Admin)
                </option>
                {advisors
                  .filter((adv: any) => adv.id !== currentUser?.id)
                  .map((adv: any) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.name} ({adv.role})
                    </option>
                  ))}
              </select>
            ) : (
              <div className="w-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span className="font-semibold">
                  {proposalToEdit?.assignedTo?.name || currentUser?.name || 'Tú (Asesor)'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  Asignado
                </span>
              </div>
            )}
          </div>

          {/* Notas y Alcance */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alcance o Notas de la Cotización
            </label>
            <textarea
              rows={2}
              placeholder="Entregables principales, plazos de pago o acuerdos conversados..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              {proposalToEdit && (
                <button
                  type="button"
                  onClick={handleDeleteProposal}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Propuesta</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Guardando...' : proposalToEdit ? 'Actualizar Propuesta' : 'Crear Propuesta'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  </div>
);
}
