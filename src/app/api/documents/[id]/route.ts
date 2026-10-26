import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        proposal: { select: { assignedToId: true } },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Si es institucional, solo un Director puede eliminarlo
    if (doc.isInstitutional && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo la Dirección Comercial puede eliminar recursos institucionales' },
        { status: 403 }
      );
    }

    // Si es de una propuesta, solo el asesor dueño o Director puede eliminarlo
    const canDelete =
      user.role === 'ADMIN' ||
      doc.uploadedById === user.id ||
      doc.proposal?.assignedToId === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes autorización para eliminar este documento' },
        { status: 403 }
      );
    }

    // Si el archivo es local (/uploads/documents/...), intentar borrarlo del disco
    if (doc.fileUrl.startsWith('/uploads/documents/')) {
      try {
        const localPath = path.join(process.cwd(), 'public', doc.fileUrl);
        await unlink(localPath);
      } catch (err) {
        // Ignorar si ya no existía
      }
    }

    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    if (doc.isInstitutional && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo la Dirección Comercial puede editar recursos institucionales' },
        { status: 403 }
      );
    }

    const canEdit = user.role === 'ADMIN' || doc.uploadedById === user.id;
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes autorización para editar este documento' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.category !== undefined) updateData.category = body.category.toUpperCase();
    if (body.version !== undefined) updateData.version = body.version.trim();

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    return NextResponse.json({ error: 'Error al actualizar documento' }, { status: 500 });
  }
}
