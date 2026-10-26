import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { type, description, nextFollowUp, nextFollowUpTask, proposalId } = await req.json();

    if (!type || !description) {
      return NextResponse.json(
        { error: 'El tipo y la descripción de la actividad son requeridos' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      select: { id: true, assignedToId: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    const canInteract = user.role === 'ADMIN' || !contact.assignedToId || contact.assignedToId === user.id;
    if (!canInteract) {
      return NextResponse.json(
        { error: 'No tienes autorización para registrar actividades en contactos de otro asesor' },
        { status: 403 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        contactId: params.id,
        userId: user.id,
        proposalId: proposalId || null,
        type,
        description: description.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Always refresh contact lastContactAt on interaction
    const updateContact: any = {
      lastContactAt: new Date(),
    };
    if (nextFollowUp !== undefined) {
      updateContact.nextFollowUp = nextFollowUp ? new Date(nextFollowUp) : null;
      updateContact.nextFollowUpTask = nextFollowUp ? (nextFollowUpTask || null) : null;
    } else if (type !== 'NOTA') {
      // Si se registra una llamada, mensaje (WhatsApp, correo), reunión o cambio de etapa
      // y no se agenda una fecha futura, la tarea pendiente se da por completada y sale de la lista
      updateContact.nextFollowUp = null;
      updateContact.nextFollowUpTask = null;
    }
    await prisma.contact.update({
      where: { id: params.id },
      data: updateContact,
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error('Error al registrar actividad:', error);
    return NextResponse.json({ error: 'Error al registrar la actividad' }, { status: 500 });
  }
}
