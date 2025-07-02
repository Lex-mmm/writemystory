'use client';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import Link from 'next/link';

export default function BlogPost() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow bg-white">
        <article className="max-w-4xl mx-auto px-6 py-12">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/blog" className="hover:text-blue-600">Blog</Link>
            <span className="mx-2">›</span>
            <span>Waarom Levensverhalen Zo Belangrijk Zijn</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Familie</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Herinneringen</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">Legacy</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Waarom Levensverhalen Zo Belangrijk Zijn Voor Families
            </h1>
            <div className="flex items-center text-gray-600 text-sm">
              <span>15 december 2024</span>
              <span className="mx-2">•</span>
              <span>5 minuten leestijd</span>
              <span className="mx-2">•</span>
              <span>Door WriteMyStory.ai Team</span>
            </div>
          </header>

          {/* Featured Image */}
          <div className="mb-8">
            <div className="h-64 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-8xl">👨‍👩‍👧‍👦</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 mb-6 font-medium">
              In onze snelle, digitale wereld dreigen familieverhalen en wijsheid van generaties verloren te gaan. 
              Maar waarom zijn deze verhalen eigenlijk zo belangrijk, en hoe kunnen we ervoor zorgen dat ze bewaard blijven?
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              De Kracht van Persoonlijke Verhalen
            </h2>
            
            <p className="mb-4">
              Levensverhalen zijn veel meer dan alleen herinneringen. Ze zijn de bouwstenen van onze identiteit, 
              zowel individueel als als familie. Wanneer grootouders hun verhalen delen, geven ze niet alleen 
              informatie door – ze delen hun waarden, lessen en de unieke perspectieve die alleen door ervaring 
              kan worden verkregen.
            </p>

            <blockquote className="border-l-4 border-blue-500 pl-6 italic text-gray-700 my-6">
              &ldquo;Een familie zonder verhalen is als een boom zonder wortels. De verhalen geven ons kracht, 
              richting en een gevoel van thuishoren.&rdquo;
            </blockquote>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Waarom Verhalen Verdwijnen
            </h2>

            <p className="mb-4">
              Helaas gaan veel familieverhalen verloren omdat:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Oudere generaties denken dat hun verhalen &ldquo;niet interessant genoeg&rdquo; zijn</li>
              <li>Jongere generaties zijn te druk om te luisteren</li>
              <li>Er is geen makkelijke manier om verhalen vast te leggen</li>
              <li>Verhalen worden alleen mondeling overgedragen en vergeten</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              De Voordelen van het Vastleggen van Levensverhalen
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              1. Versterking van Familiebanden
            </h3>
            <p className="mb-4">
              Wanneer familieleden hun verhalen delen, ontstaat er een diepere connectie. 
              Kleinkinderen begrijpen hun grootouders beter, en families ontdekken overeenkomsten 
              en patronen die door generaties heen lopen.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              2. Bewaring van Familiegeschiedenis
            </h3>
            <p className="mb-4">
              Details over hoe families zijn ontstaan, belangrijke gebeurtenissen, en culturele tradities 
              worden voor toekomstige generaties bewaard. Dit is bijzonder waardevol voor families met 
              een migratie-achtergrond.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              3. Doorgifte van Wijsheid en Waarden
            </h3>
            <p className="mb-4">
              Levensverhalen bevatten vaak levenslessen, wijsheid en waarden die alleen door ervaring 
              kunnen worden geleerd. Deze verhalen kunnen toekomstige generaties helpen bij het maken 
              van belangrijke beslissingen.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Hoe Begin Je Met het Vastleggen van Verhalen?
            </h2>

            <p className="mb-4">
              Het vastleggen van levensverhalen hoeft niet overweldigend te zijn. Hier zijn enkele praktische tips:
            </p>

            <ol className="list-decimal pl-6 mb-6 space-y-2">
              <li><strong>Begin klein:</strong> Start met één specifieke herinnering of gebeurtenis</li>
              <li><strong>Gebruik technologie:</strong> Spraakopnames via WhatsApp of apps maken het makkelijk</li>
              <li><strong>Stel de juiste vragen:</strong> &ldquo;Hoe was je jeugd?&rdquo; is te breed. Probeer: &ldquo;Wat is je mooiste jeugdherinnering?&rdquo;</li>
              <li><strong>Maak het regelmatig:</strong> Een kort gesprek per week is beter dan één lange sessie</li>
              <li><strong>Bewaar het gestructureerd:</strong> Zorg voor een systeem om verhalen te organiseren</li>
            </ol>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              De Rol van Moderne Technologie
            </h2>

            <p className="mb-4">
              Moderne tools zoals WriteMyStory.ai maken het vastleggen van levensverhalen toegankelijker 
              dan ooit tevoren. Door gebruik te maken van AI-gestuurde vragen en spraakherkenning, 
              kunnen families gemakkelijk en natuurlijk verhalen delen en bewaren.
            </p>

            <p className="mb-6">
              Het mooie van deze technologie is dat het het menselijke aspect versterkt in plaats van 
              vervangt – het maakt het gemakkelijker om te focussen op het verhaal zelf, in plaats van 
              op de technische aspecten van het vastleggen.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                💡 Praktische Tip
              </h3>
              <p className="text-blue-800">
                Begin deze week nog. Bel een familielid en vraag: &ldquo;Kun je me het verhaal vertellen 
                over hoe je [opa/oma/je ouders] hebt ontmoet?&rdquo; Je zult versteld staan van de verhalen 
                die je te horen krijgt.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Conclusie: Een Legacy Voor de Toekomst
            </h2>

            <p className="mb-4">
              Levensverhalen zijn een van de meest waardevolle erfstukken die we kunnen achterlaten. 
              Ze kosten geen geld om te maken, maar zijn onbetaalbaar in waarde. Door de verhalen van 
              onze dierbaren vast te leggen, geven we toekomstige generaties een geschenk dat generaties 
              lang zal worden gekoesterd.
            </p>

            <p className="mb-6">
              De tijd om te beginnen is nu. Elke dag die voorbijgaat, zijn er verhalen die verloren gaan. 
              Maar met de juiste tools en intentie kunnen we ervoor zorgen dat de verhalen van onze 
              families voor altijd bewaard blijven.
            </p>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mt-12 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Klaar om jouw familieverhaal vast te leggen?
            </h3>
            <p className="mb-6">
              Begin vandaag nog met WriteMyStory.ai en bewaar de verhalen die er toe doen.
            </p>
            <Link 
              href="/start"
              className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start je verhaal
            </Link>
          </div>

          {/* Related Articles */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Gerelateerde Artikelen</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/blog/tips-voor-biografieen-schrijven" className="block bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">10 Tips Voor Het Schrijven Van Een Meeslepende Biografie</h4>
                <p className="text-gray-600 text-sm">Praktische tips om van jouw levensverhaal een boeiend verhaal te maken...</p>
              </Link>
              <Link href="/blog/ai-in-biografieen" className="block bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">Hoe AI Helpt Bij Het Schrijven Van Authentieke Levensverhalen</h4>
                <p className="text-gray-600 text-sm">Leer hoe moderne AI-technologie biografieschrijvers helpt...</p>
              </Link>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
