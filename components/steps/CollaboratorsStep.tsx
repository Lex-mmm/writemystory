import React from 'react';
import { ProjectCollaborators } from '../../lib/storyTypes';

interface CollaboratorsStepProps {
  data: ProjectCollaborators;
  onChange: (data: Partial<ProjectCollaborators>) => void;
  isDemo?: boolean;
}

export const CollaboratorsStep: React.FC<CollaboratorsStepProps> = ({ 
  data, 
  onChange,
  isDemo = false 
}) => {
  const handleEmailChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ emails: e.target.value });
  };

  const handleCollaboratorToggle = (type: keyof Omit<ProjectCollaborators, 'emails'>) => {
    onChange({ [type]: !data[type] });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">👥 Wie helpt er mee?</h2>
        <p className="text-gray-600">Nodig familieleden en vrienden uit om mee te helpen</p>
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
                In de echte versie kunnen helpers echt uitgenodigd worden en krijgen ze toegang tot vragen.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Welke helpers wil je uitnodigen?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={data.partner}
                onChange={() => handleCollaboratorToggle('partner')}
                className="h-4 w-4 text-blue-600 rounded"
                disabled={isDemo}
              />
              <div>
                <span className="text-2xl mr-2">💑</span>
                <span className="font-medium text-gray-800">Partner</span>
                <p className="text-sm text-gray-600">Je partner kan persoonlijke verhalen delen</p>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={data.children}
                onChange={() => handleCollaboratorToggle('children')}
                className="h-4 w-4 text-blue-600 rounded"
                disabled={isDemo}
              />
              <div>
                <span className="text-2xl mr-2">👶</span>
                <span className="font-medium text-gray-800">Kinderen</span>
                <p className="text-sm text-gray-600">Je kinderen kunnen hun perspectief toevoegen</p>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={data.family}
                onChange={() => handleCollaboratorToggle('family')}
                className="h-4 w-4 text-blue-600 rounded"
                disabled={isDemo}
              />
              <div>
                <span className="text-2xl mr-2">👨‍👩‍👧‍👦</span>
                <span className="font-medium text-gray-800">Familie</span>
                <p className="text-sm text-gray-600">Ouders, broers, zussen kunnen jeugdherinneringen delen</p>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={data.friends}
                onChange={() => handleCollaboratorToggle('friends')}
                className="h-4 w-4 text-blue-600 rounded"
                disabled={isDemo}
              />
              <div>
                <span className="text-2xl mr-2">👥</span>
                <span className="font-medium text-gray-800">Vrienden</span>
                <p className="text-sm text-gray-600">Goede vrienden kennen je vaak het beste</p>
              </div>
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📧 E-mailadressen van helpers
          </label>
          <textarea
            value={data.emails}
            onChange={handleEmailChange}
            rows={3}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder={isDemo 
              ? "familie@example.com, vrienden@example.com (demo - werkt niet echt)"
              : "Voer e-mailadressen in, één per regel of gescheiden door komma's"}
            disabled={isDemo}
          />
          <p className="text-xs text-gray-500 mt-1">
            {isDemo 
              ? "In de echte versie krijgen helpers een uitnodiging om mee te helpen"
              : "Helpers krijgen een uitnodiging om vragen te beantwoorden via hun eigen dashboard"
            }
          </p>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-blue-600 mt-0.5">💡</span>
          <div>
            <p className="text-sm text-blue-800 font-medium">
              Hoe werkt samenwerken?
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Helpers krijgen toegang tot hun eigen vragen</li>
              <li>• Ze kunnen antwoorden via dashboard, email of WhatsApp</li>
              <li>• Jij behoudt controle over het eindresultaat</li>
              <li>• Helpers zien alleen hun eigen bijdragen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
