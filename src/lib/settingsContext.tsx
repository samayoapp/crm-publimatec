'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CURRENCIES,
  CurrencyCode,
  DEFAULT_EXCHANGE_RATES,
  convertCurrency,
  formatCurrencyValue,
} from './currency';

export interface SettingsContextType {
  // Configuración global del Director
  globalCurrency: string;
  globalCurrencySymbol: string;
  companyName: string;
  taxRate: number;
  monthlySalesTarget: number;

  // Moneda preferida activa del usuario
  userCurrency: string;
  userCurrencySymbol: string;

  // Alias para retrocompatibilidad directa
  currency: string;
  currencySymbol: string;

  // Tipos de cambio y conversión
  rates: Record<string, number>;
  ratesUpdatedAt: string | null;
  convert: (amount: number | null | undefined, fromCurrency?: string, toCurrency?: string) => number;
  formatMoney: (amount: number | null | undefined, fromCurrency?: string, targetCurrency?: string) => string;
  formatOriginal: (amount: number | null | undefined, currencyCode?: string) => string;
  setUserCurrency: (currencyCode: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshRates: (force?: boolean) => Promise<void>;
}

const defaultContext: SettingsContextType = {
  globalCurrency: 'HNL',
  globalCurrencySymbol: 'L',
  companyName: 'PUBLIMATEC CRM',
  taxRate: 15,
  monthlySalesTarget: 120000,
  userCurrency: 'HNL',
  userCurrencySymbol: 'L',
  currency: 'HNL',
  currencySymbol: 'L',
  rates: DEFAULT_EXCHANGE_RATES,
  ratesUpdatedAt: null,
  convert: (amount) => Number(amount) || 0,
  formatMoney: (amount) => `L ${(amount || 0).toLocaleString('es-HN')}`,
  formatOriginal: (amount, code) => `${code || 'HNL'} ${(amount || 0).toLocaleString('es-HN')}`,
  setUserCurrency: async () => {},
  refreshSettings: async () => {},
  refreshRates: async () => {},
};

const SettingsContext = createContext<SettingsContextType>(defaultContext);

// Cache estática en memoria para que la navegación entre pantallas sea instantánea (0ms)
let cachedGlobalSettings: {
  currency: string;
  currencySymbol: string;
  companyName: string;
  taxRate: number;
  monthlySalesTarget: number;
} | null = null;
let cachedUserCurrency: string | null = null;
let cachedRates: Record<string, number> | null = null;
let cachedRatesUpdatedAt: string | null = null;

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [globalSettings, setGlobalSettings] = useState(() => cachedGlobalSettings || {
    currency: 'HNL',
    currencySymbol: 'L',
    companyName: 'PUBLIMATEC CRM',
    taxRate: 15,
    monthlySalesTarget: 120000,
  });

  const [userPreferredCurrency, setUserPreferredCurrency] = useState<string>(() => cachedUserCurrency || 'HNL');
  const [rates, setRates] = useState<Record<string, number>>(() => cachedRates || DEFAULT_EXCHANGE_RATES);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(() => cachedRatesUpdatedAt);

