"use client";

import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import GuestModeProvider from '../../components/GuestModeProvider';
import { SharedProjectFlow } from '../../components/SharedProjectFlow';

export default function DemoPage() {
  const router = useRouter();

  const handleSignupPrompt = () => {
    alert('Demo voltooid! Maak een account aan om je echte verhaal te starten en op te slaan.');
    router.push('/signup?ref=demo');
  };

  return (
    <GuestModeProvider 
      allowGuestMode={true} 
      guestModeMessage="Je bekijkt een demo van het verhaal setup proces. Maak een account aan om je verhaal op te slaan."
    >
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                ✨ Demo: Stel je verhaal samen
              </h1>
              <p className="text-xl text-gray-600">
                Ervaar hoe WriteMyStory.ai werkt voordat je een account aanmaakt
              </p>
            </div>
            
            <div className="mb-8 p-6 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-orange-600 text-2xl">🎭</span>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">
                    Dit is een demo versie
                  </h3>
                  <p className="text-orange-800 mt-1">
                    Je kunt alle stappen doorlopen, maar je verhaal wordt niet opgeslagen. 
                    Maak een account aan om je echte verhaal te starten.
                  </p>
                </div>
              </div>
            </div>
            
            <SharedProjectFlow 
              isDemo={true}
              onSignupPrompt={handleSignupPrompt}
            />
          </div>
        </main>
        
        <Footer />
      </div>
    </GuestModeProvider>
  );
}
