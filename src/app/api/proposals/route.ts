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
    const stage = searchParams.get('stage');
    const contactId = searchParams.get('contactId');
    const assignedToId = searchParams.get('assignedToId');
    const search = searchParams.get('search');

    const where: any = {};

    if (stage) where.stage = stage;
    if (contactId) where.contactId = contactId;

    if (user.role !== 'ADMIN') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { assignedToId: user.id },
            { contact: { assignedToId: user.id } },
          ],
        },
      ];
    } else if (assignedToId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { assignedToId: assignedToId },
            { contact: { assignedToId: assignedToId } },
          ],
        },
      ];
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
            { title: searchTerms },
            { contact: { name: searchTerms } },
            { contact: { companyName: searchTerms } },
          ],
        },
      ];
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            jobTitle: true,
            avatarUrl: true,
            companyName: true,
            phone: true,
            email: true,
            firstContactAt: true,
            lastContactAt: true,
            nextFollowUp: true,
            nextFollowUpTask: true,
            company: {
              select: { id: true, name: true, logoUrl: true, industry: true },
            },
          },
        },
        company: {
          select: { id: true, name: true, logoUrl: true, industry: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        documents: {
          select: {
            id: true,
            title: true,
            fileType: true,
            fileUrl: true,
            version: true,
            category: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('Error al listar propuestas:', error);
    return NextResponse.json({ error: 'Error al obtener propuestas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.title || !data.contactId) {
      return NextResponse.json(
        { error: 'Título de la propuesta y contacto asociado son obligatorios' },
        { status: 400 }
      );
    }

    let assignedToId = user.id;
    let companyId = data.companyId || null;

    if (data.contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: data.contactId },
        select: { assignedToId: true, companyId: true },
      });
      if (user.role === 'ADMIN') {
        assignedToId = data.assignedToId || contact?.assignedToId || user.id;
      } else {
        assignedToId = user.id;
      }
      if (!companyId && contact?.companyId) {
        companyId = contact.companyId;
      }
    }

    let stage = (data.stage || 'NUEVO').trim().toUpperCase();
    if (stage === 'ENVIADA') stage = 'PROPUESTA';
    if (stage === 'VENTA') stage = 'GANADO';
    if (stage === 'PERDIDA') stage = 'PERDIDO';

    const amount = parseFloat(data.amount) || 0;

    let currency = data.currency;
    if (!currency) {
      const setting = await prisma.setting.findFirst({ select: { currency: true } });
      currency = setting?.currency || 'HNL';
    }

    const proposal = await prisma.proposal.create({
      data: {
        title: data.title.trim(),
        amount,
        currency,
        stage,
        notes: data.notes ? data.notes.trim() : null,
        contactId: data.contactId,
        companyId,
        assignedToId: assignedToId || null,
      },
      include: {
        contact: {
          select: { id: true, name: true, companyName: true, phone: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Record activity on contact
    const isSale = stage === 'VENTA' || stage === 'GANADO';
    const activityDesc = isSale
      ? `🎉 ¡VENTA CERRADA! Propuesta "${proposal.title}" por ${proposal.currency} ${amount.toLocaleString()} aprobada.`
      : `Propuesta "${proposal.title}" por ${proposal.currency} ${amount.toLocaleString()} creada por ${user.name}.`;

    await prisma.activity.create({
      data: {
        contactId: proposal.contactId,
        proposalId: proposal.id,
        userId: user.id,
        type: isSale ? 'VENTA_CERRADA' : 'CAMBIO_ETAPA',
        description: activityDesc,
      },
    });

    // Al avanzar o crear una propuesta comercial, el contacto sale del listado de prospección/llamadas iniciales
    await prisma.contact.update({
      where: { id: proposal.contactId },
      data: {
        nextFollowUp: null,
        nextFollowUpTask: null,
        lastContactAt: new Date(),
      },
    });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error('Error al crear propuesta:', error);
    return NextResponse.json({ error: 'Error al crear la propuesta' }, { status: 500 });
  }
}
