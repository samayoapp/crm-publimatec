import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assignedToId = searchParams.get('assignedToId');
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search');

    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (user.role !== 'ADMIN') {
      where.assignedToId = user.id;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      const searchTerms = {
        contains: search,
        mode: 'insensitive' as const,
      };
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: searchTerms },
            { companyName: searchTerms },
            { jobTitle: searchTerms },
            { phone: searchTerms },
            { email: searchTerms },
            { company: { name: searchTerms } },
          ],
        },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true, industry: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        proposals: {
          where: user.role === 'ADMIN' ? {} : { assignedToId: user.id },
          select: {
            id: true,
            title: true,
            amount: true,
            stage: true,
            currency: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
          },
        },
        _count: {
          select: { activities: true, proposals: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error al listar contactos:', error);
    return NextResponse.json({ error: 'Error al obtener contactos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.name || !data.phone) {
      return NextResponse.json(
        { error: 'Nombre de la persona y WhatsApp son requeridos' },
        { status: 400 }
      );
    }

    // Al registrar una persona, queda asignada automáticamente a quien la registra.
    // Solo un administrador puede especificar o asignar a otro vendedor.
    let assignedToId = user.id;
    if (user.role === 'ADMIN' && data.assignedToId) {
      assignedToId = data.assignedToId;
    }

    // Resolve company name if companyId provided
    let companyName = data.companyName ? data.companyName.trim() : null;
    let companyId = data.companyId || null;

    if (companyId && !companyName) {
      const comp = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });
      if (comp) companyName = comp.name;
    } else if (!companyId && companyName) {
      // Find or create company automatically
      let comp = await prisma.company.findFirst({
        where: { name: { equals: companyName, mode: 'insensitive' } },
      });
      if (!comp) {
        comp = await prisma.company.create({
          data: { name: companyName },
        });
      }
      companyId = comp.id;
      companyName = comp.name;
    }

    // Todo contacto nuevo entra por defecto a LLAMAR HOY (hora actual de registro)
    let finalNextFollowUp: Date = new Date();
    if (data.nextFollowUp) {
      finalNextFollowUp = new Date(data.nextFollowUp);
    }

    const finalNextFollowUpTask = data.nextFollowUpTask && data.nextFollowUpTask.trim()
      ? data.nextFollowUpTask.trim()
      : 'Primer contacto / Llamar hoy';

    const contact = await prisma.contact.create({
      data: {
        name: data.name.trim(),
        jobTitle: data.jobTitle ? data.jobTitle.trim() : null,
        avatarUrl: data.avatarUrl ? data.avatarUrl.trim() : null,
        companyId,
        companyName,
        phone: data.phone.trim().replace(/[^0-9+]/g, ''),
        email: data.email ? data.email.trim() : null,
        notes: data.notes ? data.notes.trim() : null,
        nextFollowUp: finalNextFollowUp,
        nextFollowUpTask: finalNextFollowUpTask,
        assignedToId: assignedToId || null,
      },
      include: {
        company: true,
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Record initial contact activity with 48h follow-up notice
    await prisma.activity.create({
      data: {
        contactId: contact.id,
        userId: user.id,
        type: 'NOTA',
        description: `Contacto registrado en el CRM por ${user.name}. Seguimiento comercial asignado automáticamente para las próximas 48 horas.`,
      },
    });

    // Optionally create initial proposal if provided
    if (data.initialProposalTitle || (data.amount && parseFloat(data.amount) > 0)) {
      let initialStage = (data.stage || 'NUEVO').trim().toUpperCase();
      if (initialStage === 'ENVIADA') initialStage = 'PROPUESTA';
      if (initialStage === 'VENTA') initialStage = 'GANADO';
      if (initialStage === 'PERDIDA') initialStage = 'PERDIDO';

      await prisma.proposal.create({
        data: {
          title: data.initialProposalTitle || `Propuesta inicial para ${contact.name}`,
          amount: parseFloat(data.amount) || 0,
          currency: (data.currency || 'HNL').toUpperCase(),
          stage: initialStage,
          contactId: contact.id,
          companyId: contact.companyId,
          assignedToId: contact.assignedToId,
        },
      });
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Error al crear contacto:', error);
    return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 });
  }
}
