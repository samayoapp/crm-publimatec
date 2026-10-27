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
    const personal = searchParams.get('personal') === 'true';
    const targetUserId = searchParams.get('userId');
    const folderId = searchParams.get('folderId');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const proposalId = searchParams.get('proposalId');
    const contactId = searchParams.get('contactId');

    const where: any = {};

    if (institutional) {
      // Biblioteca institucional: visible para todos los usuarios
      where.isInstitutional = true;
    } else if (personal) {
      // Espacio personal:
      where.isInstitutional = false;
      if (user.role === 'ADMIN') {
        // El Director puede ver los archivos personales de todos los vendedores o filtrar por uno específico
        if (targetUserId && targetUserId !== 'ALL') {
          where.uploadedById = targetUserId;
        }
      } else {
        where.uploadedById = user.id;
      }
    } else if (proposalId) {
      // Verificar propiedad de la propuesta
      const prop = await prisma.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true, assignedToId: true, contact: { select: { assignedToId: true } } },
      });

      if (!prop) {
        return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
      }

      const isOwner = user.role === 'ADMIN' || prop.assignedToId === user.id;

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

    // Filtro por carpeta
    if (folderId === 'ROOT' || folderId === 'NONE') {
      where.folderId = null;
    } else if (folderId && folderId !== 'ALL') {
      where.folderId = folderId;
    }

    // Filtro por Tag / Categoría
    const effectiveTag = tag || category;
    const tagFilters: any[] = [];
    if (effectiveTag && effectiveTag !== 'ALL') {
      tagFilters.push({ tags: { has: effectiveTag } });
      tagFilters.push({ category: effectiveTag });
    }

    // Filtro por búsqueda
    const searchFilters: any[] = [];
    if (search) {
      searchFilters.push({ title: { contains: search, mode: 'insensitive' } });
      searchFilters.push({ description: { contains: search, mode: 'insensitive' } });
      searchFilters.push({ tags: { has: search } });
    }

    if (tagFilters.length > 0 && searchFilters.length > 0) {
      where.AND = [
        { OR: tagFilters },
        { OR: searchFilters },
      ];
    } else if (tagFilters.length > 0) {
      where.OR = tagFilters;
    } else if (searchFilters.length > 0) {
      where.OR = searchFilters;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
        proposal: { select: { id: true, title: true, amount: true } },
        contact: { select: { id: true, name: true, companyName: true } },
        folder: { select: { id: true, name: true, color: true } },
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
      tags = [],
      folderId = null,
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

      const isOwner = user.role === 'ADMIN' || prop.assignedToId === user.id;
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

    const finalTags: string[] = Array.isArray(tags)
      ? tags.map((t: any) => String(t).trim()).filter(Boolean)
      : typeof tags === 'string' && tags.trim()
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    const effectiveCategory = category || (finalTags.length > 0 ? finalTags[0] : 'GENERAL');
    if (effectiveCategory && !finalTags.includes(effectiveCategory)) {
      finalTags.push(effectiveCategory);
    }

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        fileUrl: fileUrl.trim(),
        fileType: fileType.toUpperCase(),
        fileSize: fileSize ? parseInt(fileSize, 10) : null,
        category: effectiveCategory.toUpperCase(),
        tags: finalTags,
        folderId: folderId || null,
        version: version ? version.trim() : 'v1',
        isInstitutional: Boolean(isInstitutional),
        proposalId: proposalId || null,
        contactId: resolvedContactId,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        proposal: { select: { id: true, title: true } },
        folder: { select: { id: true, name: true, color: true } },
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
