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
  const [isDeceased, setIsDeceased] = useState<boolean>(false);
  const [passedAwayYear, setPassedAwayYear] = useState<string>("");
  
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
  const [writingStyle, setWritingStyle] = useState<string>("neutral");
  
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
  
  // Step 6: Delivery preferences
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
      const apiUrl = '/api/stories';
      
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
        isDeceased: subjectType === "other" ? isDeceased : false,
        passedAwayYear: subjectType === "other" && isDeceased ? passedAwayYear : "",
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
    const steps = [
      { number: 1, title: "Onderwerp", icon: "👤" },
      { number: 2, title: "Helpers", icon: "👥" },
      { number: 3, title: "Periode", icon: "📅" },
      { number: 4, title: "Stijl", icon: "✍️" },
      { number: 5, title: "Contact", icon: "📱" },
      { number: 6, title: "Levering", icon: "📦" },
      { number: 7, title: "Overzicht", icon: "✅" }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                currentStep === step.number 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : currentStep > step.number 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200 text-gray-500"
              }`}>
                {currentStep > step.number ? "✓" : step.icon}
              </div>
              <span className={`text-xs text-center ${
                currentStep === step.number ? "text-blue-600 font-medium" : "text-gray-500"
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / 7) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderStep1 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">👤 Voor wie schrijven we dit verhaal?</h2>
          <p className="text-gray-600">Kies het onderwerp van je levensverhaal</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              subjectType === "self" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSubjectType("self")}
          >
            <div className="flex items-center mb-3">
              <input
                type="radio"
                id="self"
                name="subjectType"
                value="self"
                checked={subjectType === "self"}
                onChange={() => setSubjectType("self")}
                className="h-4 w-4 text-blue-600 mr-3"
              />
              <span className="text-2xl mr-3">👤</span>
              <label htmlFor="self" className="text-lg font-medium text-gray-800">Over mezelf</label>
            </div>
            <p className="text-sm text-gray-600 ml-10">
              Vertel je eigen levensverhaal. Je kunt altijd familieleden en vrienden uitnodigen om mee te helpen.
            </p>
          </div>
          
          <div 
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              subjectType === "other" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSubjectType("other")}
          >
            <div className="flex items-center mb-3">
              <input
                type="radio"
                id="other"
                name="subjectType"
                value="other"
                checked={subjectType === "other"}
                onChange={() => setSubjectType("other")}
                className="h-4 w-4 text-blue-600 mr-3"
              />
              <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
              <label htmlFor="other" className="text-lg font-medium text-gray-800">Over iemand anders</label>
            </div>
            <p className="text-sm text-gray-600 ml-10">
              Schrijf het verhaal van een ouder, partner, kind, vriend of ander dierbaar persoon. Ook geschikt voor memorial verhalen.
            </p>
          </div>
        </div>
        
        {subjectType === "other" && (
          <div className="bg-blue-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Vertel ons over deze persoon</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="personName">
                  📝 Volledige naam
                </label>
                <input
                  type="text"
                  id="personName"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bijv. Maria van den Berg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="birthYear">
                  📅 Geboortejaar (optioneel)
                </label>
                <input
                  type="text"
                  id="birthYear"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bijv. 1950"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="relationship">
                💝 Relatie tot jou
              </label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Kies een relatie...</option>
                <option value="moeder">Moeder</option>
                <option value="vader">Vader</option>
                <option value="partner">Partner</option>
                <option value="kind">Kind</option>
                <option value="opa">Opa</option>
                <option value="oma">Oma</option>
                <option value="broer">Broer</option>
                <option value="zus">Zus</option>
                <option value="vriend">Vriend</option>
                <option value="vriendin">Vriendin</option>
                <option value="collega">Collega</option>
                <option value="anders">Anders</option>
              </select>
              {relationship === "anders" && (
                <input
                  type="text"
                  placeholder="Beschrijf de relatie..."
                  className="w-full border border-gray-300 p-3 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setRelationship(e.target.value)}
                />
              )}
            </div>

            {/* Memorial/Deceased Option */}
            <div className="border-t pt-4 mt-6">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="isDeceased"
                  checked={isDeceased}
                  onChange={(e) => setIsDeceased(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="isDeceased" className="text-sm font-medium text-gray-700">
                  🕊️ Deze persoon is helaas overleden
                </label>
              </div>
              
              {isDeceased && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-0.5">💛</span>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">
                        Een memorial verhaal
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        We helpen je een prachtig eerbetoon te schrijven aan het leven en de herinneringen van deze bijzondere persoon.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-yellow-800 mb-2" htmlFor="passedAwayYear">
                      🌸 Jaar van overlijden (optioneel)
                    </label>
                    <input
                      type="text"
                      id="passedAwayYear"
                      value={passedAwayYear}
                      onChange={(e) => setPassedAwayYear(e.target.value)}
                      className="w-full border border-yellow-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-yellow-50"
                      placeholder="Bijv. 2023"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={goToNextStep}
            disabled={subjectType === "other" && (!personName || !relationship)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volgende stap →
          </button>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">👥 Wie kunnen helpen met verhalen?</h2>
          <p className="text-gray-600">Selecteer mensen die extra verhalen en herinneringen kunnen bijdragen</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {[
            { key: 'partner', label: 'Partner / echtgenoot', icon: '💑', description: 'Kan intieme momenten en gedeelde ervaringen toevoegen' },
            { key: 'children', label: 'Kinderen', icon: '👶', description: 'Brengen vaak verrassende perspectieven en herinneringen' },
            { key: 'family', label: 'Familie (broers, zussen, ouders)', icon: '👨‍👩‍👧‍👦', description: 'Delen jeugdherinneringen en familieverhalen' },
            { key: 'friends', label: 'Vrienden / collega\'s', icon: '👥', description: 'Kunnen andere kanten van je persoonlijkheid belichten' }
          ].map((item) => (
            <div 
              key={item.key}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                collaborators[item.key as keyof typeof collaborators]
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setCollaborators({
                ...collaborators, 
                [item.key]: !collaborators[item.key as keyof typeof collaborators]
              })}
            >
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={item.key}
                  checked={collaborators[item.key as keyof typeof collaborators]}
                  onChange={() => setCollaborators({
                    ...collaborators, 
                    [item.key]: !collaborators[item.key as keyof typeof collaborators]
                  })}
                  className="h-4 w-4 text-blue-600 rounded mr-3"
                />
                <span className="text-xl mr-2">{item.icon}</span>
                <label htmlFor={item.key} className="font-medium text-gray-800">{item.label}</label>
              </div>
              <p className="text-sm text-gray-600 ml-9">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Skip helpers option */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-xl">✋</span>
            <div>
              <h3 className="font-medium text-gray-800">Liever alleen beginnen?</h3>
              <p className="text-sm text-gray-600">Je kunt altijd later mensen uitnodigen om mee te helpen.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3" htmlFor="collaboratorEmails">
            📧 Contactgegevens van helpers (optioneel)
          </label>
          <textarea
            id="collaboratorEmails"
            value={collaboratorEmails}
            onChange={(e) => setCollaboratorEmails(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Bijv:&#10;maria@voorbeeld.nl&#10;jan.jansen@email.com&#10;+31612345678&#10;&#10;Eén contactpersoon per regel"
          />
          <p className="mt-2 text-sm text-gray-500">
            💡 <strong>Tip:</strong> We sturen deze personen een uitnodiging om mee te helpen met het verhaal. Ze kunnen dan ook vragen beantwoorden en eigen herinneringen toevoegen.
          </p>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            ← Vorige stap
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={goToNextStep}
              className="text-gray-600 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Alleen verder →
            </button>
            <button
              type="button"
              onClick={goToNextStep}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Met helpers →
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">📅 Welke periode of thema&apos;s?</h2>
          <p className="text-gray-600">Bepaal de scope van het verhaal</p>
        </div>
        
        <div className="space-y-4 mb-6">
          {[
            { 
              value: 'fullLife', 
              icon: '🌟', 
              title: 'Het complete levensverhaal', 
              description: 'Van geboorte tot nu - het volledige verhaal met alle belangrijke momenten',
              timeframe: 'Volledig leven'
            },
            { 
              value: 'youth', 
              icon: '🎈', 
              title: 'Jeugd en opgroeijaren', 
              description: 'Focus op kindertijd, schooljaren en de formative jaren',
              timeframe: 'Tot ~18 jaar'
            },
            { 
              value: 'specificPeriod', 
              icon: '📖', 
              title: 'Een bijzondere periode', 
              description: 'Een specifieke levensfase die je wilt vastleggen',
              timeframe: 'Zelf bepalen'
            },
            { 
              value: 'specificTheme', 
              icon: '🎯', 
              title: 'Een specifiek thema', 
              description: 'Focus op een bepaald onderwerp door je hele leven heen',
              timeframe: 'Thematisch'
            }
          ].map((option) => (
            <div 
              key={option.value}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                periodType === option.value 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setPeriodType(option.value)}
            >
              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  id={option.value}
                  name="periodType"
                  value={option.value}
                  checked={periodType === option.value}
                  onChange={() => setPeriodType(option.value)}
                  className="h-4 w-4 text-blue-600 mr-3"
                />
                <span className="text-2xl mr-3">{option.icon}</span>
                <div>
                  <label htmlFor={option.value} className="text-lg font-medium text-gray-800">{option.title}</label>
                  <div className="text-xs text-blue-600 font-medium">{option.timeframe}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 ml-10">{option.description}</p>
            </div>
          ))}
        </div>
        
        {periodType === "specificPeriod" && (
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">📅 Welke periode?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="startYear">
                  Startjaar
                </label>
                <input
                  type="number"
                  id="startYear"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bijv. 1980"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="endYear">
                  Eindjaar
                </label>
                <input
                  type="number"
                  id="endYear"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bijv. 1990"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </div>
        )}
        
        {periodType === "specificTheme" && (
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">🎯 Wat is het thema?</h3>
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              {[
                "Carrière en werk", "Liefde en relaties", "Ouderschap", "Reizen en avonturen",
                "Ziekte en herstel", "Migratie", "Creativiteit en kunst", "Sport en prestaties",
                "Spiritualiteit", "Vriendschappen", "Onderwijs", "Hobby's en passies"
              ].map((themeOption) => (
                <button
                  key={themeOption}
                  type="button"
                  onClick={() => setTheme(themeOption)}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    theme === themeOption
                      ? "border-blue-500 bg-blue-100 text-blue-800"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {themeOption}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="customTheme">
                Of beschrijf je eigen thema:
              </label>
              <input
                type="text"
                id="customTheme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bijv. Mijn tijd als vrijwilliger in Afrika"
              />
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            ← Vorige stap
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            disabled={
              (periodType === "specificPeriod" && (!startYear || !endYear)) ||
              (periodType === "specificTheme" && !theme)
            }
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volgende stap →
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const styles = [
      {
        value: 'neutral',
        name: 'Neutrale stijl',
        icon: '📝',
        description: 'Helder, toegankelijk, zonder opsmuk',
        example: 'Eenvoudige, directe taal die de focus legt op de feiten en gebeurtenissen zelf.',
        suitable: 'Perfect voor mensen die van duidelijkheid en eenvoud houden'
      },
      {
        value: 'isaacson',
        name: 'Walter Isaacson',
        icon: '📚',
        description: 'Feitelijk, gelaagd, biografisch',
        example: 'Zoals in zijn biografieën van Einstein en Steve Jobs: analytisch en diepgaand.',
        suitable: 'Perfect voor mensen die houden van detail en context'
      },
      {
        value: 'gul',
        name: 'Lale Gül',
        icon: '❤️',
        description: 'Persoonlijk, direct, emotioneel',
        example: 'Warm en toegankelijk, met focus op emoties en persoonlijke groei.',
        suitable: 'Ideaal voor intieme, persoonlijke verhalen'
      },
      {
        value: 'tellegen',
        name: 'Toon Tellegen',
        icon: '🎨',
        description: 'Poëtisch, filosofisch',
        example: 'Dromerig en beeldend, met aandacht voor de schoonheid van kleine momenten.',
        suitable: 'Voor mensen die houden van literaire, artistieke taal'
      },
      {
        value: 'adaptive',
        name: 'Adaptieve stijl',
        icon: '🎯',
        description: 'Past zich aan jouw manier van vertellen aan',
        example: 'Onze AI leert van je antwoorden en ontwikkelt een unieke stijl die bij jou past.',
        suitable: 'Als je je eigen unieke stem wilt behouden'
      }
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">✍️ Welke schrijfstijl past bij je?</h2>
          <p className="text-gray-600">Kies de toon en stijl voor je verhaal</p>
        </div>
        
        <div className="space-y-6 mb-6">
          {styles.map((style) => (
            <div 
              key={style.value}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                writingStyle === style.value 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setWritingStyle(style.value)}
            >
              <div className="flex items-start space-x-4">
                <input
                  type="radio"
                  id={style.value}
                  name="writingStyle"
                  value={style.value}
                  checked={writingStyle === style.value}
                  onChange={() => setWritingStyle(style.value)}
                  className="h-4 w-4 text-blue-600 mt-1"
                />
                <span className="text-2xl">{style.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <label htmlFor={style.value} className="text-lg font-medium text-gray-800">
                      {style.name}
                    </label>
                    <span className="ml-2 text-sm text-blue-600 font-medium">
                      {style.description}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {style.example}
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    {style.suitable}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">💡</span>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Geen zorgen:</strong> Je kunt de schrijfstijl later altijd aanpassen. We kunnen zelfs verschillende stijlen combineren voor verschillende hoofdstukken.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            ← Vorige stap
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volgende stap →
          </button>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">📱 Hoe wil je contact houden?</h2>
          <p className="text-gray-600">Kies je voorkeuren voor communicatie</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="whatsapp"
              checked={communicationMethods.whatsapp}
              onChange={() => setCommunicationMethods({...communicationMethods, whatsapp: !communicationMethods.whatsapp})}
              className="h-5 w-5 text-blue-600 rounded mr-3"
            />
            <label htmlFor="whatsapp" className="text-gray-700">
              Via WhatsApp
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="email"
              checked={communicationMethods.email}
              onChange={() => setCommunicationMethods({...communicationMethods, email: !communicationMethods.email})}
              className="h-5 w-5 text-blue-600 rounded mr-3"
            />
            <label htmlFor="email" className="text-gray-700">
              Via e-mail
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="dashboard"
              checked={communicationMethods.dashboard}
              onChange={() => setCommunicationMethods({...communicationMethods, dashboard: !communicationMethods.dashboard})}
              className="h-5 w-5 text-blue-600 rounded mr-3"
            />
            <label htmlFor="dashboard" className="text-gray-700">
              Via het dashboard
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="voice"
              checked={communicationMethods.voice}
              onChange={() => setCommunicationMethods({...communicationMethods, voice: !communicationMethods.voice})}
              className="h-5 w-5 text-blue-600 rounded mr-3"
            />
            <label htmlFor="voice" className="text-gray-700">
              Spraakberichten toestaan
            </label>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            ← Vorige stap
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volgende stap →
          </button>
        </div>
      </div>
    );
  };

  const renderStep6 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">📦 Levering van het eindresultaat</h2>
          <p className="text-gray-600">Kies hoe je het verhaal wilt ontvangen</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <input
              type="radio"
              id="book"
              name="deliveryFormat"
              value="book"
              checked={deliveryFormat === "book"}
              onChange={() => setDeliveryFormat("book")}
              className="h-5 w-5 text-blue-600 rounded mr-3"
            />
            <label htmlFor="book" className="text-gray-700">
              Gedrukt boek
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="radio"
              id="pdf"
              name="deliveryFormat"
              value="pdf"
              checked={deliveryFormat === "pdf"}
              onChange={() => setDeliveryFormat("pdf")}
              className="h-5 w-5 text-blue-600 rounded mr-3"
            />
            <label htmlFor="pdf" className="text-gray-700">
              PDF
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="radio"
              id="both"
              name="deliveryFormat"
              value="both"
              checked={deliveryFormat === "both"}
              onChange={() => setDeliveryFormat("both")}
              className="h-5 w-5 text-blue-600 rounded mr-3"
            />
            <label htmlFor="both" className="text-gray-700">
              Beide
            </label>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            ← Vorige stap
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volgende stap →
          </button>
        </div>
      </div>
    );
  };

  const renderStep7 = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">✅ Overzicht en starten</h2>
          <p className="text-gray-600">Controleer je keuzes en begin met schrijven</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
            <h3 className="font-medium text-gray-800">Onderwerp</h3>
            <p className="text-gray-700 mt-1">
              {subjectType === "self" ? "Mijn eigen verhaal" : 
                `Het verhaal van ${personName} (${relationship})${isDeceased ? " 🕊️ - Memorial verhaal" : ""}`}
            </p>
            {subjectType === "other" && (birthYear || passedAwayYear) && (
              <p className="text-gray-600 text-sm mt-1">
                {birthYear && `Geboren: ${birthYear}`}
                {birthYear && passedAwayYear && " • "}
                {passedAwayYear && `Overleden: ${passedAwayYear}`}
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
            <h3 className="font-medium text-gray-800">Periode of thema</h3>
            <p className="text-gray-700 mt-1">
              {periodType === "fullLife" ? "Het hele leven" : 
              periodType === "youth" ? "Alleen de jeugd" : 
              periodType === "specificPeriod" ? `Van ${startYear} tot ${endYear}` :
              `Thema: ${theme}`}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
            <h3 className="font-medium text-gray-800">Schrijfstijl</h3>
            <p className="text-gray-700 mt-1">
              {writingStyle === "neutral" ? "Neutrale stijl (helder, toegankelijk)" :
              writingStyle === "isaacson" ? "Walter Isaacson (feitelijk, biografisch)" : 
              writingStyle === "gul" ? "Lale Gül (persoonlijk, direct)" : 
              writingStyle === "tellegen" ? "Toon Tellegen (poëtisch)" :
              "Adaptief (past zich aan jouw stijl aan)"}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
            <h3 className="font-medium text-gray-800">Levering</h3>
            <p className="text-gray-700 mt-1">
              {deliveryFormat === "book" ? "Gedrukt boek" : 
              deliveryFormat === "pdf" ? "PDF" : 
              "Gedrukt boek en PDF"}
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            ← Vorige stap
          </button>
          <button
            type="button"
            onClick={handleCreateStory}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="text-blue-600">✨</span> Begin je verhaal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Laten we samen je verhaal vormgeven. We begeleiden je stap voor stap en je kunt alles later nog aanpassen.
          </p>
        </div>

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