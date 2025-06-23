'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function HowItWorksPage() {
  return (
    <div>
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <h1 className="text-4xl font-bold text-center text-gray-800">Hoe werkt WriteMyStory.ai?</h1>
        <p className="text-lg text-gray-700">
          Bij <strong>WriteMyStory.ai</strong> krijg je hulp van een slimme groep AI-schrijfassistenten die je stap voor stap begeleiden bij het maken van een persoonlijk levensverhaal. Geen leeg Word-document, geen stress: jij vertelt, wij schrijven.
        </p>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">1. Stel zelf alles in</h2>
            <ul className="list-disc list-inside text-gray-700">
              <li><strong>Schrijfstijl:</strong> Kies bijvoorbeeld tussen de meeslepende stijl van Walter Isaacson of de warme toon van Lale Gül.</li>
              <li><strong>De persoon:</strong> Schrijf je over jezelf, je kind, je ouders of iemand anders?</li>
              <li><strong>De periode:</strong> Een volledig levensverhaal of juist een specifieke fase, zoals de eerste levensjaren of drie jaar in het buitenland.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800">2. Antwoorden kan gewoon tussendoor</h2>
            <p className="text-gray-700">
              Je hoeft niet alles uit te typen. Onze AI-stukkenjagers sturen je vragen via WhatsApp of e-mail. Je antwoordt eenvoudig met tekst of een spraakberichtje – op de wc, in de trein of tijdens een wandeling.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800">3. Bekijk je voortgang online</h2>
            <p className="text-gray-700">
              Op het platform zie je precies hoever je bent: welke hoofdstukken al klaar zijn, wat nog ontbreekt, en wat je nog kunt toevoegen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800">4. Voeg gemakkelijk foto&apos;s toe</h2>
            <p className="text-gray-700">
              Upload eenvoudig foto&apos;s per hoofdstuk of als collage. Wij zorgen dat ze op de juiste plek in het verhaal terechtkomen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800">5. Kies een stijl die bij je past</h2>
            <p className="text-gray-700">
              Modern en strak, of juist nostalgisch en warm – kies zelf een lay-out die past bij jouw verhaal.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800">6. Ontvang het als boek of PDF</h2>
            <p className="text-gray-700">
              Klaar? Dan zetten wij het verhaal om in een professioneel opgemaakt boek of PDF – om te bewaren, te delen of te drukken.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-lg text-gray-800">
          <strong>WriteMyStory.ai</strong> maakt het schrijven van een levensverhaal eenvoudig, persoonlijk en zelfs leuk. Geen gedoe, gewoon jouw verhaal – op jouw manier.
        </p>
      </div>

      <Footer />
    </div>
  );
}
