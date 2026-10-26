import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const institutional = searchParams.get('institutional') === 'true';
    const targetUserId = searchParams.get('userId');

    const where: any = {};

    if (institutional) {
      where.isInstitutional = true;
    } else {
      where.isInstitutional = false;
      // Si un Admin especifica un asesor objetivo, lo permite; si no, toma el usuario autenticado
      if (user.role === 'ADMIN' && targetUserId) {
        where.userId = targetUserId;
      } else {
        where.userId = user.id;
      }
    }

    const folders = await prisma.folder.findMany({
      where,
      include: {
        _count: {
          select: { documents: true },
        },
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error al obtener carpetas:', error);
    return NextResponse.json({ error: 'Error al obtener carpetas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, color = 'indigo', isInstitutional = false } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre de la carpeta es obligatorio' }, { status: 400 });
    }

    // Regla de permisos: Solo administradores pueden crear carpetas en el Espacio Institucional
    if (isInstitutional && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo la Dirección Comercial puede crear carpetas en la Biblioteca Institucional' },
        { status: 403 }
      );
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        color: color || 'indigo',
        isInstitutional: Boolean(isInstitutional),
        userId: isInstitutional ? null : user.id,
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json({ folder, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error al crear carpeta:', error);
    return NextResponse.json({ error: 'Error al crear la carpeta' }, { status: 500 });
  }
}
