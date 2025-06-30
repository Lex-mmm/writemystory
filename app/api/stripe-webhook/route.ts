import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Build-time protection
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase service role key not available');
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Stripe webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as {
          id: string;
          customer: string | null;
          subscription: string | null;
          metadata: Record<string, string>;
        });
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as {
          id: string;
          status: string;
          current_period_start: number;
          current_period_end: number;
        });
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as {
          id: string;
          status: string;
          current_period_start: number;
          current_period_end: number;
        });
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as {
          id: string;
        });
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as {
          subscription: string | null;
        });
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as {
          subscription: string | null;
        });
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: {
  id: string;
  customer: string | null;
  subscription: string | null;
  metadata: Record<string, string>;
}) {
  console.log('Checkout completed:', session.id);

  try {
    // Type check the session object
    if (!session.customer || !session.subscription || !session.metadata?.userId) {
      console.error('Missing required session data:', {
        customer: !!session.customer,
        subscription: !!session.subscription,
        userId: !!session.metadata?.userId
      });
      return;
    }

    // Update checkout session status
    await supabaseAdmin
      .from('checkout_sessions')
      .update({
        status: 'completed',
        subscription_id: session.subscription,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    // Update user subscription status
    await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: session.metadata.userId,
        customer_id: session.customer,
        subscription_id: session.subscription,
        plan: session.metadata.plan || 'basic',
        interval: session.metadata.interval || 'monthly',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
}) {
  console.log('Subscription created:', subscription.id);
  
  try {
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscription.id);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
}) {
  console.log('Subscription updated:', subscription.id);
  
  try {
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscription.id);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionCanceled(subscription: {
  id: string;
}) {
  console.log('Subscription canceled:', subscription.id);
  
  try {
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscription.id);
  } catch (error) {
    console.error('Error handling subscription canceled:', error);
  }
}

async function handlePaymentSucceeded(invoice: {
  subscription: string | null;
}) {
  console.log('Payment succeeded for subscription:', invoice.subscription);
  
  try {
    // Check if subscription exists and is a string
    if (!invoice.subscription || typeof invoice.subscription !== 'string') {
      console.error('Invalid subscription in payment succeeded event:', invoice.subscription);
      return;
    }

    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', invoice.subscription);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: {
  subscription: string | null;
}) {
  console.log('Payment failed for subscription:', invoice.subscription);
  
  try {
    // Check if subscription exists and is a string
    if (!invoice.subscription || typeof invoice.subscription !== 'string') {
      console.error('Invalid subscription in payment failed event:', invoice.subscription);
      return;
    }

    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', invoice.subscription);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}
