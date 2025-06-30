'use client';

export default function ContributionGuide() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 my-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Vertel je verhaal op jouw manier
        </h2>
        <p className="text-lg text-gray-600">
          Er is geen verkeerde manier om je verhaal te delen. Kies wat het fijnst voelt voor jou.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Voice Messages */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            🎤 Vertel het gewoon
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Stuur een spraakberichtje via WhatsApp, net zoals je dat doet met familie. 
            Vertel in je eigen woorden, op je eigen tempo. We luisteren naar alles wat je te vertellen hebt.
          </p>
          <div className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg p-3">
            Perfect voor wie liever praat dan typt
          </div>
        </div>

        {/* Written Messages */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            ✍️ Schrijf het op
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Stuur een berichtje via WhatsApp of e-mail wanneer je iets te binnen schiet. 
            Lange verhalen, korte herinneringen, foto&quot;s met verhalen erbij - alles is welkom.
          </p>
          <div className="mt-4 text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
            Makkelijk vanaf je telefoon of computer
          </div>
        </div>

        {/* Website Questions */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            💻 Typ online
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Log in op de website en beantwoord vragen wanneer het jou uitkomt. 
            Rustig typen achter de computer, met alle tijd die je nodig hebt.
          </p>
          <div className="mt-4 text-sm text-purple-700 bg-purple-50 rounded-lg p-3">
            Ideaal voor wie graag overzicht houdt
          </div>
        </div>
      </div>

      {/* Reassuring Message */}
      <div className="mt-8 bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-400">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-lg font-medium text-yellow-800">
              Geen zorgen over perfectie
            </h4>
            <p className="text-yellow-700 mt-1">
              Je hoeft niet in één keer alles te vertellen. Verhalen groeien langzaam, net als herinneringen. 
              Je kunt altijd later nog meer toevoegen of dingen aanpassen. We helpen je om van al je losse stukjes een mooi geheel te maken.
            </p>
          </div>
        </div>
      </div>

      {/* Mix and Match */}
      <div className="mt-6 text-center">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          Combineer wat je wilt
        </h4>
        <p className="text-gray-600">
          Vandaag een spraakberichtje, morgen een foto met verhaal, volgende week wat typen op de website. 
          Gebruik wat op dat moment het makkelijkst voelt. Wij zorgen dat alles op de juiste plek terechtkomt.
        </p>
      </div>

      <div className="mt-8 text-center">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          Vraag om hulp als je het nodig hebt
        </h4>
        <p className="text-gray-700">
          Vraag familie, vrienden of collega&apos;s om hun herinneringen toe te voegen aan jouw verhaal.
        </p>
      </div>
    </div>
  );
}
