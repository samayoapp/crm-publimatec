import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        },
        proposals: {
          include: {
            assignedTo: { select: { id: true, name: true } },
            documents: {
              select: { id: true, title: true, fileType: true, fileUrl: true, version: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true, role: true, avatarUrl: true },
            },
            proposal: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    // Validación de Privacidad: Solo el asesor dueño del contacto o un Administrador pueden ver el perfil completo y el teléfono
    const isOwner = user.role === 'ADMIN' || contact.assignedToId === user.id;
    if (!isOwner) {
      return NextResponse.json(
        {
          error: 'Acceso privado: Este contacto pertenece a otro asesor comercial',
          restricted: true,
          contact: {
            id: contact.id,
            name: contact.name,
            jobTitle: contact.jobTitle,
            companyName: contact.companyName,
            companyId: contact.companyId,
            company: contact.company ? { id: contact.company.id, name: contact.company.name } : null,
            assignedTo: contact.assignedTo,
            assignedToId: contact.assignedToId,
            // Teléfono, correo, notas, propuestas y actividades NO se exponen a otros vendedores
          },
        },
        { status: 403 }
      );
    }

    const visibleProposals = user.role === 'ADMIN'
      ? contact.proposals
      : contact.proposals.filter((p) => p.assignedToId === user.id);

    return NextResponse.json({
      contact: {
        ...contact,
        proposals: visibleProposals,
      },
    });
  } catch (error) {
    console.error('Error al obtener contacto:', error);
    return NextResponse.json({ error: 'Error al obtener contacto' }, { status: 500 });
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

    const currentContact = await prisma.contact.findUnique({
      where: { id: params.id },
    });

    if (!currentContact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    // Solo el asesor dueño o un Administrador pueden editar el contacto
    const canEdit = user.role === 'ADMIN' || !currentContact.assignedToId || currentContact.assignedToId === user.id;
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes autorización para modificar contactos asignados a otro asesor' },
        { status: 403 }
      );
    }

    const data = await req.json();
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle ? data.jobTitle.trim() : null;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl ? data.avatarUrl.trim() : null;
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.email !== undefined) updateData.email = data.email ? data.email.trim() : null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.nextFollowUp !== undefined) {
      updateData.nextFollowUp = data.nextFollowUp ? new Date(data.nextFollowUp) : null;
    }
    if (data.nextFollowUpTask !== undefined) updateData.nextFollowUpTask = data.nextFollowUpTask;
    if (data.firstContactAt !== undefined) {
      updateData.firstContactAt = data.firstContactAt ? new Date(data.firstContactAt) : null;
    }
    if (data.lastContactAt !== undefined) {
      updateData.lastContactAt = data.lastContactAt ? new Date(data.lastContactAt) : null;
    }

    if (data.companyId !== undefined) {
      updateData.companyId = data.companyId || null;
      if (data.companyId) {
        const comp = await prisma.company.findUnique({
          where: { id: data.companyId },
          select: { name: true },
        });
        if (comp) updateData.companyName = comp.name;
        // Also update proposals companyId
        await prisma.proposal.updateMany({
          where: { contactId: params.id },
          data: { companyId: data.companyId },
        });
      }
    } else if (data.companyName !== undefined) {
      const trimmedName = data.companyName ? data.companyName.trim() : null;
      updateData.companyName = trimmedName;
      if (trimmedName) {
        let comp = await prisma.company.findFirst({
          where: { name: { equals: trimmedName, mode: 'insensitive' } },
        });
        if (!comp) {
          comp = await prisma.company.create({
            data: {
              name: trimmedName,
              city: 'San Pedro Sula',
              country: 'Honduras',
            },
          });
        }
        updateData.companyId = comp.id;
        await prisma.proposal.updateMany({
          where: { contactId: params.id },
          data: { companyId: comp.id },
        });
      } else {
        updateData.companyId = null;
      }
    }

    if (data.assignedToId !== undefined) {
      // Solo los administradores pueden cambiar la asignación de vendedor
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Solo los administradores tienen autorización para reasignar el asesor de venta de un contacto' },
          { status: 403 }
        );
      }
      updateData.assignedToId = data.assignedToId || null;
      // Sync proposals under this contact
      await prisma.proposal.updateMany({
        where: { contactId: params.id },
        data: { assignedToId: data.assignedToId || null },
      });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: true,
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ contact: updatedContact });
  } catch (error) {
    console.error('Error al actualizar contacto:', error);
    return NextResponse.json({ error: 'Error al actualizar contacto' }, { status: 500 });
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

    const contactToDelete = await prisma.contact.findUnique({
      where: { id: params.id },
      select: { id: true, assignedToId: true },
    });

    if (!contactToDelete) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    const canDelete = user.role === 'ADMIN' || !contactToDelete.assignedToId || contactToDelete.assignedToId === user.id;
    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes autorización para eliminar contactos asignados a otro asesor' },
        { status: 403 }
      );
    }

    await prisma.contact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar contacto:', error);
    return NextResponse.json({ error: 'Error al eliminar contacto' }, { status: 500 });
  }
}
