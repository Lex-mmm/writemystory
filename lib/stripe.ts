import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Client-side Stripe
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found');
}

export const getStripe = () => {
  if (!stripePublishableKey) {
    console.error('Stripe publishable key is required');
    return null;
  }
  return loadStripe(stripePublishableKey);
};

// Server-side Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && typeof window === 'undefined') {
  console.warn('Stripe secret key not found');
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
}) : null;

// Pricing configuration
export const pricingPlans = {
  starter: {
    name: 'Starter',
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      'WhatsApp & browser toegang',
      'Tekst-gebaseerde verhalen',
      'Basis AI-ondersteuning',
      'PDF download',
      'E-mail ondersteuning',
      '1 verhaalproject'
    ],
    stripeIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY,
    }
  },
  comfort: {
    name: 'Comfort',
    monthlyPrice: 39,
    yearlyPrice: 390,
    features: [
      'Alles van Starter plan',
      'Afbeelding ondersteuning',
      'Slimmere AI-bewerking',
      'Meer opslagruimte',
      'Verbeterde lay-out opties',
      'WhatsApp + e-mail ondersteuning',
      'Tot 3 verhaalprojecten'
    ],
    stripeIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMFORT_MONTHLY,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMFORT_YEARLY,
    }
  },
  deluxe: {
    name: 'Deluxe',
    monthlyPrice: 69,
    yearlyPrice: 690,
    features: [
      'Alles van Comfort plan',
      'Onbeperkte input',
      'Volledige AI-hoofdstukken',
      'Menselijke review & editing',
      'Premium afbeelding ondersteuning',
      'Prioriteit ondersteuning',
      'Onbeperkte verhaalprojecten',
      'Geavanceerde lay-out opties'
    ],
    stripeIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_DELUXE_MONTHLY,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_DELUXE_YEARLY,
    }
  }
};

export type PricingPlan = keyof typeof pricingPlans;
export type BillingInterval = 'monthly' | 'yearly';
