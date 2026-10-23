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

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        contacts: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: { name: 'asc' },
        },
        proposals: {
          include: {
            contact: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const isWon = (s: string) => s === 'GANADO' || s === 'VENTA';
    const isLost = (s: string) => s === 'PERDIDO' || s === 'PERDIDA';
    const isActive = (s: string) => !isWon(s) && !isLost(s);

    const activeProps = company.proposals.filter((p) => isActive(p.stage));
    const wonProps = company.proposals.filter((p) => isWon(p.stage));
    const pipelineValue = activeProps.reduce((acc, curr) => acc + curr.amount, 0);
    const wonValue = wonProps.reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({
      company: {
        ...company,
        metrics: {
          contactsCount: company.contacts.length,
          activeProposalsCount: activeProps.length,
          wonProposalsCount: wonProps.length,
          pipelineValue,
          wonValue,
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener empresa:', error);
    return NextResponse.json({ error: 'Error al obtener la empresa' }, { status: 500 });
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

    const data = await req.json();
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.legalName !== undefined) updateData.legalName = data.legalName ? data.legalName.trim() : null;
    if (data.taxId !== undefined) updateData.taxId = data.taxId ? data.taxId.trim() : null;
    if (data.industry !== undefined) updateData.industry = data.industry ? data.industry.trim() : null;
    if (data.website !== undefined) updateData.website = data.website ? data.website.trim() : null;
    if (data.phone !== undefined) updateData.phone = data.phone ? data.phone.trim() : null;
    if (data.email !== undefined) updateData.email = data.email ? data.email.trim() : null;
    if (data.address !== undefined) updateData.address = data.address ? data.address.trim() : null;
    if (data.city !== undefined) updateData.city = data.city ? data.city.trim() : null;
    if (data.country !== undefined) updateData.country = data.country ? data.country.trim() : null;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl ? data.logoUrl.trim() : null;
    if (data.notes !== undefined) updateData.notes = data.notes ? data.notes.trim() : null;

    const updatedCompany = await prisma.company.update({
      where: { id: params.id },
      data: updateData,
    });

    // Also update companyName string on linked contacts if name was modified
    if (data.name) {
      await prisma.contact.updateMany({
        where: { companyId: params.id },
        data: { companyName: data.name.trim() },
      });
    }

    return NextResponse.json({ company: updatedCompany });
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar empresas' }, { status: 403 });
    }

    // Contacts and proposals companyId will set null automatically
    await prisma.company.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar empresa:', error);
    return NextResponse.json({ error: 'Error al eliminar la empresa' }, { status: 500 });
  }
}
