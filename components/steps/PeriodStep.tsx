import React from 'react';
import { ProjectPeriod } from '../../lib/storyTypes';

interface PeriodStepProps {
  data: ProjectPeriod;
  onChange: (data: Partial<ProjectPeriod>) => void;
}

export const PeriodStep: React.FC<PeriodStepProps> = ({ 
  data, 
  onChange 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">📅 Welke periode?</h2>
        <p className="text-gray-600">Bepaal welke tijd van het leven je wilt vastleggen</p>
      </div>
      
      <div className="space-y-6">
        <div className="grid gap-4">
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              data.type === "fullLife" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onChange({ type: "fullLife" })}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id="fullLife"
                name="periodType"
                value="fullLife"
                checked={data.type === "fullLife"}
                onChange={() => onChange({ type: "fullLife" })}
                className="h-4 w-4 text-blue-600 mr-3"
              />
              <div>
                <label htmlFor="fullLife" className="text-lg font-medium text-gray-800">
                  📖 Hele leven
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Van geboorte tot nu - het complete levensverhaal
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              data.type === "specificPeriod" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onChange({ type: "specificPeriod" })}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id="specificPeriod"
                name="periodType"
                value="specificPeriod"
                checked={data.type === "specificPeriod"}
                onChange={() => onChange({ type: "specificPeriod" })}
                className="h-4 w-4 text-blue-600 mr-3"
              />
              <div>
                <label htmlFor="specificPeriod" className="text-lg font-medium text-gray-800">
                  📊 Specifieke periode
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Focus op bepaalde jaren (bijv. jeugd, carrière, pensioen)
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              data.type === "specificTheme" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onChange({ type: "specificTheme" })}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id="specificTheme"
                name="periodType"
                value="specificTheme"
                checked={data.type === "specificTheme"}
                onChange={() => onChange({ type: "specificTheme" })}
                className="h-4 w-4 text-blue-600 mr-3"
              />
              <div>
                <label htmlFor="specificTheme" className="text-lg font-medium text-gray-800">
                  🎯 Specifiek thema
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Focus op een onderwerp (bijv. reizen, carrière, familie)
                </p>
              </div>
            </div>
          </div>
        </div>

        {data.type === "specificPeriod" && (
          <div className="bg-blue-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              📅 Welke jaren wil je vastleggen?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Van jaar
                </label>
                <input
                  type="text"
                  value={data.startYear}
                  onChange={(e) => onChange({ startYear: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bijv. 1990"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tot jaar
                </label>
                <input
                  type="text"
                  value={data.endYear}
                  onChange={(e) => onChange({ endYear: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bijv. 2020"
                />
              </div>
            </div>
          </div>
        )}

        {data.type === "specificTheme" && (
          <div className="bg-blue-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              🎯 Wat is het hoofdthema?
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thema beschrijving
              </label>
              <input
                type="text"
                value={data.theme}
                onChange={(e) => onChange({ theme: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bijv. Mijn reis door de muziekwereld, Opgroeien in de jaren 60, Mijn carrière als leraar"
              />
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Voorbeelden van thema&apos;s:</p>
              <ul className="space-y-1">
                <li>• 🎵 Een passie of hobby door de jaren heen</li>
                <li>• 👨‍💼 Je carrière en professionele ontwikkeling</li>
                <li>• 🌍 Reizen en avonturen</li>
                <li>• 👨‍👩‍👧‍👦 Familie en relaties</li>
                <li>• 🏠 Het bouwen van een thuis</li>
                <li>• 💪 Overwinnen van uitdagingen</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-green-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-green-600 mt-0.5">💡</span>
          <div>
            <p className="text-sm text-green-800 font-medium">
              Geen zorgen - je kunt dit later aanpassen
            </p>
            <p className="text-xs text-green-700 mt-1">
              Je kunt altijd kiezen om meer of minder detail toe te voegen naarmate je verhaal vordert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
