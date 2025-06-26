"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import QuestionCard from "@/components/QuestionCard";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import ProgressVisualization from "../../../components/ProgressVisualization";

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
  answer?: string;
}

interface Project {
  id: string;
  person_name: string;
  subject_type: string;
  period_type: string;
  writing_style: string;
  created_at: string;
  status: string;
  progress?: number;
  progress_detail?: any;
}

export default function ProjectPage() {
  const params = useParams();
  const { user, getIdToken } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  useEffect(() => {
    if (user && projectId) {
      fetchProjectData();
      fetchQuestions();
    }
  }, [user, projectId]);

  const fetchProjectData = async () => {
    try {
      // First try to get project data from Supabase
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error fetching project from database:', projectError);
        // Fallback to localStorage
        const storedProject = localStorage.getItem(`story-${projectId}`);
        if (storedProject) {
          try {
            const localProjectData = JSON.parse(storedProject);
            setProject({
              id: projectId,
              person_name: localProjectData.personName || "Mijn verhaal",
              subject_type: localProjectData.subjectType || "self",
              period_type: localProjectData.periodType || "fullLife",
              writing_style: localProjectData.writingStyle || "isaacson",
              created_at: localProjectData.createdAt || new Date().toISOString(),
              status: localProjectData.status || "active",
              progress: localProjectData.progress || 15
            });
          } catch (e) {
            console.error("Error parsing stored project:", e);
            setFallbackProject();
          }
        } else {
          setFallbackProject();
        }
      } else {
        // Successfully got project from database
        setProject(projectData);
      }
    } catch (error) {
      console.error("Error in fetchProjectData:", error);
      setFallbackProject();
    }
  };

  const setFallbackProject = () => {
    setProject({
      id: projectId,
      person_name: "Mijn verhaal",
      subject_type: "self",
      period_type: "fullLife",
      writing_style: "isaacson",
      created_at: new Date().toISOString(),
      status: "active",
      progress: 15
    });
  };

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      
      const token = await getIdToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/questions?storyId=${projectId}&userId=${user?.id}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        console.error("Failed to fetch questions");
        setError("Er ging iets mis bij het ophalen van de vragen.");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Er ging iets mis bij het ophalen van de vragen.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewQuestions = async () => {
    try {
      setIsGeneratingQuestions(true);
      setError(null);

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
          storyId: projectId,
          userId: user?.id,
          type: "generate"
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        
        // Show success message
        alert("Nieuwe vragen zijn gegenereerd en via e-mail verzonden!");
      } else {
        setError("Er ging iets mis bij het genereren van nieuwe vragen.");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      setError("Er ging iets mis bij het verbinden met de server.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswerSubmitted = async (questionId: string) => {
    // Refresh questions to get updated data from database
    await fetchQuestions();
    
    // Refresh project data to get updated progress
    await fetchProjectData();
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Navigation />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Project wordt geladen...</p>
          </div>
        </main>
        <Footer />
      </ProtectedRoute>
    );
  }

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const answeredQuestions = questions.filter(q => q.status === 'answered');

  return (
    <ProtectedRoute>
      <Navigation />
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/dashboard" 
              className="text-blue-600 hover:underline text-sm mb-2 inline-block"
            >
              ← Terug naar dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">
              {project?.subject_type === "self" ? "Mijn verhaal" : `Verhaal van ${project?.person_name}`}
            </h1>
            <p className="text-gray-600 mt-1">
              {project && `${project.progress || 15}% voltooid`}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={generateNewQuestions}
              disabled={isGeneratingQuestions}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isGeneratingQuestions ? "Genereren..." : "📧 Nieuwe vragen"}
            </button>
          </div>
        </div>

        {/* Progress Visualization */}
        {project && (
          <div className="mb-8">
            <ProgressVisualization project={project} />
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Questions Section */}
        <div className="space-y-8">
          {/* Pending Questions */}
          {pendingQuestions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                📋 Te beantwoorden vragen ({pendingQuestions.length})
              </h2>
              <div className="space-y-4">
                {pendingQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onAnswerSubmitted={handleAnswerSubmitted}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Answered Questions */}
          {answeredQuestions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                ✅ Beantwoorde vragen ({answeredQuestions.length})
              </h2>
              <div className="space-y-4">
                {answeredQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onAnswerSubmitted={handleAnswerSubmitted}
                    isAnswered={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {questions.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Nog geen vragen beschikbaar
              </h3>
              <p className="text-gray-600 mb-6">
                Genereer je eerste set vragen om te beginnen met je verhaal.
              </p>
              <button
                onClick={generateNewQuestions}
                disabled={isGeneratingQuestions}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isGeneratingQuestions ? "Genereren..." : "📧 Genereer eerste vragen"}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}

