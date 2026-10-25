export interface StageConfig {
  key: string;
  label: string;
  description: string;
  badgeClass: string;
  headerBorder: string;
}

export const STAGES: Record<string, StageConfig> = {
  NUEVO: {
    key: 'NUEVO',
    label: 'Nuevo Prospecto',
    description: 'Recién ingresado o sin contactar',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20',
    headerBorder: 'border-t-sky-500',
  },
  CONTACTADO: {
    key: 'CONTACTADO',
    label: 'Diagnóstico / Contactado',
    description: 'En llamada, levantando brief o requerimientos',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
    headerBorder: 'border-t-amber-500',
  },
  PROPUESTA: {
    key: 'PROPUESTA',
    label: 'Propuesta Enviada',
    description: 'Cotización o propuesta formal entregada',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20',
    headerBorder: 'border-t-purple-500',
  },
  NEGOCIACION: {
    key: 'NEGOCIACION',
    label: 'En Negociación',
    description: 'Ajustando términos, pagos o alcances',
    badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20',
    headerBorder: 'border-t-indigo-500',
  },
  GANADO: {
    key: 'GANADO',
    label: 'Venta Cerrada (Ganada)',
    description: 'Propuesta aprobada, contrato/orden cerrada',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
    headerBorder: 'border-t-emerald-500',
  },
  PERDIDO: {
    key: 'PERDIDO',
    label: 'Cerrado Perdido',
    description: 'No se concretó o descartado',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20',
    headerBorder: 'border-t-rose-500',
  },
};

// Compatibility aliases
STAGES['ENVIADA'] = STAGES['PROPUESTA'];
STAGES['VENTA'] = STAGES['GANADO'];
STAGES['PERDIDA'] = STAGES['PERDIDO'];

export const STAGE_KEYS = ['NUEVO', 'CONTACTADO', 'PROPUESTA', 'NEGOCIACION', 'GANADO', 'PERDIDO'];

export const PROPOSAL_STAGES = STAGES;

export const SERVICES = [
  'Branding & Identidad',
  'Desarrollo Web & E-commerce',
  'Social Media & Pauta',
  'Producción Audiovisual',
  'Estrategia 360',
  'Diseño Gráfico & Publicitario',
  'Consultoría & Diagnóstico',
];

export const ACTIVITY_TYPES = [
  { key: 'LLAMADA', label: 'Llamada Telefónica', icon: 'Phone' },
  { key: 'WHATSAPP', label: 'Mensaje WhatsApp', icon: 'MessageSquare' },
  { key: 'REUNION', label: 'Reunión / Briefing', icon: 'Calendar' },
  { key: 'CORREO', label: 'Correo Electrónico', icon: 'Mail' },
  { key: 'NOTA', label: 'Nota Interna', icon: 'FileText' },
  { key: 'VENTA_CERRADA', label: 'Venta Cerrada', icon: 'Award' },
];

export const DEFAULT_MOTIVATIONAL_QUOTES: string[] = [
  'Cada llamada y cada seguimiento es una oportunidad para superar tus límites. ¡Hoy se cierran grandes tratos!',
  'El éxito en las ventas no es cuestión de suerte, es la disciplina y pasión de aportar valor real a cada cliente.',
  'No vendas un producto o servicio; entrega soluciones que transformen e impulsen el negocio de tu cliente.',
  'Tu actitud y perseverancia determinan tu altitud: cada conversación de hoy construye el cierre de mañana.',
];

