import Stripe from 'stripe';

// Lazy singleton Stripe client (avoids initialization at build time)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}


// Price configuration
export const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID!,
  annual: process.env.STRIPE_ANNUAL_PRICE_ID!,
} as const;

export type PriceInterval = keyof typeof PRICE_IDS;

// URL helpers for redirects
export function getStripeUrls() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.language-a.com';
  return {
    success: `${baseUrl}/guide?subscription=success`,
    cancel: `${baseUrl}/premium`,
    portal: `${baseUrl}/profile`,
  };
}
