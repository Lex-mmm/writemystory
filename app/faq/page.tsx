'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
  category: 'general' | 'security' | 'funny' | 'technical';
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const faqs: FaqItem[] = [
    {
      question: "Is mijn verhaal veilig bij jullie?",
      answer: (
        <div>
          <p>Absoluut! Onze LLM-modellen draaien standalone in een afgeschermde omgeving – denk aan Fort Knox, maar dan voor je levensverhaal. We hebben zelfs succesvolle tests gedaan met medische gegevens, en die zijn zo privé dat zelfs je dokter er een geheimhoudingsverklaring voor moet tekenen.</p>
          <p className="mt-2">Je verhaal is veiliger bij ons dan dat chocoladekoekje dat je verstopt in de bovenste la voor "noodgevallen".</p>
        </div>
      ),
      category: 'security'
    },
    {
      question: "Kunnen jullie echt elk verhaal aan?",
      answer: (
        <div>
          <p>Tenzij je een buitenaards wezen bent dat communiceert via telepathische geurpatronen, kunnen we jouw verhaal vastleggen. En zelfs dan zouden we het proberen – we houden wel van een uitdaging!</p>
        </div>
      ),
      category: 'funny'
    },
    {
      question: "Hoe worden mijn gegevens beschermd?",
      answer: (
        <div>
          <p>We beschermen je data met militair-grade encryptie, afgeschermde standalone AI-modellen, en een virtueel fort van beveiligingsprotocollen. Onze veiligheidsmaatregelen zijn zo robuust dat we zelfs gevoelige medische gegevens kunnen verwerken zonder privacyrisico's.</p>
          <p className="mt-2">Bovendien blijven je gegevens in Nederland en worden ze verwerkt volgens de strengste GDPR-normen. Zeg maar gedag tegen dataminers en hallo tegen gemoedsrust.</p>
        </div>
      ),
      category: 'security'
    },
    {
      question: "Wat als ik een saaie schrijfstijl heb?",
      answer: (
        <div>
          <p>Dan ben je in goed gezelschap! Hemingway schreef ook "De kat zat op de mat" voordat hij zijn stijl vond. Onze AI zal je verhaal omtoveren tot een meesterwerk, zelfs als je berichten meestal bestaan uit "ok" en duimpjes-emoji's.</p>
        </div>
      ),
      category: 'funny'
    },
    {
      question: "Stelen jullie mijn verhaal voor jullie training?",
      answer: (
        <div>
          <p>Absoluut niet! In tegenstelling tot sommige tech-giganten die niet genoemd zullen worden (kuch, kuch), gebruiken wij je verhalen NOOIT voor het trainen van onze modellen. Je verhaal blijft van jou.</p>
          <p className="mt-2">Onze LLM-modellen draaien in een volledig geïsoleerde omgeving zonder externe verbindingen. Je verhaal wordt verwerkt, opgeslagen in jouw beveiligde account, en dat is het. Geen datamining, geen trainingsgebruik, geen "voor verbetering van onze diensten". Beloofd.</p>
        </div>
      ),
      category: 'security'
    },
    {
      question: "Hoe weet ik zeker dat jullie AI mijn stijl kan nabootsen?",
      answer: (
        <div>
          <p>Onze AI is zo goed in het nabootsen van schrijfstijlen dat we een weddenschap zijn aangegaan met Shakespeare's geest. Tot nu toe heeft hij nog niet gereageerd, wat we beschouwen als een overwinning.</p>
        </div>
      ),
      category: 'funny'
    },
    {
      question: "Kunnen jullie echt via WhatsApp werken?",
      answer: (
        <div>
          <p>Ja! We kunnen vragen stellen en antwoorden ontvangen via WhatsApp, e-mail, of ons platform – wat voor jou het gemakkelijkst is. Het werkt zelfs met spraakberichten, dus je kunt je verhaal vertellen terwijl je in de file staat (maar niet tijdens het rijden, veiligheid eerst!).</p>
          <p className="mt-2">En ja, onze beveiliging werkt ook op WhatsApp. We gebruiken end-to-end encryptie en slaan berichten alleen op in je beveiligde account.</p>
        </div>
      ),
      category: 'general'
    },
    {
      question: "Hoe gaan jullie om met gevoelige informatie?",
      answer: (
        <div>
          <p>Met meer voorzichtigheid dan een kat die over een net gewaxte vloer loopt. We hebben onze beveiligingssystemen getest met medische gegevens (de heilige graal van privacygevoelige informatie) en ze met vlag en wimpel laten slagen.</p>
          <p className="mt-2">Alle gevoelige informatie wordt versleuteld opgeslagen, alleen toegankelijk voor jou en de personen die jij expliciet toestemming geeft. Onze standalone LLM-modellen hebben geen toegang tot het internet en kunnen dus geen gegevens "lekken".</p>
        </div>
      ),
      category: 'security'
    },
    {
      question: "Wat als mijn verhaal te wild is voor jullie AI?",
      answer: (
        <div>
          <p>Onze AI heeft alle seizoenen van Game of Thrones én de familiebijeenkomsten van de Kardashians overleefd. We denken dat we je verhaal aankunnen, hoe wild het ook is. Als je AI kan shockeren, verdien je een gratis boek. Dat is onze garantie.</p>
        </div>
      ),
      category: 'funny'
    },
    {
      question: "Hoe kan ik jullie LLM-beveiliging vertrouwen?",
      answer: (
        <div>
          <p>Onze LLM-modellen zijn speciaal ontwikkeld voor privacy. Ze draaien in een beveiligde, offline omgeving zonder toegang tot het internet of externe diensten. Hetzelfde systeem is gevalideerd voor gebruik met patiëntgegevens in de gezondheidszorg, waar de privacyeisen nog strenger zijn.</p>
          <p className="mt-2">We bewaren niets permanent tenzij jij dat wilt, en zelfs dan alleen in jouw beveiligde account. We hebben een streng "need-to-know" beleid, wat betekent dat zelfs ons team beperkte toegang heeft tot jouw verhaal.</p>
        </div>
      ),
      category: 'technical'
    },
    {
      question: "Mijn oma snapt niks van technologie. Kan zij dit ook gebruiken?",
      answer: (
        <div>
          <p>Als je oma kan praten of typen, dan kan ze dit gebruiken! We hebben het systeem zo simpel gemaakt dat zelfs mensen die denken dat "de cloud" alleen over het weer gaat, er probleemloos mee kunnen werken.</p>
          <p className="mt-2">Ze kan gewoon vragen beantwoorden via WhatsApp, telefoon, of zelfs handgeschreven brieven (die wij dan digitaliseren). Geen technische kennis vereist, beloofd.</p>
        </div>
      ),
      category: 'general'
    },
    {
      question: "Welke technologieën gebruiken jullie voor beveiliging?",
      answer: (
        <div>
          <p>We gebruiken een combinatie van AES-256 encryptie (dezelfde die banken gebruiken), geïsoleerde offline LLM-modellen, en strikte toegangscontroles. Onze systemen worden regelmatig geaudit door onafhankelijke beveiligingsexperts.</p>
          <p className="mt-2">We hebben onze beveiligingsinfrastructuur getest met gevoelige medische gegevens en voldoen aan alle GDPR- en AVG-normen. We hosten alles in Nederlandse datacenters, dus je gegevens blijven binnen de EU.</p>
        </div>
      ),
      category: 'technical'
    },
    {
      question: "Kan mijn boek echt bezorgd worden voordat ik al mijn verhalen heb verteld?",
      answer: (
        <div>
          <p>Nee, dat zou tijdreizen vereisen, en onze techneuten werken daar nog aan. Hoewel, als je écht snel antwoordt en wij net zo snel schrijven, kan het boek sneller klaar zijn dan je denkt. We zijn sneller dan je gemiddelde autobiograaf, maar niet zo snel als licht... nog niet.</p>
        </div>
      ),
      category: 'funny'
    }
  ];
  
  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <div>
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Veelgestelde Vragen</h1>
        
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Alle vragen
          </button>
          <button 
            onClick={() => setActiveCategory('general')}
            className={`px-4 py-2 rounded-full ${activeCategory === 'general' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Algemeen
          </button>
          <button 
            onClick={() => setActiveCategory('security')}
            className={`px-4 py-2 rounded-full ${activeCategory === 'security' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Veiligheid
          </button>
          <button 
            onClick={() => setActiveCategory('funny')}
            className={`px-4 py-2 rounded-full ${activeCategory === 'funny' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            De luchtige kant
          </button>
          <button 
            onClick={() => setActiveCategory('technical')}
            className={`px-4 py-2 rounded-full ${activeCategory === 'technical' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Technisch
          </button>
        </div>
        
        <div className="space-y-6">
          {filteredFaqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
                <div className="text-gray-600">
                  {faq.answer}
                </div>
                {faq.category === 'security' && (
                  <div className="mt-3 flex items-center text-green-700 text-sm">
                    <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Medisch-grade beveiliging
                  </div>
                )}
                {faq.category === 'funny' && (
                  <div className="mt-3 flex items-center text-purple-600 text-sm">
                    <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Met een knipoog
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Nog vragen?</h3>
          <p className="text-gray-600 mb-4">We helpen je graag verder met al je vragen over ons platform.</p>
          <a 
            href="mailto:info@writemystory.ai" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact opnemen
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
