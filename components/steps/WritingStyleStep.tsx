import React from 'react';
import { ProjectStyle, WRITING_STYLES } from '../../lib/storyTypes';

interface WritingStyleStepProps {
  data: ProjectStyle;
  onChange: (data: Partial<ProjectStyle>) => void;
}

export const WritingStyleStep: React.FC<WritingStyleStepProps> = ({ 
  data, 
  onChange 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">✍️ Welke schrijfstijl spreekt je aan?</h2>
        <p className="text-gray-600">Kies de toon waarin je verhaal geschreven wordt</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {WRITING_STYLES.map((style) => (
          <div
            key={style.value}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              data.writingStyle === style.value
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onChange({ writingStyle: style.value })}
          >
            <div className="flex items-center mb-3">
              <input
                type="radio"
                id={style.value}
                name="writingStyle"
                value={style.value}
                checked={data.writingStyle === style.value}
                onChange={() => onChange({ writingStyle: style.value })}
                className="h-4 w-4 text-blue-600 mr-3"
              />
              <span className="text-2xl mr-3">{style.icon}</span>
              <label htmlFor={style.value} className="text-lg font-medium text-gray-800">
                {style.label}
              </label>
            </div>
            <p className="text-sm text-gray-600 ml-10">
              {style.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-blue-600 mt-0.5">💡</span>
          <div>
            <p className="text-sm text-blue-800 font-medium">
              Geen zorgen - je kunt dit later nog aanpassen
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Tijdens het schrijfproces kun je altijd aangeven of je de stijl wilt bijstellen. We passen ons aan jouw voorkeuren aan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
