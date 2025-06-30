'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ContributionGuide from '../../components/ContributionGuide';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Header section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Hoe werkt WriteMyStory.ai?</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bij <strong>WriteMyStory.ai</strong> krijg je hulp van een slimme groep AI-schrijfassistenten die je stap voor stap begeleiden bij het maken van een persoonlijk levensverhaal.
            </p>
            <p className="text-xl text-blue-600 font-medium mt-2">
              Geen leeg Word-document, geen stress: jij vertelt, wij schrijven.
            </p>
          </div>

          {/* Contribution Guide */}
          <ContributionGuide />

          {/* Step 1 */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-24 h-24 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-blue-600">1</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Stel zelf alles in</h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Schrijfstijl:</strong> Kies bijvoorbeeld tussen de meeslepende stijl van Walter Isaacson of de warme toon van Lale Gül.</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>De persoon:</strong> Schrijf je over jezelf, je kind, je ouders of iemand anders?</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>De periode:</strong> Een volledig levensverhaal of juist een specifieke fase, zoals de eerste levensjaren of drie jaar in het buitenland.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:flex-row-reverse">
              <div className="w-24 h-24 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-blue-600">2</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Antwoorden kan gewoon tussendoor</h2>
                <p className="text-gray-700 mb-4">
                  Je hoeft niet alles uit te typen. Onze AI-stukkenjagers sturen je vragen via WhatsApp of e-mail. Je antwoordt eenvoudig met tekst of een spraakberichtje – op de wc, in de trein of tijdens een wandeling.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-blue-700 italic">
                    &quot;Ik vind het heerlijk dat ik mijn verhaal gewoon kan vertellen via spraakberichten terwijl ik door het bos wandel. Geen laptop, geen toetsenbord, gewoon praten.&quot; — Sandra, 58
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Steps 3-4 in a grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Step 3 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Bekijk je voortgang online</h2>
              <p className="text-gray-700">
                Op het platform zie je precies hoever je bent: welke hoofdstukken al klaar zijn, wat nog ontbreekt, en wat je nog kunt toevoegen.
              </p>
              <div className="mt-4 bg-gray-100 rounded-lg p-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-blue-600 h-2.5 rounded-full w-3/4"></div>
                </div>
                <p className="text-xs text-gray-600">75% voltooid - 3 hoofdstukken klaar, 1 in behandeling</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Voeg gemakkelijk foto&apos;s toe</h2>
              <p className="text-gray-700">
                Upload eenvoudig foto&apos;s per hoofdstuk of als collage. Wij zorgen dat ze op de juiste plek in het verhaal terechtkomen.
              </p>
              <div className="mt-4 flex gap-2 overflow-hidden">
                <div className="h-16 w-16 bg-gray-200 rounded-md"></div>
                <div className="h-16 w-16 bg-gray-200 rounded-md"></div>
                <div className="h-16 w-16 bg-gray-200 rounded-md"></div>
                <div className="h-16 w-16 flex items-center justify-center bg-blue-100 rounded-md text-blue-600">+</div>
              </div>
            </div>
          </div>

          {/* Steps 5-6 in a grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Step 5 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">5</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Kies een stijl die bij je past</h2>
              <p className="text-gray-700">
                Modern en strak, of juist nostalgisch en warm – kies zelf een lay-out die past bij jouw verhaal.
              </p>
              <div className="mt-4 flex gap-3">
                <div className="h-16 w-16 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-center text-xs">Modern</div>
                <div className="h-16 w-16 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-center text-xs">Klassiek</div>
                <div className="h-16 w-16 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-center text-xs">Artistiek</div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">6</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Ontvang het als boek of PDF</h2>
              <p className="text-gray-700">
                Klaar? Dan zetten wij het verhaal om in een professioneel opgemaakt boek of PDF – om te bewaren, te delen of te drukken.
              </p>
              <div className="mt-4 flex gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Hardcover boek</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>PDF bestand</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA section */}
          <div className="bg-blue-600 rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Klaar om je verhaal te vertellen?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              <strong>WriteMyStory.ai</strong> maakt het schrijven van een levensverhaal eenvoudig, persoonlijk en zelfs leuk. Geen gedoe, gewoon jouw verhaal – op jouw manier.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 shadow-md transition-all"
              >
                Begin gratis
              </Link>
              <Link
                href="/faq"
                className="px-8 py-3 border border-white text-base font-medium rounded-lg text-white hover:bg-blue-700 shadow-sm transition-all"
              >
                Veelgestelde vragen
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

