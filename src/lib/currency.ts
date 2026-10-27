export type CurrencyCode = 'HNL' | 'USD' | 'EUR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  HNL: { code: 'HNL', symbol: 'L', name: 'Lempira hondureño', flag: '🇭🇳' },
  USD: { code: 'USD', symbol: '$', name: 'Dólar estadounidense', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
};

// Tasas de cambio base respecto a 1 USD (fallback offline / inicial)
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.894, // 1 EUR ≈ 1.118 USD
  HNL: 26.85, // 1 USD ≈ 26.85 HNL
};

/**
 * Convierte un monto entre cualquier par de monedas soportadas (USD, EUR, HNL).
 *
 * @param amount Monto a convertir
 * @param from Moneda origen ('HNL' | 'USD' | 'EUR')
 * @param to Moneda destino ('HNL' | 'USD' | 'EUR')
 * @param rates Diccionario de tasas con base USD (ej. { USD: 1, EUR: 0.894, HNL: 26.85 })
 * @returns Monto convertido redondeado a 2 decimales
 */
export function convertCurrency(
  amount: number | null | undefined,
  from: string = 'HNL',
  to: string = 'HNL',
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number {
  const safeAmount = Number(amount) || 0;
  if (safeAmount === 0) return 0;

  const fromCode = (from || 'HNL').toUpperCase();
  const toCode = (to || 'HNL').toUpperCase();

  if (fromCode === toCode) return safeAmount;

  const rateFrom = Number(rates[fromCode]) || DEFAULT_EXCHANGE_RATES[fromCode] || 1;
  const rateTo = Number(rates[toCode]) || DEFAULT_EXCHANGE_RATES[toCode] || 1;

  // Paso 1: Convertir de moneda origen a USD (base)
  const amountInUSD = safeAmount / rateFrom;
  // Paso 2: Convertir de USD a moneda destino
  const converted = amountInUSD * rateTo;

  return Math.round(converted * 100) / 100;
}

/**
 * Formatea un número como dinero con el símbolo y formato de la moneda dada.
 */
export function formatCurrencyValue(
  amount: number | null | undefined,
  currencyCode: string = 'HNL'
): string {
  const safeAmount = Number(amount) || 0;
  const code = (currencyCode || 'HNL').toUpperCase() as CurrencyCode;
  const symbol = CURRENCIES[code]?.symbol || '$';

  return `${symbol} ${safeAmount.toLocaleString('es-HN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
