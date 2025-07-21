import React from 'react';

interface AdditionalInfoStepProps {
  data: { additionalInfo: string };
  onChange: (data: { additionalInfo: string }) => void;
}

export const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({ 
  data, 
  onChange 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">💭 Vertel zoveel als je wilt</h2>
        <p className="text-gray-600">Hier kun je alles kwijt wat je belangrijk vindt voor je verhaal</p>
      </div>
      
      <div className="space-y-6">
        <div className="p-6 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 mt-0.5">✨</span>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Vertel zoveel als je wilt over:
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1">
                <li>• Belangrijke gebeurtenissen of mijlpalen</li>
                <li>• Bijzondere personen in je leven</li>
                <li>• Thema&apos;s die je graag wilt belichten</li>
                <li>• Speciale herinneringen of verhalen</li>
                <li>• Waarden of levenswijsheden</li>
                <li>• Dromen en ambities</li>
                <li>• Alles wat jouw verhaal uniek maakt</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Jouw verhaal begint hier...
          </label>
          <textarea
            value={data.additionalInfo}
            onChange={(e) => onChange({ additionalInfo: e.target.value })}
            rows={8}
            className="w-full border border-gray-300 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Vertel hier alles wat je belangrijk vindt voor je levensverhaal. Hoe meer je deelt, hoe persoonlijker en rijker je verhaal wordt.

Bijvoorbeeld:
- Ik ben geboren in 1975 in Amsterdam en ben opgegroeid in een warm, liefdevol gezin...
- De belangrijkste gebeurtenis in mijn leven was toen...
- Mijn grootste passie is altijd geweest...
- Wat me het meest heeft gevormd is...

Er zijn geen regels - schrijf gewoon wat er in je opkomt!"
          />
          <div className="mt-2 text-xs text-gray-500">
            Tip: Schrijf gewoon wat er in je opkomt. We gebruiken dit als basis voor het genereren van persoonlijke vragen.
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-green-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-green-600 mt-0.5">🤖</span>
          <div>
            <p className="text-sm text-green-800 font-medium">
              Hoe werkt het verder?
            </p>
            <p className="text-xs text-green-700 mt-1">
              Op basis van wat je hier vertelt, genereren we gepersonaliseerde vragen die je verhaal compleet maken. Je kunt deze vragen beantwoorden wanneer het jou uitkomt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
