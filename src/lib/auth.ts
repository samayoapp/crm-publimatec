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

export async function getCurrentUser(): Promise<(UserSession & { phone?: string | null; avatarUrl?: string | null }) | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  // Verify user is still active in DB
  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, active: true },
  });

  if (!dbUser || !dbUser.active) {
    return null;
  }

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    phone: dbUser.phone,
    avatarUrl: dbUser.avatarUrl,
  };
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