  // 1. Obtener perfil del usuario autenticado (para conocer su moneda de trabajo preferida)
  const fetchUserProfile = async (force = false) => {
    if (!force && cachedUserCurrency) return;
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.user?.preferredCurrency) {
          const curr = data.user.preferredCurrency.toUpperCase();
          cachedUserCurrency = curr;
          setUserPreferredCurrency(curr);
        }
      }
    } catch (e) {
      console.warn('Error al obtener moneda de preferencia del usuario:', e);
    }
  };

  // 2. Obtener configuración global del CRM (establecida por el Director)
  const fetchGlobalSettings = async (force = false) => {
    if (!force && cachedGlobalSettings) return;
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          const gCurr = data.settings.currency || 'HNL';
          const gSym = data.settings.currencySymbol || CURRENCIES[gCurr as CurrencyCode]?.symbol || 'L';
          const newSettings = {
            currency: gCurr,
            currencySymbol: gSym,
            companyName: data.settings.companyName || 'PUBLIMATEC CRM',
            taxRate: data.settings.taxRate ?? 15,
            monthlySalesTarget: data.settings.monthlySalesTarget ?? 120000,
          };
          cachedGlobalSettings = newSettings;
          setGlobalSettings(newSettings);
        }
      }
    } catch (e) {
      console.error('Error al cargar configuración global:', e);
    }
  };

  // 3. Obtener tipos de cambio vigentes
  const fetchRates = async (force: boolean = false) => {
    if (!force && cachedRates) return;
    try {
      const res = await fetch(`/api/currency/rates${force ? '?refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          const newRates = {
            USD: Number(data.rates.USD) || 1,
            EUR: Number(data.rates.EUR) || DEFAULT_EXCHANGE_RATES.EUR,
            HNL: Number(data.rates.HNL) || DEFAULT_EXCHANGE_RATES.HNL,
          };
          cachedRates = newRates;
          setRates(newRates);
        }
        if (data.updatedAt) {
          cachedRatesUpdatedAt = data.updatedAt;
          setRatesUpdatedAt(data.updatedAt);
        }
      }
    } catch (e) {
      console.warn('Error al consultar tipos de cambio:', e);
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
    fetchUserProfile();
    fetchRates();

    const handleSettingsUpdate = () => {
      fetchGlobalSettings(true);
      fetchRates(true);
    };

    const handleProfileUpdate = () => {
      fetchUserProfile(true);
    };

    window.addEventListener('crm-settings-updated', handleSettingsUpdate);
    window.addEventListener('crm-profile-updated', handleProfileUpdate);
    window.addEventListener('crm-currency-changed', handleProfileUpdate);

    return () => {
      window.removeEventListener('crm-settings-updated', handleSettingsUpdate);
      window.removeEventListener('crm-profile-updated', handleProfileUpdate);
      window.removeEventListener('crm-currency-changed', handleProfileUpdate);
    };
  }, []);

  // Moneda activa de visualización para el usuario actual
  const activeCurrency = (userPreferredCurrency || globalSettings.currency || 'HNL').toUpperCase();
  const activeSymbol = CURRENCIES[activeCurrency as CurrencyCode]?.symbol || activeCurrency;

  // Función universal de conversión
  const convert = useCallback(
    (amount: number | null | undefined, fromCurrency?: string, toCurrency?: string): number => {
      const from = (fromCurrency || activeCurrency).toUpperCase();
      const to = (toCurrency || activeCurrency).toUpperCase();
      return convertCurrency(amount, from, to, rates);
    },
    [activeCurrency, rates]
  );

  // Formateador principal: Convierte de fromCurrency a targetCurrency (o activeCurrency) y aplica formato
  const formatMoney = useCallback(
    (
      amount: number | null | undefined,
      fromCurrency?: string,
      targetCurrency?: string
    ): string => {
      const target = (targetCurrency || activeCurrency).toUpperCase();
      const from = (fromCurrency || target).toUpperCase();
      const converted = convertCurrency(amount, from, target, rates);
      return formatCurrencyValue(converted, target);
    },
    [activeCurrency, rates]
  );

  // Formateador sin conversión: Muestra el monto en su moneda original declarada
  const formatOriginal = useCallback(
    (amount: number | null | undefined, currencyCode?: string): string => {
      const code = (currencyCode || activeCurrency).toUpperCase();
      return formatCurrencyValue(amount, code);
    },
    [activeCurrency]
  );

  // Cambio dinámico de moneda de preferencia del usuario
  const setUserCurrency = async (newCurrency: string) => {
    const code = newCurrency.toUpperCase();
    setUserPreferredCurrency(code);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredCurrency: code }),
      });
      window.dispatchEvent(new CustomEvent('crm-currency-changed', { detail: { currency: code } }));
    } catch (err) {
      console.error('Error al guardar moneda de preferencia:', err);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        globalCurrency: globalSettings.currency,
        globalCurrencySymbol: globalSettings.currencySymbol,
        companyName: globalSettings.companyName,
        taxRate: globalSettings.taxRate,
        monthlySalesTarget: globalSettings.monthlySalesTarget,

        userCurrency: activeCurrency,
        userCurrencySymbol: activeSymbol,

        // Alias retrocompatibles
        currency: activeCurrency,
        currencySymbol: activeSymbol,

        rates,
        ratesUpdatedAt,
        convert,
        formatMoney,
        formatOriginal,
        setUserCurrency,
        refreshSettings: fetchGlobalSettings,
        refreshRates: fetchRates,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
