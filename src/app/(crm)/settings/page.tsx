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
} from 'lucide-react';
import ImageInput from '@/components/ImageInput';

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
                placeholder="ej. PixelMedia • Inversiones Publimatec"
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
                placeholder="contacto@pixelmediahn.com"
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
