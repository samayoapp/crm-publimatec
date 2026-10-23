import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isAdvisor = user.role === 'ASESOR';
    const whereProp: any = isAdvisor
      ? {
          OR: [
            { assignedToId: user.id },
            { contact: { assignedToId: user.id } },
          ],
        }
      : {};
    const whereContact: any = isAdvisor ? { assignedToId: user.id } : {};

    // Get all proposals
    const proposals = await prisma.proposal.findMany({
      where: whereProp,
      include: {
        contact: { select: { id: true, name: true, companyName: true, phone: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const isWonStage = (s: string) => s === 'GANADO' || s === 'VENTA';
    const isLostStage = (s: string) => s === 'PERDIDO' || s === 'PERDIDA';
    const isActiveStage = (s: string) => !isWonStage(s) && !isLostStage(s);

    const activeProposals = proposals.filter((p) => isActiveStage(p.stage));
    const wonSales = proposals.filter((p) => isWonStage(p.stage));
    const lostProposals = proposals.filter((p) => isLostStage(p.stage));

    const pipelineValue = activeProposals.reduce((acc, curr) => acc + curr.amount, 0);
    const wonSalesValue = wonSales.reduce((acc, curr) => acc + curr.amount, 0);

    const closedTotal = wonSales.length + lostProposals.length;
    const winRate = closedTotal > 0 ? Math.round((wonSales.length / closedTotal) * 100) : 0;

    // Stage counts for all 6 stages
    const stageCounts: Record<string, { count: number; value: number }> = {
      NUEVO: { count: 0, value: 0 },
      CONTACTADO: { count: 0, value: 0 },
      PROPUESTA: { count: 0, value: 0 },
      NEGOCIACION: { count: 0, value: 0 },
      GANADO: { count: 0, value: 0 },
      PERDIDO: { count: 0, value: 0 },
    };

    proposals.forEach((p) => {
      let key = p.stage;
      if (key === 'ENVIADA') key = 'PROPUESTA';
      if (key === 'VENTA') key = 'GANADO';
      if (key === 'PERDIDA') key = 'PERDIDO';

      if (stageCounts[key]) {
        stageCounts[key].count += 1;
        stageCounts[key].value += p.amount;
      }
    });

    // Contacts count
    const totalContacts = await prisma.contact.count({ where: whereContact });

    // Pending follow ups on contacts
    const pendingFollowUps = await prisma.contact.findMany({
      where: {
        ...whereContact,
        nextFollowUp: { not: null },
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { nextFollowUp: 'asc' },
      take: 6,
    });

    // Recent activities
    const recentActivities = await prisma.activity.findMany({
      where: isAdvisor
        ? {
            OR: [
              { userId: user.id },
              { contact: { assignedToId: user.id } },
              { proposal: { assignedToId: user.id } },
            ],
          }
        : {},
      include: {
        user: { select: { name: true } },
        contact: { select: { id: true, name: true, companyName: true } },
        proposal: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    return NextResponse.json({
      summary: {
        totalContacts,
        activeCount: activeProposals.length,
        activeProposalsCount: activeProposals.length,
        pipelineValue,
        wonCount: wonSales.length,
        wonSalesCount: wonSales.length,
        wonValue: wonSalesValue,
        wonSalesValue,
        winRate,
      },
      stageCounts,
      pendingFollowUps,
      recentActivities,
    });
  } catch (error) {
    console.error('Error al generar dashboard:', error);
    return NextResponse.json({ error: 'Error al cargar métricas' }, { status: 500 });
  }
}
