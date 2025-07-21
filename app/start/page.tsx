"use client";

import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import GuestModeProvider, { useGuestMode } from "../../components/GuestModeProvider";
import { SharedProjectFlow } from "../../components/SharedProjectFlow";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { ProjectData } from "../../lib/storyTypes";

export default function StartPage() {
  return (
    <GuestModeProvider 
      allowGuestMode={true}
      guestModeMessage="Je kunt de story setup bekijken, maar je moet een account aanmaken om je verhaal op te slaan."
    >
      <StartPageContent />
    </GuestModeProvider>
  );
}

function StartPageContent() {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const { isGuestMode } = useGuestMode();

  const handleProjectComplete = async (projectData: ProjectData) => {
    if (isGuestMode) {
      alert("Maak eerst een account aan om je verhaal op te slaan.");
      router.push('/signup?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!user || !user.email) {
      alert("Je moet ingelogd zijn om een verhaal te starten.");
      router.push('/login');
      return;
    }

    try {
      const token = await getIdToken();
      
      // Convert shared project data to API format
      const storyData = {
        userId: user.id || "default-user-id",
        email: user.email,
        subjectType: projectData.subject.type,
        personName: projectData.subject.type === "other" ? projectData.subject.personName : user.user_metadata?.name || "",
        birthYear: projectData.subject.birthYear,
        relationship: projectData.subject.type === "other" ? projectData.subject.relationship : "",
        isDeceased: projectData.subject.type === "other" ? projectData.subject.isDeceased : false,
        passedAwayYear: projectData.subject.type === "other" && projectData.subject.isDeceased ? projectData.subject.passedAwayYear : "",
        collaborators: {
          partner: projectData.collaborators.partner,
          children: projectData.collaborators.children,
          family: projectData.collaborators.family,
          friends: projectData.collaborators.friends,
        },
        collaboratorEmails: projectData.collaborators.emails.split(/[\n,]+/).map(email => email.trim()).filter(email => email),
        periodType: projectData.period.type,
        startYear: projectData.period.type === "specificPeriod" ? projectData.period.startYear : "",
        endYear: projectData.period.type === "specificPeriod" ? projectData.period.endYear : "",
        theme: projectData.period.type === "specificTheme" ? projectData.period.theme : "",
        writingStyle: projectData.style.writingStyle,
        communicationMethods: projectData.communication,
        deliveryFormat: projectData.delivery.format,
        additionalInfo: projectData.additionalInfo,
        createdAt: new Date().toISOString(),
        status: "active",
        includeWhatsappChat: projectData.subject.includeWhatsappChat || false
      };

      let response;
      const apiUrl = '/api/stories';
      
      // If we have a WhatsApp file, use FormData, otherwise use JSON
      if (projectData.subject.includeWhatsappChat && projectData.subject.whatsappChatFile) {
        const formData = new FormData();
        
        // Add all the story data
        Object.entries(storyData).forEach(([key, value]) => {
          if (Array.isArray(value) || typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        });
        
        // Add WhatsApp file
        formData.append('whatsappChatFile', projectData.subject.whatsappChatFile);
        
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        response = await fetch(apiUrl, {
          method: "POST",
          headers,
          body: formData,
        });
      } else {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        response = await fetch(apiUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(storyData),
        });
      }

      const data = await response.json();

      if (response.ok) {
        // Save the story data to localStorage for persistence
        if (data.story) {
          localStorage.setItem(`story-${data.id}`, JSON.stringify(data.story));
        } else {
          // If the API didn't return the full story object, create one
          const newStory = {
            id: data.id,
            ...storyData,
            progress: 10
          };
          localStorage.setItem(`story-${data.id}`, JSON.stringify(newStory));
        }
        
        // Success - redirect to dashboard with the new story ID
        router.push(`/dashboard?storyCreated=true&storyId=${data.id}`);
      } else {
        alert(`Er ging iets mis: ${data.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error creating story:", error);
      alert("Er ging iets mis bij het verbinden met de server. Controleer je internetverbinding en probeer het opnieuw.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ✨ Start je levensverhaal
            </h1>
            <p className="text-xl text-gray-600">
              Laten we samen je unieke verhaal vertellen
            </p>
          </div>
          
          <SharedProjectFlow 
            isDemo={false}
            onComplete={handleProjectComplete}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}