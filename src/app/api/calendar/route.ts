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
    const advisorId = searchParams.get('advisorId');
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    const contactWhere: any = {
      nextFollowUp: { not: null },
    };

    if (user.role === 'ASESOR') {
      contactWhere.OR = [
        { assignedToId: user.id },
        { assignedToId: null },
      ];
    } else if (advisorId) {
      contactWhere.assignedToId = advisorId;
    }

    if (startStr || endStr) {
      contactWhere.nextFollowUp = {
        ...(startStr ? { gte: new Date(startStr) } : {}),
        ...(endStr ? { lte: new Date(endStr) } : {}),
      };
    }

    // Fetch scheduled follow-ups
    const contactsWithFollowUps = await prisma.contact.findMany({
      where: contactWhere,
      select: {
        id: true,
        name: true,
        companyName: true,
        companyId: true,
        phone: true,
        email: true,
        nextFollowUp: true,
        nextFollowUpTask: true,
        firstContactAt: true,
        lastContactAt: true,
        assignedTo: {
          select: { id: true, name: true, avatarUrl: true },
        },
        company: {
          select: { id: true, name: true },
        },
        proposals: {
          select: { id: true, title: true, amount: true, stage: true },
          take: 1,
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { nextFollowUp: 'asc' },
    });

    const now = new Date().getTime();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const events = contactsWithFollowUps.map((c) => {
      const followUpTime = new Date(c.nextFollowUp!).getTime();
      const isOverdue = followUpTime < todayStart.getTime();
      const isToday = followUpTime >= todayStart.getTime() && followUpTime <= todayEnd.getTime();
      const isUpcoming = followUpTime > todayEnd.getTime();

      return {
        id: `followup-${c.id}`,
        type: 'FOLLOW_UP',
        title: c.nextFollowUpTask || 'Llamada o contacto de seguimiento',
        date: c.nextFollowUp,
        contactId: c.id,
        contactName: c.name,
        companyName: c.company?.name || c.companyName || null,
        companyId: c.companyId || null,
        phone: c.phone,
        email: c.email,
        assignedTo: c.assignedTo,
        topProposal: c.proposals[0] || null,
        isOverdue,
        isToday,
        isUpcoming,
        firstContactAt: c.firstContactAt,
        lastContactAt: c.lastContactAt,
      };
    });

    // Also fetch recent or upcoming proposal closing milestones
    const proposalWhere: any = {
      closedAt: { not: null },
    };
    if (user.role !== 'ADMIN') {
      proposalWhere.assignedToId = user.id;
    } else if (advisorId) {
      proposalWhere.assignedToId = advisorId;
    }
    if (startStr || endStr) {
      proposalWhere.closedAt = {
        ...(startStr ? { gte: new Date(startStr) } : {}),
        ...(endStr ? { lte: new Date(endStr) } : {}),
      };
    }

    const closedProposals = await prisma.proposal.findMany({
      where: proposalWhere,
      select: {
        id: true,
        title: true,
        amount: true,
        currency: true,
        stage: true,
        closedAt: true,
        createdAt: true,
        contact: {
          select: { id: true, name: true, companyName: true, phone: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
      orderBy: { closedAt: 'desc' },
      take: 50,
    });

    const milestoneEvents = closedProposals.map((p) => ({
      id: `proposal-close-${p.id}`,
      type: p.stage === 'GANADO' ? 'VENTA_CERRADA' : 'VENTA_PERDIDA',
      title: `${p.stage === 'GANADO' ? '🏆 Venta Cerrada' : 'Cerrado Perdido'}: ${p.title} ($${p.amount.toLocaleString()} ${p.currency})`,
      date: p.closedAt,
      contactId: p.contact?.id,
      contactName: p.contact?.name,
      companyName: p.contact?.companyName,
      phone: p.contact?.phone,
      assignedTo: p.assignedTo,
      isWon: p.stage === 'GANADO',
      isOverdue: false,
      isToday: false,
      isUpcoming: false,
    }));

    return NextResponse.json({
      events,
      milestoneEvents,
      totalEvents: events.length + milestoneEvents.length,
    });
  } catch (error) {
    console.error('Error al obtener eventos de calendario:', error);
    return NextResponse.json({ error: 'Error al consultar calendario' }, { status: 500 });
  }
}
