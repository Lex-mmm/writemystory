import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthTroubleshooter: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const clearAllAuthData = async () => {
    setIsClearing(true);
    setMessage(null);
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all localStorage data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear all sessionStorage data
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
      
      setMessage('Authenticatie data is gewist. Ververs de pagina om opnieuw in te loggen.');
      
      // Automatically refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing auth data:', error);
      setMessage('Er ging iets mis bij het wissen van de data. Probeer je browser cache te legen.');
    } finally {
      setIsClearing(false);
    }
  };

  if (message) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span className="text-green-800 text-sm">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <span className="text-yellow-600 mt-0.5">⚠️</span>
        <div className="flex-grow">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            Problemen met inloggen?
          </p>
          <p className="text-xs text-yellow-700 mb-3">
            Als je authenticatie-fouten blijft krijgen, kun je je login-gegevens resetten.
          </p>
          <button
            onClick={clearAllAuthData}
            disabled={isClearing}
            className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {isClearing ? 'Bezig...' : 'Reset login gegevens'}
          </button>
        </div>
      </div>
    </div>
  );
};
