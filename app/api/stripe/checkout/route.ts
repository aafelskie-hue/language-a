import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth';
import { getStripe, PRICE_IDS, getStripeUrls, type PriceInterval } from '@/lib/stripe';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  if (!user.email) {
    return NextResponse.json(
      { error: 'Email required for subscription' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { interval = 'monthly' } = body as { interval?: PriceInterval };

    // Validate interval
    if (!PRICE_IDS[interval]) {
      return NextResponse.json(
        { error: 'Invalid price interval' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // Create checkout session
    const urls = getStripeUrls();
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[interval],
          quantity: 1,
        },
      ],
      success_url: urls.success,
      cancel_url: urls.cancel,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
