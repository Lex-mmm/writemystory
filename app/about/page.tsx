'use client';

import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Over WriteMyStory.ai</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Het persoonlijke verhaal achter ons AI-schrijfplatform
            </p>
          </div>

          {/* Profile section with image */}
          <div className="bg-white rounded-lg shadow-md p-8 flex flex-col md:flex-row items-center gap-8 mb-10">
            <div className="w-40 h-40 md:w-56 md:h-56 flex-shrink-0 relative">
              <Image
                src="/images/lex.png"
                alt="Lex van Loon"
                fill
                sizes="(max-width: 768px) 160px, 224px"
                className="rounded-full object-cover shadow-md border-4 border-white"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Lex van Loon</h2>
              <p className="text-blue-600 font-medium mb-4">Oprichter van WriteMyStory.ai</p>
              <p className="text-gray-600">
                Technisch geneeskundige werkzaam op het snijvlak van technologie en zorg. 
                Dagelijks bezig met het toepassen van AI en nieuwe technieken om patiënten 
                beter te helpen — en nu ook om jouw herinneringen te bewaren.
              </p>
            </div>
          </div>

          {/* Story section */}
          <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">Waarom WriteMyStory.ai?</h2>
            
            <p className="text-gray-700 leading-relaxed">
              Sommige verhalen verdienen het om nooit verloren te gaan.
            </p>
            
            <p className="text-gray-700 leading-relaxed">
              Als liefhebber van geschiedenis en biografieën heb ik tientallen levensverhalen gelezen — van Nietzsche tot Nelson Mandela, van Erasmus tot Elon Musk. Wat me telkens weer raakt, is de kracht van een goed verteld leven: hoe herinneringen, keuzes en toevalligheden samen een uniek mens vormen.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500 my-6">
              <p className="text-blue-700 italic">
                &quot;In mijn werk in de gezondheidszorg zie ik dagelijks wat technologie kan betekenen. Mijn collega&apos;s ontwikkelden daar al een AI-model dat veilig en betrouwbaar medische brieven opstelt. Diezelfde techniek — slim, ondersteunend en betrouwbaar — inspireerde mij om iets te bouwen dat mensen helpt hun eigen verhaal te vertellen.&quot;
              </p>
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              Mijn diepste motivatie is persoonlijk. Mijn kinderen zijn allebei te vroeg geboren. Die eerste weken in het ziekenhuis waren intens, waardevol, maar ook overweldigend. Ik had zó graag een boekje gehad waarin ik hun begin kon vastleggen — de kleine overwinningen, de emoties, de momenten. Maar ik had simpelweg niet de tijd, laat staan de cognitieve ruimte om daar rustig voor te gaan zitten.
            </p>
            
            <p className="text-gray-700 leading-relaxed">
              Wat ik wél kon, was reageren op appjes. Even vertellen hoe het ging als iemand langs kwam. Hoe mooi zou het zijn als die losse momentjes, die stukjes tekst en emotie, automatisch worden gebundeld tot een verhaal? Dat idee raakte me. En precies dat wil ik met WriteMyStory.ai mogelijk maken.
            </p>
            
            <p className="text-gray-700 leading-relaxed font-medium">
              Met WriteMyStory.ai wil ik die brug slaan: tussen herinnering en verhaal, tussen mens en machine, tussen nu en later.
            </p>
          </div>
          
          {/* Mission section */}
          <div className="bg-blue-600 text-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Onze Missie</h2>
            <p className="text-lg">
              WriteMyStory.ai is mijn persoonlijke missie: technologie gebruiken om iets wezenlijks vast te leggen. 
              Niet voor de cloud, maar voor de familie. Voor nu en voor later.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
