import React from 'react';
import { StoryQuestion, ANSWERER_OPTIONS } from '../../lib/storyTypes';

interface QuestionsStepProps {
  questions: StoryQuestion[];
  onAssignmentChange: (questionId: string, assignedTo: string) => void;
  onAnswerChange: (questionId: string, answer: string) => void;
  isDemo?: boolean;
}

export const QuestionsStep: React.FC<QuestionsStepProps> = ({
  questions,
  onAssignmentChange,
  onAnswerChange,
  isDemo = false
}) => {
  const getAnswererOption = (value: string) => {
    return ANSWERER_OPTIONS.find(option => option.value === value) || ANSWERER_OPTIONS[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">❓ Jouw persoonlijke vragen</h2>
        <p className="text-gray-600">
          {isDemo 
            ? "Bekijk hier een voorbeeld van hoe de vragen eruitzien" 
            : "Beantwoord deze vragen om je verhaal compleet te maken"
          }
        </p>
      </div>
      
      {isDemo && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-orange-600 mt-0.5">🎭</span>
            <div>
              <p className="text-sm text-orange-800 font-medium">
                Dit is een demo
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Deze vragen zijn voorbeelden. In de echte versie genereren we vragen specifiek voor jouw verhaal.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-blue-600 mt-0.5">🤖</span>
          <div>
            <p className="text-sm text-blue-800 font-medium">
              AI-gestuurde vraag toewijzing
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Onze AI bepaalt wie het beste elke vraag kan beantwoorden. Je kunt deze suggestie altijd aanpassen.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {questions.map((question) => {
          const suggestedOption = getAnswererOption(question.suggestedAnswerer);
          
          return (
            <div key={question.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {question.category}
                    </span>
                    {question.generated && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        AI gegenereerd
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {question.question}
                  </h3>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-gray-600">Wie kan dit beantwoorden?</span>
                  {question.assignedTo !== question.suggestedAnswerer && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Aangepast van {suggestedOption.label}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {ANSWERER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onAssignmentChange(question.id, option.value)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        question.assignedTo === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isDemo}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antwoord {isDemo ? "(demo)" : ""}
                </label>
                <textarea
                  value={question.answer}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={isDemo 
                    ? "In de echte versie kun je hier je antwoord typen..." 
                    : "Typ hier je antwoord..."}
                  disabled={isDemo}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {questions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">❓</div>
          <p className="text-gray-600">
            Er zijn nog geen vragen gegenereerd. Ga terug naar de vorige stap om je verhaal te vertellen.
          </p>
        </div>
      )}
      
      <div className="mt-8 p-6 bg-green-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-green-600 mt-0.5">💡</span>
          <div>
            <p className="text-sm text-green-800 font-medium">
              Tips voor het beantwoorden van vragen
            </p>
            <ul className="text-xs text-green-700 mt-1 space-y-1">
              <li>• Neem de tijd - je hoeft niet alles in één keer te doen</li>
              <li>• Hoe meer detail, hoe persoonlijker je verhaal wordt</li>
              <li>• Deel specifieke herinneringen, niet alleen algemene feiten</li>
              <li>• Vraag anderen om mee te helpen bij vragen die voor hen bedoeld zijn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
