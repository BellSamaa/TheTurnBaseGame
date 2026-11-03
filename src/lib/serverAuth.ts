import { createHmac, timingSafeEqual, randomBytes, scryptSync } from 'crypto';
import { cookies } from 'next/headers';
const cookieName = 'dice_session';
function key() {
  const value = process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error('Server needs AUTH_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY');
  return value;
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: string, stored: string) {
  if (!password || !stored) return false;
  if (!stored.startsWith('scrypt:')) return password === stored; // Migrate legacy account on login.
  const [, salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex'), actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export async function issueSession(id: string) {
  const data = Buffer.from(JSON.stringify({ id, exp: Date.now() + 7 * 86400000 })).toString('base64url');
  const signature = createHmac('sha256', key()).update(data).digest('base64url');
  (await cookies()).set(cookieName, `${data}.${signature}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
}
export async function sessionUser() {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;
  try {
    const [data, signature] = value.split('.');
    const expected = createHmac('sha256', key()).update(data).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    return typeof payload.id === 'string' && payload.exp > Date.now() ? payload.id as string : null;
  } catch { return null; }
}
export async function clearSession() { (await cookies()).delete(cookieName); }
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  return !origin || origin === new URL(req.url).origin;
}
