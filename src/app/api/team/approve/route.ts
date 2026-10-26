import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendAccountApprovedEmail, sendAccountRejectedEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo la Dirección Comercial tiene autorización para aprobar solicitudes de vendedores' },
        { status: 403 }
      );
    }

    const { userId, approved, reason } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (approved) {
      // 1. Activar usuario
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          approved: true,
          active: true,
          status: 'ACTIVE',
        },
      });

      // 2. Marcar notificaciones de registro como leídas
      try {
        const notifs = await prisma.notification.findMany({
          where: { type: 'NEW_USER_REGISTRATION', read: false },
        });

        for (const notif of notifs) {
          if (notif.metadata?.includes(userId) || notif.message.includes(targetUser.email)) {
            await prisma.notification.update({
              where: { id: notif.id },
              data: { read: true },
            });
          }
        }
      } catch (e) {
        console.error('Error al actualizar notificación:', e);
      }

      // 3. Enviar correo de confirmación de aprobación al vendedor
      let emailResult = { success: false, simulated: true };
      try {
        emailResult = await sendAccountApprovedEmail({
          to: targetUser.email,
          userName: targetUser.name,
          jobTitle: targetUser.jobTitle || 'Ejecutivo de Ventas',
          loginUrl: `${process.env.APP_URL || 'http://localhost:3010'}/login`,
        });
      } catch (mailErr) {
        console.error('Error al enviar correo de aprobación:', mailErr);
      }

      return NextResponse.json({
        success: true,
        message: `El ejecutivo ${targetUser.name} ha sido aprobado exitosamente y se le ha enviado la confirmación por correo electrónico.`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          status: updatedUser.status,
          approved: updatedUser.approved,
        },
        emailSent: emailResult.success,
      });
    } else {
      // Rechazar solicitud
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          approved: false,
          active: false,
          status: 'REJECTED',
        },
      });

      // Marcar notificaciones como leídas
      try {
        const notifs = await prisma.notification.findMany({
          where: { type: 'NEW_USER_REGISTRATION', read: false },
        });

        for (const notif of notifs) {
          if (notif.metadata?.includes(userId) || notif.message.includes(targetUser.email)) {
            await prisma.notification.update({
              where: { id: notif.id },
              data: { read: true },
            });
          }
        }
      } catch (e) {}

      // Enviar correo de notificación de rechazo
      try {
        await sendAccountRejectedEmail({
          to: targetUser.email,
          userName: targetUser.name,
          reason,
        });
      } catch (mailErr) {
        console.error('Error al enviar correo de rechazo:', mailErr);
      }

      return NextResponse.json({
        success: true,
        message: `La solicitud de ${targetUser.name} ha sido rechazada y se le ha notificado por correo.`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          status: updatedUser.status,
        },
      });
    }
  } catch (error) {
    console.error('Error al procesar aprobación:', error);
    return NextResponse.json({ error: 'Error al procesar la aprobación del vendedor' }, { status: 500 });
  }
}
