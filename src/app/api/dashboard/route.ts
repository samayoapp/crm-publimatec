import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { DEFAULT_MOTIVATIONAL_QUOTES } from '@/lib/constants';
import { getBusinessDayBoundaries } from '@/lib/timeUtils';
import { convertCurrency, DEFAULT_EXCHANGE_RATES } from '@/lib/currency';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const targetCurrency = user.preferredCurrency || 'HNL';

    const setting = await prisma.setting.findUnique({
      where: { id: 'default' },
      select: { exchangeRates: true },
    });
    const rates = (setting?.exchangeRates as Record<string, number>) || DEFAULT_EXCHANGE_RATES;

    const isAdvisor = user.role !== 'ADMIN';
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

    const pipelineValue = activeProposals.reduce(
      (acc, curr) => acc + convertCurrency(curr.amount, curr.currency, targetCurrency, rates),
      0
    );
    const wonSalesValue = wonSales.reduce(
      (acc, curr) => acc + convertCurrency(curr.amount, curr.currency, targetCurrency, rates),
      0
    );

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
        stageCounts[key].value += convertCurrency(p.amount, p.currency, targetCurrency, rates);
      }
    });

    // Contacts count
    const totalContacts = await prisma.contact.count({ where: whereContact });

    // Delimitación de tiempo: HOY vs LISTA DE ESPERA (MAÑANA)
    // Se utiliza la zona horaria de Honduras (America/Tegucigalpa) para que al pasar las 12 de la noche
    // en hora local se activen automáticamente para LLAMAR HOY.
    const now = new Date();
    const { endOfToday, endOfTomorrow } = getBusinessDayBoundaries();

    // 1. Pending follow ups due TODAY or OVERDUE (Single Path Action Block - LLAMAR HOY)
    // Se excluyen los contactos que ya avanzaron a propuesta comercial o etapas posteriores
    const pendingFollowUps = await prisma.contact.findMany({
      where: {
        ...whereContact,
        nextFollowUp: { not: null, lte: endOfToday },
        NOT: {
          proposals: {
            some: {
              stage: { in: ['PROPUESTA', 'ENVIADA', 'NEGOCIACION', 'GANADO', 'VENTA'] },
            },
          },
        },
      },
      include: {
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        proposals: {
          select: { id: true, title: true, stage: true, amount: true, currency: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { nextFollowUp: 'asc' },
      take: 25,
    });

    // 2. Lista especial de espera: contactos marcados con "No contestó hoy" o reagendados para mañana
    const waitingListFollowUps = await prisma.contact.findMany({
      where: {
        ...whereContact,
        nextFollowUp: { gt: endOfToday, lte: endOfTomorrow },
        NOT: {
          proposals: {
            some: {
              stage: { in: ['PROPUESTA', 'ENVIADA', 'NEGOCIACION', 'GANADO', 'VENTA'] },
            },
          },
        },
      },
      include: {
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        proposals: {
          select: { id: true, title: true, stage: true, amount: true, currency: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { nextFollowUp: 'asc' },
      take: 25,
    });

    const overdueCount = pendingFollowUps.filter(
      (c) => c.nextFollowUp && new Date(c.nextFollowUp) < now
    ).length;

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

    const settings = await prisma.setting.findUnique({
      where: { id: 'default' },
      select: {
        motivationalQuotes: true,
        currency: true,
        currencySymbol: true,
        companyName: true,
        monthlySalesTarget: true,
      },
    });

    const motivationalQuotes = settings?.motivationalQuotes?.length
      ? settings.motivationalQuotes
      : DEFAULT_MOTIVATIONAL_QUOTES;

    // Directores: Solicitudes de vendedores pendientes de aprobación
    let pendingApprovalUsers: any[] = [];
    let unreadNotificationsCount = 0;

    if (user.role === 'ADMIN') {
      pendingApprovalUsers = await prisma.user.findMany({
        where: {
          OR: [
            { status: 'PENDING_APPROVAL' },
            { approved: false },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          jobTitle: true,
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      unreadNotificationsCount = await prisma.notification.count({
        where: {
          OR: [
            { userId: user.id },
            { userId: null },
          ],
          read: false,
        },
      });
    }

    return NextResponse.json({
      currentUser: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      settings: {
        currency: settings?.currency || 'HNL',
        currencySymbol: settings?.currencySymbol || 'L',
        companyName: settings?.companyName || 'PUBLIMATEC CRM',
        monthlySalesTarget: settings?.monthlySalesTarget || 120000,
      },
      motivationalQuotes,
      summary: {
        currency: targetCurrency,
        totalContacts,
        pendingFollowUpsCount: pendingFollowUps.length,
        waitingListCount: waitingListFollowUps.length,
        overdueCount,
        activeCount: activeProposals.length,
        activeProposalsCount: activeProposals.length,
        pipelineValue,
        wonCount: wonSales.length,
        wonSalesCount: wonSales.length,
        wonValue: wonSalesValue,
        wonSalesValue,
        winRate,
        pendingApprovalCount: pendingApprovalUsers.length,
        unreadNotificationsCount,
      },
      stageCounts,
      pendingFollowUps,
      waitingListFollowUps,
      pendingApprovalUsers,
      recentActivities,
    });
  } catch (error) {
    console.error('Error al generar dashboard:', error);
    return NextResponse.json({ error: 'Error al cargar métricas' }, { status: 500 });
  }
}

