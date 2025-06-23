"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navigation from "../../../components/Navigation";
import Footer from "../../../components/Footer";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import Link from "next/link";

interface StoryDetails {
  id: string;
  personName: string;
  subjectType: string;
  periodType: string;
  writingStyle: string;
  createdAt: string;
  status: string;
  progress?: number;
}

export default function StoryPage() {
  const { id } = useParams();
  const { user, getIdToken } = useAuth();
  const [story, setStory] = useState<StoryDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStory = async () => {
      if (!user || !id) return;
      
      try {
        setIsLoading(true);
        
        // First check localStorage for the story
        const localStoryData = localStorage.getItem(`story-${id}`);
        
        if (localStoryData) {
          try {
            const localStory = JSON.parse(localStoryData);
            setStory(localStory);
            setIsLoading(false);
            return;
          } catch (e) {
            console.error("Error parsing local story data:", e);
          }
        }
        
        // If not in localStorage, try to fetch from API
        const token = await getIdToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/stories?id=${id}`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          setStory(data);
          
          // Save to localStorage for future use
          localStorage.setItem(`story-${id}`, JSON.stringify(data));
        } else {
          // Fallback to mock story
          const mockStory: StoryDetails = {
            id: id as string,
            personName: "Mijn verhaal",
            subjectType: "self",
            periodType: "fullLife",
            writingStyle: "isaacson",
            createdAt: new Date().toISOString(),
            status: "active",
            progress: 10
          };
          
          setStory(mockStory);
        }
      } catch (err) {
        console.error("Error fetching story:", err);
        setError("Er ging iets mis bij het ophalen van je verhaal.");
        
        // Fallback to mock story
        const mockStory: StoryDetails = {
          id: id as string,
          personName: "Mijn verhaal",
          subjectType: "self",
          periodType: "fullLife",
          writingStyle: "isaacson",
          createdAt: new Date().toISOString(),
          status: "active",
          progress: 10
        };
        
        setStory(mockStory);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStory();
  }, [user, id, getIdToken]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <ProtectedRoute>
      <Navigation />
      <main className="max-w-5xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Verhaal wordt geladen...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-600">{error}</p>
            <Link
              href="/dashboard"
              className="mt-4 text-blue-600 underline"
            >
              Terug naar dashboard
            </Link>
          </div>
        ) : story ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                {story.subjectType === "self" ? "Mijn verhaal" : `Verhaal van ${story.personName}`}
              </h1>
              <Link
                href="/dashboard"
                className="text-blue-600 hover:underline"
              >
                ← Terug naar dashboard
              </Link>
            </div>
            
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-600 text-sm">
                      Aangemaakt op {formatDate(story.createdAt)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Status: <span className="font-medium">{story.status === "active" ? "Actief" : story.status}</span>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    story.status === 'active' ? 'bg-green-100 text-green-800' :
                    story.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {story.progress || 10}% voltooid
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${story.progress || 10}%` }}
                  ></div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-medium mb-2">Instellingen</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><span className="font-medium">Type:</span> {
                          story.subjectType === 'self' ? 'Over mezelf' : 'Over iemand anders'
                        }</p>
                        <p><span className="font-medium">Periode:</span> {
                          story.periodType === 'fullLife' ? 'Volledig leven' :
                          story.periodType === 'youth' ? 'Jeugd' :
                          story.periodType === 'specificPeriod' ? 'Specifieke periode' :
                          'Specifiek thema'
                        }</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Schrijfstijl:</span> {
                          story.writingStyle === 'isaacson' ? 'Walter Isaacson' :
                          story.writingStyle === 'gul' ? 'Lale Gül' :
                          story.writingStyle === 'tellegen' ? 'Toon Tellegen' :
                          'Adaptief'
                        }</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium mb-4">Volgende stappen</h2>
                <div className="space-y-2">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800">
                      Je eerste set vragen is naar je gestuurd! Check je WhatsApp of e-mail en beantwoord de vragen om je verhaal te beginnen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium mb-4">Hoofdstukken</h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Hoofdstuk 1: De beginjaren</h3>
                    <p className="text-sm text-gray-600">Wachten op jouw antwoorden</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    In behandeling
                  </span>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center opacity-50">
                  <div>
                    <h3 className="font-medium">Hoofdstuk 2: Opgroeien</h3>
                    <p className="text-sm text-gray-600">Nog niet begonnen</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Nog niet begonnen
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-600">Verhaal niet gevonden</p>
            <Link
              href="/dashboard"
              className="mt-4 text-blue-600 underline"
            >
              Terug naar dashboard
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
