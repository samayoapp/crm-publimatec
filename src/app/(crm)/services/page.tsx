import {
  Palette,
  Globe,
  Share2,
  Video,
  Layers,
  Sparkles,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export default function ServicesPage() {
  const services = [
    {
      title: 'Branding & Identidad Visual',
      badge: 'Core Creativo',
      icon: Palette,
      gradient: 'from-purple-500 to-indigo-600',
      description: 'Construcción integral de identidad corporativa para empresas emergentes y consolidadas.',
      deliverables: [
        'Diseño de Logotipo principal, variantes y submarcas',
        'Manual de identidad y normas de uso gráfico',
        'Paleta cromática y tipografías corporativas',
        'Diseño de papelería institucional y tarjetas de presentación',
        'Assets digitales para redes y firmas de correo',
      ],
      priceGuide: 'Desde $800 - $1,800 USD según alcance',
    },
    {
      title: 'Desarrollo Web & E-commerce',
      badge: 'Tecnología',
      icon: Globe,
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Sitios web modernos, rápidos y optimizados para convertir visitantes en clientes.',
      deliverables: [
        'Diseño UI/UX a la medida de la marca',
        'Desarrollo 100% responsivo para móviles y tablets',
        'Optimización para motores de búsqueda (SEO inicial)',
        'Integración con WhatsApp y formularios de captación',
        'Panel autoadministrable y catálogo de productos',
      ],
      priceGuide: 'Desde $1,200 - $3,500 USD',
    },
    {
      title: 'Social Media & Pauta Digital',
      badge: 'Crecimiento',
      icon: Share2,
      gradient: 'from-pink-500 to-rose-600',
      description: 'Gestión profesional de comunidades y campañas publicitarias en Meta, Google y TikTok.',
      deliverables: [
        'Estrategia de comunicación y parrilla mensual de contenidos',
        'Diseño de posts gráficos, reels y carruseles',
        'Configuración y optimización de pauta (Facebook, IG, Google Ads)',
        'Reporte analítico de métricas y retorno de inversión (ROI)',
        'Monitoreo y respuesta a prospectos calificados',
      ],
      priceGuide: 'Planes mensuales desde $500 - $1,500 USD/mes',
    },
    {
      title: 'Producción Audiovisual 4K',
      badge: 'Impacto',
      icon: Video,
      gradient: 'from-amber-500 to-orange-600',
      description: 'Videos comerciales de alto impacto cinematográfico para marcas e instituciones.',
      deliverables: [
        'Guión creativo y storyboard',
        'Grabación con cámaras de cine 4K y tomas aéreas con dron',
        'Iluminación profesional y microfonía de estudio',
        'Edición, corrección de color y diseño sonoro',
        'Formatos adaptados para televisión, YouTube y redes sociales',
      ],
      priceGuide: 'Desde $900 - $2,800 USD por producción',
    },
    {
      title: 'Estrategia 360 & Consultoría',
      badge: 'Integral',
      icon: Layers,
      gradient: 'from-emerald-500 to-teal-600',
      description: 'Planes comerciales y de mercadeo integral que combinan branding, digital y eventos.',
      deliverables: [
        'Diagnóstico profundo de posicionamiento de mercado',
        'Plan estratégico de lanzamiento o relanzamiento',
        'Supervisión de producción gráfica y pauta omnicanal',
        'Acompañamiento directivo continuo con Inversiones Publimatec',
      ],
      priceGuide: 'Planes anuales personalizados',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Portafolio Comercial • PixelMedia
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Catálogo de Servicios y Guía Comercial
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Referencia de alcances, entregables y presupuestos para asesores de venta
          </p>
        </div>

        <a
          href="https://pixelmediahn.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
        >
          <span>pixelmediahn.com</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv, idx) => {
          const Icon = srv.icon;
          return (
            <div
              key={idx}
              className="glass-panel glass-panel-hover rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${srv.gradient} text-white flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {srv.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{srv.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {srv.description}
                </p>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Entregables habituales:
                  </div>
                  {srv.deliverables.map((item, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                  Rango estimado de inversión
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {srv.priceGuide}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
