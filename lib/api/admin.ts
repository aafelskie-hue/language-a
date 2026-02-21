import { getAuthenticatedUser } from './auth';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export async function isAdmin(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return { authorized: false as const };
  }
  return { authorized: true as const, userId: user.id };
}
