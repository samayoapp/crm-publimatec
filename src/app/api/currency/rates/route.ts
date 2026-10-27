import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { DEFAULT_EXCHANGE_RATES, CurrencyCode } from '@/lib/currency';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function fetchLiveExchangeRates(): Promise<{
  rates: Record<string, number>;
  updatedAt: Date;
  success: boolean;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        const rates: Record<string, number> = {
          USD: 1.0,
          EUR: Number(data.rates.EUR) || DEFAULT_EXCHANGE_RATES.EUR,
          HNL: Number(data.rates.HNL) || DEFAULT_EXCHANGE_RATES.HNL,
        };
        const updatedAt = new Date();

        // Guardar en la base de datos de forma segura
        await prisma.setting.upsert({
          where: { id: 'default' },
          update: {
            exchangeRates: rates,
            ratesUpdatedAt: updatedAt,
          },
          create: {
            id: 'default',
            currency: 'HNL',
            currencySymbol: 'L',
            exchangeRates: rates,
            ratesUpdatedAt: updatedAt,
          },
        });

        return { rates, updatedAt, success: true };
      }
    }
  } catch (error) {
    console.warn('No se pudo conectar a la API en vivo de tipos de cambio, usando guardados/fallback:', error);
  }

  return {
    rates: DEFAULT_EXCHANGE_RATES,
    updatedAt: new Date(),
    success: false,
  };
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Consultar tasas guardadas en Settings
    const setting = await prisma.setting.findUnique({
      where: { id: 'default' },
      select: {
        currency: true,
        currencySymbol: true,
        exchangeRates: true,
        ratesUpdatedAt: true,
      },
    });

    const storedRates = setting?.exchangeRates as Record<string, number> | null;
    const ratesUpdatedAt = setting?.ratesUpdatedAt;

    const isStale =
      !storedRates ||
      !ratesUpdatedAt ||
      Date.now() - new Date(ratesUpdatedAt).getTime() > SIX_HOURS_MS;

    if (forceRefresh || isStale) {
      const live = await fetchLiveExchangeRates();
      return NextResponse.json({
        rates: live.rates,
        updatedAt: live.updatedAt,
        isLive: live.success,
        globalCurrency: setting?.currency || 'HNL',
        globalCurrencySymbol: setting?.currencySymbol || 'L',
      });
    }

    return NextResponse.json({
      rates: storedRates || DEFAULT_EXCHANGE_RATES,
      updatedAt: ratesUpdatedAt,
      isLive: true,
      globalCurrency: setting?.currency || 'HNL',
      globalCurrencySymbol: setting?.currencySymbol || 'L',
    });
  } catch (error) {
    console.error('Error al obtener tipos de cambio:', error);
    return NextResponse.json({
      rates: DEFAULT_EXCHANGE_RATES,
      updatedAt: new Date(),
      isLive: false,
      globalCurrency: 'HNL',
      globalCurrencySymbol: 'L',
    });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo directores administradores pueden sincronizar o fijar tipos de cambio' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Si pasan customRates, guardamos los valores manuales
    if (body.customRates) {
      const customRates: Record<string, number> = {
        USD: 1.0,
        EUR: Number(body.customRates.EUR) || DEFAULT_EXCHANGE_RATES.EUR,
        HNL: Number(body.customRates.HNL) || DEFAULT_EXCHANGE_RATES.HNL,
      };

      const updatedAt = new Date();
      await prisma.setting.upsert({
        where: { id: 'default' },
        update: {
          exchangeRates: customRates,
          ratesUpdatedAt: updatedAt,
        },
        create: {
          id: 'default',
          currency: 'HNL',
          currencySymbol: 'L',
          exchangeRates: customRates,
          ratesUpdatedAt: updatedAt,
        },
      });

      return NextResponse.json({
        rates: customRates,
        updatedAt,
        message: 'Tasas de cambio actualizadas manualmente con éxito',
        success: true,
      });
    }

    // De lo contrario, forzar sincronización en vivo
    const live = await fetchLiveExchangeRates();
    return NextResponse.json({
      rates: live.rates,
      updatedAt: live.updatedAt,
      isLive: live.success,
      message: live.success
        ? 'Tipos de cambio actualizados exitosamente con el mercado internacional'
        : 'No se pudo sincronizar en línea; se mantuvieron las tasas locales seguras',
      success: live.success,
    });
  } catch (error) {
    console.error('Error al actualizar tipos de cambio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tipos de cambio' },
      { status: 500 }
    );
  }
}
