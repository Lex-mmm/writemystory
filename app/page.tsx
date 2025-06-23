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
                <span className="block">Jullie vertellen,</span>
                <span className="block text-blue-600">Wij schrijven</span>
              </h1>
              <p className="mt-3 text-lg text-gray-600 mb-8">
                Leg moeiteloos herinneringen vast met spraak of WhatsApp. Geen formulieren, 
                geen schrijfwerk – deel gewoon verhalen en ontvang een prachtig boek.
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
              Zelfs voor wie niet digitaal vaardig is of niet van schrijven houdt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Beantwoord vragen</h3>
              <p className="text-gray-600">
                Via WhatsApp, e-mail of spraakbericht. Gewoon, wanneer het jou uitkomt.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Zie het verhaal groeien</h3>
              <p className="text-gray-600">
                Wij bouwen het verhaal op. Familie en vrienden kunnen meewerken.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-center hover:shadow-md transition-all">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ontvang je boek</h3>
              <p className="text-gray-600">
                Als PDF of als prachtig gedrukt boek, om te koesteren en delen.
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
                &quot;Mijn oma van 92 is helemaal niet digitaal vaardig, maar via WhatsApp kon ze toch haar hele levensverhaal met ons delen. Het boek is nu een kostbaar familiebezit.&quot;
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
                &quot;Ik wilde mijn levensverhaal vastleggen voor mijn kinderen, maar kwam nooit aan schrijven toe. Deze aanpak werkte perfect voor mij.&quot;
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
                &quot;Mijn vader vertelde altijd zoveel verhalen. We wisten niet hoe we ze moesten vastleggen tot we WriteMyStory vonden. Nu hebben we alles in een prachtig boek.&quot;
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