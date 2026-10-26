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
    const search = searchParams.get('search');
    const industry = searchParams.get('industry');

    // Auto-sync / auto-link: Ensure any contact with companyName has a corresponding Company record
    const unlinkedContacts = await prisma.contact.findMany({
      where: {
        companyId: null,
        companyName: { not: null },
      },
      select: { id: true, companyName: true },
    });

    if (unlinkedContacts.length > 0) {
      for (const c of unlinkedContacts) {
        if (!c.companyName || !c.companyName.trim()) continue;
        const name = c.companyName.trim();
        let comp = await prisma.company.findFirst({
          where: { name: { equals: name, mode: 'insensitive' } },
        });
        if (!comp) {
          comp = await prisma.company.create({
            data: {
              name,
              city: 'San Pedro Sula',
              country: 'Honduras',
            },
          });
        }
        await prisma.contact.update({
          where: { id: c.id },
          data: { companyId: comp.id, companyName: comp.name },
        });
        await prisma.proposal.updateMany({
          where: { contactId: c.id, companyId: null },
          data: { companyId: comp.id },
        });
      }
    }

    const where: any = {};

    if (industry) {
      where.industry = industry;
    }

    if (search) {
      const searchTerms = {
        contains: search,
        mode: 'insensitive' as const,
      };
      where.OR = [
        { name: searchTerms },
        { legalName: searchTerms },
        { taxId: searchTerms },
        { industry: searchTerms },
        { city: searchTerms },
        { website: searchTerms },
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            jobTitle: true,
            phone: true,
            email: true,
            avatarUrl: true,
            assignedToId: true,
            assignedTo: {
              select: { id: true, name: true },
            },
          },
        },
        proposals: {
          select: {
            id: true,
            title: true,
            stage: true,
            amount: true,
          },
        },
        _count: {
          select: { contacts: true, proposals: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute aggregated metrics per company
    const isWon = (s: string) => s === 'GANADO' || s === 'VENTA';
    const isLost = (s: string) => s === 'PERDIDO' || s === 'PERDIDA';
    const isActive = (s: string) => !isWon(s) && !isLost(s);

    const formatted = companies.map((comp) => {
      // Regla de Privacidad: Un asesor solo ve el teléfono/WhatsApp de sus propios contactos
      const sanitizedContacts = comp.contacts.map((c) => {
        const canAccess = user.role === 'ADMIN' || !c.assignedToId || c.assignedToId === user.id;
        return {
          id: c.id,
          name: c.name,
          jobTitle: c.jobTitle,
          avatarUrl: c.avatarUrl,
          assignedToId: c.assignedToId,
          assignedTo: c.assignedTo,
          canAccess,
          phone: canAccess ? c.phone : null,
          email: canAccess ? c.email : null,
        };
      });

      const activeProps = comp.proposals.filter((p) => isActive(p.stage));
      const wonProps = comp.proposals.filter((p) => isWon(p.stage));
      const pipelineValue = activeProps.reduce((acc, curr) => acc + curr.amount, 0);
      const wonValue = wonProps.reduce((acc, curr) => acc + curr.amount, 0);

      return {
        ...comp,
        contacts: sanitizedContacts,
        metrics: {
          contactsCount: sanitizedContacts.length,
          activeProposalsCount: activeProps.length,
          wonProposalsCount: wonProps.length,
          pipelineValue,
          wonValue,
        },
      };
    });

    return NextResponse.json({ companies: formatted });
  } catch (error) {
    console.error('Error al listar empresas:', error);
    return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'El nombre de la empresa es obligatorio' }, { status: 400 });
    }

    const newCompany = await prisma.company.create({
      data: {
        name: data.name.trim(),
        legalName: data.legalName ? data.legalName.trim() : null,
        taxId: data.taxId ? data.taxId.trim() : null,
        industry: data.industry ? data.industry.trim() : null,
        website: data.website ? data.website.trim() : null,
        phone: data.phone ? data.phone.trim() : null,
        email: data.email ? data.email.trim() : null,
        address: data.address ? data.address.trim() : null,
        city: data.city ? data.city.trim() : 'San Pedro Sula',
        country: data.country ? data.country.trim() : 'Honduras',
        logoUrl: data.logoUrl ? data.logoUrl.trim() : null,
        notes: data.notes ? data.notes.trim() : null,
      },
      include: {
        contacts: true,
        proposals: true,
      },
    });

    return NextResponse.json({ company: newCompany }, { status: 201 });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 });
  }
}
