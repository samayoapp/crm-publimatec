import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let settings = await prisma.setting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: 'default',
          companyName: 'PixelMedia • Inversiones Publimatec',
          currency: 'USD',
          currencySymbol: '$',
          taxRate: 15.0,
          phone: '+504 9900-1122',
          email: 'contacto@pixelmediahn.com',
          address: 'San Pedro Sula, Cortés, Honduras',
          monthlySalesTarget: 15000,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    return NextResponse.json({ error: 'Error al obtener configuraciones' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden modificar las configuraciones del sistema' }, { status: 403 });
    }

    const data = await req.json();

    const updateData: any = {};
    if (data.companyName !== undefined) updateData.companyName = data.companyName.trim();
    if (data.currency !== undefined) updateData.currency = data.currency.trim().toUpperCase();
    if (data.currencySymbol !== undefined) updateData.currencySymbol = data.currencySymbol.trim();
    if (data.taxRate !== undefined) updateData.taxRate = parseFloat(data.taxRate) || 0;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl?.trim() || null;
    if (data.monthlySalesTarget !== undefined) updateData.monthlySalesTarget = parseFloat(data.monthlySalesTarget) || 0;

    const settings = await prisma.setting.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        companyName: updateData.companyName || 'PixelMedia • Inversiones Publimatec',
        currency: updateData.currency || 'USD',
        currencySymbol: updateData.currencySymbol || '$',
        taxRate: updateData.taxRate ?? 15.0,
        phone: updateData.phone || '+504 9900-1122',
        email: updateData.email || 'contacto@pixelmediahn.com',
        address: updateData.address || 'San Pedro Sula, Cortés, Honduras',
        logoUrl: updateData.logoUrl || null,
        monthlySalesTarget: updateData.monthlySalesTarget ?? 15000,
      },
    });

    return NextResponse.json({ settings, success: true });
  } catch (error) {
    console.error('Error al actualizar configuraciones:', error);
    return NextResponse.json({ error: 'Error al guardar configuraciones' }, { status: 500 });
  }
}
