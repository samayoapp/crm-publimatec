import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
    }

    if (folder.isInstitutional && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo la Dirección Comercial puede editar carpetas institucionales' },
        { status: 403 }
      );
    }

    if (!folder.isInstitutional && user.role !== 'ADMIN' && folder.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes autorización para editar esta carpeta' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.color !== undefined) updateData.color = body.color;

    const updated = await prisma.folder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json({ folder: updated, success: true });
  } catch (error) {
    console.error('Error al editar carpeta:', error);
    return NextResponse.json({ error: 'Error al actualizar carpeta' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
    }

    if (folder.isInstitutional && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo la Dirección Comercial puede eliminar carpetas institucionales' },
        { status: 403 }
      );
    }

    if (!folder.isInstitutional && user.role !== 'ADMIN' && folder.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes autorización para eliminar esta carpeta' },
        { status: 403 }
      );
    }

    // Al eliminar la carpeta, los documentos dentro conservan su existencia y pasan a folderId = null (onDelete: SetNull)
    await prisma.folder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar carpeta:', error);
    return NextResponse.json({ error: 'Error al eliminar carpeta' }, { status: 500 });
  }
}
