"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Question {
  id: string;
  story_id: string;
  category: string;
  question: string;
  type: string;
  status: 'pending' | 'answered' | 'skipped';
  created_at: string;
  answeredAt?: string;
  priority: number;
  answer?: string;
  skipped_reason?: string;
}

interface QuestionCardProps {
  question: Question;
  onAnswerSubmitted: () => void;
  isAnswered?: boolean;
}

export default function QuestionCard({ question, onAnswerSubmitted, isAnswered = false }: QuestionCardProps) {
  const { user, getIdToken } = useAuth();
  const [answer, setAnswer] = useState(question.answer || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkipOptions, setShowSkipOptions] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const token = await getIdToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/answers", {
        method: "POST",
        headers,
        body: JSON.stringify({
          questionId: question.id,
          storyId: question.story_id,
          userId: user?.id,
          answer: answer.trim()
        })
      });

      if (response.ok) {
        onAnswerSubmitted();
        setAnswer("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Er ging iets mis bij het opslaan van je antwoord.");
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Er ging iets mis bij het verbinden met de server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipQuestion = async (reason: string) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const token = await getIdToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/answers", {
        method: "POST",
        headers,
        body: JSON.stringify({
          questionId: question.id,
          storyId: question.story_id,
          userId: user?.id,
          answer: "",
          status: "skipped",
          skipReason: reason
        })
      });

      if (response.ok) {
        onAnswerSubmitted();
        setShowSkipOptions(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Er ging iets mis bij het overslaan van de vraag.");
      }
    } catch (err) {
      console.error("Error skipping question:", err);
      setError("Er ging iets mis bij het verbinden met de server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'childhood': '🧸',
      'education': '🎓',
      'career': '💼',
      'family': '👨‍👩‍👧‍👦',
      'relationships': '💕',
      'hobbies': '🎨',
      'travel': '✈️',
      'challenges': '💪',
      'achievements': '🏆',
      'general': '💭'
    };
    return icons[category] || '❓';
  };

  const getStatusDisplay = () => {
    if (question.status === 'skipped') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-yellow-800 font-medium">Vraag overgeslagen</span>
          </div>
          {question.skipped_reason && (
            <p className="text-yellow-700 text-sm mt-1">Reden: {question.skipped_reason}</p>
          )}
          <button
            onClick={() => {
              setAnswer("");
              setShowSkipOptions(false);
            }}
            className="text-yellow-700 text-sm underline mt-2 hover:text-yellow-900"
          >
            Toch beantwoorden
          </button>
        </div>
      );
    }

    if (isAnswered && question.answer) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 font-medium">Beantwoord</span>
            {question.answeredAt && (
              <span className="text-green-600 text-sm ml-2">
                op {formatDate(question.answeredAt)}
              </span>
            )}
          </div>
          <p className="text-green-800">{question.answer}</p>
        </div>
      );
    }

    return null;
  };

  const skipOptions = [
    { value: "too_personal", label: "Te persoonlijk" },
    { value: "dont_remember", label: "Kan ik me niet herinneren" },
    { value: "not_relevant", label: "Niet relevant voor mijn verhaal" },
    { value: "answer_later", label: "Wil ik later beantwoorden" },
    { value: "other", label: "Andere reden" }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{getCategoryIcon(question.category)}</span>
          <div>
            <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full mb-2">
              {question.category}
            </span>
            <h3 className="text-lg font-medium text-gray-900">{question.question}</h3>
          </div>
        </div>
        {question.priority > 1 && (
          <div className="flex items-center">
            <svg className="h-4 w-4 text-orange-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs text-orange-600 font-medium">Prioriteit</span>
          </div>
        )}
      </div>

      {/* Status Display */}
      {getStatusDisplay()}

      {/* Answer Form (only show if not answered and not skipped) */}
      {!isAnswered && question.status !== 'skipped' && (
        <div className="mt-4">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Typ je antwoord hier..."
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
          
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Opslaan..." : "Antwoord opslaan"}
            </button>
            
            <button
              onClick={() => setShowSkipOptions(!showSkipOptions)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Overslaan
            </button>
          </div>

          {/* Skip Options */}
          {showSkipOptions && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Waarom wil je deze vraag overslaan?</h4>
              <div className="space-y-2">
                {skipOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (option.value === "other") {
                        const customReason = prompt("Wat is de reden?");
                        if (customReason) {
                          handleSkipQuestion(customReason);
                        }
                      } else {
                        handleSkipQuestion(option.label);
                      }
                    }}
                    disabled={isSubmitting}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSkipOptions(false)}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Annuleren
              </button>
            </div>
          )}
        </div>
      )}

      {/* Question metadata */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Vraag gesteld op {formatDate(question.created_at)}
        </p>
      </div>
    </div>
  );
}

