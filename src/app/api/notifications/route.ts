import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Admins see notifications directed to them or general director notifications (userId: null)
    // Regular users see notifications directed to their userId
    const whereClause: any = user.role === 'ADMIN'
      ? {
          OR: [
            { userId: user.id },
            { userId: null },
          ],
        }
      : { userId: user.id };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...whereClause,
        read: false,
      },
    });

    // Also get pending users count if user is admin
    let pendingUsers: any[] = [];
    if (user.role === 'ADMIN') {
      pendingUsers = await prisma.user.findMany({
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
          jobTitle: true,
          phone: true,
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      notifications,
      unreadCount,
      pendingUsers,
      pendingCount: pendingUsers.length,
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID de notificación requerido' }, { status: 400 });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return NextResponse.json({ error: 'Error al actualizar notificación' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const whereClause: any = user.role === 'ADMIN'
      ? {
          OR: [
            { userId: user.id },
            { userId: null },
          ],
        }
      : { userId: user.id };

    await prisma.notification.updateMany({
      where: {
        ...whereClause,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    return NextResponse.json({ error: 'Error al actualizar notificaciones' }, { status: 500 });
  }
}
