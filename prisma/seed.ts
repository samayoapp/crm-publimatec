import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seeding para PixelMedia / Publimatec ---');

  // Clear existing
  await prisma.activity.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedSalesPassword = await bcrypt.hash('ventas123', 10);

  // 1. Usuarios del CRM
  const admin = await prisma.user.create({
    data: {
      name: 'Dirección Publimatec',
      email: 'admin@pixelmediahn.com',
      password: hashedAdminPassword,
      role: 'ADMIN',
      phone: '+504 9900-1122',
      active: true,
    },
  });

  const asesor1 = await prisma.user.create({
    data: {
      name: 'Carlos Mendoza',
      email: 'carlos.ventas@pixelmediahn.com',
      password: hashedSalesPassword,
      role: 'ASESOR',
      phone: '+504 9888-2233',
      active: true,
    },
  });

  const asesor2 = await prisma.user.create({
    data: {
      name: 'Sofía Reyes',
      email: 'sofia.ventas@pixelmediahn.com',
      password: hashedSalesPassword,
      role: 'ASESOR',
      phone: '+504 9777-3344',
      active: true,
    },
  });

  console.log('✅ Usuarios creados: Admin y 2 Asesores.');

  // 2. Contactos (Personas & Relaciones)
  const contact1 = await prisma.contact.create({
    data: {
      name: 'Ing. Roberto Flores',
      companyName: 'Distribuidora del Caribe',
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
      companyName: 'Café Monte Alto',
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
      companyName: 'Clínica Dental Sonrisas',
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
      companyName: 'Grupo Logístico Honduras',
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
      companyName: 'Inmobiliaria Panorama',
      email: 'cnunez@panoramahn.com',
      phone: '50493332211',
      notes: 'Relación consolidada. Contrato firmado por 6 meses con renovación automática.',
      assignedToId: asesor1.id,
    },
  });

  const contact6 = await prisma.contact.create({
    data: {
      name: 'Dra. Elena Castro',
      companyName: 'Laboratorios Centroamérica',
      email: 'ecastro@labcentroamerica.hn',
      phone: '50497775566',
      notes: 'Contacto referido. Esperando que nos envíe sus manuales actuales antes de cotizar.',
      nextFollowUp: new Date(Date.now() + 1000 * 60 * 60 * 48),
      nextFollowUpTask: 'Confirmar recepción de información por WhatsApp.',
      assignedToId: asesor2.id,
    },
  });

  console.log('✅ Contactos creados.');

  // 3. Oportunidades y Propuestas en el Embudo de Ventas (6 etapas)
  const prop1 = await prisma.proposal.create({
    data: {
      title: 'Rediseño Web Corporativa + Catálogo',
      amount: 1850,
      currency: 'USD',
      stage: 'PROPUESTA',
      notes: 'Incluye diseño UX/UI a la medida, catálogo de productos y optimización móvil.',
      contactId: contact1.id,
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
