'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SettingsContextType {
  currency: string;
  currencySymbol: string;
  companyName: string;
  taxRate: number;
  monthlySalesTarget: number;
  formatMoney: (amount: number | null | undefined) => string;
  refreshSettings: () => Promise<void>;
}

const defaultContext: SettingsContextType = {
  currency: 'HNL',
  currencySymbol: 'L',
  companyName: 'PUBLIMATEC CRM',
  taxRate: 15,
  monthlySalesTarget: 120000,
  formatMoney: (amount) => `L ${(amount || 0).toLocaleString('es-HN')}`,
  refreshSettings: async () => {},
};

const SettingsContext = createContext<SettingsContextType>(defaultContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState({
    currency: 'HNL',
    currencySymbol: 'L',
    companyName: 'PUBLIMATEC CRM',
    taxRate: 15,
    monthlySalesTarget: 120000,
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({
            currency: data.settings.currency || 'HNL',
            currencySymbol: data.settings.currencySymbol || 'L',
            companyName: data.settings.companyName || 'PUBLIMATEC CRM',
            taxRate: data.settings.taxRate ?? 15,
            monthlySalesTarget: data.settings.monthlySalesTarget ?? 120000,
          });
        }
      }
    } catch (e) {
      console.error('Error al cargar configuración:', e);
    }
  };

  useEffect(() => {
    fetchSettings();

    const handleUpdate = () => {
      fetchSettings();
    };
    window.addEventListener('crm-settings-updated', handleUpdate);
    return () => window.removeEventListener('crm-settings-updated', handleUpdate);
  }, []);

  const formatMoney = (amount: number | null | undefined): string => {
    const safeAmount = amount || 0;
    return `${settings.currencySymbol} ${safeAmount.toLocaleString('es-HN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
        companyName: settings.companyName,
        taxRate: settings.taxRate,
        monthlySalesTarget: settings.monthlySalesTarget,
        formatMoney,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
