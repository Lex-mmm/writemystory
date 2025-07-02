"use client";

import { useState } from 'react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

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
      description: 'Perfect om te ontdekken hoe het werkt',
      monthlyPrice: 0,
      priceId: 'free',
      features: [
        '1 verhaalproject starten',
        'Tot 10 vragen beantwoorden',
        'Voorbeeld hoofdstuk genereren',
        'Dashboard toegang',
        'E-mail ondersteuning'
      ],
      limitations: [
        'Geen volledig boek',
        'Beperkte vragenset',
        'Geen premium lay-outs'
      ],
      cta: 'Gratis proberen',
      popular: false,
      color: 'gray'
    },
    {
      name: 'Starter',
      description: 'Start je verhaal met tekstgebaseerde input via WhatsApp of browser. Inclusief AI-ondersteuning, PDF-export en e-mail support.',
      monthlyPrice: 19,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY,
      features: [
        'WhatsApp & browser toegang',
        'Tekst-gebaseerde verhalen',
        'Basis AI-ondersteuning',
        'PDF download',
        'E-mail ondersteuning',
        '1 verhaalproject'
      ],
      limitations: [
        'Geen afbeeldingen',
        'Beperkte AI-functies',
        'Geen gedrukt boek'
      ],
      cta: 'Start met Starter',
      popular: false,
      color: 'blue'
    },
    {
      name: 'Comfort',
      description: 'Meer ruimte en mogelijkheden: afbeeldingen, slimmere AI-bewerking, verbeterde lay-outs en ondersteuning voor meerdere projecten.',
      monthlyPrice: 69,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMFORT_MONTHLY,
      features: [
        'Alles van Starter plan',
        'Afbeelding ondersteuning',
        'Slimmere AI-bewerking',
        'Meer opslagruimte',
        'Verbeterde lay-out opties',
        'WhatsApp + e-mail ondersteuning',
        'Tot 3 verhaalprojecten'
      ],
      limitations: [
        'Geen menselijke review',
        'Geen gedrukt boek inbegrepen'
      ],
      cta: 'Kies Comfort',
      popular: true,
      color: 'green'
    },
    {
      name: 'Deluxe',
      description: 'Onbeperkte input, volledige AI-hoofdstukken, afbeeldingen en menselijke review.',
      monthlyPrice: 99,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DELUXE_MONTHLY,
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
      <Navigation />
      
      <main className="flex-grow bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Kies je verhaal-pakket
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Begin gratis en upgrade wanneer je klaar bent om je verhaal compleet te maken. 
              Alle plannen omvatten onze AI-begeleiding en smart vragenservice.
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
                  
                  {plan.monthlyPrice === 0 ? (
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">Gratis</span>
                      <span className="text-gray-600"> / altijd</span>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        €{plan.monthlyPrice}
                      </span>
                      <span className="text-gray-600">/maand</span>
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

                {plan.monthlyPrice === 0 ? (
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

          {/* Print Upgrade Add-on */}
          <div className="mt-12 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📚 Print Upgrade</h2>
              <p className="text-gray-600 mb-6">
                Ontvang je verhaal als professioneel gedrukt hardcover boek. Inclusief persoonlijke omslag, hoogwaardig papier en gratis verzending binnen Nederland.
              </p>
              
              <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Gedrukt Hardcover Boek</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Ontvang je verhaal als professioneel gedrukt hardcover boek. Inclusief persoonlijke omslag, hoogwaardig papier en gratis verzending binnen Nederland.
                </p>
                
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  €169<span className="text-base font-normal text-gray-600">/boek</span>
                </div>
                
                <ul className="text-sm text-gray-600 mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Professionele hardcover binding
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Hoogkwalitatieve papier en print
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Gepersonaliseerde omslag
                  </li>
                  <li className="flex items-center">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Gratis verzending in Nederland
                  </li>
                </ul>
                
                <button
                  onClick={() => {
                    if (!user) {
                      window.location.href = '/login?redirect=/pricing';
                      return;
                    }
                    handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRINT_UPGRADE!, 'Print Upgrade');
                  }}
                  className="w-full py-3 px-6 rounded-lg font-medium transition-colors bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Bestel Print Upgrade
                </button>
                
                <p className="text-xs text-gray-500 mt-3">
                  * Print upgrade kan worden besteld voor elk voltooid verhaal
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">30 dagen geld terug</h3>
              <p className="text-gray-600 text-sm">
                Niet tevreden? Krijg je geld terug binnen 30 dagen, geen vragen gesteld.
              </p>
            </div>
            
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
              <h3 className="text-lg font-semibold mb-2">Altijd opzeggen</h3>
              <p className="text-gray-600 text-sm">
                Stop wanneer je wilt. Geen verborgen kosten, geen lange contracten.
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Veelgestelde vragen over prijzen</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Kan ik later upgraden of downgraden?</h3>
                <p className="text-gray-600 text-sm">
                  Ja, je kunt altijd van plan wisselen. Bij upgraden betaal je direct het verschil, bij downgraden krijg je een tegoed voor de volgende maand.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Wat gebeurt er als ik stop?</h3>
                <p className="text-gray-600 text-sm">
                  Je houdt toegang tot al je gegenereerde content. Downloaden blijft mogelijk, nieuwe vragen genereren niet.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Zijn er extra kosten voor gedrukte boeken?</h3>
                <p className="text-gray-600 text-sm">
                  In Premium en Familie pakketten is 1 boek per verhaal inbegrepen. Extra exemplaren kosten €25 per stuk.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Hoe werkt de gratis trial?</h3>
                <p className="text-gray-600 text-sm">
                  De gratis versie is onbeperkt bruikbaar maar beperkt in functionaliteit. Perfect om te ervaren hoe ons platform werkt.
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
