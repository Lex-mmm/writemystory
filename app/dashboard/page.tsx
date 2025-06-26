"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import ProgressVisualization from "../../components/ProgressVisualization";

interface Project {
  id: string;
  personName: string;
  subjectType: string;
  periodType: string;
  writingStyle: string;
  createdAt: string;
  status: string;
  progress?: number;
  progress_detail?: any;
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
        setError(null);
        
        console.log('Fetching projects for user:', user.id);
        
        // Try to get the ID token for authorization
        const token = await getIdToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        // First try the local API route
        const apiUrl = `/api/stories?userId=${encodeURIComponent(user.id || "default-user")}`;
        
        console.log('Making request to:', apiUrl);
        
        const response = await fetch(apiUrl, { headers });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
          } catch (parseError) {
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
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
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Er ging iets mis bij het ophalen van je projecten: ${errorMessage}`);
        
        // If a new project was just created, at least show that one
        if (projectCreated && projectId) {
          const newProjectData = localStorage.getItem(`story-${projectId}`);
          
          if (newProjectData) {
            try {
              const newProject = JSON.parse(newProjectData);
              setProjects([newProject]);
              setError(`Waarschuwing: Kon andere projecten niet ophalen, maar het nieuwe project is geladen. Error: ${errorMessage}`);
            } catch (e) {
              console.error("Error parsing new project data:", e);
              setFallbackProject(projectId);
            }
          } else {
            setFallbackProject(projectId);
          }
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
    setError("Kon projecten niet ophalen, maar het nieuwe project is beschikbaar.");
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
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Opnieuw proberen
            </button>
            <div className="text-sm text-gray-600">
              <p>Als het probleem aanhoudt:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Controleer je internetverbinding</li>
                <li>Log uit en weer in</li>
                <li>Neem contact op met support</li>
              </ul>
            </div>
          </div>
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
        <>
          {/* Project Grid */}
          {projects.length > 0 && (
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
                  
                  {/* Progress Visualization */}
                  <div className="mt-4">
                    <ProgressVisualization 
                      project={{
                        id: project.id,
                        progress: project.progress,
                        progress_detail: project.progress_detail,
                        period_type: project.periodType,
                        subject_type: project.subjectType
                      }} 
                      compact={true} 
                    />
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
        </>
      )}

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
          <p><strong>Debug info:</strong></p>
          <p>User ID: {user?.id}</p>
          <p>Projects loaded: {projects.length}</p>
          {error && <p>Last error: {error}</p>}
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