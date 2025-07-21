import React from 'react';
import { ProjectCommunication } from '../../lib/storyTypes';

interface CommunicationStepProps {
  data: ProjectCommunication;
  onChange: (data: Partial<ProjectCommunication>) => void;
  isDemo?: boolean;
}

export const CommunicationStep: React.FC<CommunicationStepProps> = ({ 
  data, 
  onChange,
  isDemo = false 
}) => {
  const handleToggle = (method: keyof ProjectCommunication) => {
    onChange({ [method]: !data[method] });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">📱 Hoe wil je communiceren?</h2>
        <p className="text-gray-600">Kies hoe je vragen wilt ontvangen en updates wilt krijgen</p>
      </div>
      
      {isDemo && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-orange-600 mt-0.5">🎭</span>
            <div>
              <p className="text-sm text-orange-800 font-medium">
                Demo modus
              </p>
              <p className="text-xs text-orange-700 mt-1">
                In de echte versie bepalen deze instellingen hoe je vragen ontvangt en communiceert.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="grid gap-4">
          <label className="flex items-center space-x-4 p-6 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={data.dashboard}
              onChange={() => handleToggle('dashboard')}
              className="h-5 w-5 text-blue-600 rounded"
              disabled={isDemo}
            />
            <div className="flex-grow">
              <div className="flex items-center">
                <span className="text-3xl mr-3">💻</span>
                <div>
                  <span className="text-lg font-medium text-gray-800">Dashboard</span>
                  <p className="text-sm text-gray-600">
                    Via je persoonlijke dashboard op de website
                  </p>
                </div>
              </div>
              <div className="ml-12 mt-2">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>✅ Overzichtelijk</span>
                  <span>✅ Altijd beschikbaar</span>
                  <span>✅ Voortgang bijhouden</span>
                </div>
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-4 p-6 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={data.email}
              onChange={() => handleToggle('email')}
              className="h-5 w-5 text-blue-600 rounded"
              disabled={isDemo}
            />
            <div className="flex-grow">
              <div className="flex items-center">
                <span className="text-3xl mr-3">📧</span>
                <div>
                  <span className="text-lg font-medium text-gray-800">E-mail</span>
                  <p className="text-sm text-gray-600">
                    Ontvang vragen en updates direct in je inbox
                  </p>
                </div>
              </div>
              <div className="ml-12 mt-2">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>✅ Directe notificaties</span>
                  <span>✅ Eenvoudig antwoorden</span>
                  <span>✅ Bekende interface</span>
                </div>
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-4 p-6 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={data.whatsapp}
              onChange={() => handleToggle('whatsapp')}
              className="h-5 w-5 text-blue-600 rounded"
              disabled={isDemo}
            />
            <div className="flex-grow">
              <div className="flex items-center">
                <span className="text-3xl mr-3">💬</span>
                <div>
                  <span className="text-lg font-medium text-gray-800">WhatsApp</span>
                  <p className="text-sm text-gray-600">
                    Ontvang vragen via WhatsApp - handig onderweg
                  </p>
                </div>
              </div>
              <div className="ml-12 mt-2">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>✅ Snel en persoonlijk</span>
                  <span>✅ Voice messages mogelijk</span>
                  <span>✅ Overal bereikbaar</span>
                </div>
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-4 p-6 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={data.voice}
              onChange={() => handleToggle('voice')}
              className="h-5 w-5 text-blue-600 rounded"
              disabled={isDemo}
            />
            <div className="flex-grow">
              <div className="flex items-center">
                <span className="text-3xl mr-3">🎤</span>
                <div>
                  <span className="text-lg font-medium text-gray-800">Voice memo&apos;s</span>
                  <p className="text-sm text-gray-600">
                    Beantwoord vragen met spraakberichten
                  </p>
                </div>
              </div>
              <div className="ml-12 mt-2">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>✅ Natuurlijk vertellen</span>
                  <span>✅ Emotie en nuance</span>
                  <span>✅ Sneller dan typen</span>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 mt-0.5">💡</span>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Aanbeveling
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Kies minstens 2 methoden voor de beste ervaring. Dashboard + WhatsApp werkt voor de meeste mensen het beste.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-green-600 mt-0.5">🔒</span>
            <div>
              <p className="text-sm text-green-800 font-medium">
                Privacy
              </p>
              <p className="text-xs text-green-700 mt-1">
                Je persoonlijke informatie wordt alleen gebruikt voor je verhaal. We versturen geen marketing via deze kanalen.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-600 mt-0.5">⚡</span>
          <div>
            <p className="text-sm text-yellow-800 font-medium">
              Hoe werkt het in de praktijk?
            </p>
            <ul className="text-xs text-yellow-700 mt-1 space-y-1">
              <li>• Je krijgt 1-3 vragen per week via je gekozen kanalen</li>
              <li>• Beantwoord in je eigen tempo - geen druk</li>
              <li>• Helpers krijgen vragen via hun voorkeurskanaal</li>
              <li>• Je kunt je voorkeuren altijd aanpassen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
