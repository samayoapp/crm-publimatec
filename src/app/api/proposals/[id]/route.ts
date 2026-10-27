import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { PROPOSAL_STAGES } from '@/lib/constants';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
            assignedToId: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      const isOwner = proposal.assignedToId === user.id;
      if (!isOwner) {
        return NextResponse.json(
          { error: 'No tienes autorización para ver propuestas de otros vendedores' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error('Error al obtener propuesta:', error);
    return NextResponse.json({ error: 'Error al obtener propuesta' }, { status: 500 });
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

    const currentProp = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: { contact: true },
    });

    if (!currentProp) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      const isOwner = currentProp.assignedToId === user.id;
      if (!isOwner) {
        return NextResponse.json(
          { error: 'No tienes autorización para modificar propuestas de otros vendedores' },
          { status: 403 }
        );
      }
    }

    const data = await req.json();
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.amount !== undefined) updateData.amount = parseFloat(data.amount) || 0;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.assignedToId !== undefined) {
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Solo los administradores tienen autorización para reasignar el asesor de una propuesta' },
          { status: 403 }
        );
      }
      updateData.assignedToId = data.assignedToId || null;
    }

    let isStageChange = false;
    if (data.stage) {
      let normalizedStage = data.stage.trim().toUpperCase();
      if (normalizedStage === 'ENVIADA') normalizedStage = 'PROPUESTA';
      if (normalizedStage === 'VENTA') normalizedStage = 'GANADO';
      if (normalizedStage === 'PERDIDA') normalizedStage = 'PERDIDO';
      if (normalizedStage !== currentProp.stage) {
        updateData.stage = normalizedStage;
        updateData.stageUpdatedAt = new Date();
        isStageChange = true;

        if (normalizedStage === 'GANADO' || normalizedStage === 'PERDIDO') {
          updateData.closedAt = new Date();
        } else {
          updateData.closedAt = null;
        }
      }
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contact: {
          select: { id: true, name: true, companyName: true, phone: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Auto-record activity on stage change and refresh contact lastContactAt
    if (isStageChange) {
      const prevLabel = PROPOSAL_STAGES[currentProp.stage]?.label || currentProp.stage;
      const newLabel = PROPOSAL_STAGES[data.stage]?.label || data.stage;

      const isWon = data.stage === 'VENTA' || data.stage === 'GANADO';
      const description = isWon
        ? `🎉 ¡VENTA CERRADA! La propuesta "${updatedProposal.title}" fue aprobada por un valor de ${updatedProposal.currency || 'HNL'} ${updatedProposal.amount.toLocaleString()}.`
        : `Etapa de la propuesta actualizada de "${prevLabel}" a "${newLabel}".`;

      await prisma.activity.create({
        data: {
          contactId: updatedProposal.contactId,
          proposalId: updatedProposal.id,
          userId: user.id,
          type: isWon ? 'VENTA_CERRADA' : 'CAMBIO_ETAPA',
          description,
        },
      });

      // Update contact last interaction time and clear pending prospecting follow-up
      await prisma.contact.update({
        where: { id: updatedProposal.contactId },
        data: {
          lastContactAt: new Date(),
          nextFollowUp: null,
          nextFollowUpTask: null,
        },
      });
    }

    return NextResponse.json({ proposal: updatedProposal });
  } catch (error) {
    console.error('Error al actualizar propuesta:', error);
    return NextResponse.json({ error: 'Error al actualizar propuesta' }, { status: 500 });
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

    const currentProp = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: { contact: { select: { assignedToId: true } } },
    });

    if (!currentProp) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      const isOwner = currentProp.assignedToId === user.id;
      if (!isOwner) {
        return NextResponse.json(
          { error: 'No tienes autorización para eliminar propuestas de otros vendedores' },
          { status: 403 }
        );
      }
    }

    await prisma.proposal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar propuesta:', error);
    return NextResponse.json({ error: 'Error al eliminar propuesta' }, { status: 500 });
  }
}
