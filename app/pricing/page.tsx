"use client";

import { useState } from 'react';
import Head from 'next/head';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import CLIENT_WHATSAPP_CONFIG from '../../lib/clientWhatsappConfig';

export default function PricingPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) {
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    // Check if price ID is configured
    if (!priceId || priceId.includes('REPLACE_WITH_ACTUAL') || priceId.startsWith('prod_')) {
      alert('Deze prijs is nog niet geconfigureerd. Je moet price IDs (niet product IDs) instellen in de environment variables.');
      return;
    }

    setIsLoading(priceId);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
          planName,
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create checkout session');
      }
      
      if (responseData.url) {
        window.location.href = responseData.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Er ging iets mis bij het starten van de betaling: ${errorMessage}. Probeer het opnieuw.`);
    } finally {
      setIsLoading(null);
    }
  };

  const plans = [
    {
      name: 'Gratis Kennismaking',
      description: 'Ontdek hoe het werkt – zonder verplichtingen',
      projectPrice: 0,
      priceId: 'free',
      features: [
        '1 proefproject',
        'Tot 10 vragen beantwoorden',
        'Voorbeeld hoofdstuk genereren',
        'Alleen via browser'
      ],
      limitations: [
        'Geen AI-ondersteuning',
        'Geen e-mail ondersteuning',
        'Geen volledig verhaal',
        'Beperkte functies'
      ],
      cta: 'Probeer gratis',
      popular: false,
      color: 'gray'
    },
    {
      name: 'Basis',
      description: CLIENT_WHATSAPP_CONFIG.shouldShowWhatsAppFeatures() 
        ? 'Voor een persoonlijk verhaal via WhatsApp' 
        : 'Voor een persoonlijk verhaal',
      projectPrice: 49,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_PROJECT,
      features: [
        CLIENT_WHATSAPP_CONFIG.shouldShowWhatsAppFeatures() 
          ? 'Input via WhatsApp en browser' 
          : 'Input via browser en email',
        'AI-gegenereerde tekst',
        'PDF-download van je verhaal',
        'E-mail ondersteuning',
        '1 afgerond verhaal'
      ],
      limitations: [
        'Geen afbeeldingen',
        'Beperkte revisiemogelijkheden'
      ],
      cta: 'Start met Basis',
      popular: false,
      color: 'blue'
    },
    {
      name: 'Comfort',
      description: 'Voor visueel rijkere verhalen en slimmere AI',
      projectPrice: 79,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMFORT_PROJECT,
      features: [
        'Alles van Basis',
        'Afbeeldingen uploaden voor je verhaal',
        'Verbeterde lay-out en bewerkingen',
        'Tot 3 revisierondes',
        CLIENT_WHATSAPP_CONFIG.shouldShowWhatsAppFeatures()
          ? 'WhatsApp & e-mail ondersteuning'
          : 'E-mail ondersteuning'
      ],
      limitations: [],
      cta: 'Kies Comfort',
      popular: true,
      color: 'green'
    },
    {
      name: 'Deluxe',
      description: 'Voor het meest complete en professionele eindresultaat',
      projectPrice: 129,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DELUXE_PROJECT,
      features: [
        'Alles van Comfort',
        'Onbeperkte input',
        'Volledige AI-hoofdstukken',
        'Inclusief menselijke review en eindredactie',
        'Meerdere exportformaten (PDF, Word, ePub)',
        'Prioriteit support'
      ],
      limitations: [],
      cta: 'Ga voor Deluxe',
      popular: false,
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string, active = false) => {
    const colors = {
      gray: active ? 'border-gray-500 bg-gray-50' : 'border-gray-200',
      blue: active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-blue-200',
      purple: active ? 'border-purple-500 bg-purple-50' : 'border-purple-200',
      green: active ? 'border-green-500 bg-green-50' : 'border-green-200'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getButtonClasses = (color: string) => {
    const colors = {
      gray: 'bg-gray-600 hover:bg-gray-700 text-white',
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      purple: 'bg-purple-600 hover:bg-purple-700 text-white',
      green: 'bg-green-600 hover:bg-green-700 text-white'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Prijzen - WriteMyStory.ai</title>
        <meta name="description" content="Kies je verhaal-pakket. Begin gratis en betaal alleen voor complete verhaalprojecten." />
      </Head>
      <Navigation />
      
      <main className="flex-grow bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Kies je verhaal-pakket
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Begin gratis en betaal alleen voor complete verhaalprojecten. 
              Alle plannen omvatten onze AI-begeleiding en {CLIENT_WHATSAPP_CONFIG.shouldShowWhatsAppFeatures() ? 'WhatsApp ondersteuning' : 'e-mail ondersteuning'}.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg p-6 ${
                  plan.popular ? getColorClasses(plan.color, true) : getColorClasses(plan.color)
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Meest gekozen
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  {plan.projectPrice === 0 ? (
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">Gratis</span>
                      <span className="text-gray-600"> / altijd</span>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        €{plan.projectPrice}
                      </span>
                      <span className="text-gray-600"> / project</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((limitation, index) => (
                    <li key={`limitation-${index}`} className="flex items-start opacity-75">
                      <svg className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-gray-500 text-sm">{limitation}</span>
                    </li>
                  ))}
                </ul>

                {plan.projectPrice === 0 ? (
                  <button
                    onClick={() => window.location.href = user ? '/dashboard' : '/signup'}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${getButtonClasses(plan.color)}`}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(
                      plan.priceId!,
                      plan.name
                    )}
                    disabled={isLoading === plan.priceId}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonClasses(plan.color)}`}
                  >
                    {isLoading === plan.priceId
                      ? 'Bezig...'
                      : plan.cta
                    }
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Veilige betalingen</h3>
              <p className="text-gray-600 text-sm">
                Alle betalingen worden veilig verwerkt via Stripe. Je gegevens zijn altijd beschermd.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 11-9.75 9.75 9.75 9.75 0 019.75-9.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Betaal per project</h3>
              <p className="text-gray-600 text-sm">
                Geen abonnementen of terugkerende kosten. Betaal alleen voor afgeronde verhaalprojecten.
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Veelgestelde vragen over onze pakketten</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Kan ik meerdere projecten maken?</h3>
                <p className="text-gray-600 text-sm">
                  Ja, je kunt zoveel projecten maken als je wilt. Je betaalt per afgerond project volgens het pakket dat je kiest.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Wat gebeurt er na betaling?</h3>
                <p className="text-gray-600 text-sm">
                  Na betaling krijg je direct toegang tot alle functies van je gekozen pakket en kun je je verhaal voltooien.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Hoe werkt de gratis kennismaking?</h3>
                <p className="text-gray-600 text-sm">
                  Je kunt gratis beginnen met een beperkt proefproject om te ervaren hoe ons platform werkt voordat je een volledig pakket koopt.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              💳 Veilig betalen met iDEAL, creditcard of bankoverschrijving • 🇳🇱 Nederlandse klantenservice
            </p>
            <p className="text-sm text-gray-500">
              Vragen over de prijzen? 
              <a href="mailto:info@write-my-story.com" className="text-blue-600 hover:underline ml-1">
                Neem contact op
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
