import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getDaysDiff, getStalenessInfo } from '@/lib/timeUtils';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const advisorId = searchParams.get('advisorId');
    const period = searchParams.get('period') || 'last_4_weeks'; // this_week, this_month, last_4_weeks, all

    // Compute date cutoff based on period
    const now = new Date();
    let startDate: Date | null = null;

    if (period === 'this_week') {
      const dayOfWeek = now.getDay() || 7; // Sunday = 7
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek + 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'last_4_weeks') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 28);
    } else if (period === 'last_3_months') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    }

    const isSalesperson = user.role !== 'ADMIN';
    const effectiveAdvisorId = isSalesperson ? user.id : advisorId;

    // Contact scoping: strictly advisor's contacts if ASESOR or if filtered by admin
    const contactWhere: any = {};
    if (effectiveAdvisorId) {
      contactWhere.assignedToId = effectiveAdvisorId;
    }

    // Proposal scoping: strictly advisor's proposals if ASESOR or if filtered by admin
    const proposalWhere: any = {};
    if (effectiveAdvisorId) {
      proposalWhere.assignedToId = effectiveAdvisorId;
    }

    // 1. Won Proposals (Ciclo Comercial de Cierre)
    const wonWhere: any = {
      ...proposalWhere,
      stage: { in: ['GANADO', 'VENTA'] },
      ...(startDate ? { closedAt: { gte: startDate } } : {}),
    };

    const wonProposals = await prisma.proposal.findMany({
      where: wonWhere,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            companyName: true,
            firstContactAt: true,
            createdAt: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
      orderBy: { closedAt: 'desc' },
    });

    const closedCycles = wonProposals.map((p) => {
      const start = p.contact?.firstContactAt || p.contact?.createdAt || p.createdAt;
      const end = p.closedAt || p.updatedAt;
      const days = getDaysDiff(start, end);
      return {
        proposalId: p.id,
        title: p.title,
        amount: p.amount,
        currency: p.currency,
        contactName: p.contact?.name,
        companyName: p.contact?.companyName,
        assignedTo: p.assignedTo?.name,
        daysToClose: Math.max(1, days),
        closedAt: p.closedAt,
      };
    });

    const totalWonCycles = closedCycles.length;
    const avgDaysToClose = totalWonCycles > 0
      ? Math.round(closedCycles.reduce((sum, c) => sum + c.daysToClose, 0) / totalWonCycles)
      : 0;

    const fastestClose = totalWonCycles > 0
      ? Math.min(...closedCycles.map((c) => c.daysToClose))
      : 0;
    const slowestClose = totalWonCycles > 0
      ? Math.max(...closedCycles.map((c) => c.daysToClose))
      : 0;

    // 2. Active Proposals (Etapas & Tiempo de Permanencia)
    const activeWhere: any = {
      ...proposalWhere,
      stage: { notIn: ['GANADO', 'VENTA', 'PERDIDO', 'PERDIDA'] },
    };

    const activeProposals = await prisma.proposal.findMany({
      where: activeWhere,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            lastContactAt: true,
            nextFollowUp: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });

    // Compute days in current stage & staleness
    const activeProposalsWithTime = activeProposals.map((p) => {
      const stageStart = p.stageUpdatedAt || p.updatedAt || p.createdAt;
      const daysInStage = getDaysDiff(stageStart);
      const staleness = getStalenessInfo(p.contact?.lastContactAt || p.updatedAt);

      return {
        id: p.id,
        title: p.title,
        amount: p.amount,
        currency: p.currency,
        stage: p.stage,
        daysInStage,
        contactName: p.contact?.name,
        contactId: p.contact?.id,
        companyName: p.contact?.companyName,
        phone: p.contact?.phone,
        assignedTo: p.assignedTo?.name,
        staleness,
        nextFollowUp: p.contact?.nextFollowUp,
      };
    });

    // Stale proposals: in current stage > 7 days OR no contact > 5 days
    const atRiskProposals = activeProposalsWithTime
      .filter((p) => p.staleness.level === 'stale' || p.daysInStage >= 7)
      .sort((a, b) => b.daysInStage - a.daysInStage);

    // 3. Contacts Staleness Distribution
    const contacts = await prisma.contact.findMany({
      where: contactWhere,
      select: {
        id: true,
        name: true,
        lastContactAt: true,
        firstContactAt: true,
        createdAt: true,
      },
    });

    let freshCount = 0;
    let attentionCount = 0;
    let staleCount = 0;

    contacts.forEach((c) => {
      const s = getStalenessInfo(c.lastContactAt || c.createdAt);
      if (s.level === 'fresh') freshCount++;
      else if (s.level === 'attention') attentionCount++;
      else staleCount++;
    });

    // 4. Average stage duration estimates
    const stageGroups: Record<string, number[]> = {
      NUEVO: [],
      CONTACTADO: [],
      PROPUESTA: [],
      NEGOCIACION: [],
    };

    activeProposalsWithTime.forEach((p) => {
      if (stageGroups[p.stage]) {
        stageGroups[p.stage].push(p.daysInStage);
      }
    });

    const avgStageDuration: Record<string, number> = {};
    for (const [stg, arr] of Object.entries(stageGroups)) {
      avgStageDuration[stg] = arr.length > 0
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : 0;
    }

    let advisorsList: any[] = [];
    if (user.role === 'ADMIN') {
      advisorsList = await prisma.user.findMany({
        where: { active: true },
        select: { id: true, name: true, role: true, avatarUrl: true },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json({
      period,
      userRole: user.role,
      advisors: advisorsList,
      summary: {
        avgDaysToClose,
        totalWonCycles,
        fastestClose,
        slowestClose,
        activeInPipelineCount: activeProposals.length,
        atRiskCount: atRiskProposals.length,
        contactsStaleness: {
          fresh: freshCount,
          attention: attentionCount,
          stale: staleCount,
          total: contacts.length,
        },
      },
      avgStageDuration,
      closedCycles,
      atRiskProposals: atRiskProposals.slice(0, 10),
    });
  } catch (error) {
    console.error('Error al calcular analítica de tiempo:', error);
    return NextResponse.json({ error: 'Error al consultar métricas de tiempo' }, { status: 500 });
  }
}
