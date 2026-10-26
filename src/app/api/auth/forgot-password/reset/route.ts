import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Correo, código de seguridad y nueva contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    // Verify code
    const record = await prisma.verificationCode.findFirst({
      where: {
        email: cleanEmail,
        type: 'PASSWORD_RESET',
        code: cleanCode,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Código de seguridad inválido o caducado. Por favor verifica e intenta de nuevo.' },
        { status: 400 }
      );
    }

    if (new Date() > record.expiresAt) {
      await prisma.verificationCode.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: 'El código de seguridad ha expirado. Por favor solicita uno nuevo.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { email: cleanEmail },
      data: { password: passwordHash },
    });

    // Delete used code
    await prisma.verificationCode.deleteMany({
      where: {
        email: cleanEmail,
        type: 'PASSWORD_RESET',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la contraseña.' },
      { status: 500 }
    );
  }
}
