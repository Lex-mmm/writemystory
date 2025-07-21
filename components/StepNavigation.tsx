import React from 'react';

interface StepNavigationProps {
  currentStep: number;
  maxSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
  canProceed?: boolean;
  nextLabel?: string;
  previousLabel?: string;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  maxSteps,
  onNext,
  onPrevious,
  isLoading = false,
  canProceed = true,
  nextLabel = "Volgende",
  previousLabel = "Vorige"
}) => {
  const isLastStep = currentStep === maxSteps;
  const isFirstStep = currentStep === 1;

  return (
    <div className="flex justify-between items-center mt-8">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep || isLoading}
        className={`px-6 py-3 rounded-lg font-medium transition-all ${
          isFirstStep || isLoading
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        ← {previousLabel}
      </button>
      
      <div className="text-sm text-gray-500">
        Stap {currentStep} van {maxSteps}
      </div>
      
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed || isLoading}
        className={`px-6 py-3 rounded-lg font-medium transition-all ${
          !canProceed || isLoading
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Bezig...</span>
          </div>
        ) : (
          <>
            {isLastStep ? "Voltooien" : nextLabel} →
          </>
        )}
      </button>
    </div>
  );
};
