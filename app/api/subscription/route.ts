import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  // Build-time protection
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase service role key not available');
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    // Get user subscription from database
    const { data: subscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!subscription) {
      return NextResponse.json({ 
        hasSubscription: false,
        subscription: null 
      });
    }

    // Get detailed info from Stripe if needed
    let stripeSubscription = null;
    if (subscription.subscription_id && stripe) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(subscription.subscription_id);
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        ...subscription,
        stripe_data: stripeSubscription
      }
    });

  } catch (error) {
    console.error('Error in subscription API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { action, userId, subscriptionId } = await request.json();

  if (!userId || !subscriptionId) {
    return NextResponse.json({ 
      error: 'User ID and subscription ID required' 
    }, { status: 400 });
  }

  try {
    if (action === 'cancel') {
      // Cancel subscription at period end
      const subscription = await stripe?.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      // Update database
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: 'canceling',
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscriptionId);

      return NextResponse.json({ 
        success: true, 
        subscription 
      });

    } else if (action === 'reactivate') {
      // Reactivate subscription
      const subscription = await stripe?.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      // Update database
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscriptionId);

      return NextResponse.json({ 
        success: true, 
        subscription 
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to manage subscription' 
    }, { status: 500 });
  }
}
