import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return NextResponse.json({ error: 'Error al consultar perfil' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, jobTitle, avatarUrl, currentPassword, newPassword } = body;

    const updateData: any = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : null;
    }

    if (jobTitle !== undefined) {
      updateData.jobTitle = jobTitle ? jobTitle.trim() : null;
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl ? avatarUrl.trim() : null;
    }

    // Cambio de contraseña seguro
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Debes ingresar tu contraseña actual para cambiarla' },
          { status: 400 }
        );
      }

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!fullUser) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, fullUser.password);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: 'La contraseña actual ingresada es incorrecta' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'Perfil actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
