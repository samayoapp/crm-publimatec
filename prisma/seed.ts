import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seeding para PixelMedia / Publimatec ---');

  // Clear existing
  await prisma.activity.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('abc123', 10);

  // 1. Usuarios del CRM
  const admin = await prisma.user.create({
    data: {
      name: 'Dirección Publimatec',
      email: 'admin@pixelmediahn.com',
      password: defaultPassword,
      role: 'ADMIN',
      phone: '+504 9900-1122',
      active: true,
    },
  });

  const allan = await prisma.user.create({
    data: {
      name: 'Allan Samayoa',
      email: 'allan.samayoa@gmail.com',
      password: defaultPassword,
      role: 'ADMIN',
      phone: '+504 9900-0000',
      active: true,
    },
  });

  const asesor1 = await prisma.user.create({
    data: {
      name: 'Carlos Mendoza',
      email: 'carlos.ventas@pixelmediahn.com',
      password: defaultPassword,
      role: 'ASESOR',
      phone: '+504 9888-2233',
      active: true,
    },
  });

  const asesor2 = await prisma.user.create({
    data: {
      name: 'Sofía Reyes',
      email: 'sofia.ventas@pixelmediahn.com',
      password: defaultPassword,
      role: 'ASESOR',
      phone: '+504 9777-3344',
      active: true,
    },
  });

  console.log('✅ Usuarios creados: Admin y 2 Asesores.');

  // 2. Empresas Corporativas
  const comp1 = await prisma.company.create({
    data: {
      name: 'Distribuidora del Caribe',
      legalName: 'Distribuidora del Caribe S.A. de C.V.',
      taxId: '05019001234567',
      industry: 'Distribución & Logística',
      phone: '+504 2550-1122',
      email: 'contacto@distribuidoradelcaribe.hn',
      address: 'Barrio Guamilito, 7ma Avenida',
      city: 'San Pedro Sula',
      country: 'Honduras',
      notes: 'Distribuidor líder de productos de consumo masivo en la zona norte de Honduras.',
    },
  });

  const comp2 = await prisma.company.create({
    data: {
      name: 'Café Monte Alto',
      legalName: 'Café Monte Alto Exportadores S. de R.L.',
      taxId: '05019007654321',
      industry: 'Alimentos & Bebidas',
      phone: '+504 2552-3344',
      email: 'info@cafemontealto.com',
      address: 'Colonia Trejo, 10 Calle',
      city: 'San Pedro Sula',
      country: 'Honduras',
      notes: 'Productores y exportadores de café especial de altura a mercados internacionales.',
    },
  });

  const comp3 = await prisma.company.create({
    data: {
      name: 'Clínica Dental Sonrisas',
      legalName: 'Servicios Odontológicos Sonrisas S.A.',
      taxId: '05019002345678',
      industry: 'Salud & Odontología',
      phone: '+504 2556-7788',
      email: 'citas@dentalsonrisas.hn',
      address: 'Bulevar Los Próceres',
      city: 'San Pedro Sula',
      country: 'Honduras',
      notes: 'Cadena de clínicas odontológicas con servicios especializados de implantes y ortodoncia.',
    },
  });

  const comp4 = await prisma.company.create({
    data: {
      name: 'Grupo Logístico Honduras',
      legalName: 'Grupo Logístico y Aduanero Honduras S.A.',
      taxId: '05019003456789',
      industry: 'Transporte & Carga',
      phone: '+504 2665-9900',
      email: 'operaciones@grupologisticohn.com',
      address: 'Zona Viva, Puerto Cortés',
      city: 'Puerto Cortés',
      country: 'Honduras',
      notes: 'Agencia aduanera y transporte multimodal para importadores y exportadores.',
    },
  });

  const comp5 = await prisma.company.create({
    data: {
      name: 'Inmobiliaria Panorama',
      legalName: 'Inversiones y Desarrollos Panorama S.A. de C.V.',
      taxId: '05019004567890',
      industry: 'Bienes Raíces & Construcción',
      phone: '+504 2566-4455',
      email: 'ventas@panoramahn.com',
      address: 'Colonia Rancho El Coco',
      city: 'San Pedro Sula',
      country: 'Honduras',
      notes: 'Desarrolladora inmobiliaria de condominios residenciales y torres corporativas.',
    },
  });

  const comp6 = await prisma.company.create({
    data: {
      name: 'Laboratorios Centroamérica',
      legalName: 'Laboratorios Farmacéuticos Centroamericanos S.A.',
      taxId: '05019005678901',
      industry: 'Farmacéutica & Salud',
      phone: '+504 2235-8899',
      email: 'info@labcentroamerica.hn',
      address: 'Parque Industrial Búfalo',
      city: 'San Pedro Sula',
      country: 'Honduras',
      notes: 'Fabricación y comercialización de medicamentos, soluciones y suplementos de salud.',
    },
  });

  console.log('✅ Empresas creadas: 6 Cuentas corporativas.');

  // 3. Contactos (Personas & Relaciones vinculadas a Empresas)
  const contact1 = await prisma.contact.create({
    data: {
      name: 'Ing. Roberto Flores',
      jobTitle: 'Gerente de Compras',
      companyId: comp1.id,
      companyName: comp1.name,
      email: 'rflores@distribuidoradelcaribe.hn',
      phone: '50499887766',
      notes: 'Cliente muy interesado en renovar la presencia digital para mayor alcance comercial en San Pedro Sula.',
      nextFollowUp: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // en 2 días
      nextFollowUpTask: 'Llamar para resolver dudas sobre la propuesta enviada por correo.',
      assignedToId: asesor1.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      name: 'Lic. Mariana Zelaya',
      jobTitle: 'Directora de Marca & Mercadeo',
      companyId: comp2.id,
      companyName: comp2.name,
      email: 'mariana@cafemontealto.com',
      phone: '50498765432',
      notes: 'Nueva línea de café especial de altura para exportación. Excelente química en la primera reunión.',
      nextFollowUp: new Date(Date.now() + 1000 * 60 * 60 * 24), // mañana
      nextFollowUpTask: 'Reunión virtual para afinar paquete de packaging y formas de pago.',
      assignedToId: asesor2.id,
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      name: 'Lic. Javier Pineda',
      jobTitle: 'Director Médico y Propietario',
      companyId: comp3.id,
      companyName: comp3.name,
      email: 'jpineda@dentalsonrisas.hn',
      phone: '50495551234',
      notes: 'Buscan captar más pacientes para ortodoncia e implantes con pauta publicitaria en Meta y TikTok.',
      nextFollowUp: new Date(Date.now() + 1000 * 60 * 60 * 6), // hoy
      nextFollowUpTask: 'Enviar brief digital para conocer presupuesto mensual.',
      assignedToId: asesor1.id,
    },
  });

  const contact4 = await prisma.contact.create({
    data: {
      name: 'Abg. Claudia Romero',
      jobTitle: 'Gerente General',
      companyId: comp4.id,
      companyName: comp4.name,
      email: 'cromero@grupologisticohn.com',
      phone: '50494448899',
      notes: 'Video con dron y testimonios para su 15 aniversario institucional.',
      nextFollowUp: new Date(Date.now() + 1000 * 60 * 60 * 14), // hoy
      nextFollowUpTask: 'Llamar para coordinar fecha de visita a las instalaciones.',
      assignedToId: asesor2.id,
    },
  });

  const contact5 = await prisma.contact.create({
    data: {
      name: 'Carlos Nuñez',
      jobTitle: 'Gerente Comercial Inmobiliario',
      companyId: comp5.id,
      companyName: comp5.name,
      email: 'cnunez@panoramahn.com',
      phone: '50493332211',
      notes: 'Relación consolidada. Contrato firmado por 6 meses con renovación automática.',
      assignedToId: asesor1.id,
    },
  });

  const contact6 = await prisma.contact.create({
    data: {
      name: 'Dra. Elena Castro',
      jobTitle: 'Jefe de Control de Calidad',
      companyId: comp6.id,
      companyName: comp6.name,
      email: 'ecastro@labcentroamerica.hn',
      phone: '50497775566',
      notes: 'Contacto referido. Esperando que nos envíe sus manuales actuales antes de cotizar.',
      nextFollowUp: new Date(Date.now() + 1000 * 60 * 60 * 48),
      nextFollowUpTask: 'Confirmar recepción de información por WhatsApp.',
      assignedToId: asesor2.id,
    },
  });

  console.log('✅ Contactos creados y vinculados a sus empresas.');

  // 4. Oportunidades y Propuestas en el Embudo de Ventas (6 etapas)
  const prop1 = await prisma.proposal.create({
    data: {
      title: 'Rediseño Web Corporativa + Catálogo',
      amount: 1850,
      currency: 'USD',
      stage: 'PROPUESTA',
      notes: 'Incluye diseño UX/UI a la medida, catálogo de productos y optimización móvil.',
      contactId: contact1.id,
      companyId: comp1.id,
      assignedToId: asesor1.id,
    },
  });

  const prop2 = await prisma.proposal.create({
    data: {
      title: 'Branding Completo y Manual de Marca',
      amount: 1200,
      currency: 'USD',
      stage: 'NEGOCIACION',
      notes: 'Identidad visual, logotipo, papelería y diseño de 3 empaques de café.',
      contactId: contact2.id,
      companyId: comp2.id,
      assignedToId: asesor2.id,
    },
  });

  const prop3 = await prisma.proposal.create({
    data: {
      title: 'Pauta Digital y Manejo de Redes (Plan 6 Meses)',
      amount: 750,
      currency: 'USD',
      stage: 'CONTACTADO',
      notes: 'Diagnóstico inicial realizado por llamada. Levantando brief para definir inversión publicitaria.',
      contactId: contact3.id,
      companyId: comp3.id,
      assignedToId: asesor1.id,
    },
  });

  const prop4 = await prisma.proposal.create({
    data: {
      title: 'Video Corporativo Institucional 4K',
      amount: 2400,
      currency: 'USD',
      stage: 'PROPUESTA',
      notes: 'Producción audiovisual con cámaras de cine, dron 4K, edición y locución profesional.',
      contactId: contact4.id,
      companyId: comp4.id,
      assignedToId: asesor2.id,
    },
  });

  const prop5 = await prisma.proposal.create({
    data: {
      title: 'Estrategia Digital 360 Anual',
      amount: 4500,
      currency: 'USD',
      stage: 'GANADO', // ¡Venta Cerrada Ganada!
      notes: 'Servicio integral: branding, web y campañas omnicanal. Contrato firmado y anticipo pagado.',
      contactId: contact5.id,
      companyId: comp5.id,
      assignedToId: asesor1.id,
    },
  });

  const prop6 = await prisma.proposal.create({
    data: {
      title: 'Rebranding y Empaques Farmacéuticos',
      amount: 1600,
      currency: 'USD',
      stage: 'NUEVO',
      notes: 'Prospecto recién ingresado por recomendación. Esperando manuales para sesión de diagnóstico.',
      contactId: contact6.id,
      companyId: comp6.id,
      assignedToId: asesor2.id,
    },
  });

  console.log('✅ Oportunidades del embudo de ventas creadas.');

  // 4. Actividades y Conversaciones
  await prisma.activity.create({
    data: {
      contactId: contact1.id,
      proposalId: prop1.id,
      userId: asesor1.id,
      type: 'LLAMADA',
      description: 'Llamada de 20 min con Ing. Roberto. Se levantaron requerimientos técnicos del catálogo.',
    },
  });

  await prisma.activity.create({
    data: {
      contactId: contact1.id,
      proposalId: prop1.id,
      userId: asesor1.id,
      type: 'CORREO',
      description: 'Envío de propuesta formal en PDF con dos opciones de desarrollo.',
    },
  });

  await prisma.activity.create({
    data: {
      contactId: contact2.id,
      proposalId: prop2.id,
      userId: asesor2.id,
      type: 'WHATSAPP',
      description: 'Mariana confirmó que le gustó la propuesta y quiere revisar detalles del packaging mañana.',
    },
  });

  await prisma.activity.create({
    data: {
      contactId: contact5.id,
      proposalId: prop5.id,
      userId: asesor1.id,
      type: 'VENTA_CERRADA',
      description: '🎉 ¡VENTA CERRADA! Carlos Nuñez firmó el contrato por $4,500 USD con Inversiones Publimatec.',
    },
  });

  console.log('✅ Actividades registradas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
