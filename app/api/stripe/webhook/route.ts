import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  // Get raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// --- Event Handlers ---

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('Checkout completed without userId in metadata');
    return;
  }

  console.log(`[Stripe] Checkout completed for user ${userId}`);

  await db
    .update(users)
    .set({
      tier: 'premium',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find by subscription ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeSubscriptionId, subscription.id));

    if (!user) {
      console.error('Subscription deleted but no matching user found:', subscription.id);
      return;
    }

    await downgradeUser(user.id);
    return;
  }

  await downgradeUser(userId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  // Handle cancellation (status changes to 'canceled' or 'unpaid')
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    if (userId) {
      await downgradeUser(userId);
    } else {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stripeSubscriptionId, subscription.id));

      if (user) {
        await downgradeUser(user.id);
      }
    }
  }

  // Handle reactivation
  if (subscription.status === 'active') {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeSubscriptionId, subscription.id));

    if (user && user.tier !== 'premium') {
      await db
        .update(users)
        .set({
          tier: 'premium',
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Log for monitoring - don't immediately downgrade
  // Stripe will retry and eventually cancel the subscription
  console.warn('[Stripe] Payment failed for invoice:', invoice.id, {
    customer: invoice.customer,
    attemptCount: invoice.attempt_count,
  });
}

// --- Helper Functions ---

async function downgradeUser(userId: string) {
  console.log(`[Stripe] Downgrading user ${userId} to free tier`);

  await db
    .update(users)
    .set({
      tier: 'free',
      stripeSubscriptionId: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
