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
    label: 'Lista de Propuestas',
    description: 'Propuestas iniciales, solicitudes o en elaboración',
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

export interface MotivationalQuote {
  quote: string;
  author: string;
  context: string;
}

export const RAW_DEFAULT_QUOTES: MotivationalQuote[] = [
  {
    quote: 'Puedes conseguir todo lo que quieras en la vida si ayudas a suficientes personas a conseguir lo que ellas quieren.',
    author: 'Zig Ziglar',
    context: 'Pionero mundial del entrenamiento en ventas y autor de "Nos vemos en la cumbre"',
  },
  {
    quote: 'A las personas no les gusta que les vendan, pero les apasiona comprar. Conviértete en su aliado de confianza y no en un vendedor insistente.',
    author: 'Jeffrey Gitomer',
    context: 'Consultor comercial internacional y autor de "La pequeña biblia de las ventas"',
  },
  {
    quote: 'Cada "no" que recibes no es un rechazo personal, es simplemente un paso estadístico que te acerca al siguiente "sí".',
    author: 'Brian Tracy',
    context: 'Especialista en psicología comercial y autor de "Psicología de Ventas"',
  },
  {
    quote: 'Trata las ventas no como un simple empleo, sino como tu propio imperio comercial. El éxito requiere una dedicación diez veces mayor.',
    author: 'Grant Cardone',
    context: 'Empresario, estratega de negocios y autor de "La Regla 10X"',
  },
  {
    quote: 'Vender es una transferencia de certeza. Si tú crees con absoluta convicción en tu servicio, el cliente sentirá esa misma seguridad.',
    author: 'Jordan Belfort',
    context: 'Estratega de persuasión y ventas, autor de "El camino del Lobo"',
  },
  {
    quote: 'La única manera de influir en una persona es hablar de lo que a ella le interesa y enseñarle cómo conseguirlo.',
    author: 'Dale Carnegie',
    context: 'Pionero en relaciones humanas y autor de "Cómo ganar amigos e influir sobre las personas"',
  },
  {
    quote: 'Las grandes batallas se ganan antes de iniciar el combate: con preparación, investigación y anticipación a las necesidades del cliente.',
    author: 'Sun Tzu',
    context: 'Estratega y filósofo militar clásico, autor de "El Arte de la Guerra"',
  },
  {
    quote: 'El mejor servicio al cliente no es resolver un problema rápido, es conocer el negocio de tu cliente tan bien que te anticipes a lo que necesitará.',
    author: 'Chet Holmes',
    context: 'Asesor de empresas Fortune 500 y autor de "La máquina definitiva de ventas"',
  },
];

export function serializeQuote(q: MotivationalQuote): string {
  return JSON.stringify({
    quote: q.quote.trim(),
    author: q.author.trim(),
    context: q.context.trim(),
  });
}

export function parseQuote(raw: any): MotivationalQuote {
  if (!raw) {
    return RAW_DEFAULT_QUOTES[0];
  }

  if (typeof raw === 'object' && raw.quote) {
    return {
      quote: raw.quote,
      author: raw.author || 'Autor Anónimo',
      context: raw.context || '',
    };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const obj = JSON.parse(trimmed);
        if (obj.quote || obj.text) {
          return {
            quote: obj.quote || obj.text || '',
            author: obj.author || 'Autor Anónimo',
            context: obj.context || obj.role || '',
          };
        }
      } catch (e) {}
    }

    if (trimmed.includes(' | ')) {
      const parts = trimmed.split(' | ');
      return {
        quote: parts[0]?.trim() || trimmed,
        author: parts[1]?.trim() || 'Autor Anónimo',
        context: parts[2]?.trim() || '',
      };
    }

    return {
      quote: trimmed,
      author: 'Estratega Comercial',
      context: 'Filosofía y mejores prácticas de ventas',
    };
  }

  return {
    quote: String(raw),
    author: 'Estratega Comercial',
    context: '',
  };
}

export const DEFAULT_MOTIVATIONAL_QUOTES: string[] = RAW_DEFAULT_QUOTES.map(serializeQuote);

