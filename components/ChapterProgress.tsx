'use client';

import { useState, useEffect, useCallback } from 'react';

interface ChapterData {
  id: string;
  name: string;
  icon: string;
  description: string;
  categories: string[];
  progress: number;
  questionsAnswered: number;
  totalQuestions: number;
  questions: Question[];
}

interface Question {
  id: string;
  story_id: string;
  category: string;
  question: string;
  type: string;
  priority: number;
  created_at: string;
  status: string;
  answer?: string;
}

interface ChapterProgressProps {
  projectId: string;
  userId: string;
  questions: Question[];
  isDeceased?: boolean;
  onQuestionsGenerated?: () => void; // Callback to refresh questions
}

const LIFE_CHAPTERS = {
  early_childhood: {
    name: 'Vroege Jeugd',
    icon: '🍼',
    description: 'De eerste levensjaren, familie en vroege herinneringen',
    categories: ['early_life', 'family', 'childhood', 'birth', 'parents'],
  },
  school_years: {
    name: 'Schooltijd',
    icon: '🎓',
    description: 'School, vrienden, eerste lessen van het leven',
    categories: ['school', 'education', 'friends', 'learning', 'adolescence'],
  },
  young_adult: {
    name: 'Jong Volwassen',
    icon: '🌟',
    description: 'Eerste baan, onafhankelijkheid, relaties',
    categories: ['career', 'relationships', 'independence', 'first_job', 'love'],
  },
  adult_life: {
    name: 'Volwassen Leven',
    icon: '💼',
    description: 'Werk, huwelijk, prestaties, hobby\'s en reizen',
    categories: ['work', 'marriage', 'achievements', 'hobbies', 'travel', 'family_life'],
  },
  later_life: {
    name: 'Later Leven',
    icon: '🌅',
    description: 'Pensioen, wijsheid, nalatenschap en reflectie',
    categories: ['retirement', 'wisdom', 'legacy', 'challenges', 'grandchildren'],
  },
  memorial: {
    name: 'Herinneringen',
    icon: '🕊️',
    description: 'Speciale herinneringen en het nalatenschap',
    categories: ['memorial', 'memories', 'legacy', 'tribute'],
  },
};

export default function ChapterProgress({ projectId, userId, questions, isDeceased, onQuestionsGenerated }: ChapterProgressProps) {
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [generatingForChapter, setGeneratingForChapter] = useState<string | null>(null);

  const calculateChapterProgress = useCallback(() => {
    const chapterData: ChapterData[] = [];
    
    // Get all chapters based on whether person is deceased or not
    const availableChapters = isDeceased 
      ? Object.entries(LIFE_CHAPTERS)
      : Object.entries(LIFE_CHAPTERS).filter(([key]) => key !== 'memorial');

    availableChapters.forEach(([chapterId, chapterInfo]) => {
      // Filter questions that belong to this chapter
      const chapterQuestions = questions.filter(q => 
        chapterInfo.categories.some(category => 
          q.category.toLowerCase().includes(category.toLowerCase()) ||
          category.toLowerCase().includes(q.category.toLowerCase())
        )
      );

      // Calculate progress
      const answeredQuestions = chapterQuestions.filter(q => q.answer && q.answer.trim());
      const progress = chapterQuestions.length > 0 
        ? Math.round((answeredQuestions.length / chapterQuestions.length) * 100)
        : 0;

      chapterData.push({
        id: chapterId,
        name: chapterInfo.name,
        icon: chapterInfo.icon,
        description: chapterInfo.description,
        categories: chapterInfo.categories,
        progress,
        questionsAnswered: answeredQuestions.length,
        totalQuestions: chapterQuestions.length,
        questions: chapterQuestions,
      });
    });

    setChapters(chapterData);
  }, [questions, isDeceased]);

  useEffect(() => {
    calculateChapterProgress();
  }, [calculateChapterProgress]);

  const handleGenerateChapterQuestions = async (chapterId: string) => {
    setGeneratingForChapter(chapterId);
    
    try {
      const response = await fetch('/api/generate-chapter-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId,
          chapterId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`${data.questionsGenerated} nieuwe vragen gegenereerd voor ${data.chapter}!`);
        if (onQuestionsGenerated) {
          onQuestionsGenerated(); // Refresh questions in parent component
        }
      } else {
        alert(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating chapter questions:', error);
      alert('Er ging iets mis bij het genereren van vragen.');
    } finally {
      setGeneratingForChapter(null);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress < 30) return 'bg-red-400';
    if (progress < 70) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  const getProgressTextColor = (progress: number) => {
    if (progress === 0) return 'text-gray-600';
    if (progress < 30) return 'text-red-800';
    if (progress < 70) return 'text-yellow-800';
    return 'text-green-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">📚 Hoofdstukken van je verhaal</h2>
        <div className="text-sm text-gray-600">
          {chapters.reduce((total, chapter) => total + chapter.questionsAnswered, 0)} van{' '}
          {chapters.reduce((total, chapter) => total + chapter.totalQuestions, 0)} vragen beantwoord
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedChapter === chapter.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{chapter.icon}</span>
                <h3 className="font-medium text-gray-800">{chapter.name}</h3>
              </div>
              <span className={`text-sm font-medium ${getProgressTextColor(chapter.progress)}`}>
                {chapter.progress}%
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">{chapter.description}</p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(chapter.progress)}`}
                style={{ width: `${chapter.progress}%` }}
              ></div>
            </div>

            <div className="text-xs text-gray-500">
              {chapter.questionsAnswered} van {chapter.totalQuestions} vragen
            </div>

            {/* Generate Questions Button */}
            {chapter.totalQuestions < 8 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateChapterQuestions(chapter.id);
                }}
                disabled={generatingForChapter === chapter.id}
                className="mt-2 w-full text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {generatingForChapter === chapter.id ? 'Genereren...' : '+ Meer vragen'}
              </button>
            )}

            {/* Expanded Chapter Details */}
            {selectedChapter === chapter.id && chapter.questions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Vragen in dit hoofdstuk:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {chapter.questions.map((question) => (
                    <div
                      key={question.id}
                      className={`text-sm p-2 rounded ${
                        question.answer 
                          ? 'bg-green-50 border border-green-200 text-green-800' 
                          : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{question.answer ? '✅' : '❓'}</span>
                        <span className="flex-1">{question.question}</span>
                      </div>
                      {question.answer && (
                        <div className="mt-1 text-xs text-gray-600 italic">
                          {question.answer.length > 100 
                            ? question.answer.substring(0, 100) + '...' 
                            : question.answer
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Genereer eerst enkele vragen om je hoofdstukken te zien verschijnen!
          </p>
        </div>
      )}

      {/* Overall Progress Summary */}
      {chapters.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-800 mb-3">Totale voortgang</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-800">
                {chapters.filter(c => c.progress === 100).length}
              </div>
              <div className="text-sm text-gray-600">Voltooid</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-800">
                {chapters.filter(c => c.progress > 0 && c.progress < 100).length}
              </div>
              <div className="text-sm text-yellow-700">Bezig</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-800">
                {chapters.filter(c => c.progress === 0).length}
              </div>
              <div className="text-sm text-red-700">Nog niet begonnen</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-800">
                {Math.round(chapters.reduce((sum, c) => sum + c.progress, 0) / chapters.length) || 0}%
              </div>
              <div className="text-sm text-blue-700">Gemiddeld</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
