'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Building2,
  Mail,
  Phone,
  MapPin,
  Percent,
  TrendingUp,
  Save,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Quote,
  Trash2,
  Plus,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import ImageInput from '@/components/ImageInput';
import {
  DEFAULT_MOTIVATIONAL_QUOTES,
  parseQuote,
  serializeQuote,
  MotivationalQuote,
} from '@/lib/constants';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [taxRate, setTaxRate] = useState('15');
  const [monthlySalesTarget, setMonthlySalesTarget] = useState('15000');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [motivationalQuotes, setMotivationalQuotes] = useState<string[]>([]);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newQuoteContext, setNewQuoteContext] = useState('');

  const fetchSettings = () => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          setCompanyName(data.settings.companyName || '');
          setCurrency(data.settings.currency || 'USD');
          setCurrencySymbol(data.settings.currencySymbol || '$');
          setTaxRate(data.settings.taxRate?.toString() || '15');
          setMonthlySalesTarget(data.settings.monthlySalesTarget?.toString() || '15000');
          setPhone(data.settings.phone || '');
          setEmail(data.settings.email || '');
          setAddress(data.settings.address || '');
          setLogoUrl(data.settings.logoUrl || '');
          setMotivationalQuotes(
            data.settings.motivationalQuotes && data.settings.motivationalQuotes.length > 0
              ? data.settings.motivationalQuotes
              : DEFAULT_MOTIVATIONAL_QUOTES
          );
        }
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
    fetchSettings();
    fetchUser();
  }, []);

  const handleCurrencyChange = (curr: string) => {
    setCurrency(curr);
    if (curr === 'USD') setCurrencySymbol('$');
    else if (curr === 'HNL') setCurrencySymbol('L');
    else if (curr === 'EUR') setCurrencySymbol('€');
  };

  const handleAddQuote = () => {
    const trimmedText = newQuoteText.trim();
    if (!trimmedText) return;
    const serialized = serializeQuote({
      quote: trimmedText,
      author: newQuoteAuthor.trim() || 'Referente en Ventas',
      context: newQuoteContext.trim() || 'Filosofía comercial',
    });
    setMotivationalQuotes([...motivationalQuotes, serialized]);
    setNewQuoteText('');
    setNewQuoteAuthor('');
    setNewQuoteContext('');
  };

  const handleRemoveQuote = (index: number) => {
    setMotivationalQuotes(motivationalQuotes.filter((_, i) => i !== index));
  };

  const handleResetDefaultQuotes = () => {
    setMotivationalQuotes([...DEFAULT_MOTIVATIONAL_QUOTES]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          currency,
          currencySymbol,
          taxRate,
          monthlySalesTarget,
          phone,
          email,
          address,
          logoUrl,
          motivationalQuotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar configuración');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Parámetros del Sistema
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Configuración General & Comercial
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ajusta la moneda de cotización, datos institucionales, logotipo y metas comerciales
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configuración guardada exitosamente</span>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center gap-3 text-amber-700 dark:text-amber-400 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Estás visualizando las configuraciones en modo lectura. Solo los usuarios con rol de <strong>Dirección / Administrador</strong> pueden guardar cambios en estos parámetros.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 text-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Identidad Corporativa */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Identidad de la Organización & Logotipo
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Empresa o Marca Comercial *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ej. PUBLIMATEC CRM"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              />
            </div>

            <div>
              <ImageInput
                label="Logotipo del CRM / Empresa"
                value={logoUrl}
                onChange={setLogoUrl}
                shape="square"
                placeholder="Subir logo o pegar URL..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp / Teléfono Institucional
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+504 9900-1122"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico de Contacto
              </label>
              <input
                type="email"
                disabled={!isAdmin}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@publimatec.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dirección Física / Oficina Principal
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ej. Barrio Los Andes, San Pedro Sula, Cortés, Honduras"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Sección: Finanzas, Moneda y Cotizaciones */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Moneda de Cotización & Parámetros Financieros
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Moneda Principal del CRM
              </label>
              <select
                disabled={!isAdmin}
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              >
                <option value="USD">USD - Dólares Estadounidenses ($)</option>
                <option value="HNL">HNL - Lempiras Hondureñas (L)</option>
                <option value="EUR">EUR - Euros (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Símbolo de la Moneda
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="$"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tasa de Impuesto / ISV (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  disabled={!isAdmin}
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="15"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                  %
                </span>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meta Mensual de Ventas ({currencySymbol})
              </label>
              <div className="relative max-w-sm">
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={monthlySalesTarget}
                  onChange={(e) => setMonthlySalesTarget(e.target.value)}
                  placeholder="15000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                  {currency}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Objetivo comercial para calcular el porcentaje de logro mensual en reportes y dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Frases Motivadoras del Dashboard */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Quote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Frases Motivadoras del Dashboard</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-400">
                    {motivationalQuotes.length} activas
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Estas frases se seleccionan al azar para darle la bienvenida y motivar las ventas de cada asesor al ingresar.
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleResetDefaultQuotes}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Restablecer a frases sugeridas predeterminadas"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar sugeridas</span>
              </button>
            )}
          </div>

          {/* Form to add a new quote */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Agregar Nueva Cita o Frase Motivadora</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Cita o Frase de Ventas *
                </label>
                <textarea
                  rows={2}
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  placeholder="ej. Puedes conseguir todo lo que quieras en la vida si ayudas a suficientes personas..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Persona Real o Libro *
                  </label>
                  <input
                    type="text"
                    value={newQuoteAuthor}
                    onChange={(e) => setNewQuoteAuthor(e.target.value)}
                    placeholder="ej. Zig Ziglar o Dale Carnegie"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Quién es / Contexto (1 línea) *
                  </label>
                  <input
                    type="text"
                    value={newQuoteContext}
                    onChange={(e) => setNewQuoteContext(e.target.value)}
                    placeholder="ej. Maestro mundial de ventas y autor de 'Nos vemos en la cumbre'"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddQuote}
                  disabled={!newQuoteText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Frase</span>
                </button>
              </div>
            </div>
          )}

          {/* List of quotes */}
          <div className="space-y-2.5 pt-2">
            {motivationalQuotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No hay frases configuradas actualmente. Haz clic en "Restaurar sugeridas" o escribe una arriba.
              </p>
            ) : (
              motivationalQuotes.map((rawQuote, idx) => {
                const item = parseQuote(rawQuote);
                return (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 hover:border-indigo-300 dark:hover:border-indigo-800/60 transition-colors group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xs font-black text-indigo-500 mt-0.5">#{idx + 1}</span>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed">
                          "{item.quote}"
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/50">
                            {item.author}
                          </span>
                          {item.context && (
                            <span className="text-slate-500 dark:text-slate-400">
                              • {item.context}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuote(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                        title="Eliminar frase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer actions */}
        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando cambios...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
