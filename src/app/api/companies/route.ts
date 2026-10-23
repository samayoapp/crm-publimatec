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
      const activeProps = comp.proposals.filter((p) => isActive(p.stage));
      const wonProps = comp.proposals.filter((p) => isWon(p.stage));
      const pipelineValue = activeProps.reduce((acc, curr) => acc + curr.amount, 0);
      const wonValue = wonProps.reduce((acc, curr) => acc + curr.amount, 0);

      return {
        ...comp,
        metrics: {
          contactsCount: comp.contacts.length,
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
