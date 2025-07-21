"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

interface GuestModeProviderProps {
  children: React.ReactNode;
  allowGuestMode?: boolean;
  guestModeMessage?: string;
}

export default function GuestModeProvider({ 
  children, 
  allowGuestMode = false,
  guestModeMessage = "Je bekijkt een demo. Registreer je om je voortgang op te slaan."
}: GuestModeProviderProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    if (!isLoading && !user && allowGuestMode) {
      setIsGuestMode(true);
    } else if (!isLoading && !user && !allowGuestMode) {
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
    }
  }, [user, isLoading, router, allowGuestMode]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="ml-2 text-gray-600">Laden...</p>
      </div>
    );
  }

  if (!user && !allowGuestMode) {
    return null;
  }

  return (
    <>
      {isGuestMode && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>Demo Mode:</strong> {guestModeMessage}
              </p>
              <div className="mt-2">
                <button
                  onClick={() => router.push('/signup?redirect=' + encodeURIComponent(window.location.pathname))}
                  className="bg-amber-100 px-3 py-1 rounded text-sm text-amber-800 hover:bg-amber-200 transition-colors mr-3"
                >
                  Account aanmaken
                </button>
                <button
                  onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                  className="text-amber-700 text-sm hover:text-amber-800 transition-colors"
                >
                  Inloggen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

// Hook to check if user is in guest mode
export function useGuestMode() {
  const { user } = useAuth();
  return { isGuestMode: !user };
}
