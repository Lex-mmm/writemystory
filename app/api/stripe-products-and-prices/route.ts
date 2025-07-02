import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';

export async function GET() {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Get all products with their prices
    const products = await stripe.products.list({ limit: 10, expand: ['data.default_price'] });
    
    const productDetails = [];
    
    for (const product of products.data) {
      // Get all prices for this product
      const prices = await stripe.prices.list({ 
        product: product.id, 
        limit: 10 
      });
      
      productDetails.push({
        id: product.id,
        name: product.name,
        description: product.description,
        active: product.active,
        prices: prices.data.map(price => ({
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          type: price.type
        }))
      });
    }

    return NextResponse.json({
      products: productDetails,
      instructions: {
        message: "Use the price IDs from the products above in your environment variables",
        mapping: {
          "Starter": "Find the Starter product and use its price ID for NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY",
          "Comfort": "Find the Comfort product and use its price ID for NEXT_PUBLIC_STRIPE_PRICE_COMFORT_MONTHLY", 
          "Deluxe": "Find the Deluxe product and use its price ID for NEXT_PUBLIC_STRIPE_PRICE_DELUXE_MONTHLY",
          "Print": "Find the Print product and use its price ID for NEXT_PUBLIC_STRIPE_PRICE_PRINT_UPGRADE"
        }
      }
    });

  } catch (error) {
    console.error('Error getting products and prices:', error);
    return NextResponse.json({ 
      error: 'Failed to get products and prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
