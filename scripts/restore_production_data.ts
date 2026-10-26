import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Restauración Segura de Datos de Producción ---');

  // 1. Usuarios
  const users = [
    {
      id: 'f7bc6976-789c-49e2-9872-aad3a4981768',
      name: 'Allan Samayoa',
      email: 'allan.samayoa@pixelmediahn.com',
      password: '$2a$10$w2t5/g95J80UYx947itsI.f/6Hkyr.GixrdYEvIVtlNDsa/sDs792',
      role: 'ADMIN' as const,
      phone: '+504 3370 4848',
      avatarUrl: '/uploads/1793029834778-IMG_8524.jpg',
      jobTitle: 'Ejecutivo de Ventas',
      active: true,
      approved: true,
      status: 'ACTIVE',
    },
    {
      id: 'c11d9c1e-f1f0-4cb5-8b2a-0a0f34152c90',
      name: 'Jessie Fernandez',
      email: 'jessie@pixelmediahn.com',
      password: '$2a$10$wKwwBz3MXmobRok5HOFnCe/XS1srSvqVLYw4H94mP6Vjby4q8yFq2',
      role: 'ASESOR' as const,
      phone: '+504 9936-9788',
      jobTitle: 'Ejecutivo de Ventas',
      active: true,
      approved: true,
      status: 'ACTIVE',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        jobTitle: u.jobTitle,
        active: u.active,
        approved: u.approved,
        status: u.status,
      },
      create: u,
    });
    console.log(`✅ Usuario verificado/restaurado: ${u.name} (${u.email})`);
  }

  // 2. Empresas
  const companies = [
    {
      id: 'a45a7570-199a-4be8-a91d-d023650a338c',
      name: 'Nueva',
      city: 'San Pedro Sula',
      country: 'Honduras',
    },
    {
      id: '5d1b4c5f-1b00-4669-9929-6d5037f21c03',
      name: 'Camas Aurora',
      city: 'San Pedro Sula',
      country: 'Honduras',
    },
    {
      id: 'f906f3fd-cc7a-4fc3-b5da-808cfc8c6f8c',
      name: 'FINSOL',
      city: 'San Pedro Sula',
      country: 'Honduras',
    },
    {
      id: 'e85f2fb8-d016-42b3-8c7f-8f7d949dc9f9',
      name: 'COLPROSUMAH',
      city: 'San Pedro Sula',
      country: 'Honduras',
    },
    {
      id: 'c5088bd8-ae70-442c-86e4-3ac25c7f7cd5',
      name: 'Galeas Periodista',
      city: 'San Pedro Sula',
      country: 'Honduras',
    },
  ];

  for (const c of companies) {
    await prisma.company.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        city: c.city,
        country: c.country,
      },
      create: c,
    });
    console.log(`✅ Empresa verificada/restaurada: ${c.name}`);
  }

  // 3. Contactos
  const contacts = [
    {
      id: 'bd7174da-df26-480b-a31d-9ffbb364ee8d',
      name: 'Gabriela Galeas',
      jobTitle: 'Influencer / Creadora',
      companyId: 'c5088bd8-ae70-442c-86e4-3ac25c7f7cd5',
      companyName: 'Galeas Periodista',
      phone: '87330416',
      notes: 'Ella tiene pendiente crear su sitio web desde hace tiempo y está pagando un dominio en nuestra cuenta de hosting',
      nextFollowUpTask: 'Primer contacto / Llamar hoy',
      nextFollowUp: new Date('2026-10-26T18:00:00Z'),
      assignedToId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: '5a73259c-cab1-4093-866d-7932f33ca374',
      name: 'Synthia Valladares',
      jobTitle: 'Gerente de Mercadeo',
      companyId: 'e85f2fb8-d016-42b3-8c7f-8f7d949dc9f9',
      companyName: 'COLPROSUMAH',
      phone: '+50495739578',
      notes: 'Hace tiempo me comentó que el Colprosumah queria Actualizar su WEB, es un proyecto institucional latente',
      nextFollowUpTask: '[Reunión] Reunión de Diagnóstico',
      nextFollowUp: new Date('2026-10-26T18:00:00Z'),
      assignedToId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: 'd8ac6f27-2d7f-44a6-9f62-fcc78b21872f',
      name: 'Maria Rosales',
      jobTitle: 'Gerente de Mercadeo',
      companyId: 'f906f3fd-cc7a-4fc3-b5da-808cfc8c6f8c',
      companyName: 'FINSOL',
      phone: '+50487892931',
      notes: 'Ya es cliente nuestra, posiblemente no renueven en 2027 pero queremos proponerle Proyecto de GCDB y renovar obviamente con creacion de contenidos',
      nextFollowUpTask: 'Seguimiento pospuesto para mañana',
      nextFollowUp: new Date('2026-10-27T15:00:00Z'),
      assignedToId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: '15dc6caf-4031-4a89-b478-1c709234c992',
      name: 'Abraham Jaar',
      jobTitle: 'Dueño / Director General',
      companyId: '5d1b4c5f-1b00-4669-9929-6d5037f21c03',
      companyName: 'Camas Aurora',
      phone: '99674418',
      notes: 'Carrera de Botargas',
      nextFollowUpTask: 'Seguimiento pospuesto para próxima semana',
      nextFollowUp: new Date('2026-11-02T15:00:00Z'),
      assignedToId: 'c11d9c1e-f1f0-4cb5-8b2a-0a0f34152c90',
    },
    {
      id: 'b613525b-267e-471e-91d4-bad099c39ec6',
      name: 'Test',
      jobTitle: 'Gestor de Compras',
      companyId: 'a45a7570-199a-4be8-a91d-d023650a338c',
      companyName: 'Nueva',
      phone: '156456456',
      notes: null,
      nextFollowUpTask: 'Primer contacto / Llamar hoy',
      nextFollowUp: new Date('2026-10-26T18:00:00Z'),
      assignedToId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
  ];

  for (const ct of contacts) {
    await prisma.contact.upsert({
      where: { id: ct.id },
      update: {
        name: ct.name,
        jobTitle: ct.jobTitle,
        companyId: ct.companyId,
        companyName: ct.companyName,
        phone: ct.phone,
        notes: ct.notes,
        nextFollowUpTask: ct.nextFollowUpTask,
        nextFollowUp: ct.nextFollowUp,
        assignedToId: ct.assignedToId,
      },
      create: ct,
    });
    console.log(`✅ Contacto verificado/restaurado: ${ct.name} (${ct.companyName})`);
  }

  // 4. Propuestas
  const proposals = [
    {
      id: '9c5fd655-f777-46fe-904c-be917a555b87',
      title: 'Diseño y desarrollo de Sitio Web Perfil Profesional',
      amount: 12500,
      currency: 'USD',
      stage: 'CONTACTADO',
      notes: 'Pensado para crear site con IA',
      contactId: 'bd7174da-df26-480b-a31d-9ffbb364ee8d',
      companyId: 'c5088bd8-ae70-442c-86e4-3ac25c7f7cd5',
      assignedToId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: '55d63af4-ae9b-4d06-9ef8-fbd277e80aac',
      title: 'Rediseño de Pagin Web Corporativa',
      amount: 20000,
      currency: 'HNL',
      stage: 'CONTACTADO',
      notes: null,
      contactId: '5a73259c-cab1-4093-866d-7932f33ca374',
      companyId: 'e85f2fb8-d016-42b3-8c7f-8f7d949dc9f9',
      assignedToId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
  ];

  for (const p of proposals) {
    await prisma.proposal.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        amount: p.amount,
        currency: p.currency,
        stage: p.stage,
        notes: p.notes,
        contactId: p.contactId,
        companyId: p.companyId,
        assignedToId: p.assignedToId,
      },
      create: p,
    });
    console.log(`✅ Propuesta verificada/restaurada: ${p.title}`);
  }

  // 5. Actividades
  const activities = [
    {
      id: 'cbbc107a-a5ac-4f16-a8c9-2d0cd0fdcac5',
      type: 'NOTA',
      description: 'Contacto registrado en el CRM por Allan Samayoa. Seguimiento comercial asignado automáticamente para las próximas 48 horas.',
      contactId: 'b613525b-267e-471e-91d4-bad099c39ec6',
      proposalId: null,
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: 'c237c65b-71cc-4fe0-8475-604f68fed51b',
      type: 'NOTA',
      description: 'Contacto pospuesto 7 días por el asesor comercial.',
      contactId: '15dc6caf-4031-4a89-b478-1c709234c992',
      proposalId: null,
      userId: 'c11d9c1e-f1f0-4cb5-8b2a-0a0f34152c90',
    },
    {
      id: '37810a7c-2870-4cd3-8c8f-769a8047fca9',
      type: 'NOTA',
      description: 'Contacto registrado en el CRM por Jessie Fernandez. Seguimiento comercial asignado automáticamente para las próximas 48 horas.',
      contactId: '15dc6caf-4031-4a89-b478-1c709234c992',
      proposalId: null,
      userId: 'c11d9c1e-f1f0-4cb5-8b2a-0a0f34152c90',
    },
    {
      id: '64adebc6-8d6f-4e87-bcdb-72c1eedaba5f',
      type: 'NOTA',
      description: 'Contacto pospuesto para mañana por el asesor comercial.',
      contactId: 'd8ac6f27-2d7f-44a6-9f62-fcc78b21872f',
      proposalId: null,
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: 'cfa31829-88b5-4922-9f35-87fb3dd2ca09',
      type: 'NOTA',
      description: 'Contacto registrado en el CRM por Allan Samayoa. Seguimiento comercial asignado automáticamente para las próximas 48 horas.',
      contactId: 'd8ac6f27-2d7f-44a6-9f62-fcc78b21872f',
      proposalId: null,
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: '8320eacc-08c2-45ea-b0b1-d97ec82e7d62',
      type: 'CAMBIO_ETAPA',
      description: 'Etapa de la propuesta actualizada de "Lista de Propuestas" a "Diagnóstico / Contactado".',
      contactId: 'bd7174da-df26-480b-a31d-9ffbb364ee8d',
      proposalId: '9c5fd655-f777-46fe-904c-be917a555b87',
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: 'c216ae0e-e517-477a-8de9-beba9fed5f44',
      type: 'CAMBIO_ETAPA',
      description: 'Etapa de la propuesta actualizada de "Lista de Propuestas" a "Diagnóstico / Contactado".',
      contactId: '5a73259c-cab1-4093-866d-7932f33ca374',
      proposalId: '55d63af4-ae9b-4d06-9ef8-fbd277e80aac',
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: '196bfeb8-aaf8-4f43-9edf-fec3af8db710',
      type: 'CAMBIO_ETAPA',
      description: 'Propuesta "Rediseño de Pagin Web Corporativa" por HNL 20,000 creada por Allan Samayoa.',
      contactId: '5a73259c-cab1-4093-866d-7932f33ca374',
      proposalId: '55d63af4-ae9b-4d06-9ef8-fbd277e80aac',
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: 'b8d07538-b232-4d4a-b193-6f09ada261a6',
      type: 'WHATSAPP',
      description: '[WhatsApp] Reunión o presentación acordada. Detalle: Me contesto por mensaje que si le interesa una NUEVA PAGINA para el Colprosumah, está interesada',
      contactId: '5a73259c-cab1-4093-866d-7932f33ca374',
      proposalId: null,
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: '2becaa64-1a9a-462a-aef8-e87a5c8efe29',
      type: 'NOTA',
      description: 'Contacto registrado en el CRM por Allan Samayoa. Seguimiento comercial asignado automáticamente para las próximas 48 horas.',
      contactId: '5a73259c-cab1-4093-866d-7932f33ca374',
      proposalId: null,
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: '95faf028-4fe6-40bc-af3d-bd7da1ee897b',
      type: 'WHATSAPP',
      description: 'contactada por WhatsApp y está interesada en retomar el diseño de su web, tenia una antigua cotización por 25k lps pero le dije que ahora con la IA podria ofrecerle a la mitad de eso su sitio',
      contactId: 'bd7174da-df26-480b-a31d-9ffbb364ee8d',
      proposalId: null,
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: 'aab7fd3f-f313-4ff6-9daa-75c8d51a5f9d',
      type: 'CAMBIO_ETAPA',
      description: 'Propuesta "Diseño y desarrollo de Sitio Web Perfil Profesional" por USD 12,500 creada por Allan Samayoa.',
      contactId: 'bd7174da-df26-480b-a31d-9ffbb364ee8d',
      proposalId: '9c5fd655-f777-46fe-904c-be917a555b87',
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
    {
      id: '047d56ce-5dab-4402-90a7-b131bb70f3b1',
      type: 'NOTA',
      description: 'Contacto registrado en el CRM por Allan Samayoa. Seguimiento comercial asignado automáticamente para las próximas 48 horas.',
      contactId: 'bd7174da-df26-480b-a31d-9ffbb364ee8d',
      proposalId: null,
      userId: 'f7bc6976-789c-49e2-9872-aad3a4981768',
    },
  ];

  for (const act of activities) {
    await prisma.activity.upsert({
      where: { id: act.id },
      update: {
        description: act.description,
        type: act.type,
      },
      create: act,
    });
    console.log(`✅ Actividad restaurada: ${act.type} - ${act.id}`);
  }

  console.log('🎉 --- Restauración completada exitosamente sin pérdida de datos ---');
}

main()
  .catch((e) => {
    console.error('❌ Error durante restauración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
