import { kv } from '@vercel/kv';

export { kv };

// Key patterns for rate limiting and spend tracking
export const kvKeys = {
  // Authenticated user monthly conversation count
  userMonthlyUsage: (userId: string, monthId: string) => `usage:monthly:${userId}:${monthId}`,

  // Anonymous IP lifetime conversation count
  ipUsage: (ip: string) => `usage:ip:${ip}`,

  // Daily spend tracking
  dailySpend: (date: string) => `cost:${date}`,
};

/**
 * Get ISO week number (1-53) for the current date
 * Used for weekly rate limit resets
 */
export function getISOWeekNumber(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayDateKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get month key in YYYY-MM format for monthly rate limit resets
 */
export function getMonthKey(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}
