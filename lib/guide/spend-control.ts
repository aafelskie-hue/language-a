// Simple spend tracking — in-memory for now
// Replace with Vercel KV or database when traffic justifies it

let dailySpendCents = 0;
let monthlySpendCents = 0;
let currentDay = new Date().toDateString();
let currentMonth = new Date().getMonth();

const DAILY_LIMIT = parseInt(
  process.env.GUIDE_DAILY_SPEND_LIMIT_CENTS || '500'
);
const MONTHLY_LIMIT = parseInt(
  process.env.GUIDE_MONTHLY_SPEND_LIMIT_CENTS || '5000'
);

export interface SpendCheckResult {
  allowed: boolean;
  dailySpendCents: number;
  monthlySpendCents: number;
  dailyLimitCents: number;
  monthlyLimitCents: number;
}

export function checkSpendLimit(): SpendCheckResult {
  const now = new Date();

  // Reset daily counter
  if (now.toDateString() !== currentDay) {
    dailySpendCents = 0;
    currentDay = now.toDateString();
  }

  // Reset monthly counter
  if (now.getMonth() !== currentMonth) {
    monthlySpendCents = 0;
    currentMonth = now.getMonth();
  }

  return {
    allowed: dailySpendCents < DAILY_LIMIT && monthlySpendCents < MONTHLY_LIMIT,
    dailySpendCents,
    monthlySpendCents,
    dailyLimitCents: DAILY_LIMIT,
    monthlyLimitCents: MONTHLY_LIMIT,
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

export function recordUsage(
  clientIP: string,
  sessionId: string | undefined,
  costCents: number
): void {
  dailySpendCents += costCents;
  monthlySpendCents += costCents;

  // Log for monitoring (Vercel logs)
  console.log(
    `[Guide] IP=${clientIP} session=${sessionId || 'none'} ` +
    `cost=${costCents.toFixed(4)}¢ ` +
    `daily=${dailySpendCents.toFixed(2)}¢ ` +
    `monthly=${monthlySpendCents.toFixed(2)}¢`
  );
}

// Get current spend stats (useful for debugging/monitoring)
export function getSpendStats(): {
  dailySpendCents: number;
  monthlySpendCents: number;
  dailyLimitCents: number;
  monthlyLimitCents: number;
  currentDay: string;
  currentMonth: number;
} {
  return {
    dailySpendCents,
    monthlySpendCents,
    dailyLimitCents: DAILY_LIMIT,
    monthlyLimitCents: MONTHLY_LIMIT,
    currentDay,
    currentMonth,
  };
}

// Reset spend counters (useful for testing)
export function resetSpend(): void {
  dailySpendCents = 0;
  monthlySpendCents = 0;
  currentDay = new Date().toDateString();
  currentMonth = new Date().getMonth();
}
