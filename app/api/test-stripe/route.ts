import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';

export async function GET() {
  try {
    // Test Stripe connection
    if (!stripe) {
      return NextResponse.json({ 
        error: 'Stripe not configured',
        configured: false 
      }, { status: 500 });
    }

    // Try to list products to test API key
    const products = await stripe.products.list({ limit: 10 });
    
    const productInfo = products.data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      active: product.active
    }));

    // Check environment variables
    const envCheck = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY,
      NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY,
      NEXT_PUBLIC_STRIPE_PRICE_COMFORT_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMFORT_MONTHLY,
      NEXT_PUBLIC_STRIPE_PRICE_COMFORT_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMFORT_YEARLY,
      NEXT_PUBLIC_STRIPE_PRICE_DELUXE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_DELUXE_MONTHLY,
      NEXT_PUBLIC_STRIPE_PRICE_DELUXE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_DELUXE_YEARLY,
      NEXT_PUBLIC_STRIPE_PRICE_PRINT_UPGRADE: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRINT_UPGRADE,
    };

    return NextResponse.json({
      message: 'Stripe connection successful',
      configured: true,
      products: productInfo,
      environment: envCheck,
      needsPriceIds: Object.values(envCheck).some(val => 
        typeof val === 'string' && (val.includes('PleaseFillIn') || val.includes('YOUR_'))
      )
    });

  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json({ 
      error: 'Stripe test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      configured: false 
    }, { status: 500 });
  }
}
