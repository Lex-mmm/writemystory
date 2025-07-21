import React from 'react';
import { PROJECT_STEPS } from '../lib/storyTypes';

interface StepIndicatorProps {
  currentStep: number;
  maxSteps?: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  maxSteps = PROJECT_STEPS.length 
}) => {
  const steps = PROJECT_STEPS.slice(0, maxSteps);

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
          style={{ width: `${(currentStep / maxSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
