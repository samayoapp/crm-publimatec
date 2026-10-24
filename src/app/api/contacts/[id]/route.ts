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

    return NextResponse.json({ contact });
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

    await prisma.contact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar contacto:', error);
    return NextResponse.json({ error: 'Error al eliminar contacto' }, { status: 500 });
  }
}
