import { useState } from 'react';
import { ProjectData, StoryQuestion } from './storyTypes';

export const useProjectData = () => {
  const [projectData, setProjectData] = useState<ProjectData>({
    subject: {
      type: 'self',
      personName: '',
      birthYear: '',
      relationship: '',
      isDeceased: false,
      passedAwayYear: '',
      includeWhatsappChat: false,
      whatsappChatFile: null,
    },
    collaborators: {
      partner: false,
      children: false,
      family: false,
      friends: false,
      emails: '',
    },
    period: {
      type: 'fullLife',
      startYear: '',
      endYear: '',
      theme: '',
    },
    style: {
      writingStyle: 'neutral',
    },
    communication: {
      whatsapp: true,
      email: true,
      dashboard: true,
      voice: false,
    },
    delivery: {
      format: 'both',
    },
    additionalInfo: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateProjectData = (section: keyof ProjectData, data: any) => {
    setProjectData(prev => ({
      ...prev,
      [section]: section === 'additionalInfo' ? data : {
        ...prev[section],
        ...data
      }
    }));
  };

  return { projectData, updateProjectData, setProjectData };
};

export const useStoryQuestions = (initialQuestions: StoryQuestion[] = []) => {
  const [questions, setQuestions] = useState<StoryQuestion[]>(initialQuestions);

  const updateQuestion = (questionId: string, updates: Partial<StoryQuestion>) => {
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    );
  };

  const assignQuestion = (questionId: string, assignedTo: string) => {
    updateQuestion(questionId, { assignedTo });
  };

  const answerQuestion = (questionId: string, answer: string) => {
    updateQuestion(questionId, { answer });
  };

  const addQuestions = (newQuestions: StoryQuestion[]) => {
    setQuestions(prev => [...prev, ...newQuestions]);
  };

  const generateAIQuestions = async (projectData: ProjectData, isDemo: boolean = false): Promise<StoryQuestion[]> => {
    // For demo mode, return mock questions
    if (isDemo) {
      return [
        {
          id: 'demo-1',
          question: 'Wat is je vroegste jeugdherinnering?',
          category: 'Jeugd & Familie',
          answer: '',
          generated: true,
          suggestedAnswerer: 'self',
          assignedTo: 'self'
        },
        {
          id: 'demo-2', 
          question: 'Beschrijf je favoriete familietraditie uit je jeugd.',
          category: 'Jeugd & Familie',
          answer: '',
          generated: true,
          suggestedAnswerer: 'family',
          assignedTo: 'family'
        },
        {
          id: 'demo-3',
          question: 'Wat was je droomcarrière toen je kind was?',
          category: 'Dromen & Ambities',
          answer: '',
          generated: true,
          suggestedAnswerer: 'self',
          assignedTo: 'self'
        },
        {
          id: 'demo-4',
          question: 'Welke belangrijke levenslessen heb je geleerd?',
          category: 'Wijsheid & Reflectie',
          answer: '',
          generated: true,
          suggestedAnswerer: 'self',
          assignedTo: 'self'
        },
        {
          id: 'demo-5',
          question: 'Wat zijn je trots momenten in je leven?',
          category: 'Prestaties & Hoogtepunten',
          answer: '',
          generated: true,
          suggestedAnswerer: 'self',
          assignedTo: 'self'
        }
      ];
    }

    // For real mode, call the actual API
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectType: projectData.subject.type,
          personName: projectData.subject.personName,
          birthYear: projectData.subject.birthYear,
          isDeceased: projectData.subject.isDeceased,
          periodType: projectData.period.type,
          theme: projectData.period.theme,
          writingStyle: projectData.style.writingStyle,
          collaborators: projectData.collaborators,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      return data.questions || [];
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
  };

  return {
    questions,
    setQuestions,
    updateQuestion,
    assignQuestion,
    answerQuestion,
    addQuestions,
    generateAIQuestions,
  };
};

export const useProjectFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const goToNextStep = () => {
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };

  return {
    currentStep,
    isLoading,
    status,
    setIsLoading,
    setStatus,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
};
