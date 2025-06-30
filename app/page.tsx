"use client";

import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from "../components/Footer";
import Image from "next/image";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-white to-blue-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
                <span className="block">Wij vragen,</span>
                <span className="block text-blue-600">Jij vertelt</span>
              </h1>
              <p className="mt-3 text-lg text-gray-600 mb-8">
                Herinneringen vervagen, verhalen verdwijnen. Bewaar het levensverhaal van je dierbare – moeiteloos via spraak of WhatsApp. Jij vertelt, wij maken er een boek van.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
                  >
                    Naar mijn dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
                    >
                      Begin nu gratis
                    </Link>
                    <Link
                      href="/login"
                      className="px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 shadow-sm transition-all"
                    >
                      Inloggen
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="rounded-xl overflow-hidden shadow-xl">
                <Image
                  src="/images/home.png"
                  width={600}
                  height={400}
                  alt="Verhalen boek voorbeeld"
                  className="w-full h-auto object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Zo werkt het
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Onze AI stelt de juiste vragen op het juiste moment – jij hoeft alleen maar te antwoorden
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Wij stellen gerichte vragen</h3>
              <p className="text-gray-600">
                Onze AI vraagt precies wat nodig is om jouw verhaal compleet te maken. Van jeugdherinneringen tot levenslessons.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Jij antwoordt makkelijk</h3>
              <p className="text-gray-600">
                Via WhatsApp, e-mail of spraakbericht. Gewoon, wanneer het jou uitkomt. Geen stress, geen lege pagina.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Wij vullen de gaten op</h3>
              <p className="text-gray-600">
                Onze AI herkent ontbrekende stukken en stelt vervolgvragen. Zo wordt je verhaal compleet en samenhangend.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link 
              href="/how-it-works" 
              className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800"
            >
              Ontdek meer over hoe het werkt
              <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* New AI Guidance Section */}
      <div className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Onze AI begeleidt je verhaal
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Zoals een ervaren interviewer helpen wij je de verhalen te ontdekken die je misschien vergeten was
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Slimme vervolgvragen</h3>
                  <p className="text-gray-600">Als je vertelt over je eerste baan, vragen wij door over je collega&quot;s, uitdagingen en wat je geleerd hebt.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ontbrekende periodes opsporen</h3>
                  <p className="text-gray-600">Onze AI merkt gaten in je tijdlijn op en helpt je belangrijke levensfases in te vullen.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Emoties en betekenis</h3>
                  <p className="text-gray-600">We vragen niet alleen naar feiten, maar ook naar gevoelens en wat momenten voor je betekenden.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Verbindingen leggen</h3>
                  <p className="text-gray-600">Onze AI ziet patronen en helpt je verhalen te verbinden tot een samenhangend levensverhaal.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="space-y-4">
                <div className="bg-blue-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">AI vraagt:</p>
                  <p className="text-blue-800">&quot;Je noemde net je verhuizing naar Amsterdam. Wat was de grootste uitdaging in die periode?&quot;</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">Jij antwoordt:</p>
                  <p className="text-gray-700">&quot;De eenzaamheid. Ik kende niemand en miste mijn familie.&quot;</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">AI vervolgvraag:</p>
                  <p className="text-blue-800">&quot;Hoe heb je die eenzaamheid overwonnen? Wanneer begon Amsterdam echt thuis te voelen?&quot;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Wat anderen zeggen
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-bold">
                  M
                </div>
                <div className="ml-4">
                  <p className="font-medium">Marieke</p>
                  <p className="text-gray-500 text-sm">Het verhaal van mijn oma</p>
                </div>
              </div>
              <p className="text-gray-600">
                &quot;De AI stelde vragen waar ik zelf nooit aan gedacht had. Zo kwamen verhalen naar boven die mijn oma bijna vergeten was. Het boek werd veel rijker dan verwacht.&quot;
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-bold">
                  J
                </div>
                <div className="ml-4">
                  <p className="font-medium">Johan</p>
                  <p className="text-gray-500 text-sm">Voor mijn kinderen</p>
                </div>
              </div>
              <p className="text-gray-600">
                &quot;Ik dacht dat ik een saai leven had, maar door de slimme vragen ontdekte ik hoeveel bijzondere momenten ik eigenlijk had meegemaakt.&quot;
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-bold">
                  S
                </div>
                <div className="ml-4">
                  <p className="font-medium">Sandra</p>
                  <p className="text-gray-500 text-sm">Het verhaal van mijn vader</p>
                </div>
              </div>
              <p className="text-gray-600">
                &quot;De AI merkte op dat we niets hadden over papa&apos;s jeugd en stelde specifieke vragen die herinneringen naar boven brachten die hij jaren niet had verteld.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto text-center py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-4">
            Klaar om te beginnen?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Leg vandaag nog dat bijzondere levensverhaal vast voor toekomstige generaties
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="px-8 py-3 border border-transparent text-base font-medium rounded-lg text-blue-700 bg-white hover:bg-gray-50 shadow-md transition-all"
            >
              {user ? "Naar mijn dashboard" : "Begin gratis"}
            </Link>
            <Link
              href="/prices"
              className="px-8 py-3 border border-white text-base font-medium rounded-lg text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              Bekijk prijzen
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}