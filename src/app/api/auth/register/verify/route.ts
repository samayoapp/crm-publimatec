import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Correo y código de verificación son requeridos' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    // Find valid verification code
    const record = await prisma.verificationCode.findFirst({
      where: {
        email: cleanEmail,
        type: 'REGISTER',
        code: cleanCode,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'El código ingresado es incorrecto o ha caducado. Por favor verifica o solicita uno nuevo.' },
        { status: 400 }
      );
    }

    if (new Date() > record.expiresAt) {
      await prisma.verificationCode.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: 'El código de verificación ha expirado. Por favor solicita uno nuevo.' },
        { status: 400 }
      );
    }

    if (!record.payload) {
      return NextResponse.json(
        { error: 'Datos de registro incompletos. Por favor inicia el registro nuevamente.' },
        { status: 400 }
      );
    }

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(record.payload);
    } catch (e) {
      return NextResponse.json(
        { error: 'Error procesando datos del registro.' },
        { status: 400 }
      );
    }

    // Double check email uniqueness before creating
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      await prisma.verificationCode.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: 'Este correo ya cuenta con un usuario activo en el sistema.' },
        { status: 400 }
      );
    }

    // Create the new Sales Executive User (Pending Director Approval)
    const user = await prisma.user.create({
      data: {
        name: parsedPayload.name,
        email: cleanEmail,
        password: parsedPayload.passwordHash,
        phone: parsedPayload.phone || null,
        jobTitle: parsedPayload.jobTitle || 'Ejecutivo de Ventas',
        role: 'ASESOR',
        active: false,
        approved: false,
        status: 'PENDING_APPROVAL',
      },
    });

    // Delete used verification codes for this email
    await prisma.verificationCode.deleteMany({
      where: {
        email: cleanEmail,
        type: 'REGISTER',
      },
    });

    // Create Notification for the Director (Admins)
    try {
      await prisma.notification.create({
        data: {
          type: 'NEW_USER_REGISTRATION',
          title: 'Nueva Solicitud de Registro de Vendedor',
          message: `${user.name} (${cleanEmail}) se ha registrado como ${user.jobTitle} y solicita aprobación de acceso.`,
          link: '/team',
          metadata: JSON.stringify({
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            jobTitle: user.jobTitle,
            registeredAt: user.createdAt,
          }),
        },
      });
    } catch (notifErr) {
      console.error('Error al registrar notificación de nuevo usuario:', notifErr);
    }

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: '¡Correo verificado con éxito! Tu solicitud de acceso ha sido enviada a la Dirección Comercial para su aprobación.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        status: 'PENDING_APPROVAL',
      },
    });
  } catch (error) {
    console.error('Error al verificar código de registro:', error);
    return NextResponse.json(
      { error: 'Error interno al verificar la cuenta.' },
      { status: 500 }
    );
  }
}
