import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  // Build-time protection
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase service role key not available');
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  if (!stripe) {
    console.error('Stripe not configured - missing secret key');
    return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
  }

  try {
    const { priceId, userId, userEmail, planName } = await request.json();

    if (!priceId || !userId || !userEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if price ID is a placeholder or product ID
    if (priceId.includes('PleaseFillIn') || priceId.includes('YOUR_') || priceId.includes('REPLACE_WITH_ACTUAL')) {
      return NextResponse.json({ 
        error: 'Price ID not configured. Please set up your Stripe price IDs in the environment variables.' 
      }, { status: 500 });
    }

    // Check if user provided product ID instead of price ID
    if (priceId.startsWith('prod_')) {
      return NextResponse.json({ 
        error: 'Invalid price ID. You provided a product ID (starts with prod_) but need a price ID (starts with price_). Please create prices for your products in Stripe Dashboard and use the price IDs.' 
      }, { status: 500 });
    }

    console.log('Creating checkout session for:', { priceId, userId, planName });

    // Create or get customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: userId
          }
        });
      }
    } catch (error) {
      console.error('Error with customer:', error);
      return NextResponse.json({ error: 'Customer creation failed' }, { status: 500 });
    }

    // Determine the correct site URL (for both local and production)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${siteUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
      metadata: {
        userId: userId,
        plan: planName,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          plan: planName,
        },
      },
    });

    console.log('Checkout session created:', session.id);

    // Store checkout session in database
    try {
      await supabaseAdmin
        .from('checkout_sessions')
        .insert({
          id: session.id,
          user_id: userId,
          customer_id: customer.id,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error storing checkout session:', error);
      // Continue anyway - the webhook will handle the subscription
    }

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session' 
    }, { status: 500 });
  }
}
