"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";

function AnswerPageContent() {
  const searchParams = useSearchParams();
  const { user, getIdToken } = useAuth();
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const questionId = searchParams.get('questionId');
  const storyId = searchParams.get('storyId');

  useEffect(() => {
    if (questionId && storyId) {
      fetchQuestion();
    }
  }, [questionId, storyId]);

  const fetchQuestion = async () => {
    try {
      // Mock question data - in production, fetch from API
      setQuestion({
        id: questionId,
        storyId: storyId,
        question: "Kun je me vertellen over de plek waar je bent opgegroeid? Hoe zag je buurt eruit?",
        category: "early_life"
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching question:", error);
      setIsLoading(false);
    }
  };

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
          storyId: storyId,
          questionId: questionId,
          userId: user?.id || 'anonymous',
          answer: answer.trim(),
          type: "answer"
        })
      });

      if (response.ok) {
        setSubmitted(true);
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

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Vraag wordt geladen...</p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Dank je wel!</h1>
          <p className="text-gray-600 mb-6">
            Je verhaal is opgeslagen en wordt toegevoegd aan het hoofdstuk. 
            Je ontvangt binnenkort nieuwe vragen via e-mail.
          </p>
          {user && (
            <a
              href={`/project/${storyId}`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Bekijk je volledige verhaal
            </a>
          )}
        </div>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Vraag niet gevonden</h1>
          <p className="text-gray-600">
            De vraag die je probeert te beantwoorden bestaat niet of is al beantwoord.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">📝 Vertel je verhaal</h1>
          <p className="text-gray-600">
            Neem de tijd om je verhaal te vertellen. Elk detail telt!
          </p>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <h2 className="text-lg font-medium text-blue-800 mb-2">Vraag:</h2>
            <p className="text-blue-700">{question.question}</p>
          </div>
        </div>

        <form onSubmit={handleSubmitAnswer} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jouw verhaal:
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Begin gewoon te typen... Er zijn geen verkeerde antwoorden. Vertel het zoals jij het hebt beleefd."
              className="w-full border border-gray-300 rounded-lg p-4 h-40 resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
            <p className="text-gray-500 text-sm mt-2">
              💡 Tip: Je kunt zoveel of zo weinig vertellen als je wilt. Het gaat om jouw herinneringen en beleving.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {answer.trim().length} karakters
            </span>
            
            <div className="flex gap-3">
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Opslaan..." : "💾 Verhaal opslaan"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            Je antwoord wordt opgeslagen en verwerkt in je levensverhaal. 
            Je ontvangt binnenkort nieuwe vragen via e-mail.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AnswerPage() {
  return (
    <>
      <Navigation />
      <Suspense fallback={
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Laden...</p>
          </div>
        </main>
      }>
        <AnswerPageContent />
      </Suspense>
      <Footer />
    </>
  );
}
