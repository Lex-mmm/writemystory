"use client";

import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import { useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function StartPage() {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: About the subject
  const [subjectType, setSubjectType] = useState<string>("self");
  const [personName, setPersonName] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [relationship, setRelationship] = useState<string>("");
  
  // Step 2: Collaborators
  const [collaborators, setCollaborators] = useState<{
    partner: boolean;
    children: boolean;
    family: boolean;
    friends: boolean;
  }>({
    partner: false,
    children: false,
    family: false,
    friends: false,
  });
  const [collaboratorEmails, setCollaboratorEmails] = useState<string>("");
  
  // Step 3: Period or themes
  const [periodType, setPeriodType] = useState<string>("fullLife");
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");
  const [theme, setTheme] = useState<string>("");
  
  // Step 4: Writing style
  const [writingStyle, setWritingStyle] = useState<string>("isaacson");
  
  // Step 5: Communication preferences
  const [communicationMethods, setCommunicationMethods] = useState<{
    whatsapp: boolean;
    email: boolean;
    dashboard: boolean;
    voice: boolean;
  }>({
    whatsapp: true,
    email: true,
    dashboard: true,
    voice: false,
  });
  
  // Step 6: Delivery preferences (simplified - removed layout style)
  const [deliveryFormat, setDeliveryFormat] = useState<string>("both");

  const goToNextStep = () => {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    setIsLoading(true);

    try {
      // Make sure user is logged in
      if (!user || !user.email) {
        setStatus("Je moet ingelogd zijn om een verhaal te starten.");
        setIsLoading(false);
        return;
      }

      // First try using the local API endpoint
      let apiUrl = '/api/stories';
      
      const token = await getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const storyData = {
        userId: user.id || "default-user-id",
        email: user.email,
        subjectType,
        personName: subjectType === "other" ? personName : user.user_metadata?.name || "",
        birthYear,
        relationship: subjectType === "other" ? relationship : "",
        collaborators,
        collaboratorEmails: collaboratorEmails.split(/[\n,]+/).map(email => email.trim()).filter(email => email),
        periodType,
        startYear: periodType === "specificPeriod" ? startYear : "",
        endYear: periodType === "specificPeriod" ? endYear : "",
        theme: periodType === "specificTheme" ? theme : "",
        writingStyle,
        communicationMethods,
        deliveryFormat,
        createdAt: new Date().toISOString(),
        status: "active",
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(storyData),
      });

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
        setStatus(
          `Er ging iets mis: ${data.message || response.statusText}`
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error creating story:", error);
      setStatus("Er ging iets mis bij het verbinden met de server. Controleer je internetverbinding en probeer het opnieuw.");
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5, 6, 7].map((step) => (
            <div 
              key={step} 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step 
                  ? "bg-blue-600 text-white" 
                  : currentStep > step 
                    ? "bg-green-100 text-green-800 border border-green-500" 
                    : "bg-gray-100 text-gray-500 border border-gray-300"
              }`}
            >
              {currentStep > step ? "✓" : step}
            </div>
          ))}
        </div>
        <div className="flex mt-2 justify-between">
          <div className="text-xs text-gray-500">Start</div>
          <div className="text-xs text-gray-500">Afronding</div>
        </div>
      </div>
    );
  };

  const renderStep1 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">1. Voor wie is dit verhaal?</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="self"
              name="subjectType"
              value="self"
              checked={subjectType === "self"}
              onChange={() => setSubjectType("self")}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="self" className="text-gray-700">Over mezelf</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="other"
              name="subjectType"
              value="other"
              checked={subjectType === "other"}
              onChange={() => setSubjectType("other")}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="other" className="text-gray-700">Over iemand anders</label>
          </div>
        </div>
        
        {subjectType === "other" && (
          <div className="space-y-4 pl-6 border-l-2 border-blue-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="personName">
                🧑 Naam van die persoon
              </label>
              <input
                type="text"
                id="personName"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Bijv. Jan Jansen"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="birthYear">
                📆 Geboortejaar (optioneel)
              </label>
              <input
                type="text"
                id="birthYear"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Bijv. 1950"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="relationship">
                💬 Relatie tot jou
              </label>
              <input
                type="text"
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Bijv. moeder, opa, vriend"
              />
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Volgende stap
          </button>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">2. Wie mogen helpen het verhaal te vertellen?</h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="partner"
              checked={collaborators.partner}
              onChange={() => setCollaborators({...collaborators, partner: !collaborators.partner})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="partner" className="text-gray-700">Partner</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="children"
              checked={collaborators.children}
              onChange={() => setCollaborators({...collaborators, children: !collaborators.children})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="children" className="text-gray-700">Kinderen</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="family"
              checked={collaborators.family}
              onChange={() => setCollaborators({...collaborators, family: !collaborators.family})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="family" className="text-gray-700">Familieleden</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="friends"
              checked={collaborators.friends}
              onChange={() => setCollaborators({...collaborators, friends: !collaborators.friends})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="friends" className="text-gray-700">Vrienden / collega's</label>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="collaboratorEmails">
            📧 Voeg e-mailadressen of telefoonnummers toe
          </label>
          <textarea
            id="collaboratorEmails"
            value={collaboratorEmails}
            onChange={(e) => setCollaboratorEmails(e.target.value)}
            className="w-full border p-2 rounded h-24"
            placeholder="Bijv. jan@voorbeeld.nl, +31612345678 (één per regel)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Deze personen kunnen vragen beantwoorden over het verhaal
          </p>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-4 py-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Vorige stap
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Volgende stap
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">3. Welke periode of thema's wil je vastleggen?</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="fullLife"
              name="periodType"
              value="fullLife"
              checked={periodType === "fullLife"}
              onChange={() => setPeriodType("fullLife")}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="fullLife" className="text-gray-700">Het hele leven</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="youth"
              name="periodType"
              value="youth"
              checked={periodType === "youth"}
              onChange={() => setPeriodType("youth")}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="youth" className="text-gray-700">Alleen de jeugd</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="specificPeriod"
              name="periodType"
              value="specificPeriod"
              checked={periodType === "specificPeriod"}
              onChange={() => setPeriodType("specificPeriod")}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="specificPeriod" className="text-gray-700">Alleen een bijzondere periode</label>
          </div>
          
          {periodType === "specificPeriod" && (
            <div className="pl-6 space-y-2 border-l-2 border-blue-100">
              <div className="flex space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="startYear">
                    Startjaar
                  </label>
                  <input
                    type="text"
                    id="startYear"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    className="w-full border p-2 rounded"
                    placeholder="Bijv. 1980"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="endYear">
                    Eindjaar
                  </label>
                  <input
                    type="text"
                    id="endYear"
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    className="w-full border p-2 rounded"
                    placeholder="Bijv. 1985"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="specificTheme"
              name="periodType"
              value="specificTheme"
              checked={periodType === "specificTheme"}
              onChange={() => setPeriodType("specificTheme")}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="specificTheme" className="text-gray-700">Specifiek thema</label>
          </div>
          
          {periodType === "specificTheme" && (
            <div className="pl-6 border-l-2 border-blue-100">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="theme">
                Thema
              </label>
              <input
                type="text"
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Bijv. migratie, carrière, liefde, ziekte & herstel"
              />
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-4 py-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Vorige stap
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Volgende stap
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">4. Welke schrijfstijl past het best?</h2>
        
        <div className="space-y-6 mb-6">
          <div className="flex items-start space-x-2">
            <input
              type="radio"
              id="isaacson"
              name="writingStyle"
              value="isaacson"
              checked={writingStyle === "isaacson"}
              onChange={() => setWritingStyle("isaacson")}
              className="h-4 w-4 text-blue-600 mt-1"
            />
            <div>
              <label htmlFor="isaacson" className="text-gray-700 font-medium block">Walter Isaacson</label>
              <p className="text-sm text-gray-500">Feitelijk, gelaagd, biografisch</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <input
              type="radio"
              id="gul"
              name="writingStyle"
              value="gul"
              checked={writingStyle === "gul"}
              onChange={() => setWritingStyle("gul")}
              className="h-4 w-4 text-blue-600 mt-1"
            />
            <div>
              <label htmlFor="gul" className="text-gray-700 font-medium block">Lale Gül</label>
              <p className="text-sm text-gray-500">Persoonlijk, direct, emotioneel</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <input
              type="radio"
              id="tellegen"
              name="writingStyle"
              value="tellegen"
              checked={writingStyle === "tellegen"}
              onChange={() => setWritingStyle("tellegen")}
              className="h-4 w-4 text-blue-600 mt-1"
            />
            <div>
              <label htmlFor="tellegen" className="text-gray-700 font-medium block">Toon Tellegen</label>
              <p className="text-sm text-gray-500">Poëtisch, filosofisch</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <input
              type="radio"
              id="adaptive"
              name="writingStyle"
              value="adaptive"
              checked={writingStyle === "adaptive"}
              onChange={() => setWritingStyle("adaptive")}
              className="h-4 w-4 text-blue-600 mt-1"
            />
            <div>
              <label htmlFor="adaptive" className="text-gray-700 font-medium block">Mijn eigen stijl</label>
              <p className="text-sm text-gray-500">AI past zich aan jouw antwoorden aan</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-4 py-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Vorige stap
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Volgende stap
          </button>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">5. Hoe wil je vragen ontvangen?</h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="whatsapp"
              checked={communicationMethods.whatsapp}
              onChange={() => setCommunicationMethods({...communicationMethods, whatsapp: !communicationMethods.whatsapp})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="whatsapp" className="text-gray-700">Via WhatsApp</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="email"
              checked={communicationMethods.email}
              onChange={() => setCommunicationMethods({...communicationMethods, email: !communicationMethods.email})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="email" className="text-gray-700">Via e-mail</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dashboard"
              checked={communicationMethods.dashboard}
              onChange={() => setCommunicationMethods({...communicationMethods, dashboard: !communicationMethods.dashboard})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="dashboard" className="text-gray-700">Via het dashboard</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="voice"
              checked={communicationMethods.voice}
              onChange={() => setCommunicationMethods({...communicationMethods, voice: !communicationMethods.voice})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="voice" className="text-gray-700">Spraakberichten toestaan</label>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-4 py-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Vorige stap
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Volgende stap
          </button>
        </div>
      </div>
    );
  };

  const renderStep6 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">6. Levering van het eindresultaat</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">📄 Levering</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="book"
                name="deliveryFormat"
                value="book"
                checked={deliveryFormat === "book"}
                onChange={() => setDeliveryFormat("book")}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="book" className="text-gray-700">Gedrukt boek</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="pdf"
                name="deliveryFormat"
                value="pdf"
                checked={deliveryFormat === "pdf"}
                onChange={() => setDeliveryFormat("pdf")}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="pdf" className="text-gray-700">PDF</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="both"
                name="deliveryFormat"
                value="both"
                checked={deliveryFormat === "both"}
                onChange={() => setDeliveryFormat("both")}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="both" className="text-gray-700">Beide</label>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-4 py-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Vorige stap
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Volgende stap
          </button>
        </div>
      </div>
    );
  };

  const renderStep7 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">7. Voortgang volgen en aanpassen</h2>
        
        <div className="space-y-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <h3 className="font-medium text-blue-800">Voortgang volgen</h3>
            <p className="text-blue-700 mt-1">
              Je kunt altijd de voortgang volgen in je dashboard. Je ziet precies welke hoofdstukken al klaar zijn en wat nog ontbreekt.
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <h3 className="font-medium text-blue-800">Zelf bewerken</h3>
            <p className="text-blue-700 mt-1">
              Je kunt op elk moment hoofdstukken bewerken of herschrijven. Het is en blijft jouw verhaal.
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <h3 className="font-medium text-blue-800">Media toevoegen</h3>
            <p className="text-blue-700 mt-1">
              Voeg eenvoudig foto's en video's toe aan je verhaal om het persoonlijker te maken.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-6 mb-6">
          <h3 className="font-medium mb-2">Samenvatting van je keuzes</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><span className="font-medium">Verhaal over:</span> {subjectType === "self" ? "Mezelf" : `${personName} (${relationship})`}</li>
            <li><span className="font-medium">Periode:</span> {
              periodType === "fullLife" ? "Het hele leven" : 
              periodType === "youth" ? "Alleen de jeugd" : 
              periodType === "specificPeriod" ? `Periode van ${startYear} tot ${endYear}` :
              `Thema: ${theme}`
            }</li>
            <li><span className="font-medium">Schrijfstijl:</span> {
              writingStyle === "isaacson" ? "Walter Isaacson (feitelijk, biografisch)" : 
              writingStyle === "gul" ? "Lale Gül (persoonlijk, direct)" : 
              writingStyle === "tellegen" ? "Toon Tellegen (poëtisch)" :
              "Adaptief (past zich aan jouw stijl aan)"
            }</li>
            <li><span className="font-medium">Levering:</span> {
              deliveryFormat === "book" ? "Gedrukt boek" : 
              deliveryFormat === "pdf" ? "PDF" : 
              "Gedrukt boek en PDF"
            }</li>
          </ul>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-4 py-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Vorige stap
          </button>
          <button
            type="button"
            onClick={handleCreateStory}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Even geduld..." : "Start mijn verhaal"}
          </button>
        </div>
        
        {status && (
          <div
            className={`mt-4 p-3 rounded ${
              status.includes("mis")
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {status}
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <Navigation />
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        <div className="flex items-center space-x-2 text-blue-600">
          <span className="text-xl">🧭</span>
          <h1 className="text-3xl font-bold">Begin je verhaal</h1>
        </div>
        
        <p className="text-gray-600">
          Laten we je verhaal stap voor stap opbouwen. We hebben een paar vragen over hoe je verhaal eruit moet zien.
          Je kunt je keuzes later altijd aanpassen.
        </p>

        {renderStepIndicator()}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
        {currentStep === 7 && renderStep7()}
      </main>
      <Footer />
    </ProtectedRoute>
  );
}