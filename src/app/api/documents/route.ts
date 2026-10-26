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
    const institutional = searchParams.get('institutional') === 'true';
    const proposalId = searchParams.get('proposalId');
    const contactId = searchParams.get('contactId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};

    if (institutional) {
      // Biblioteca institucional: visible para todos los usuarios
      where.isInstitutional = true;
    } else if (proposalId) {
      // Verificar propiedad de la propuesta
      const prop = await prisma.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true, assignedToId: true, contact: { select: { assignedToId: true } } },
      });

      if (!prop) {
        return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
      }

      const isOwner =
        user.role === 'ADMIN' ||
        !prop.assignedToId ||
        prop.assignedToId === user.id ||
        prop.contact?.assignedToId === user.id;

      if (!isOwner) {
        return NextResponse.json(
          { error: 'No tienes autorización para ver los documentos de esta propuesta' },
          { status: 403 }
        );
      }

      where.proposalId = proposalId;
    } else if (contactId) {
      // Verificar propiedad del contacto
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, assignedToId: true },
      });

      if (!contact) {
        return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
      }

      const isOwner = user.role === 'ADMIN' || !contact.assignedToId || contact.assignedToId === user.id;

      if (!isOwner) {
        return NextResponse.json(
          { error: 'No tienes autorización para ver los documentos de este contacto' },
          { status: 403 }
        );
      }

      where.contactId = contactId;
    } else {
      // Si no especifica filtros, el asesor ve sus documentos subidos o los de sus propuestas + institucionales
      if (user.role === 'ADMIN') {
        // Admin ve todo
      } else {
        where.OR = [
          { isInstitutional: true },
          { uploadedById: user.id },
          { proposal: { assignedToId: user.id } },
          { contact: { assignedToId: user.id } },
        ];
      }
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
        proposal: { select: { id: true, title: true, amount: true } },
        contact: { select: { id: true, name: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      fileUrl,
      fileType = 'OTRO',
      fileSize,
      category = 'COTIZACION',
      version = 'v1',
      isInstitutional = false,
      proposalId,
      contactId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'El título del documento es obligatorio' }, { status: 400 });
    }

    if (!fileUrl || !fileUrl.trim()) {
      return NextResponse.json({ error: 'La URL o archivo del documento es obligatorio' }, { status: 400 });
    }

    // Regla de Privacidad y Gobernanza:
    // Solo un Administrador (Director) puede publicar o marcar documentos en la Biblioteca Institucional
    if (isInstitutional && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo la Dirección Comercial puede publicar recursos en la Biblioteca Institucional' },
        { status: 403 }
      );
    }

    // Si se adjunta a una propuesta, validar que pertenezca al asesor o sea Admin
    let resolvedContactId = contactId || null;
    if (proposalId) {
      const prop = await prisma.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true, contactId: true, assignedToId: true },
      });

      if (!prop) {
        return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
      }

      const isOwner = user.role === 'ADMIN' || !prop.assignedToId || prop.assignedToId === user.id;
      if (!isOwner) {
        return NextResponse.json(
          { error: 'No tienes autorización para adjuntar documentos en esta propuesta' },
          { status: 403 }
        );
      }

      if (!resolvedContactId) {
        resolvedContactId = prop.contactId;
      }
    }

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        fileUrl: fileUrl.trim(),
        fileType: fileType.toUpperCase(),
        fileSize: fileSize ? parseInt(fileSize, 10) : null,
        category: category.toUpperCase(),
        version: version ? version.trim() : 'v1',
        isInstitutional: Boolean(isInstitutional),
        proposalId: proposalId || null,
        contactId: resolvedContactId,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        proposal: { select: { id: true, title: true } },
      },
    });

    // Registrar actividad en la bitácora si está vinculado a un contacto/propuesta
    if (resolvedContactId) {
      await prisma.activity.create({
        data: {
          contactId: resolvedContactId,
          proposalId: proposalId || null,
          userId: user.id,
          type: 'NOTA',
          description: `Documento adjuntado: "${document.title}" (${document.fileType}${document.version ? ` - ${document.version}` : ''}) por ${user.name}.`,
        },
      });
    }

    return NextResponse.json({ document, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error al registrar documento:', error);
    return NextResponse.json({ error: 'Error al registrar el documento' }, { status: 500 });
  }
}
