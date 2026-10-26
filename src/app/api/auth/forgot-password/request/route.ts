import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateVerificationCode, sendVerificationEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu correo electrónico' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No se encontró ninguna cuenta registrada con este correo electrónico.' },
        { status: 404 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Esta cuenta está desactivada. Por favor contacta al administrador del sistema.' },
        { status: 403 }
      );
    }

    // Generate 6-digit recovery code
    const code = generateVerificationCode();

    // Remove any previous recovery codes for this email
    await prisma.verificationCode.deleteMany({
      where: {
        email: cleanEmail,
        type: 'PASSWORD_RESET',
      },
    });

    // Save code with 15 minutes expiration
    await prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        code,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Send email
    const mailResult = await sendVerificationEmail({
      to: cleanEmail,
      userName: user.name,
      subject: `Código de Recuperación: ${code} - PUBLIMATEC CRM`,
      title: 'Restablecimiento de Contraseña',
      description: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta en PUBLIMATEC CRM. Utiliza el siguiente código de seguridad para definir una nueva contraseña:',
      code,
      footerNote: 'Este código de recuperación es válido por 15 minutos.',
    });

    return NextResponse.json({
      success: true,
      message: 'Código de recuperación enviado exitosamente a tu correo electrónico',
      email: cleanEmail,
      devCode: mailResult.simulated ? code : undefined,
    });
  } catch (error) {
    console.error('Error en solicitud de recuperación de contraseña:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud. Por favor intenta más tarde.' },
      { status: 500 }
    );
  }
}
