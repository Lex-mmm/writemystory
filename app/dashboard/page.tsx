"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";

interface Project {
  id: string;
  personName: string;
  subjectType: string;
  periodType: string;
  writingStyle: string;
  createdAt: string;
  status: string;
  progress?: number;
}

// Create a separate component for the parts that need useSearchParams
function DashboardContent() {
  const { user, getIdToken } = useAuth();
  const searchParams = useSearchParams();
  const projectCreated = searchParams.get("projectCreated");
  const projectId = searchParams.get("projectId");
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Try to get the ID token for authorization
        const token = await getIdToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        // First try the local API route
        const apiUrl = `/api/stories?userId=${user.id || "default-user"}`;
        
        const response = await fetch(apiUrl, { headers });
        
        if (!response.ok) {
          throw new Error("Kon projecten niet ophalen");
        }
        
        const data = await response.json();
        
        // If a new project was just created, make sure it's in the list
        if (projectCreated && projectId) {
          // Check if the project is already in the list
          const projectExists = data.some((project: Project) => project.id === projectId);
          
          if (!projectExists) {
            // If not, get the new project details from localStorage if available
            const newProjectData = localStorage.getItem(`story-${projectId}`);
            
            if (newProjectData) {
              try {
                const newProject = JSON.parse(newProjectData);
                data.unshift(newProject); // Add it to the beginning of the array
              } catch (e) {
                console.error("Error parsing new project data:", e);
              }
            } else {
              // If we don't have the project data, create a placeholder
              data.unshift({
                id: projectId,
                personName: "Mijn verhaal",
                subjectType: "self",
                periodType: "fullLife",
                writingStyle: "isaacson",
                createdAt: new Date().toISOString(),
                status: "active",
                progress: 10
              });
            }
          }
        }
        
        setProjects(data);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Er ging iets mis bij het ophalen van je projecten.");
        
        // If a new project was just created, at least show that one
        if (projectCreated && projectId) {
          const newProjectData = localStorage.getItem(`story-${projectId}`);
          
          if (newProjectData) {
            try {
              const newProject = JSON.parse(newProjectData);
              setProjects([newProject]);
            } catch (e) {
              console.error("Error parsing new project data:", e);
              setFallbackProject(projectId);
            }
          } else {
            setFallbackProject(projectId);
          }
        } else {
          // Set some mock data if the API fails
          setProjects([
            {
              id: "mock-project-1",
              personName: "Mijn verhaal",
              subjectType: "self",
              periodType: "fullLife",
              writingStyle: "isaacson",
              createdAt: new Date().toISOString(),
              status: "active",
              progress: 10
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [user, getIdToken, projectCreated, projectId]);

  const setFallbackProject = (id: string) => {
    setProjects([{
      id: id,
      personName: "Mijn verhaal",
      subjectType: "self",
      periodType: "fullLife",
      writingStyle: "isaacson",
      createdAt: new Date().toISOString(),
      status: "active",
      progress: 10
    }]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getProjectStatusText = (status: string) => {
    switch(status) {
      case 'active':
        return 'Actief';
      case 'completed':
        return 'Voltooid';
      case 'paused':
        return 'Gepauzeerd';
      default:
        return status;
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {projectCreated && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <p className="font-medium">Je project is succesvol aangemaakt!</p>
          <p className="text-sm">Je kunt nu beginnen met het beantwoorden van vragen om je verhaal op te bouwen.</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mijn Projecten</h1>
        <Link
          href="/start"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nieuw project
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Projecten worden geladen...</p>
        </div>
      ) : error && projects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 underline"
          >
            Opnieuw proberen
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-medium text-gray-700 mb-4">
            Je hebt nog geen projecten
          </h2>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Begin je eerste project door op de knop &quot;Nieuw project&quot; te klikken en doorloop de setup-stappen.
          </p>
          <Link
            href="/start"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Begin je eerste project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`border rounded-lg p-6 ${
                projectId === project.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    {project.subjectType === "self" ? "Mijn verhaal" : `Verhaal van ${project.personName}`}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Aangemaakt op {formatDate(project.createdAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getProjectStatusText(project.status)}
                </span>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${project.progress || 10}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {project.progress || 10}% voltooid
                </p>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Schrijfstijl:</span> {
                    project.writingStyle === 'isaacson' ? 'Walter Isaacson' :
                    project.writingStyle === 'gul' ? 'Lale Gül' :
                    project.writingStyle === 'tellegen' ? 'Toon Tellegen' :
                    'Adaptief'
                  }</p>
                  <p><span className="font-medium">Periode:</span> {
                    project.periodType === 'fullLife' ? 'Volledig leven' :
                    project.periodType === 'youth' ? 'Jeugd' :
                    project.periodType === 'specificPeriod' ? 'Specifieke periode' :
                    'Specifiek thema'
                  }</p>
                </div>
                
                <Link
                  href={`/project/${project.id}`}
                  className="bg-white text-blue-600 px-4 py-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Naar project
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

// Loading fallback for Suspense
function DashboardLoading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center py-10">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">Dashboard wordt geladen...</p>
      </div>
    </main>
  );
}

// Main dashboard page component that wraps the content in Suspense
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
      <Footer />
    </ProtectedRoute>
  );
}