import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { generateVerificationCode, sendVerificationEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { name, email, phone, jobTitle, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Por favor completa todos los campos requeridos (nombre, correo y contraseña)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener un mínimo de 6 caracteres' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este correo electrónico. Puedes iniciar sesión o recuperar tu contraseña.' },
        { status: 400 }
      );
    }

    // Generate 6-digit code and password hash
    const code = generateVerificationCode();
    const passwordHash = await bcrypt.hash(password, 10);

    const payload = JSON.stringify({
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || null,
      jobTitle: jobTitle?.trim() || 'Ejecutivo de Ventas',
      passwordHash,
    });

    // Remove any previous pending registration codes for this email
    await prisma.verificationCode.deleteMany({
      where: {
        email: cleanEmail,
        type: 'REGISTER',
      },
    });

    // Save verification code valid for 15 minutes
    await prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        code,
        type: 'REGISTER',
        payload,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Send email
    const mailResult = await sendVerificationEmail({
      to: cleanEmail,
      userName: name.trim(),
      subject: `Código de Confirmación: ${code} - Registro PUBLIMATEC CRM`,
      title: '¡Bienvenido al Equipo de Ventas!',
      description: `Estás a un paso de activar tu cuenta de <strong>Ejecutivo de Ventas</strong> en PUBLIMATEC CRM. Para validar tu dirección de correo electrónico, utiliza el siguiente código de confirmación:`,
      code,
      footerNote: 'Por tu seguridad, este código expirará en 15 minutos.',
    });

    return NextResponse.json({
      success: true,
      message: 'Código de confirmación enviado exitosamente a tu correo electrónico',
      email: cleanEmail,
      devCode: mailResult.simulated ? code : undefined,
    });
  } catch (error) {
    console.error('Error en solicitud de registro:', error);
    return NextResponse.json(
      { error: 'Error al procesar el registro. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}
