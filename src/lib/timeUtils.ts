/**
 * Utilidades de tiempo, medición de inactividad (staleness),
 * cálculo del ciclo comercial (Sales Cycle) y formateo de fechas en español.
 */

export type StalenessLevel = 'fresh' | 'attention' | 'stale';

export interface StalenessInfo {
  days: number;
  level: StalenessLevel;
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotColor: string;
}

/**
 * Calcula la diferencia en días enteros entre dos fechas.
 */
export function getDaysDiff(
  startDate: Date | string | null | undefined,
  endDate: Date | string = new Date()
): number {
  if (!startDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffTime = Math.max(0, end - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evalúa el nivel de inactividad / días sin respuesta de un prospecto o cliente.
 * - Verde (fresh): 0 - 2 días
 * - Amarillo (attention): 3 - 6 días sin respuesta
 * - Rojo (stale): 7+ días sin respuesta / en riesgo de enfriarse
 */
export function getStalenessInfo(
  lastDate?: Date | string | null
): StalenessInfo {
  if (!lastDate) {
    return {
      days: 99,
      level: 'stale',
      label: 'Sin registros recientes',
      shortLabel: '+7d',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
      dotColor: 'bg-rose-500',
    };
  }

  const days = getDaysDiff(lastDate);

  if (days === 0) {
    return {
      days: 0,
      level: 'fresh',
      label: 'Activo hoy',
      shortLabel: 'Hoy',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  }

  if (days === 1) {
    return {
      days: 1,
      level: 'fresh',
      label: 'Contacto ayer',
      shortLabel: '1d',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  }

  if (days === 2) {
    return {
      days: 2,
      level: 'fresh',
      label: 'Hace 2 días',
      shortLabel: '2d',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  }

  if (days <= 6) {
    return {
      days,
      level: 'attention',
      label: `${days} días sin contacto`,
      shortLabel: `${days}d`,
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
      dotColor: 'bg-amber-500',
    };
  }

  return {
    days,
    level: 'stale',
    label: `${days} días sin respuesta (Alerta)`,
    shortLabel: `${days}d`,
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
    dotColor: 'bg-rose-500',
  };
}

/**
 * Formato de fecha legible en español para Honduras/Centroamérica.
 */
export function formatFriendlyDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-HN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formato de fecha con hora.
 */
export function formatFriendlyDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-HN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcula la duración del ciclo comercial en días.
 */
export function calculateCycleDuration(
  firstContactDate?: Date | string | null,
  closedDate?: Date | string | null
): number {
  if (!firstContactDate) return 0;
  const start = new Date(firstContactDate);
  const end = closedDate ? new Date(closedDate) : new Date();
  return getDaysDiff(start, end);
}

/**
 * Obtiene los límites de tiempo de 'fin del día de hoy' (23:59:59.999)
 * y 'fin del día de mañana' (23:59:59.999) en la zona horaria del negocio
 * (por defecto Honduras 'America/Tegucigalpa', UTC-6).
 * Esto garantiza que al pasar las 12 de la noche en hora local,
 * las tareas de seguimiento se activen automáticamente para HOY.
 */
export function getBusinessDayBoundaries(tz = 'America/Tegucigalpa'): {
  startOfToday: Date;
  endOfToday: Date;
  endOfTomorrow: Date;
} {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  }).formatToParts(now).reduce((acc: any, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});

  const localDateStr = `${parts.year}-${parts.month}-${parts.day}`;
  
  // Honduras está en UTC-6 todo el año
  const startOfToday = new Date(`${localDateStr}T00:00:00.000-06:00`);
  const endOfToday = new Date(`${localDateStr}T23:59:59.999-06:00`);

  const nextDay = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + 1));
  const tomParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(nextDay).reduce((acc: any, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const tomDateStr = `${tomParts.year}-${tomParts.month}-${tomParts.day}`;
  const endOfTomorrow = new Date(`${tomDateStr}T23:59:59.999-06:00`);

  return { startOfToday, endOfToday, endOfTomorrow };
}
