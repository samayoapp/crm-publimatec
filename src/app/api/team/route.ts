import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        active: true,
        createdAt: true,
        contacts: {
          select: {
            id: true,
            proposals: {
              select: {
                id: true,
                stage: true,
                amount: true,
                assignedToId: true,
              },
            },
          },
        },
        proposals: {
          select: {
            id: true,
            stage: true,
            amount: true,
            assignedToId: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const isWonStage = (s: string) => s === 'GANADO' || s === 'VENTA';
    const isLostStage = (s: string) => s === 'PERDIDO' || s === 'PERDIDA';
    const isActiveStage = (s: string) => !isWonStage(s) && !isLostStage(s);

    const formatted = users.map((u) => {
      // Map all proposals assigned to user directly or through their assigned contacts
      const propMap = new Map<string, { id: string; stage: string; amount: number }>();
      
      u.proposals.forEach((p) => {
        propMap.set(p.id, p);
      });

      u.contacts.forEach((c) => {
        c.proposals?.forEach((p) => {
          if (!p.assignedToId || p.assignedToId === u.id) {
            propMap.set(p.id, p);
          }
        });
      });

      const allProposals = Array.from(propMap.values());
      const totalContacts = u.contacts.length;
      const totalProposals = allProposals.length;
      const wonProposals = allProposals.filter((p) => isWonStage(p.stage));
      const wonValue = wonProposals.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const activeProposals = allProposals.filter((p) => isActiveStage(p.stage));

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        active: u.active,
        createdAt: u.createdAt,
        totalContacts,
        totalLeads: totalContacts,
        totalProposals,
        activeProposals: activeProposals.length,
        activeLeads: activeProposals.length,
        wonCount: wonProposals.length,
        wonValue,
      };
    });

    return NextResponse.json({ team: formatted });
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    return NextResponse.json({ error: 'Error al obtener miembros del equipo' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden crear usuarios' }, { status: 403 });
    }

    const { name, email, password, role, phone, avatarUrl } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nombre, correo y contraseña son obligatorios' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un usuario con este correo electrónico' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role === 'ADMIN' ? 'ADMIN' : 'ASESOR',
        phone: phone ? phone.trim() : null,
        avatarUrl: avatarUrl ? avatarUrl.trim() : null,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        active: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, name, email, role, phone, active, password, avatarUrl } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const isAdmin = currentUser.role === 'ADMIN';
    const isSelf = currentUser.id === id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'No tienes permisos para modificar este usuario' }, { status: 403 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl ? avatarUrl.trim() : null;

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await prisma.user.findFirst({
        where: { email: cleanEmail, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Ya existe otro usuario con este correo electrónico' }, { status: 409 });
      }
      updateData.email = cleanEmail;
    }

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    // Only admin can change role or active status
    if (isAdmin) {
      if (role) updateData.role = role;
      if (active !== undefined) updateData.active = active;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        active: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar usuarios' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario no especificado' }, { status: 400 });
    }

    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario en sesión activa' }, { status: 400 });
    }

    // Preserve activities by detaching user
    await prisma.activity.updateMany({
      where: { userId },
      data: { userId: null },
    });

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
