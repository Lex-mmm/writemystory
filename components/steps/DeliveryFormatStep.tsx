import React from 'react';
import { ProjectDelivery, DELIVERY_FORMATS } from '../../lib/storyTypes';

interface DeliveryFormatStepProps {
  data: ProjectDelivery;
  onChange: (data: Partial<ProjectDelivery>) => void;
}

export const DeliveryFormatStep: React.FC<DeliveryFormatStepProps> = ({ 
  data, 
  onChange 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">📦 Hoe wil je jouw verhaal ontvangen?</h2>
        <p className="text-gray-600">Kies het format waarin je je levensverhaal wilt krijgen</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {DELIVERY_FORMATS.map((format) => (
          <div
            key={format.value}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              data.format === format.value
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onChange({ format: format.value })}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">{format.icon}</div>
              <div className="flex items-center justify-center mb-3">
                <input
                  type="radio"
                  id={format.value}
                  name="deliveryFormat"
                  value={format.value}
                  checked={data.format === format.value}
                  onChange={() => onChange({ format: format.value })}
                  className="h-4 w-4 text-blue-600 mr-3"
                />
                <label htmlFor={format.value} className="text-lg font-medium text-gray-800">
                  {format.label}
                </label>
              </div>
              <p className="text-sm text-gray-600">
                {format.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-green-600 mt-0.5">📱</span>
            <div>
              <p className="text-sm text-green-800 font-medium">
                Digitaal boek voordelen
              </p>
              <ul className="text-xs text-green-700 mt-1 space-y-1">
                <li>• Onmiddellijk beschikbaar</li>
                <li>• Eenvoudig te delen</li>
                <li>• Zelf te printen</li>
                <li>• Doorzoekbaar</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-orange-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-orange-600 mt-0.5">📖</span>
            <div>
              <p className="text-sm text-orange-800 font-medium">
                Fysiek boek voordelen
              </p>
              <ul className="text-xs text-orange-700 mt-1 space-y-1">
                <li>• Tastbare herinnering</li>
                <li>• Professionele kwaliteit</li>
                <li>• Thuisbezorgd</li>
                <li>• Perfect cadeau</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
