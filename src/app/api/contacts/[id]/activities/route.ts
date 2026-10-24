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
    }
    if (nextFollowUpTask !== undefined) {
      updateContact.nextFollowUpTask = nextFollowUpTask;
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
