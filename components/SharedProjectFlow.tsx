import React from 'react';
import { useProjectData, useStoryQuestions, useProjectFlow } from '../lib/storyHooks';
import { ProjectData } from '../lib/storyTypes';
import { StepIndicator } from './StepIndicator';
import { StepNavigation } from './StepNavigation';
import { SubjectSelectionStep } from './steps/SubjectSelectionStep';
import { CollaboratorsStep } from './steps/CollaboratorsStep';
import { PeriodStep } from './steps/PeriodStep';
import { WritingStyleStep } from './steps/WritingStyleStep';
import { CommunicationStep } from './steps/CommunicationStep';
import { DeliveryFormatStep } from './steps/DeliveryFormatStep';
import { AdditionalInfoStep } from './steps/AdditionalInfoStep';
import { QuestionsStep } from './steps/QuestionsStep';

interface SharedProjectFlowProps {
  isDemo?: boolean;
  onComplete?: (projectData: ProjectData) => void;
  onSignupPrompt?: () => void;
}

export const SharedProjectFlow: React.FC<SharedProjectFlowProps> = ({
  isDemo = false,
  onComplete,
  onSignupPrompt
}) => {
  const { projectData, updateProjectData } = useProjectData();
  const { questions, assignQuestion, answerQuestion, generateAIQuestions } = useStoryQuestions();
  const { currentStep, isLoading, setIsLoading, goToNextStep, goToPreviousStep } = useProjectFlow();

  const maxSteps = isDemo ? 8 : 7;

  const handleNextStep = async () => {
    if (currentStep === 7 && !isDemo) {
      // For non-demo mode, complete the flow after step 7
      if (onComplete) {
        onComplete(projectData);
      }
    } else if (currentStep === 7 && isDemo) {
      // For demo mode, generate questions and go to step 8
      setIsLoading(true);
      try {
        await generateAIQuestions(projectData, isDemo);
        goToNextStep();
      } catch (error) {
        console.error('Error generating questions:', error);
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === maxSteps) {
      // Complete the flow (demo step 8)
      if (isDemo && onSignupPrompt) {
        onSignupPrompt();
      } else if (onComplete) {
        onComplete(projectData);
      }
    } else {
      goToNextStep();
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return projectData.subject.type === 'self' || 
               (projectData.subject.type === 'other' && projectData.subject.personName.trim() !== '');
      case 2:
        return true; // Collaborators are optional
      case 3:
        return projectData.period.type === 'fullLife' || 
               (projectData.period.type === 'specificPeriod' && !!projectData.period.startYear && !!projectData.period.endYear) ||
               (projectData.period.type === 'specificTheme' && !!projectData.period.theme);
      case 4:
        return !!projectData.style.writingStyle;
      case 5:
        return true; // Communication preferences have defaults
      case 6:
        return !!projectData.delivery.format;
      case 7:
        return true; // Additional info is optional
      case 8:
        return true; // Questions step
      default:
        return true;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SubjectSelectionStep
            data={projectData.subject}
            onChange={(data) => updateProjectData('subject', data)}
          />
        );
      case 2:
        return (
          <CollaboratorsStep
            data={projectData.collaborators}
            onChange={(data) => updateProjectData('collaborators', data)}
            isDemo={isDemo}
          />
        );
      case 3:
        return (
          <PeriodStep
            data={projectData.period}
            onChange={(data) => updateProjectData('period', data)}
          />
        );
      case 4:
        return (
          <WritingStyleStep
            data={projectData.style}
            onChange={(data) => updateProjectData('style', data)}
          />
        );
      case 5:
        return (
          <CommunicationStep
            data={projectData.communication}
            onChange={(data) => updateProjectData('communication', data)}
            isDemo={isDemo}
          />
        );
      case 6:
        return (
          <DeliveryFormatStep
            data={projectData.delivery}
            onChange={(data) => updateProjectData('delivery', data)}
          />
        );
      case 7:
        return (
          <AdditionalInfoStep
            data={{ additionalInfo: projectData.additionalInfo }}
            onChange={(data) => updateProjectData('additionalInfo', data.additionalInfo)}
          />
        );
      case 8:
        return (
          <QuestionsStep
            questions={questions}
            onAssignmentChange={assignQuestion}
            onAnswerChange={answerQuestion}
            isDemo={isDemo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={currentStep} maxSteps={maxSteps} />
      
      {renderCurrentStep()}
      
      <StepNavigation
        currentStep={currentStep}
        maxSteps={maxSteps}
        onNext={handleNextStep}
        onPrevious={goToPreviousStep}
        isLoading={isLoading}
        canProceed={canProceed()}
        nextLabel={currentStep === maxSteps ? (isDemo ? "Maak account aan" : "Verhaal starten") : "Volgende"}
      />
    </div>
  );
};
