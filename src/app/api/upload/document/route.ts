import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // Limit size to 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el límite máximo de 50MB' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    let fileType = 'OTRO';
    if (ext === '.pdf') fileType = 'PDF';
    else if (['.ppt', '.pptx'].includes(ext)) fileType = 'PPT';
    else if (['.xls', '.xlsx', '.csv'].includes(ext)) fileType = 'EXCEL';
    else if (['.doc', '.docx'].includes(ext)) fileType = 'WORD';
    else if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) fileType = 'IMAGE';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    await mkdir(uploadsDir, { recursive: true });

    const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = `${Date.now()}-${safeBaseName}${ext}`;
    const filePath = path.join(uploadsDir, safeFilename);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/documents/${safeFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
      originalName: file.name,
      fileType,
      size: file.size,
    });
  } catch (error) {
    console.error('Error al subir documento:', error);
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 });
  }
}
