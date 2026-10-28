import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'pixelmedia_publimatec_secret_key_crm_2026_super_secure';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'crm_publimatec_token';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function createSessionToken(user: UserSession): Promise<string> {
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

// Micro-cache en memoria TTL de 5 segundos para evitar consultas duplicadas a la tabla User
// en requests concurrentes generados por la misma pantalla (ej. dashboard + notificaciones + perfil)
const userCache = new Map<string, { user: any; expiresAt: number }>();

export function invalidateUserCache(userId?: string) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

export async function getCurrentUser(): Promise<(UserSession & { phone?: string | null; avatarUrl?: string | null; preferredCurrency?: string | null }) | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const now = Date.now();
  const cached = userCache.get(session.id);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  // Verify user is still active in DB
  let dbUser: any = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, preferredCurrency: true, active: true },
    });
  } catch (err: any) {
    // Graceful fallback if preferredCurrency column is not yet migrated in DB
    dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, active: true },
    });
  }

  if (!dbUser || !dbUser.active) {
    userCache.delete(session.id);
    return null;
  }

  const userResult = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    phone: dbUser.phone,
    avatarUrl: dbUser.avatarUrl,
    preferredCurrency: dbUser.preferredCurrency || 'HNL',
  };

  // Guardar en cache durante 5 segundos
  userCache.set(session.id, { user: userResult, expiresAt: now + 5000 });

  return userResult;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
