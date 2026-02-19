import { kv, kvKeys, getTodayDateKey } from '@/lib/kv';

const DAILY_LIMIT = parseInt(
  process.env.GUIDE_DAILY_SPEND_LIMIT_CENTS || '5000'
);

// 48 hours in seconds - gives buffer for timezone differences
const EXPIRY_SECONDS = 48 * 60 * 60;

export interface SpendCheckResult {
  allowed: boolean;
  dailySpendCents: number;
  dailyLimitCents: number;
}

/**
 * Check if daily spend limit has been reached
 */
export async function checkSpendLimit(): Promise<SpendCheckResult> {
  const dateKey = getTodayDateKey();
  const key = kvKeys.dailySpend(dateKey);

  const dailySpendCents = (await kv.get<number>(key)) || 0;

  return {
    allowed: dailySpendCents < DAILY_LIMIT,
    dailySpendCents,
    dailyLimitCents: DAILY_LIMIT,
  };
}

/**
 * Estimate cost in cents based on token usage
 * Sonnet 4.5 pricing: $3/M input, $15/M output
 */
export function estimateCost(usage: { input_tokens: number; output_tokens: number }): number {
  const inputCostCents = (usage.input_tokens / 1_000_000) * 300;
  const outputCostCents = (usage.output_tokens / 1_000_000) * 1500;
  return inputCostCents + outputCostCents;
}

/**
 * Record API usage cost
 */
export async function recordUsage(
  clientIP: string,
  sessionId: string | undefined,
  costCents: number
): Promise<void> {
  const dateKey = getTodayDateKey();
  const key = kvKeys.dailySpend(dateKey);

  // Increment daily spend and set expiry
  await kv.incrby(key, Math.ceil(costCents * 100)); // Store as integer (hundredths of cents)
  await kv.expire(key, EXPIRY_SECONDS);

  // Log for monitoring (Vercel logs)
  const newTotal = (await kv.get<number>(key)) || 0;
  console.log(
    `[Guide] IP=${clientIP} session=${sessionId || 'none'} ` +
    `cost=${costCents.toFixed(4)}c ` +
    `daily=${(newTotal / 100).toFixed(2)}c`
  );
}

/**
 * Get current spend stats (for debugging/monitoring)
 */
export async function getSpendStats(): Promise<{
  dailySpendCents: number;
  dailyLimitCents: number;
  dateKey: string;
}> {
  const dateKey = getTodayDateKey();
  const key = kvKeys.dailySpend(dateKey);
  const rawValue = (await kv.get<number>(key)) || 0;

  return {
    dailySpendCents: rawValue / 100, // Convert back from hundredths
    dailyLimitCents: DAILY_LIMIT,
    dateKey,
  };
}
