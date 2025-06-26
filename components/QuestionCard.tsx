"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Question {
  id: string;
  story_id: string;
  category: string;
  question: string;
  type: string;
  status: 'pending' | 'answered';
  created_at: string;
  answeredAt?: string;
  priority: number;
  answer?: string; // The actual answer text from database
}

interface QuestionCardProps {
  question: Question;
  onAnswerSubmitted: (questionId: string) => void;
  isAnswered?: boolean;
}

export default function QuestionCard({ question, onAnswerSubmitted, isAnswered = false }: QuestionCardProps) {
  const { user, getIdToken } = useAuth();
  const [answer, setAnswer] = useState(question.answer || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isAnswered);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) return;

    try {
      setIsSubmitting(true);

      const token = await getIdToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/questions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          storyId: question.story_id,
          questionId: question.id,
          userId: user?.id,
          answer: answer.trim(),
          type: "answer"
        })
      });

      if (response.ok) {
        onAnswerSubmitted(question.id);
        setIsExpanded(false);
        setIsEditing(false);
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successMessage.textContent = 'Antwoord opgeslagen! ✨';
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      } else {
        alert("Er ging iets mis bij het opslaan van je antwoord. Probeer het opnieuw.");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Er ging iets mis bij het verbinden met de server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const categoryEmojis: Record<string, string> = {
      'early_life': '🌱',
      'family': '👨‍👩‍👧‍👦',
      'childhood': '🧸',
      'school': '🎓',
      'career': '💼',
      'relationships': '❤️',
      'hobbies': '🎨',
      'travel': '✈️',
      'challenges': '💪',
      'achievements': '🏆'
    };
    return categoryEmojis[category] || '💭';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`border rounded-lg p-6 transition-all duration-200 ${
      isAnswered ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getCategoryEmoji(question.category)}</span>
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              isAnswered ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {isAnswered ? 'Beantwoord' : 'Te beantwoorden'}
            </span>
            <p className="text-gray-500 text-sm mt-1">
              {isAnswered && question.answeredAt ? 
                `Beantwoord op ${formatDate(question.answeredAt)}` :
                `Gesteld op ${formatDate(question.created_at)}`
              }
            </p>
          </div>
        </div>
        
        {isAnswered && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
      </div>

      <div className={`transition-all duration-200 ${isExpanded ? 'block' : 'hidden'}`}>
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {question.question}
        </h3>

        {(!isAnswered || isEditing) && (
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Vertel je verhaal... Je kunt zoveel of zo weinig typen als je wilt."
                className="w-full border border-gray-300 rounded-lg p-4 h-32 resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
              <p className="text-gray-500 text-sm mt-2">
                💡 Tip: Neem de tijd en vertel het zoals jij het hebt beleefd. Er zijn geen verkeerde antwoorden.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {answer.trim().length} karakters
                </span>
              </div>
              
              <div className="flex gap-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnswer(question.answer || "");
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Annuleren
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAnswer("")}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Wissen
                </button>
                <button
                  type="submit"
                  disabled={!answer.trim() || isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Opslaan..." : "💾 Antwoord opslaan"}
                </button>
              </div>
            </div>
          </form>
        )}

        {isAnswered && !isEditing && question.answer && (
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Jouw antwoord:</h4>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {question.answer}
            </p>
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-3 text-blue-600 hover:underline text-sm"
            >
              Bewerken
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
