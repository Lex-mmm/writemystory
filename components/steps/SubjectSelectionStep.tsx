import React from 'react';
import { ProjectSubject } from '../../lib/storyTypes';

interface SubjectSelectionStepProps {
  data: ProjectSubject;
  onChange: (data: Partial<ProjectSubject>) => void;
}

export const SubjectSelectionStep: React.FC<SubjectSelectionStepProps> = ({ 
  data, 
  onChange 
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange({ whatsappChatFile: file });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">👤 Voor wie schrijven we dit verhaal?</h2>
        <p className="text-gray-600">Kies het onderwerp van je levensverhaal</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div 
          className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
            data.type === "self" 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => onChange({ type: "self" })}
        >
          <div className="flex items-center mb-3">
            <input
              type="radio"
              id="self"
              name="subjectType"
              value="self"
              checked={data.type === "self"}
              onChange={() => onChange({ type: "self" })}
              className="h-4 w-4 text-blue-600 mr-3"
            />
            <span className="text-2xl mr-3">👤</span>
            <label htmlFor="self" className="text-lg font-medium text-gray-800">Over mezelf</label>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            Vertel je eigen levensverhaal. Je kunt altijd familieleden en vrienden uitnodigen om mee te helpen.
          </p>
        </div>
        
        <div 
          className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
            data.type === "other" 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => onChange({ type: "other" })}
        >
          <div className="flex items-center mb-3">
            <input
              type="radio"
              id="other"
              name="subjectType"
              value="other"
              checked={data.type === "other"}
              onChange={() => onChange({ type: "other" })}
              className="h-4 w-4 text-blue-600 mr-3"
            />
            <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
            <label htmlFor="other" className="text-lg font-medium text-gray-800">Over iemand anders</label>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            Schrijf het verhaal van een ouder, partner, kind, vriend of ander dierbaar persoon. Ook geschikt voor memorial verhalen.
          </p>
        </div>
      </div>
      
      {data.type === "other" && (
        <div className="bg-blue-50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Vertel ons over deze persoon</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="personName">
                📝 Volledige naam
              </label>
              <input
                type="text"
                id="personName"
                value={data.personName}
                onChange={(e) => onChange({ personName: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bijv. Maria van den Berg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="birthYear">
                📅 Geboortejaar (optioneel)
              </label>
              <input
                type="text"
                id="birthYear"
                value={data.birthYear}
                onChange={(e) => onChange({ birthYear: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bijv. 1950"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="relationship">
              💝 Relatie tot jou
            </label>
            <select
              id="relationship"
              value={data.relationship}
              onChange={(e) => onChange({ relationship: e.target.value })}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Kies een relatie...</option>
              <option value="moeder">Moeder</option>
              <option value="vader">Vader</option>
              <option value="partner">Partner</option>
              <option value="kind">Kind</option>
              <option value="opa">Opa</option>
              <option value="oma">Oma</option>
              <option value="broer">Broer</option>
              <option value="zus">Zus</option>
              <option value="vriend">Vriend</option>
              <option value="vriendin">Vriendin</option>
              <option value="collega">Collega</option>
              <option value="anders">Anders</option>
            </select>
          </div>

          {/* Memorial/Deceased Option */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="isDeceased"
                checked={data.isDeceased}
                onChange={(e) => onChange({ isDeceased: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="isDeceased" className="text-sm font-medium text-gray-700">
                🕊️ Deze persoon is helaas overleden
              </label>
            </div>
            
            {data.isDeceased && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 mt-0.5">💛</span>
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">
                      Een memorial verhaal
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      We helpen je een prachtig eerbetoon te schrijven aan het leven en de herinneringen van deze bijzondere persoon.
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-yellow-800 mb-2" htmlFor="passedAwayYear">
                    🌸 Jaar van overlijden (optioneel)
                  </label>
                  <input
                    type="text"
                    id="passedAwayYear"
                    value={data.passedAwayYear}
                    onChange={(e) => onChange({ passedAwayYear: e.target.value })}
                    className="w-full border border-yellow-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-yellow-50"
                    placeholder="Bijv. 2023"
                  />
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Chat Upload Option */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="includeWhatsappChat"
                checked={data.includeWhatsappChat}
                onChange={(e) => onChange({ includeWhatsappChat: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="includeWhatsappChat" className="text-sm font-medium text-gray-700">
                💬 WhatsApp gesprekken toevoegen
              </label>
            </div>
            
            {data.includeWhatsappChat && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 mt-0.5">💚</span>
                  <div>
                    <p className="text-sm text-green-800 font-medium">
                      WhatsApp gesprekken toevoegen
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Upload WhatsApp gesprekken om extra herinneringen en verhalen te gebruiken. {data.isDeceased ? 'Vooral waardevol voor memorial verhalen.' : 'Geeft extra context voor je levensverhaal.'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-green-800 mb-2">
                    📱 WhatsApp chat bestand (.txt)
                  </label>
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center bg-green-50">
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileChange}
                      className="hidden"
                      id="whatsappFile"
                    />
                    <label htmlFor="whatsappFile" className="cursor-pointer">
                      {data.whatsappChatFile ? (
                        <div className="text-green-700">
                          <p className="font-medium">📁 {data.whatsappChatFile.name}</p>
                          <p className="text-sm">Klik om een ander bestand te selecteren</p>
                        </div>
                      ) : (
                        <div className="text-green-600">
                          <p className="font-medium">📱 Klik om WhatsApp chat te uploaden</p>
                          <p className="text-sm">Alleen .txt bestanden</p>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="mt-2 text-xs text-green-700">
                    <p><strong>Hoe exporteer je WhatsApp chats:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 mt-1">
                      <li>Open het WhatsApp gesprek</li>
                      <li>Druk op de 3 puntjes (⋮) of naam van de persoon</li>
                      <li>Selecteer &quot;Exporteer chat&quot;</li>
                      <li>Kies &quot;Zonder media&quot; voor een snellere upload</li>
                      <li>Verzend naar jezelf en download het .txt bestand</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
